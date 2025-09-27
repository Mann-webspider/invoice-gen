<?php

namespace Shelby\OpenSwoole\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ExporterDropdown;
use Shelby\OpenSwoole\Models\ProductCategory;
use Shelby\OpenSwoole\Models\ProductSizeDropdown;
use Shelby\OpenSwoole\Models\ShippingDetail;
use Shelby\OpenSwoole\Models\SupplierDropdown;
use Shelby\OpenSwoole\Models\DropdownOption;
use Shelby\OpenSwoole\Models\DropdownCategory;
use Shelby\OpenSwoole\Models\ArnDeclaration;
use Illuminate\Database\Capsule\Manager as DB;
use Exception;

class DropdownController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // ExporterDropdown CRUD Operations
    public function createExporter(Request $request, Response $response)
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            $requiredFields = ['company_name', 'company_address', 'email', 'tax_id', 'ie_code', 
                             'pan_number', 'gstin_number', 'state_code', 'authorized_name', 
                             'authorized_designation', 'contact_number'];
            
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    throw new \InvalidArgumentException("Missing required field: {$field}");
                }
            }

            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException("Invalid email format");
            }

            $exporter = ExporterDropdown::create($data);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $exporter
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to create exporter',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updateExporter(Request $request, Response $response, array $args)
    {
        try {
            $data = $request->getParsedBody();
            
            // Validate ID exists
            if (empty($args['id'])) {
                throw new \InvalidArgumentException("Missing exporter ID");
            }

            // Find the exporter
            $exporter = ExporterDropdown::find($args['id']);
            if (!$exporter) {
                throw new \InvalidArgumentException("Exporter not found");
            }

            // Validate email if provided
            if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException("Invalid email format");
            }

            $exporter->update($data);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $exporter
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to update exporter',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function deleteExporter(Request $request, Response $response, array $args)
    {
        try {
            // Validate ID exists
            if (empty($args['id'])) {
                throw new \InvalidArgumentException("Missing exporter ID");
            }

            // Find the exporter
            $exporter = ExporterDropdown::find($args['id']);
            if (!$exporter) {
                throw new \InvalidArgumentException("Exporter not found");
            }

            $exporter->delete();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'message' => 'Exporter deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to delete exporter',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

   



    // SupplierDropdown CRUD Operations
    public function createSupplier(Request $request, Response $response)
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data)) {
                throw new Exception('Request body is empty');
            }

            $SupplierDropdown = SupplierDropdown::create($data);

            $response->getBody()->write(json_encode($SupplierDropdown));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function updateSupplier(Request $request, Response $response, array $args)
    {
        try {
            if (!isset($args['id'])) {
                throw new Exception('Supplier ID is required');
            }

            $data = $request->getParsedBody();
            if (empty($data)) {
                throw new Exception('Request body is empty');
            }

            $SupplierDropdown = SupplierDropdown::findOrFail($args['id']);
            $SupplierDropdown->update($data);

            $response->getBody()->write(json_encode($SupplierDropdown));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Supplier not found'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
    }

    public function deleteSupplier(Request $request, Response $response, array $args)
    {
        try {
            if (!isset($args['id'])) {
                throw new Exception('Supplier ID is required');
            }

            SupplierDropdown::findOrFail($args['id'])->delete();
            return $response->withStatus(204);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Supplier not found'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
    }

    // ARN Declaration CRUD Operations
    public function createArnDeclaration(Request $request, Response $response)
    {
        try {
            //code...
            $data = $request->getParsedBody();
        // Convert value to JSON string for DB (if storing in BLOB column)
        // Convert 'value' to a JSON string if it's an array
       
        $arn = ArnDeclaration::updateOrCreate(['id' => '1'],[
            'arn' => $data['applicationRefNumber'],
            'gst_circular' => $data['gstCircular'],
            
        ]);
        $response->getBody()->write(json_encode($arn));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Throwable $th) {
            //throw $th;
            $response->getBody()->write(json_encode([
                'error' => $th
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
        
    }

    public function updateArnDeclaration(Request $request, Response $response, array $args)
    {
        $data = $request->getParsedBody();
        $arn = ArnDeclaration::findOrFail($args['id']);
        $arn->update($data);

        $response->getBody()->write(json_encode($arn));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteArnDeclaration(Request $request, Response $response, array $args)
    {
        ArnDeclaration::findOrFail($args['id'])->delete();
        return $response->withStatus(204);
    }

    // Existing read methods...
    public function getExporternDetails(Request $request, Response $response, array $args)
    {
        try {
            if (empty($args['id'])) {
                throw new \InvalidArgumentException("Missing exporter ID");
            }

            $exporter = ExporterDropdown::find($args['id']);
            if (!$exporter) {
                throw new \InvalidArgumentException("Exporter not found");
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $exporter
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch exporter details',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getAllExporterDetails(Request $request, Response $response): Response
{
    try {
        $exporters = ExporterDropdown::select('*')
            ->orderBy('company_name', 'desc')
            ->get()
            ->toArray();

        // Add next_invoice_number to each exporter
        foreach ($exporters as &$exporter) {
            $prefix = $exporter['company_prefix'] ?? 'EXP';  // Fallback prefix
            $lastNumber = (int) ($exporter['last_invoice_number'] ?? 0);
            $year = $exporter['invoice_year'] ?? date('Y');
            $nextNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            $exporter['next_invoice_number'] = "{$prefix}/{$nextNumber}/{$year}";
        }

        $response->getBody()->write(json_encode([
            'status' => 'success',
            'data' => $exporters
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    } catch (\Exception $e) {
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => 'Failed to fetch all exporter details',
            'error' => $e->getMessage()
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
    }
}


    public function getSupplierDetails(Request $request, Response $response, array $args)
    {
        try {
            if (empty($args['id'])) {
                throw new \InvalidArgumentException("Missing supplier ID");
            }

            $supplier = SupplierDropdown::find($args['id']);
            if (!$supplier) {
                throw new \InvalidArgumentException("Supplier not found");
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $supplier
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch supplier details',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getAllSupplierDetails(Request $request, Response $response)
    {
        try {
            $suppliers = SupplierDropdown::select('*')
                ->orderBy('supplier_name', 'desc')
                ->get();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $suppliers
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch all supplier details',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getArnDeclaration(Request $request, Response $response, array $args)
    {
        try {
            if (empty($args['id'])) {
                throw new \InvalidArgumentException("Missing ARN declaration ID");
            }

            $arn = ArnDeclaration::find($args['id']);
            if (!$arn) {
                throw new \InvalidArgumentException("ARN declaration not found");
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $arn
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch ARN declaration',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getAllArnDeclaration(Request $request, Response $response)
    {
        try {
            $arns = ArnDeclaration::select('*')
                ->orderBy('arn', 'desc')
                ->get();

            foreach ($arns as $arn) {
                $arn->value = json_decode($arn->value, true);
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $arns
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch all ARN declarations',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getAllOptions(Request $request, Response $response)
    {
        try {
            $data = [
                
                'shipping' => DropdownOption::select('id','category','value')
                    ->get(),
                
            ];

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $data
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch dropdown options',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // Dropdown Options CRUD Operations
    public function getDropdownOptions(Request $request, Response $response, array $args)
    {
        try {
            if (empty($args['category'])) {
                throw new \InvalidArgumentException("Missing category parameter");
            }

            $options = DropdownOption::select('id', 'value')
                ->where('category', $args['category'])
                ->active()
                ->orderBy('value')
                ->get();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => [$args['category'] => $options]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch dropdown options',
                'error' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

  

    public function createDropdownOption(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        if (!isset($data['category']) || !isset($data['value'])) {
            $response->getBody()->write(json_encode([
                'error' => 'Missing required fields: category, value, and label are required'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        $isAvailable= DropdownOption::where('category', $data['category'])
            ->where('value', $data['value'])
            ->active()
            ->exists();
        if ($isAvailable) {
            $response->getBody()->write(json_encode([
                'error' => 'Option already exists'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        $option = DropdownOption::create([

            'category' => $data['category'],
            'value' => $data['value'],
            'is_active' => $data['is_active'] ?? 1
        ]);

        $allOptions = DropdownOption::select('id', 'category', 'value')->where('category', $data['category'])
            ->active()
            ->orderBy('updated_timestamp')
            ->get();

        $response->getBody()->write(json_encode([
            'data' => $option,
            'all_options' => $allOptions
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    public function updateDropdownOption(Request $request, Response $response, array $args)
    {
        $data = $request->getParsedBody();
        $option = DropdownOption::findOrFail($args['id']);
        $option->update([
            'category' => $data['category'],
            'value' => $data['value'],

            'is_active' => $data['is_active'] ?? 1
        ]);

        $allOptions = DropdownOption::where('category', $data['category'])
            ->active()
            ->orderBy('label')
            ->get();

        $response->getBody()->write(json_encode([
            'updated' => $option,
            'all_options' => $allOptions
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteDropdownOption(Request $request, Response $response, array $args)
    {
        DropdownOption::findOrFail($args['id'])->delete();
        $data = DropdownOption::select('id','category','value')->get();
     
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);;
    }

    


   

    // Add this new method to the DropdownController class
    public function getAllDropdownValues(Request $request, Response $response)
    {
        try {
            // Get all dropdown options grouped by category
            $dropdownOptions = DropdownOption::active()
                ->get()
                ->groupBy('category')
                ->map(function ($items) {
                    return $items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'value' => $item->value,

                        ];
                    });
                });

            // Get shipping details in array format
            
            $shippingDetails = [
                'place_of_receipt' => DropdownOption::where("category","place_of_receipt")->orderBy('value')->pluck('value')->toArray(),
                'port_of_loading' => DropdownOption::where("category","port_of_loading")->orderBy('value')->pluck('value')->toArray(),
                'port_of_discharge' => DropdownOption::where("category","port_of_discharge")->orderBy('value')->pluck('value')->toArray(),
                'final_destination' => DropdownOption::where("category","final_destination")->orderBy('value')->pluck('value')->toArray()
            ];

           

            

            

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $shippingDetails
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }
    public function getTableInfo(Request $request, Response $response)      {
        try {
            //code...
            $tableInfo = [
                'descriptionHsnPairs' => ProductCategory::select("*")->orderBy('hsn_code')->get(),
                'sizeSqmPairs' => ProductSizeDropdown::select("*")->orderBy('size')->get(),
                'unitTypes' => DropdownOption::select("id","value")->where("category",'unit_type')->orderBy('value')->get(),
               
            ];

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $tableInfo
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Throwable $th) {
            //throw $th;
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $th->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')
                ->withStatus(500);
        }
    }

 
}