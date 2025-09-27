<?php

namespace Shelby\OpenSwoole\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;
use Shelby\OpenSwoole\Models\ExporterDetails;
use Shelby\OpenSwoole\Models\ExporterDropdown;
use Slim\Psr7\Stream;

class DocumentUploadController
{
    public function uploadHeader(Request $request, Response $response, $args): Response
    {
        $exporterId = $args['exporterId'] ?? null;
        return $this->handleUpload($request, $response, 'uploads/exporters', 'header', $exporterId);
    }

    public function uploadFooter(Request $request, Response $response, $args): Response
    {
        $exporterId = $args['exporterId'] ?? null;
        return $this->handleUpload($request, $response, 'uploads/exporters', 'footer', $exporterId);
    }

    public function uploadSignature(Request $request, Response $response, $args): Response
    {
        $exporterId = $args['exporterId'] ?? null;
        return $this->handleUpload($request, $response, 'uploads/exporters', 'signature', $exporterId);
    }

    public function getHeader(Request $request, Response $response, $args): Response
    {
        $exporterId = $args['exporterId'] ?? null;
        return $this->handleGetFile($response, 'uploads/exporters', 'header', $exporterId);
    }

    public function getFooter(Request $request, Response $response, $args): Response
    {
        $exporterId = $args['exporterId'] ?? null;
        return $this->handleGetFile($response, 'uploads/exporters', 'footer', $exporterId);
    }

    public function getSignature(Request $request, Response $response, $args): Response
    {
        $exporterId = $args['exporterId'] ?? null;
        return $this->handleGetFile($response, 'uploads/exporters', 'signature', $exporterId);
    }

    private function getPublicUploadPath($subdirectory)
{
    $publicPath = realpath(__DIR__ . '/../../database/');
    return $publicPath . DIRECTORY_SEPARATOR . $subdirectory;
}


private function handleUpload(Request $request, Response $response, $directory, $type, $exporterId = null): Response
{
    $uploadedFiles = $request->getUploadedFiles();

    if (empty($uploadedFiles['image'])) {
        $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    $image = $uploadedFiles['image'];
    if ($image->getError() === UPLOAD_ERR_OK) {
        if ($exporterId) {
            // Get absolute directory path using your existing getPublicUploadPath
            $directory = $this->getPublicUploadPath('uploads/exporters/' . $exporterId);
        } else {
            $directory = $this->getPublicUploadPath($directory);
        }

        // Ensure directory exists
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        // Determine the base filename (header/footer/signature)
        $baseFilename = strtolower($type);

        // Check and remove existing files with same base name but any extension
        $existingFiles = glob($directory . '/' . $baseFilename . '.*');
        foreach ($existingFiles as $file) {
            unlink($file); // Delete the existing file
        }

        // Move uploaded file with the appropriate filename (base + new extension)
        $filename = $this->moveUploadedFile($directory, $image, $type);

        // You can optionally update the database here if needed
        
         if ($exporterId) {
                $field = match (strtolower($type)) {
                    'header' => 'letterhead_top_image',
                    'footer' => 'letterhead_bottom_image',
                    'signature' => 'stamp_image',
                    default => 'other_image'
                };

                ExporterDropdown::where('id', $exporterId)->update([
                    $field => '/upload'.'/'. $type . '/' . $exporterId
                ]);
            }

        $response->getBody()->write(json_encode([
            'message' => 'File uploaded and replaced successfully',
            'file' => '/upload'.'/'. $type . '/' . $exporterId
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    $response->getBody()->write(json_encode(['error' => 'Upload error']));
    return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
}


    private function moveUploadedFile($directory, UploadedFileInterface $uploadedFile, $type): string
    {
        $originalFilename = pathinfo($uploadedFile->getClientFilename(), PATHINFO_FILENAME);
        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
        if (!in_array(strtolower($extension), $allowedExtensions)) {
            throw new \Exception('Invalid file type. Only images are allowed.');
        }

        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }


        $filename = sprintf('%s.%s', $type, $extension);

        $uploadedFile->moveTo($directory . DIRECTORY_SEPARATOR . $filename);
        return $filename;
    }
    private function handleGetFile(Response $response, $directory, $type, $exporterId): Response
{
    // Construct absolute directory path to the exporter's folder
    $absoluteDirectory = $this->getPublicUploadPath($directory . '/' . $exporterId);

    // Search for a file matching the expected type with any extension
    $pattern = sprintf('%s/%s.*', $absoluteDirectory, strtolower($type));
    $files = glob($pattern);

    if (empty($files)) {
        $response->getBody()->write(json_encode(['error' => 'File not found for exporter']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
    }

    $filepath = $files[0]; // Get the first match
    $mimeType = mime_content_type($filepath);

    $stream = new Stream(fopen($filepath, 'rb'));

    return $response
        ->withHeader('Content-Type', $mimeType)
        ->withBody($stream);
}


}
