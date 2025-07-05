<?php
namespace Shelby\OpenSwoole\Lib;

require __DIR__ . '/../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Html;
use Mpdf\Mpdf;
class SplitExcelSheetsAndConvertToPdf
{
    public static function splitExcelSheetsAndConvertToPdf($inputExcelFile, $outputPdfDir)
    {
        try {
            if (!file_exists($outputPdfDir)) {
                mkdir($outputPdfDir, 0777, true);
            }

            // OS-specific LibreOffice path
            $os = strtoupper(substr(PHP_OS, 0, 3));
            $libreOffice = $os === 'WIN'
                ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"'
                : 'soffice';

            // Load the Excel workbook
            $spreadsheet = IOFactory::load($inputExcelFile);

            // Apply print settings to all sheets
            foreach ($spreadsheet->getAllSheets() as $sheet) {
                $sheet->getPageSetup()->setFitToWidth(1);
                $sheet->getPageSetup()->setFitToHeight(1);
                $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_PORTRAIT);
                $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A4);

                $lastRow = $sheet->getHighestRow();
                $lastCol = $sheet->getHighestColumn();
                $sheet->getPageSetup()->setPrintArea("A1:{$lastCol}{$lastRow}");
            }

            // Save modified Excel file to temp location
            $tempXlsxPath = sys_get_temp_dir() . '/full_book_' . uniqid() . '.xlsx';
            $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
            $writer->save($tempXlsxPath);

            // Convert to PDF via LibreOffice
            $escapedInput = escapeshellarg($tempXlsxPath);
            $escapedOutputDir = escapeshellarg($outputPdfDir);
            $command = "$libreOffice --headless --convert-to pdf $escapedInput --outdir $escapedOutputDir";
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                return [
                    'success' => false,
                    'message' => '❌ LibreOffice failed to convert the Excel file.',
                    'output' => $output
                ];
            }

            // Build output file path
            $pdfFileName = pathinfo($inputExcelFile, PATHINFO_FILENAME) . '.pdf';
            $relativePath = 'database/data/' . basename($outputPdfDir) . '/' . $pdfFileName;

            return [
                'success' => true,
                'pdfFile' => $relativePath
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => '❌ Exception during conversion.',
                'error' => $e->getMessage()
            ];
        }
    }



   public static function splitAndConvert($inputExcelFile, $outputDir) {
    $spreadsheet = IOFactory::load($inputExcelFile);
    $sheetNames = $spreadsheet->getSheetNames();
    $pdfPaths = [];

    foreach ($sheetNames as $index => $name) {
        $spreadsheet->setActiveSheetIndex($index);
        $sheet = $spreadsheet->getActiveSheet();

        // HTML Writer
        $htmlWriter = new Html($spreadsheet);
        $htmlContent = $htmlWriter->generateSheetData();

        // Setup MPDF
        $mpdf = new Mpdf([
            'format' => 'A4',
            'orientation' => 'P'  // Landscape
        ]);
        $mpdf->WriteHTML($htmlContent);

        $safeName = preg_replace('/[^a-zA-Z0-9]/', '_', $name);
        $pdfPath = "$outputDir/$safeName.pdf";
        $mpdf->Output($pdfPath, \Mpdf\Output\Destination::FILE);

        $pdfPaths[] = $pdfPath;
    }

    return $pdfPaths;
}
}


