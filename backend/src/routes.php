<?php


// use App\InvoiceController;
use Shelby\OpenSwoole\Controllers\DraftController;
use Slim\App;
use Shelby\OpenSwoole\Controllers\DropdownController;
use Shelby\OpenSwoole\Controllers\InvoiceController;
use Shelby\OpenSwoole\Controllers\ProductCategoryController;
use Shelby\OpenSwoole\Controllers\ProductSizeController;
use Shelby\OpenSwoole\Controllers\DatabaseController;
use Shelby\OpenSwoole\Controllers\UserController;
use Shelby\OpenSwoole\Controllers\DocumentUploadController;
use Shelby\OpenSwoole\Controllers\PdfController;


return function (App $app) {
    $container = $app->getContainer();






    // Create controller with container
    $dropdownController = new DropdownController($container->get('db'));
    $invoiceController = new InvoiceController($container->get('db'));
    $productCategoryController = new ProductCategoryController($container->get('db'));
    $productSizeController = new ProductSizeController($container->get('db'));
    $databaseController = new DatabaseController($container->get('db'));
    $userController = new UserController($container->get('db'));
    $documentUploadController = new DocumentUploadController();
    $pdfController = new PdfController();
    $draftController = new DraftController($container->get('db'));




    // create authentication routes
    
    $app->post('/api/auth/login', [$userController, 'login']);
    $app->post('/api/auth/logout', [$userController, 'logout']);
    $app->post('/api/auth/register', [$userController, 'register']);

    // Database Backup and Restore Routes
    $app->post('/api/database/backup', [$databaseController, 'createBackup']);
    $app->get('/api/database/backups', [$databaseController, 'listBackups']);
    $app->post('/api/database/restore/upload', [$databaseController, 'restoreFromUpload']);
    $app->post('/api/database/restore/{filename}', [$databaseController, 'restoreBackup']);
    $app->get('/api/database/download/{filename}', [$databaseController, 'downloadBackup']);
    $app->delete('/api/backup/{filename}', [$databaseController, 'deleteBackup']);

    // Get all dropdown values in a single call
    $app->get('/api/all-dropdowns', [$dropdownController, 'getAllDropdownValues']);

    // Get all dropdown options
    $app->get('/api/dropdown-options', [$dropdownController, 'getAllOptions']);


    // Individual Dropdown Options Management
    $app->get('/api/dropdown-options/{category}', [$dropdownController, 'getDropdownOptions']);
    $app->post('/api/dropdown-options', [$dropdownController, 'createDropdownOption']);
    $app->put('/api/dropdown-options/{id}', [$dropdownController, 'updateDropdownOption']);
    $app->delete('/api/dropdown-options/{id}', [$dropdownController, 'deleteDropdownOption']);
    $app->put('/api/dropdown-options/{id}/toggle', [$dropdownController, 'toggleDropdownOption']);
    $app->put('/api/dropdown-options/{category}/reorder', [$dropdownController, 'reorderDropdownOptions']);



    $app->get('/api/invoice', [$invoiceController, 'getInvoices']);
    $app->get('/api/invoice/{id}', [$invoiceController, 'getInvoiceById']);
    $app->post('/api/invoice', [$invoiceController, 'createInvoice']);
    $app->put('/api/invoice/{id}', [$invoiceController, 'updateInvoice']);
    $app->delete('/api/invoice/all', [$invoiceController, 'deleteAllInvoices']);
    $app->delete('/api/invoice/{id}', [$invoiceController, 'deleteInvoice']);

    // Exporter Routes
    $app->get('/api/exporter/{id}', [$dropdownController, 'getExporterDropdown']);
    $app->get('/api/exporter', [$dropdownController, 'getAllExporterDetails']);
    $app->post('/api/exporter', [$dropdownController, 'createExporter']);
    $app->put('/api/exporter/{id}', [$dropdownController, 'updateExporter']);
    $app->delete('/api/exporter/{id}', [$dropdownController, 'deleteExporter']);

    // product-category Routes
    $app->get('/api/product-category/{id}', [$productCategoryController, 'getProductCategoryById']);
    $app->get('/api/product-category', [$productCategoryController, 'getProductsCategory']);
    $app->post('/api/product-category', [$productCategoryController, 'createProductCategory']);
    $app->put('/api/product-category/{id}', [$productCategoryController, 'updateProductCategory']);
    $app->delete('/api/product-category/{id}', [$productCategoryController, 'deleteProductCategory']);

    // product-size Routes
    $app->get('/api/product-size/{id}', [$productSizeController, 'getProductSizeById']);
    $app->get('/api/product-size', [$productSizeController, 'getProductsSize']);
    $app->post('/api/product-size', [$productSizeController, 'createProductSize']);
    $app->put('/api/product-size/{id}', [$productSizeController, 'updateProductSize']);
    $app->delete('/api/product-size/{id}', [$productSizeController, 'deleteProductSize']);

    // Supplier Routes
    $app->get('/api/supplier', [$dropdownController, 'getAllSupplierDetails']);
    $app->get('/api/supplier/{id}', [$dropdownController, 'getSupplierDetails']);
    $app->post('/api/supplier', [$dropdownController, 'createSupplier']);
    $app->put('/api/supplier/{id}', [$dropdownController, 'updateSupplier']);
    $app->delete('/api/supplier/{id}', [$dropdownController, 'deleteSupplier']);


    $app->get('/api/tableinfo', [$dropdownController, 'getTableInfo']);
    // ARN Declaration Routes
    $app->get('/api/arn', [$dropdownController, 'getAllArnDeclaration']);
    $app->get('/api/arn/{id}', [$dropdownController, 'getArnDeclaration']);
    $app->post('/api/arn', [$dropdownController, 'createArnDeclaration']);
    $app->put('/api/arn/{id}', [$dropdownController, 'updateArnDeclaration']);
    $app->delete('/api/arn/{id}', [$dropdownController, 'deleteArnDeclaration']);

    // login token checker
    $app->get('/api/check-session', [$userController, 'checkSession']);

    $app->post('/api/upload/header/{exporterId}', [$documentUploadController, 'uploadHeader']);
    $app->post('/api/upload/footer/{exporterId}', [$documentUploadController, 'uploadFooter']);
    $app->post('/api/upload/signature/{exporterId}', [$documentUploadController, 'uploadSignature']);

    $app->get('/api/upload/header/{exporterId}', [$documentUploadController, 'getHeader']);
    $app->get('/api/upload/footer/{exporterId}', [$documentUploadController, 'getFooter']);
    $app->get('/api/upload/signature/{exporterId}', [$documentUploadController, 'getSignature']);

     $app->post('/api/upload/excel', [$pdfController, 'convert']);
     $app->post('/api/upload/doc', [$pdfController, 'uploadDoc']);
     $app->get('/api/show/list', [$pdfController, 'listFiles']);
     $app->get('/api/show/file/{path:.+}', [$pdfController, 'streamByRelativePath']);

    // Draft Routes
    $app->post('/api/draft', [$draftController, 'createDraft']);
    $app->get('/api/draft', [$draftController, 'getDrafts']); 
    $app->get('/api/draft/{id}', [$draftController, 'getDraftById']);
    $app->put('/api/draft/{id}', [$draftController, 'updateDraft']);
    $app->delete('/api/draft/all', [$draftController, 'deleteAllDrafts']);
    $app->delete('/api/draft/{id}', [$draftController, 'deleteDraft']);


};
