<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\PackageInformation;

class PackageController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE PackageInformation
    public function createPackage(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Package = PackageInformation::create($data);

        $response->getBody()->write(json_encode($Package));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Suppliers
    public function getPackage(Request $request, Response $response)
    {
        $Package = PackageInformation::all();

        $response->getBody()->write(json_encode($Package));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Buyers by ID
    public function getPackageById(Request $request, Response $response, $args)
    {
        $Package = PackageInformation::find($args['id']);

        if (!$Package) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Package));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Supplier
    public function updatePackage(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Package = PackageInformation::find($args['id']);

        if (!$Package) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Package->update($data);

        $response->getBody()->write(json_encode($Package));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Buyers
    public function deletePackage(Request $request, Response $response, $args)
    {
        $Package = PackageInformation::find($args['id']);

        if (!$Package) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Package->delete();

        $response->getBody()->write(json_encode(['message' => 'Supplier deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
