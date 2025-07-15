<?php

namespace Shelby\OpenSwoole\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Lib\PdfConverter;
use Shelby\OpenSwoole\Lib\SplitExcelSheetsAndConvertToPdf;

class PdfController
{
    public static function changeInvoice(string $invoiceId)
    {

        $parts = explode('/', $invoiceId); // ['SGP', '0006', '2025']

        if (count($parts) === 3) {
            $reordered = $parts[2] . '/' . $parts[0] . '/' . $parts[1]; // '2025/SGP/0006'
            return $reordered;
        } else {
            echo "❌ Invalid format.";
            return null;
        }

    }
    public static function convert(Request $request, Response $response, $args)
    {
        $parsedBody = $request->getParsedBody();
        $invoiceId = $parsedBody['id'] ?? null;

        if (!$invoiceId) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Missing invoice ID.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $uploadedFiles = $request->getUploadedFiles();
        if (!isset($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'No file uploaded.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $uploadedFile = $uploadedFiles['file'];
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Upload error.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        $formattedInvoice = self::changeInvoice($invoiceId);
        // Define permanent storage folder: database/data/{invoiceId}
        $storageDir = __DIR__ . '/../../database/data/' . $formattedInvoice;
        if (!file_exists($storageDir)) {
            mkdir($storageDir, 0755, true);
        }

        // all file paths
        $files = [
            $storageDir . DIRECTORY_SEPARATOR.'CUSTOM_INVOICE.xlsx',
            $storageDir . DIRECTORY_SEPARATOR.'PACKING_LIST.xlsx',
            $storageDir .DIRECTORY_SEPARATOR .'ANNEXURE.xlsx',
            $storageDir .DIRECTORY_SEPARATOR .'VGN.xlsx',
        ];
        
        // if all file exists then combine them otherwise just continue the rest of the process


        // Save uploaded Excel file
        $originalFilename = $uploadedFile->getClientFilename();
        $savedExcelPath = $storageDir . DIRECTORY_SEPARATOR . $originalFilename;

        $uploadedFile->moveTo($savedExcelPath);


        // Convert Excel to PDF
        // $result = PdfConverter::convertExcelToPdf($savedExcelPath, $storageDir); // Output PDF in same folder
        $result = PdfConverter::convertExcelToPdf($savedExcelPath, $storageDir, $originalFilename); // Output PDF in same folder
        if (file_exists($files[0]) && file_exists($files[1]) && file_exists($files[2]) && file_exists($files[3])) {
            error_log("✅ All files exist. Combining them into one Excel file.\n");
            $combineOutputFile = $storageDir . DIRECTORY_SEPARATOR.'COMBINED_INVOICE.xlsx';
            // Combine all Excel files into one
            $result = PdfConverter::combineExcelFilesIntoOne($files, $combineOutputFile);
        } else {
            error_log("❌ Some files are missing. Proceeding with the uploaded file only.\n");

        }
        $pdfFiles = $result['pdfFiles'] ?? [];
        if (!$result['success']) {
            return self::jsonError(
                $response,
                $result['message'] ?? 'Unknown conversion error occurred.',
                500,
                $result['error'] ?? $result['output'] ?? []
            );

        }

        return self::jsonSuccess($response, 'File uploaded and converted successfully.', [
            'excel' => $formattedInvoice . '/' . $originalFilename,

            'pdfs' => array_map(function ($relativePath) use ($formattedInvoice) {
                return $formattedInvoice . '/' . basename($relativePath);
            }, $pdfFiles),
        ]);


    }
    public static function uploadDoc(Request $request, Response $response){
        try {
            $parsedBody = $request->getParsedBody();
        $invoiceId = $parsedBody['id'] ?? null;

        if (!$invoiceId) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Missing invoice ID.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $uploadedFiles = $request->getUploadedFiles();
        if (!isset($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'No file uploaded.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $uploadedFile = $uploadedFiles['file'];
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Upload error.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        $formattedInvoice = self::changeInvoice($invoiceId);
        // Define permanent storage folder: database/data/{invoiceId}
        $storageDir = __DIR__ . '/../../database/data/' . $formattedInvoice;
        if (!file_exists($storageDir)) {
            mkdir($storageDir, 0755, true);
        }

        $originalFilename = $uploadedFile->getClientFilename();
        $savedExcelPath = $storageDir . DIRECTORY_SEPARATOR . $originalFilename;

        $uploadedFile->moveTo($savedExcelPath);

        return self::jsonSuccess($response, 'File uploaded', []);
            
        } catch (\Throwable $th) {
            //throw $th;
            return self::jsonError($response, 'An error occurred while uploading the document.', 500, $th->getMessage());
        }
    }
    private static function jsonError(Response $response, string $message, int $status = 400, $details = null)
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];
        if ($details)
            $payload['error'] = $details;

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    private static function jsonSuccess(Response $response, string $message, array $data = [])
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'files' => $data
        ];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public static function streamByRelativePath(Request $request, Response $response, array $args): Response
{
    $relativePath = $args['path'] ?? null;

    if (!$relativePath) {
        return self::jsonError($response, 'Invalid or missing file path.', 400);
    }

    // Sanitize to prevent path traversal
    $safePath = str_replace(['..', './', '\\'], '', $relativePath);

    $baseDir = __DIR__ . '/../../database/data/';
    $joinedPath = $baseDir . $safePath;
    $fullPath = realpath($joinedPath);

    // Ensure the path is inside the base directory
    if (!$fullPath || !str_starts_with($fullPath, realpath($baseDir))) {
        return self::jsonError($response, 'File not found or access denied.', 404);
    }

    // Check file existence and readability
    if (!file_exists($fullPath) || !is_readable($fullPath)) {
        return self::jsonError($response, 'File is not accessible.', 404);
    }

    // Open file stream
    $stream = fopen($fullPath, 'rb');

    // Detect MIME type dynamically
    $finfo = new \finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($fullPath) ?: 'application/octet-stream';

    return $response
        ->withHeader('Content-Type', $mimeType)
        ->withHeader('Content-Disposition', 'inline; filename="' . basename($fullPath) . '"')
        ->withHeader('Content-Length', (string) filesize($fullPath))
        ->withBody(new \Slim\Psr7\Stream($stream))
        ->withStatus(200);
}

// list all files in a directory by get url path like /api/show/list?path=SGP/0006/2025
public static function listFiles(Request $request, Response $response, array $args): Response
{
    $queryParams = $request->getQueryParams();
    $path = $queryParams['path'] ?? null;
    $type = $queryParams['type'] ?? null;

    if (!$path) {
        return self::jsonError($response, 'Invalid or missing path.', 400);
    }
    $formattedInvoice = self::changeInvoice($path);
    // Sanitize to prevent path traversal
    $safePath = str_replace(['..', './', '\\'], '', $formattedInvoice);

    $baseDir = __DIR__ . '/../../database/data/';
    $fullPath = realpath($baseDir . $safePath);

    // Ensure the path is inside the base directory
    if (!$fullPath || !str_starts_with($fullPath, realpath($baseDir))) {
        return self::jsonError($response, 'Directory not found or access denied.', 404);
    }

    // Check if the path is a directory
    if (!is_dir($fullPath)) {
        return self::jsonError($response, 'Provided path is not a directory.', 400);
    }

    // Get all files in the directory
    $files = array_diff(scandir($fullPath), ['.', '..']);
    // i want to send files with url path like /api/show/file/2025/SGP/0006/CUSTOM_INVOICE.xlsx and if type is not null then filter files by type
    if ($type) {
        $files = array_filter($files, function ($file) use ($type) {
            return pathinfo($file, PATHINFO_EXTENSION) === $type;
        });
    }
    $files = array_map(function ($file) use ($safePath) {
        
        return '/'.$safePath . '/' . $file;
    }, $files);
    return self::jsonSuccess($response, 'Files listed successfully.', [
        'files' => array_values($files)
    ]);
}





}
