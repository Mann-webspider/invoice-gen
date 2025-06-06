<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ShippingDetail;

class ShippingController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Shipping
    public function createShipping(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Shipping = ShippingDetail::create($data);

        $response->getBody()->write(json_encode($Shipping));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Shipping
    public function getShipping(Request $request, Response $response)
    {
        $Shipping = ShippingDetail::all();

        $response->getBody()->write(json_encode($Shipping));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Shipping by ID
    public function getShippingById(Request $request, Response $response, $args)
    {
        $Shipping = ShippingDetail::find($args['id']);

        if (!$Shipping) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Shipping));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Shipping
    public function updateShipping(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Shipping = ShippingDetail::find($args['id']);

        if (!$Shipping) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Shipping->update($data);

        $response->getBody()->write(json_encode($Shipping));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Shipping
    public function deleteShipping(Request $request, Response $response, $args)
    {
        $Shipping = ShippingDetail::find($args['id']);

        if (!$Shipping) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Shipping->delete();

        $response->getBody()->write(json_encode(['message' => 'Supplier deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
