<?php

namespace Shelby\OpenSwoole\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Slim\Psr7\Stream;
use Shelby\OpenSwoole\Lib\PdfConverter;

class PdfController
{
   public function convert(Request $request, Response $response, $args)
    {
        $uploadedFiles = $request->getUploadedFiles();

        // Check if a file was uploaded
        if (!isset($uploadedFiles['file'])) {
            $response->getBody()->write("❌ No file uploaded.");
            return $response->withStatus(400);
        }

        $uploadedFile = $uploadedFiles['file'];
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write("❌ Upload error.");
            return $response->withStatus(400);
        }

        // Store uploaded file in system temp directory
        $tempDir = sys_get_temp_dir();
        $originalFilename = $uploadedFile->getClientFilename();
        $tempInputPath = $tempDir . DIRECTORY_SEPARATOR . uniqid('excel_') . '_' . $originalFilename;
        $uploadedFile->moveTo($tempInputPath);

        // Define output PDF path in temp directory
        $tempOutputPath = $tempDir . DIRECTORY_SEPARATOR . uniqid('pdf_') . '_' . pathinfo($originalFilename, PATHINFO_FILENAME) . '.pdf';

        // Convert Excel to PDF
        $result = PdfConverter::convertExcelToPdf($tempInputPath, $tempDir);

        if (!$result['success']) {
            $response->getBody()->write("❌ Conversion failed:\n" . implode("\n", $result['output']));
            return $response->withStatus(500);
        }

        $pdfPath = $result['pdfFile'];

        // Stream the PDF as response
        $pdfStream = fopen($pdfPath, 'rb');
        $response = $response
            ->withHeader('Content-Type', 'application/pdf')
            ->withHeader('Content-Disposition', 'attachment; filename="' . basename($pdfPath) . '"')
            ->withStatus(200)
            ->withBody(new \Slim\Psr7\Stream($pdfStream));

        return $response;
    }


}
