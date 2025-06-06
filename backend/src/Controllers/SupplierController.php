<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\SupplierDetails;

class SupplierController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Supplier
    public function createSupplier(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Supplier = SupplierDetails::create($data);

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Suppliers
    public function getSuppliers(Request $request, Response $response)
    {
        $Suppliers = SupplierDetails::all();

        $response->getBody()->write(json_encode($Suppliers));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Supplier by ID
    public function getSupplierById(Request $request, Response $response, $args)
    {
        $Supplier = SupplierDetails::find($args['id']);

        if (!$Supplier) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Supplier
    public function updateSupplier(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Supplier = SupplierDetails::find($args['id']);

        if (!$Supplier) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Supplier->update($data);

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Supplier
    public function deleteSupplier(Request $request, Response $response, $args)
    {
        $Supplier = SupplierDetails::find($args['id']);

        if (!$Supplier) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Supplier->delete();

        $response->getBody()->write(json_encode(['message' => 'Supplier deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
