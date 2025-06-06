<?php
namespace Shelby\OpenSwoole\Lib;
require __DIR__.'/../../vendor/autoload.php';
use PhpOffice\PhpSpreadsheet\IOFactory;

class PdfConverter{
   public static function convertExcelToPdf($inputFilePath, $outputDir)
{
    try {
        //code...

        if (!file_exists($inputFilePath)) {
        return ['success' => false, 'output' => ["File not found: {$inputFilePath}"]];
    }

    $spreadsheet = IOFactory::load($inputFilePath);

    foreach ($spreadsheet->getAllSheets() as $sheet) {
        $lastRow = $sheet->getHighestRow();
        $lastCol = $sheet->getHighestColumn();
        $printArea = "A1:{$lastCol}{$lastRow}";
        $sheet->getPageSetup()->setPrintArea($printArea);
    }

    $outputExcelFile = $outputDir . DIRECTORY_SEPARATOR . uniqid('output_', true) . '.xlsx';
    $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
    $writer->save($outputExcelFile);

    $os = strtoupper(substr(PHP_OS, 0, 3));
    $outputPath = $outputDir;
    $inputPath = realpath($outputExcelFile);

    if ($os === 'WIN') {
        $libreOffice = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
        $cmd = "$libreOffice --headless --convert-to pdf \"" . str_replace('\\', '/', $inputPath) . "\" --outdir \"" . str_replace('\\', '/', $outputPath) . "\" 2>&1";
    } else {
        $libreOffice = 'soffice';
        $cmd = "$libreOffice --headless --convert-to pdf " . escapeshellarg($inputPath) . " --outdir " . escapeshellarg($outputPath) . " 2>&1";
    }

    exec($cmd, $output, $resultCode);

    if ($resultCode === 0) {
        $pdfFile = $outputPath . DIRECTORY_SEPARATOR . pathinfo($inputPath, PATHINFO_FILENAME) . '.pdf';
        if (file_exists($pdfFile)) {
            return ['success' => true, 'pdfFile' => $pdfFile, 'output' => $output];
        } else {
            return ['success' => false, 'output' => ['PDF file not found after conversion']];
        }
    } else {
        return ['success' => false, 'output' => $output];
    }
}catch (\Throwable $th) {
        return ['success' => false, 'output' => [$th->getMessage()]];
}
    
}
}

// Usage:
// $inputFile = __DIR__ . '/custom_invoice.xlsx';
// $outputDir = __DIR__ . '/pdf';

// convertExcelToPdfWithPrintArea($inputFile, $outputDir);
?>
