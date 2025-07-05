<?php
namespace Shelby\OpenSwoole\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ExporterDropdown;
use Shelby\OpenSwoole\Models\Invoice;
use Shelby\OpenSwoole\Models\ExporterDetails;
use Shelby\OpenSwoole\Models\BuyerDetails;
use Shelby\OpenSwoole\Models\ProductDetails;
use Shelby\OpenSwoole\Models\ProductLists;
use Shelby\OpenSwoole\Models\ProductCategory;
use Shelby\OpenSwoole\Models\ContainerInformation;
use Shelby\OpenSwoole\Models\SupplierDetails;
use Shelby\OpenSwoole\Models\ShippingDetail;
use Shelby\OpenSwoole\Models\PackageInformation;
use Shelby\OpenSwoole\Models\Annexure;
use Shelby\OpenSwoole\Models\Vgm;
use PDO;
use Illuminate\Database\Capsule\Manager as DB;
use Shelby\OpenSwoole\Models\VgmContainer;
use Slim\Log\DEBUG;
class InvoiceController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Invoice
    public function createInvoice(Request $request, Response $response)
    {
        try {
            $data = $request->getParsedBody();
            $annxure = $data['annexure'];
            $vgm = $data['vgm'];
            $data = $data['invoice'];
            // Start transaction
            DB::beginTransaction();

            // Create exporter record
            $exporter = ExporterDetails::create([
                'company_name' => $data['exporter']['company_name'],
                'company_address' => $data['exporter']['company_address'],
                'email' => $data['exporter']['email'],
                'contact_number' => $data['exporter']['contact_number'],
                'authorized_name' => $data['exporter']['authorized_name'],
                'authorized_designation' => $data['exporter']['authorized_designation'],
                'tax_id' => $data['exporter']['tax_id'],
                'ie_code' => $data['exporter']['ie_code'],
                'pan_number' => $data['exporter']['pan_number'],
                'gstin_number' => $data['exporter']['gstin_number'],
                'state_code' => $data['exporter']['state_code']
            ]);

            // Create buyer record
            $buyer = BuyerDetails::create([
                'order_number' => $data['buyer']['buyer_order_no'],
                'order_date' => $data['buyer']['buyer_order_date'],
                'po_number' => $data['buyer']['po_no'],
                'consignee' => $data['buyer']['consignee'],
                'notify_party' => $data['buyer']['notify_party']
            ]);

            // Create products
            $productIds = [];
            foreach ($data['products']['product_list'] as $product) {
                // Check if category exists by ID
                $categoryName = $product['category_name'];
                $category = ProductCategory::where('description', $categoryName)->first();

                // If category doesn't exist, create a new one
                if (!$category) {
                    $category = ProductCategory::create([
                        'description' => $product['category_name'],
                        'hsn_code' => $product['hsn_code']
                    ]);
                }

                // Create product record with the category
                $productRecord = ProductLists::create([
                    'category_id' => $category->id,
                    'product_name' => $product['product_name'],
                    'size' => $product['size'],
                    'quantity' => $product['quantity'],
                    'sqm' => $product['sqm'],
                    'total_sqm' => $product['total_sqm'],
                    'total_price' => $product['total'],
                    'price' => $product['price'],
                    'unit' => $product['unit'],
                    'net_weight' => $product['net_weight'],
                    'gross_weight' => $product['gross_weight']
                ]);
                $productIds[] = $productRecord->id;
            }

            // Create containers
            $containerIds = [];
            foreach ($data['products']['containers'] as $container) {
                $containerRecord = ContainerInformation::create([
                    'container_number' => $container['container_no'],
                    'line_seal_number' => $container['line_seal_no'],
                    'rfid_number' => $container['rfid_seal'],
                    'design_no' => $container['design_no'],
                    'quantity_box' => $container['quantity'],
                    'net_weight' => $container['net_weight'],
                    'gross_weight' => $container['gross_weight']
                ]);
                $containerIds[] = $containerRecord->id;
            }

            // Create product details
            $productDetails = ProductDetails::create([
                'marks' => $data['products']['marks'],
                'nos' => $data['products']['nos'],
                'frieght' => $data['products']['frieght'],
                'total_pallet_count' => $data['products']['total_pallet_count'],
                'insurance' => $data['products']['insurance'],
                'total_price' => $data['products']['total_price'],
                'product_ids' => json_encode($productIds),
                'container_ids' => json_encode($containerIds)
            ]);

            // Create supplier records
            $supplierIds = [];

            if (isset($data['suppliers']) && is_array($data['suppliers'])) {
                foreach ($data['suppliers'] as $supplierData) {
                    $supplierRecord = SupplierDetails::create([
                        'supplier_name' => $supplierData['name'] ?? '',
                        'supplier_address' => $supplierData['address'] ?? '',
                        'gstin_number' => $supplierData['gstin_number'] ?? '',
                        'tax_invoice_no' => $supplierData['tax_invoice_number'] ?? '',
                        'date' => $supplierData['date'] ?? null,
                    ]);

                    $supplierIds[] = $supplierRecord->id;
                }
            }



            // Create shipping record
            $shipping = ShippingDetail::create([
                'place_of_receipt' => $data['shipping']['place_of_receipt'],
                'port_of_loading' => $data['shipping']['port_of_loading'],
                'port_of_discharge' => $data['shipping']['port_of_discharge'],
                'pre_carriage' => $data['shipping']['pre_carriage_by'],
                'shipping_number' => $data['shipping']['vessel_flight_no'],
                'country_of_origin' => $data['shipping']['country_of_origin'],
                'origin_details' => $data['shipping']['origin_details'],
                'country_of_final_destination' => $data['shipping']['country_of_final_destination'],
                'terms_of_delivery' => $data['shipping']['terms_of_delivery'],
                'payment' => $data['shipping']['payment'],
                'shipping_method' => $data['shipping']['shipping_method'],
                'vessel_flight_no' => $data['shipping']['vessel_flight_no'],
                'final_destination' => $data['shipping']['final_destination']
            ]);

            // Create package record
            $package = PackageInformation::create([
                'number_of_package' => $data['package']['no_of_packages'],
                'total_gross_weight' => $data['package']['gross_weight'],
                'total_net_weight' => $data['package']['net_weight'],
                'gst_amount' => $data['package']['gst_amount'],
                'taxable_value' => $data['package']['taxable_value'],
                'total_sqm' => $data['package']['total_sqm'],
                'gst_circular' => $data['package']['gst_circular'],
                'app_ref_number' => $data['package']['arn_no'],
                'lut_date' => $data['package']['lut_date'],
                'total_amount' => $data['package']['total_fob'],
                'amount_in_words' => $data['package']['amount_in_words']
            ]);

            //create annexure record
            $anx = Annexure::create([
                'invoice_number' => $data['invoice_number'],

                'range' => $annxure['range'],
                'division' => $annxure['division'],
                'commissionerate' => $annxure['commissionerate'],
                'exam_date' => $annxure['exam_date'],
                'invoice_date' => $annxure['invoice_date'],
                'net_weight' => $annxure['net_weight'],
                'gross_weight' => $annxure['gross_weight'],
                'total_packages' => $annxure['total_packages'],
                'officer_designation1' => $annxure['officer_designation1'],
                'officer_designation2' => $annxure['officer_designation2'],
                'lut_date' => $annxure['lut_date'],
                'location_code' => $annxure['location_code'],
                'question9c' => $annxure['question9c'],
                'question9a' => $annxure['question9a'],
                'question9b' => $annxure['question9b'],
                'non_containerized' => $annxure['non_containerized'],
                'containerized' => $annxure['containerized'],
                'manufacturer_name' => $annxure['selected_manufacturer']['name'],
                'manufacturer_address' => $annxure['selected_manufacturer']['address'],
                'manufacturer_gstin_no' => $annxure['selected_manufacturer']['gstin_number'],
                'manufacturer_permission' => $annxure['selected_manufacturer']['permission']
            ]);

            $vgmContainerIds = [];
            foreach ($vgm['containers'] as $container) {
                $containerRecord = VgmContainer::create([
                    'booking_no' => $container['booking_no'],
                    'container_no' => $container['container_no'],
                    'tare_weight' => $container['tare_weight'],
                    'gross_weight' => $container['gross_weight'],
                    'total_vgm' => $container['total_vgm'],
                ]);
                $vgmContainerIds[] = $containerRecord->id;
            }
            $vgm = Vgm::create([
                'shipper_name' => $vgm['shipper_name'],
                'ie_code' => $vgm['ie_code'],
                'authorized_name' => $vgm['authorized_name'],
                'authorized_contact' => $vgm['authorized_contact'],
                'container_number' => $vgm['container_number'],
                'container_size' => $vgm['container_size'],
                'permissible_weight' => $vgm['permissible_weight'],
                'weighbridge_registration' => $vgm['weighbridge_registration'],
                'verified_gross_mass' => $vgm['verified_gross_mass'],
                'unit_of_measurement' => $vgm['unit_of_measurement'],
                'dt_weighing' => $vgm['dt_weighing'],
                'weighing_slip_no' => $vgm['weighing_slip_no'],
                'type' => $vgm['type'],
                'IMDG_class' => $vgm['IMDG_class'],
                'forwarder_email' => $vgm['forwarder_email'],
                'containers_id' => json_encode($vgmContainerIds),
                'invoice_number' => $data['invoice_number'],
            ]);
            // update exporterDropdown last_invoice_number by 1
            $exporterDropdown = ExporterDropdown::where('company_name', $data['exporter']['company_name'])->first();
            if (!$exporterDropdown) {
                throw new \Exception('Exporter not found in dropdown');
            }
            // Increment the last invoice number
            $lastInvoiceNumber = $exporterDropdown->last_invoice_number + 1;
            // Update the exporterDropdown with the new last invoice number
            $exporterDropdown->last_invoice_number = $lastInvoiceNumber;

            $exporterDropdown->save();

            // Finally, create the invoice record
            if (isset($data['suppliers'])) {

                $invoice = Invoice::create([
                    'invoice_number' => $data['invoice_number'],
                    'invoice_date' => $data['invoice_date'],
                    'integrated_tax' => $data['integrated_tax'],
                    'payment_term' => $data['payment_term'],
                    'product_type' => $data['product_type'],
                    'currancy_type' => $data['currency_type'],
                    'currancy_rate' => $data['currency_rate'],
                    'exporter_id' => $exporter->id,
                    'buyer_id' => $buyer->id,
                    'product_id' => $productDetails->id,
                    'supplier_ids' => json_encode($supplierIds),
                    'shipping_id' => $shipping->id,
                    'package_id' => $package->id,
                    'annexure_id' => $anx->id,
                    'vgm_id' => $vgm->id
                ]);
                DB::commit();

                $responseData = [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'invoice_date' => $invoice->invoice_date,
                    'integrated_tax' => $invoice->integrated_tax,
                    'payment_term' => $invoice->payment_term,
                    'product_type' => $invoice->product_type,
                    'currancy_type' => $invoice->currancy_type,
                    'currancy_rate' => $invoice->currancy_rate,
                    'exporter_id' => $exporter->id,
                    'buyer_id' => $buyer->id,
                    'product_id' => $productDetails->id,

                    'supplier_ids' => json_encode($supplierIds),
                    'shipping_id' => $shipping->id,
                    'package_id' => $package->id,
                    'annexure_id' => $anx->id,
                    'vgm_id' => $vgm->id
                ];
                $response->getBody()->write(json_encode($responseData));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(201);

            } else {
                $invoice = Invoice::create([
                    'invoice_number' => $data['invoice_number'],
                    'invoice_date' => $data['invoice_date'],
                    'integrated_tax' => $data['integrated_tax'],
                    'payment_term' => $data['payment_term'],
                    'product_type' => $data['product_type'],
                    'currancy_type' => $data['currency_type'],
                    'currancy_rate' => $data['currency_rate'],
                    'exporter_id' => $exporter->id,
                    'buyer_id' => $buyer->id,
                    'product_id' => $productDetails->id,
                    // 'supplier_id' => $supplier->id,
                    'shipping_id' => $shipping->id,
                    'package_id' => $package->id,
                    'annexure_id' => $anx->id,
                    'vgm_id' => $vgm->id
                ]);
                DB::commit();

                $responseData = [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'invoice_date' => $invoice->invoice_date,
                    'integrated_tax' => $invoice->integrated_tax,
                    'payment_term' => $invoice->payment_term,
                    'product_type' => $invoice->product_type,
                    'currancy_type' => $invoice->currancy_type,
                    'currancy_rate' => $invoice->currancy_rate,
                    'exporter_id' => $exporter->id,
                    'buyer_id' => $buyer->id,
                    'product_id' => $productDetails->id,

                    // 'supplier_id' => $supplier->id,
                    'shipping_id' => $shipping->id,
                    'package_id' => $package->id,
                    'annexure_id' => $anx->id,
                    'vgm_id' => $vgm->id
                ];
                $response->getBody()->write(json_encode($responseData));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
            }
            // Commit transaction





        } catch (\Exception $e) {
            // Rollback transaction on error
            DB::rollBack();

            $response->getBody()->write(json_encode([
                'error' => 'Failed to create invoice',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // READ all invoices with related data
    public function getInvoices(Request $request, Response $response)
    {
        try {
            // Fetch counts
            $exporterCount = ExporterDropdown::count();
            $invoiceCount = Invoice::count();
            $productCount = ProductCategory::count();
            $products = ProductCategory::select('id', 'category_name')->get();
            // Get query parameter 'limit' (optional)
            $queryParams = $request->getQueryParams();
            $limit = isset($queryParams['limit']) ? (int) $queryParams['limit'] : null;
            // Fetch list of invoices with joins
            $invoiceQuery = Invoice::select(
                'invoice.id',
                'invoice.invoice_number as invoiceNo',
                'invoice.invoice_date as date',
                'exporter_details.company_name as exporter_name',
                // 'supplier_details.supplier_name as supplier_name',
                'buyer_details.order_number as buyer_order_number',
                'product_details.total_price as totalFOBEuro',
                'invoice.product_id as product_id',
                'shipping_details.port_of_loading as portOfLoading',
                'shipping_details.final_destination as finalDestination',
                'shipping_details.port_of_discharge as portOfDischarge',
                'shipping_details.terms_of_delivery as shippingTerm',

            )
                ->leftJoin('exporter_details', 'exporter_details.id', '=', 'invoice.exporter_id')
                // ->leftJoin('supplier_details', 'supplier_details.id', '=', 'invoice.supplier_id')
                ->leftJoin('buyer_details', 'buyer_details.id', '=', 'invoice.buyer_id')
                ->leftJoin('product_details', 'product_details.id', '=', 'invoice.product_id')
                ->leftJoin('shipping_details', 'shipping_details.id', '=', 'invoice.shipping_id');



            if ($limit) {
                $invoiceQuery->limit($limit)->orderBy("invoice_date", 'desc');
            }
            $invoices = $invoiceQuery->get();
            $invoicesWithProducts = $invoices->map(function ($invoice) {
                $invoice->status = 'completed';

                // Fetch product details row for this invoice
                $productDetailRow = ProductDetails::where('id', $invoice->product_id)->first();

                if ($productDetailRow && !empty($productDetailRow->product_ids)) {
                    // Decode product_ids from JSON string
                    $productIdsArray = json_decode($productDetailRow->product_ids, true);

                    if (is_array($productIdsArray) && !empty($productIdsArray)) {
                        // Query ProductCategory (or ProductList) with those IDs
                        $products = ProductLists::whereIn('id', $productIdsArray)
                            ->select('id', 'product_name as description', 'quantity', 'unit', 'price', 'total_price as total') // Adjust fields as needed
                            ->get();
                    } else {
                        $products = [];
                    }
                } else {
                    $products = [];
                }

                // Add to invoice
                $invoice->items = $products;

                return $invoice;
            });
            // Apply limit if provided
            // Build response
            $responseData = [
                'status' => 'success',
                'counts' => [
                    'exporterCount' => $exporterCount,
                    'invoiceCount' => $invoiceCount,
                    'productCount' => $productCount
                ],
                'invoices' => $invoicesWithProducts,

            ];

            $response->getBody()->write(json_encode($responseData));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch invoices',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }


    // READ invoice by ID with related data
    public function getInvoiceById(Request $request, Response $response, $args)
{
    try {
        $invoice = Invoice::with([
            'exporter',
            'buyer',
            'productDetails',
            'shipping',
            'package',
            'annexure',
            'vgm'
        ])->find($args['id']);

        if (!$invoice) {
            $response->getBody()->write(json_encode(['message' => 'Invoice not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // === Safely extract related data ===
        $products = optional($invoice->productDetails)->products ?? collect();
        $containers = optional($invoice->productDetails)->containers ?? collect();
        $vgmContainers = optional($invoice->vgm)->containers ?? collect();

        // Ensure collections
        $products = is_array($products) ? collect($products) : $products;
        $containers = is_array($containers) ? collect($containers) : $containers;
        $vgmContainers = is_array($vgmContainers) ? collect($vgmContainers) : $vgmContainers;

        // === Group Products into Sections ===
        $productSection = $products->groupBy('category_id')->map(function ($groupedProducts, $categoryId) {
            $category = ProductCategory::find($categoryId);

            return [
                'id' => $categoryId,
                'category_id' => $categoryId,
                'category_name' => $category->description ?? null,
                'hsn_code' => $category->hsn_code ?? null,
                'products' => $groupedProducts->values()->toArray()
            ];
        })->values();

        // === Add Supplier Info ===
        $suppliers = $invoice->suppliers ?? collect();
        $formattedSuppliers = collect($suppliers)->map(function ($supplier) {
            return [
                'id' => $supplier->id,
                'name' => $supplier->supplier_name,
                'address' => $supplier->supplier_address,
                'gstin_number' => $supplier->gstin_number,
                'tax_invoice_number' => $supplier->tax_invoice_no,
                'date' => $supplier->date,
            ];
        })->values();

        $invoice->setAttribute('suppliers', $formattedSuppliers);

        // === Exporter Letterhead Images ===
        $expDrop = ExporterDropdown::where('company_name', $invoice->exporter->company_name)->first();
        if ($expDrop) {
            $invoice->exporter->setAttribute('header', $expDrop['letterhead_top_image']);
            $invoice->exporter->setAttribute('footer', $expDrop['letterhead_bottom_image']);
            $invoice->exporter->setAttribute('signature', $expDrop['stamp_image']);
        }

        // === Set Data to Object for Frontend ===
        $invoice->productDetails?->setAttribute('products', $products);
        $invoice->productDetails?->setAttribute('containers', $containers);
        $invoice->productDetails?->setAttribute('product_section', $productSection);
        $invoice->vgm?->setAttribute('containers', $vgmContainers);

        $response->getBody()->write(json_encode($invoice));
        return $response->withHeader('Content-Type', 'application/json');

    } catch (\Exception $e) {
        $response->getBody()->write(json_encode([
            'error' => 'Failed to fetch invoice',
            'message' => $e->getMessage()
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
}


    // UPDATE invoice and related data
    public function updateInvoice(Request $request, Response $response, $args)
    {
        try {
            $data = $request->getParsedBody();

            // Start transaction
            DB::beginTransaction();

            $invoice = Invoice::find($args['id']);
            if (!$invoice) {
                DB::rollBack();
                $response->getBody()->write(json_encode(['message' => 'Invoice not found']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }
            $data=$data['invoice'];
            // Update exporter
            $exporter = ExporterDetails::find($invoice->exporter_id);
            $exporter->update([
                'company_name' => $data['exporter']['company_name'],
                'company_address' => $data['exporter']['company_address'],
                'email' => $data['exporter']['email'],
                'tax_id' => $data['exporter']['tax_id'],
                'ie_code' => $data['exporter']['ie_code'],
                'pan_number' => $data['exporter']['pan_number'],
                'gstin_number' => $data['exporter']['gstin_number'],
                'state_code' => $data['exporter']['state_code']
            ]);

            // Update buyer
            $buyer = BuyerDetails::find($invoice->buyer_id);
            $buyer->update([
                'order_number' => $data['buyer']['buyer_order_no'],
                'order_date' => $data['buyer']['buyer_order_date'],
                'po_number' => $data['buyer']['po_no'],
                'consignee' => $data['buyer']['consignee'],
                'notify_party' => $data['buyer']['notify_party']
            ]);

            // Update products
            $productIds = [];
            foreach ($data['products']['product_list'] as $product) {
                $productRecord = ProductLists::updateOrCreate(
                    ['id' => $product['id'] ?? null],
                    [
                        'category_id' => $product['category_id'],
                        'product_name' => $product['product_name'],
                        'size' => $product['size'],
                        'quantity' => $product['quantity'],
                        'sqm' => $product['sqm'],
                        'total_sqm' => $product['total_sqm'],
                        'price' => $product['price'],
                        'net_weight' => $product['net_weight'],
                        'gross_weight' => $product['gross_weight']
                    ]
                );
                $productIds[] = $productRecord->id;
            }

            // Update containers
            $containerIds = [];
            foreach ($data['product_id']['containers'] as $container) {
                $containerRecord = ContainerInformation::updateOrCreate(
                    ['id' => $container['id'] ?? null],
                    [
                        'container_number' => $container['container_number'],
                        'line_seal_number' => $container['line_seal_number'],
                        'rfid_number' => $container['rfid_number'],
                        'design_no' => $container['design_no'],
                        'quantity_box' => $container['quantity_box'],
                        'net_weight' => $container['net_weight'],
                        'gross_weight' => $container['gross_weight']
                    ]
                );
                $containerIds[] = $containerRecord->id;
            }

            // Update product details
            $productDetails = ProductDetails::find($invoice->product_id);
            $productDetails->update([
                'marks' => $data['product']['marks'],
                'nos' => $data['product']['nos'],
                'frieght' => $data['product']['frieght'],
                'insurance' => $data['product']['insurance'],
                'total_price' => $data['product']['total_price'],
                'product_ids' => json_encode($productIds),
                'container_ids' => json_encode($containerIds)
            ]);

            // Update supplier
            $supplier = SupplierDetails::find($invoice->supplier_id);
            $supplier->update([
                'supplier_name' => $data['supplier']['supplier_name'],
                'supplier_address' => $data['supplier']['supplier_address'],
                'gstin_number' => $data['supplier']['gstin_number'],
                'tax_invoice_no' => $data['supplier']['tax_invoice_no'],
                'date' => $data['supplier']['date']
            ]);

            // Update shipping
            $shipping = ShippingDetail::find($invoice->shipping_id);
            $shipping->update([
                'place_of_receipt' => $data['shipping']['place_of_receipt'],
                'port_of_loading' => $data['shipping']['port_of_loading'],
                'port_of_discharge' => $data['shipping']['port_of_discharge'],
                'pre_carriage' => $data['shipping']['pre_carriage'],
                'shipping_number' => $data['shipping']['shipping_number'],
                'country_of_origin' => $data['shipping']['country_of_origin'],
                'origin_details' => $data['shipping']['origin_details'],
                'country_of_final_destination' => $data['shipping']['country_of_final_destination'],
                'terms_of_delivery' => $data['shipping']['terms_of_delivery'],
                'payment' => $data['shipping']['payment'],
                'shipping_method' => $data['shipping']['shipping_method'],
                'final_destination' => $data['shipping']['final_destination']
            ]);

            // Update package
            $package = PackageInformation::find($invoice->package_id);
            $package->update([
                'number_of_package' => $data['package']['number_of_package'],
                'total_gross_weight' => $data['package']['total_gross_weight'],
                'total_net_weight' => $data['package']['total_net_weight'],
                'gst_circular' => $data['package']['gst_circular'],
                'app_ref_number' => $data['package']['app_ref_number'],
                'lut_date' => $data['package']['lut_date'],
                'total_amount' => $data['package']['total_amount'],
                'amount_in_words' => $data['package']['amount_in_words']
            ]);

            // Update invoice
            $invoice->update([
                'invoice_number' => $data['invoice_number'],
                'integrated_tax' => $data['integrated_tax'],
                'payment_term' => $data['payment_term'],
                'product_type' => $data['product_type'],
                'currancy_type' => $data['currancy_type'],
                'currancy_rate' => $data['currancy_rate']
            ]);

            // Commit transaction
            DB::commit();

            // Return updated invoice with all IDs
            $responseData = [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'integrated_tax' => $invoice->integrated_tax,
                'payment_term' => $invoice->payment_term,
                'product_type' => $invoice->product_type,
                'currancy_type' => $invoice->currancy_type,
                'currancy_rate' => $invoice->currancy_rate,
                'exporter_id' => $exporter->id,
                'buyer_id' => $buyer->id,
                'product_id' => $productDetails->id,
                'supplier_id' => $supplier->id,
                'shipping_id' => $shipping->id,
                'package_id' => $package->id
            ];

            $response->getBody()->write(json_encode($responseData));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            // Rollback transaction on error
            DB::rollBack();

            $response->getBody()->write(json_encode([
                'error' => 'Failed to update invoice',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // DELETE invoice and related data
    public function deleteInvoice(Request $request, Response $response, $args)
    {
        try {
            // Start transaction
            DB::beginTransaction();

            $invoice = Invoice::find($args['id']);
            if (!$invoice) {
                DB::rollBack();
                $response->getBody()->write(json_encode(['message' => 'Invoice not found']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            // Delete related records
            ExporterDetails::destroy($invoice->exporter_id);
            BuyerDetails::destroy($invoice->buyer_id);

            $productDetails = ProductDetails::find($invoice->product_id);
            if ($productDetails) {
                $productIds = json_decode($productDetails->product_ids, true);
                $containerIds = json_decode($productDetails->container_ids, true);

                ProductList::destroy($productIds);
                ContainerInformation::destroy($containerIds);
                $productDetails->delete();
            }

            SupplierDetails::destroy($invoice->supplier_id);
            ShippingDetail::destroy($invoice->shipping_id);
            PackageInformation::destroy($invoice->package_id);

            // Finally, delete the invoice
            $invoice->delete();

            // Commit transaction
            DB::commit();

            $response->getBody()->write(json_encode(['message' => 'Invoice and related data deleted successfully']));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            // Rollback transaction on error
            DB::rollBack();

            $response->getBody()->write(json_encode([
                'error' => 'Failed to delete invoice',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // public function createAnnexureVgm(Request $request, Response $response, array $args){
    //     try {
    //         //code...
    //         // code to save data for annexure and vgm with transaction





    //     } catch (\Throwable $th) {
    //         //throw $th;
    //     }
    // }
}
