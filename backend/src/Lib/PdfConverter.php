<?php
namespace Shelby\OpenSwoole\Lib;

require __DIR__ . '/../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx as XlsxReader;
class PdfConverter
{
    public static function changeInvoice($invoiceId)
    {
        $parts = explode('/', $invoiceId); // ['SGP', '0006', '2025']
        if (count($parts) === 3) {
            return $parts[2] . '/' . $parts[0] . '/' . $parts[1]; // '2025/SGP/0006'
        } else {
            return null; // Properly return null if format is invalid
        }
    }

    public static function convertExcelToPdf($inputFilePath, $outputDir, $originalFileName)
    {
        try {
            if (!file_exists($inputFilePath)) {
                return ['success' => false, 'message' => 'Input file not found.', 'output' => ["File not found: {$inputFilePath}"]];
            }

            // Load Excel
            $spreadsheet = IOFactory::load($inputFilePath);

            // Set print area for each sheet to include content + extra rows for margin
            foreach ($spreadsheet->getAllSheets() as $sheet) {
                $lastRow = $sheet->getHighestRow() + 5;
                $lastCol = $sheet->getHighestColumn();
                $printArea = "A1:{$lastCol}{$lastRow}";
                $sheet->getPageSetup()->setPrintArea($printArea);
            }

            // Save temporary Excel file in temp directory
            $tempDir = sys_get_temp_dir();
            $tempExcelPath = $tempDir . DIRECTORY_SEPARATOR . $originalFileName;
            $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
            $writer->save($tempExcelPath);

            // Prepare LibreOffice command
            $os = strtoupper(substr(PHP_OS, 0, 3));
            $escapedTempExcel = escapeshellarg($tempExcelPath);
            $escapedOutputDir = escapeshellarg($outputDir);

            if ($os === 'WIN') {
                $libreOffice = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
                $cmd = "$libreOffice --headless --convert-to pdf $escapedTempExcel --outdir $escapedOutputDir";
            } else {
                $libreOffice = 'soffice';
                $cmd = "$libreOffice --headless --convert-to pdf $escapedTempExcel --outdir $escapedOutputDir";
            }

            exec($cmd, $cmdOutput, $resultCode);

            // Clean up temp Excel file
            if (file_exists($tempExcelPath)) {
                unlink($tempExcelPath);
            }

            if ($resultCode !== 0) {
                return ['success' => false, 'message' => 'LibreOffice failed to convert.', 'output' => $cmdOutput];
            }

            // Build expected PDF path
            $expectedPdfName = pathinfo($tempExcelPath, PATHINFO_FILENAME) . '.pdf';
            $pdfFilePath = rtrim($outputDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $expectedPdfName;

            if (!file_exists($pdfFilePath)) {
                return ['success' => false, 'message' => 'PDF file not found after conversion.', 'output' => $cmdOutput];
            }

            return ['success' => true, 'pdfFile' => $pdfFilePath, 'output' => $cmdOutput];

        } catch (\Throwable $th) {
            return ['success' => false, 'message' => 'Exception occurred during conversion.', 'error' => $th->getMessage()];
        }
    }




    public static function combineExcelFilesIntoOne(array $filePaths, string $outputPath): array
    {
        try {
            $normalizedPaths = array_map(function ($path) {
                return str_replace(['/', '\\'], DIRECTORY_SEPARATOR, realpath($path));
            }, $filePaths);
            // error_log("Normalised paths: " . json_encode($normalizedPaths));
            $normalisedOutputFilePath = realpath(dirname($outputPath)) . DIRECTORY_SEPARATOR . basename($outputPath);
            // error_log("Normalised output file path: " . $normalisedOutputFilePath);
            $combined = new Spreadsheet();
            $combined->removeSheetByIndex(0); // Remove default sheet



            
            foreach ($normalizedPaths as $filePath) {
                 $reader = new XlsxReader();
                    // Read data only – formulas are not evaluated, errors are ignored
                    $reader->setReadDataOnly(true);

                    // Optional: speed-up – don’t load charts, styles, etc.
                    // $reader->setReadEmptyCells(false);
                    // $reader->setIncludeCharts(false);

                    try {
                        $spreadsheet = $reader->load($filePath);
                    } catch (\PhpOffice\PhpSpreadsheet\Reader\Exception $e) {
                        error_log("❌ Could not load {$filePath}: " . $e->getMessage());
                        continue;   // skip this file and carry on
                    }
                if (!file_exists($filePath)) {
                    error_log("❌ File missing: $filePath");
                    continue;
                }
                
                $spreadsheet = IOFactory::load($filePath);

                foreach ($spreadsheet->getAllSheets() as $sheet) {
                    $sheetName = $sheet->getTitle();
                    $clonedSheet = $spreadsheet->getSheetByName($sheetName);;
                    if (!$clonedSheet) {
                        error_log("❌ Sheet '$sheetName' does not exist in $filePath");
                        continue;
                    }
                    // Optional: ensure sheet name is unique

                    $clonedSheet->setTitle($sheetName);
                    $combined->addExternalSheet($clonedSheet);
                    
                }
            }

            $writer = IOFactory::createWriter($combined, 'Xlsx');
            $writer->save($normalisedOutputFilePath);

            return [
                'success' => true,
                'message' => 'Excel files combined successfully.',
                'outputFile' => $normalisedOutputFilePath,
            ];
        } catch (\Throwable $th) {
            return [
                'success' => false,
                'message' => 'Failed combining Excel files.',
                'error' => $th->getMessage(),
            ];
        }
    }

}