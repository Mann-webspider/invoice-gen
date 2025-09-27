
<?php
require __DIR__ . '/../vendor/autoload.php';
// Accept invoice number as argument
$invoiceNumber = $argv[1] ?? null;
if ($invoiceNumber) {
    error_log("Deleting files for invoice: " . $invoiceNumber);
    Shelby\OpenSwoole\Controllers\PdfController::deleteAllFilesFromInvoice($invoiceNumber, true);
}
