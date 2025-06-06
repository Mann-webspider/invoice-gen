<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\BuyerDetails;

class BuyerController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE BuyerDetails
    public function createBuyer(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Supplier = BuyerDetails::create($data);

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Suppliers
    public function getBuyers(Request $request, Response $response)
    {
        $Buyers = BuyerDetails::all();

        $response->getBody()->write(json_encode($Buyers));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Buyers by ID
    public function getBuyerById(Request $request, Response $response, $args)
    {
        $Buyers = BuyerDetails::find($args['id']);

        if (!$Buyers) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Buyers));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Supplier
    public function updateBuyer(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Buyers = BuyerDetails::find($args['id']);

        if (!$Buyers) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Buyers->update($data);

        $response->getBody()->write(json_encode($Buyers));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Buyers
    public function deleteBuyer(Request $request, Response $response, $args)
    {
        $Buyers = BuyerDetails::find($args['id']);

        if (!$Buyers) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Buyers->delete();

        $response->getBody()->write(json_encode(['message' => 'Supplier deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
