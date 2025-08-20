<?php

namespace Shelby\OpenSwoole\Controllers;

use Exception;
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

    public static function updateFileName(string $fileName, string $prefix){
        // Check if the file name starts with the prefix
        if (strpos($fileName, $prefix) === 0) {
            return $fileName; // No change needed
        }

        // Otherwise, prepend the prefix
        return $prefix . " ".$fileName;
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
    
    // Fix path building - use realpath to normalize
    $storageDir = realpath(__DIR__ . '/../../database/data') . DIRECTORY_SEPARATOR . $formattedInvoice;
    if (!file_exists($storageDir)) {
        mkdir($storageDir, 0755, true);
    }

        // ADD THIS: Check if force regeneration is requested
    $forceRegenerate = filter_var($parsedBody['force_regenerate'] ?? false, FILTER_VALIDATE_BOOLEAN);
    error_log("Force regenerate: " . ($forceRegenerate ? 'true' : 'false'));

    // Get list of files to combine from request (optional)
    $filesToCombine = $parsedBody['files_to_combine'] ?? null;
    $excelFileName = $parsedBody['excel_file_name'] ?? 'CUSTOM_INVOICE.xlsx'; // Default name if not provided
    error_log("Files to combine: " . json_encode($filesToCombine));
    // If no specific files requested, use default list
    if ($filesToCombine != "FOB") {
        $filesToCombine = [
            'CUSTOM_INVOICE.xlsx',
            'WORKSHEET_COPY.xlsx', 
            'PACKING_LIST.xlsx',
            'ANNEXURE.xlsx',
            'VGM.xlsx'
        ];
       
    }else{
        $filesToCombine = [
            'CUSTOM_INVOICE.xlsx',
            'PACKING_LIST.xlsx',
            'ANNEXURE.xlsx',
            'VGM.xlsx'
        ];
    
    }

    // Save uploaded Excel file first
    $originalFilename = $uploadedFile->getClientFilename();
    $savedExcelPath = $storageDir . DIRECTORY_SEPARATOR . $originalFilename;
    $uploadedFile->moveTo($savedExcelPath);

     // Build full paths for files to combine and check existence
    $existingFiles = [];
    $missingFiles = [];
    $filesToConvert = []; // Track files that need PDF conversion
    
        foreach ($filesToCombine as $filename) {
        // Generate PDF filename for each Excel file
        $pdfFilename = str_replace('.xlsx', '.pdf', $filename);
        
        $fullPath = $storageDir . DIRECTORY_SEPARATOR . $filename;
        $pdfFullPath = $storageDir . DIRECTORY_SEPARATOR . $pdfFilename;
        $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fullPath);
        $pdfNormalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $pdfFullPath);
        
        if (file_exists($normalizedPath)) {
            $existingFiles[] = $normalizedPath;
            error_log("✅ Found file: " . $normalizedPath);
            
            // MODIFIED LOGIC: Check if PDF needs to be generated/regenerated
            if (!file_exists($pdfNormalizedPath) || $forceRegenerate) {
                $filesToConvert[] = [
                    'excel_path' => $normalizedPath,
                    'filename' => $filename,
                    'pdf_path' => $pdfNormalizedPath,
                    'action' => file_exists($pdfNormalizedPath) ? 'regenerate' : 'generate'
                ];
                
                // If force regenerate and PDF exists, delete it first
                if ($forceRegenerate && file_exists($pdfNormalizedPath)) {
                    unlink($pdfNormalizedPath);
                    error_log("🔄 Deleted existing PDF for regeneration: " . $pdfNormalizedPath);
                }
            }
        } else {
            $missingFiles[] = $filename;
            error_log("❌ Missing file: " . $normalizedPath);
        }
    }
       // Convert Excel files to PDF if needed
    $conversionResults = [];
    foreach ($filesToConvert as $fileInfo) {
        $result = PdfConverter::convertExcelToPdf(
            $fileInfo['excel_path'], 
            $storageDir, 
            self::updateFileName($fileInfo['filename'],$excelFileName)
        );
        $conversionResults[] = $result;
        
        if ($result['success']) {
            error_log("✅ Successfully converted: " . $fileInfo['filename']);
        } else {
            error_log("❌ Failed to convert: " . $fileInfo['filename']);
        }
    }


    // Log what we found
    error_log("Storage directory: " . $storageDir);
    error_log("Existing files count: " . count($existingFiles));
    error_log("Missing files: " . implode(', ', $missingFiles));

    $combineResult = null;
    
    // Only combine if we have files to combine
    if (count($existingFiles) >= count($filesToCombine)) {
        error_log("✅ Found " . count($existingFiles) . " files to combine.");
        
        $combineOutputFile = $storageDir . DIRECTORY_SEPARATOR . self::updateFileName('COMBINED.xlsx',$excelFileName);
        $pdfOutFile = self::updateFileName("COMBINED",$excelFileName);
        // Try to combine files
        try {
            $combineResult = PdfConverter::combineExcelFilesIntoOne($existingFiles, $combineOutputFile);
            
            if ($combineResult['success']) {
                error_log("✅ Successfully combined files into: " . $combineOutputFile);
                
                // Now convert the combined file to PDF
                $pdfResult = PdfConverter::convertExcelToPdf($combineOutputFile, $storageDir, $pdfOutFile);
                
                if (!$pdfResult['success']) {
                    error_log("❌ Failed to convert combined Excel to PDF: " . ($pdfResult['message'] ?? 'Unknown error'));
                }
                
                $result = $pdfResult; // Use PDF conversion result as final result
            } else {
                error_log("❌ Failed to combine files: " . ($combineResult['error'] ?? 'Unknown error'));
                // Fall back to converting individual uploaded file
                // $result = PdfConverter::convertExcelToPdf($savedExcelPath, $storageDir, $originalFilename);
            }
        } catch (Exception $e) {
            error_log("❌ Exception during file combination: " . $e->getMessage());
            // Fall back to converting individual uploaded file
            // $result = PdfConverter::convertExcelToPdf($savedExcelPath, $storageDir, $originalFilename);
        }
    } else {
        error_log("❌ Not enough files to combine (" . count($existingFiles) . " found). Converting uploaded file only.");
        // Convert only the uploaded Excel file to PDF
        // $result = PdfConverter::convertExcelToPdf($savedExcelPath, $storageDir, $originalFilename);
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
        'combined_files_count' => count($existingFiles),
        'missing_files' => $missingFiles,
        'existing_files' => array_map('basename', $existingFiles),
        'combine_attempted' => count($existingFiles) > 1,
        'combine_success' => $combineResult['success'] ?? false
    ]);
}
public static function deleteAllFilesFromInvoice(string $invoiceId, bool $removeDirectory = false): array
{
    try {
        $formattedInvoice = self::changeInvoice($invoiceId);
        
        // Sanitize to prevent path traversal
        $safePath = str_replace(['..', './', '\\'], '', $formattedInvoice);
        
        $baseDir = __DIR__ . '/../../database/data/';
        $fullPath = realpath($baseDir . $safePath);

        // Ensure the path is inside the base directory
        if (!$fullPath || !str_starts_with($fullPath, realpath($baseDir))) {
            return [
                'success' => false,
                'message' => 'Directory not found or access denied.',
                'error' => 'Invalid path: ' . $formattedInvoice
            ];
        }

        // Check if the directory exists
        if (!is_dir($fullPath)) {
            return [
                'success' => false,
                'message' => 'Invoice directory does not exist.',
                'error' => 'Directory not found: ' . $fullPath
            ];
        }

        // Get all files in the directory
        $files = array_diff(scandir($fullPath), ['.', '..']);
        $deletedFiles = [];
        $failedFiles = [];

        // Delete each file
        foreach ($files as $file) {
            $filePath = $fullPath . DIRECTORY_SEPARATOR . $file;
            
            // Only delete files, not subdirectories
            if (is_file($filePath)) {
                if (unlink($filePath)) {
                    $deletedFiles[] = $file;
                    error_log("✅ Deleted file: " . $filePath);
                } else {
                    $failedFiles[] = $file;
                    error_log("❌ Failed to delete file: " . $filePath);
                }
            }
        }

        // Remove the directory if requested and it's empty
        $directoryRemoved = false;
        if ($removeDirectory) {
            $remainingFiles = array_diff(scandir($fullPath), ['.', '..']);
            
            if (empty($remainingFiles)) {
                if (rmdir($fullPath)) {
                    $directoryRemoved = true;
                    error_log("✅ Removed empty directory: " . $fullPath);
                } else {
                    error_log("❌ Failed to remove directory: " . $fullPath);
                }
            }
        }

        // Prepare success message
        $message = count($deletedFiles) > 0 
            ? "Successfully deleted " . count($deletedFiles) . " file(s)" 
            : "No files were deleted";

        if (count($failedFiles) > 0) {
            $message .= ". Failed to delete " . count($failedFiles) . " file(s)";
        }

        return [
            'success' => true,
            'message' => $message,
            'data' => [
                'deleted_files' => $deletedFiles,
                'failed_files' => $failedFiles,
                'total_files_found' => count($deletedFiles) + count($failedFiles),
                'directory_removed' => $directoryRemoved,
                'invoice_path' => $formattedInvoice
            ]
        ];

    } catch (\Throwable $th) {
        error_log("❌ Error in deleteAllFilesFromInvoice: " . $th->getMessage());
        return [
            'success' => false,
            'message' => 'An error occurred while deleting files.',
            'error' => $th->getMessage()
        ];
    }
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