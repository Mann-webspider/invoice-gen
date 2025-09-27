<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ProductDetails;

class ProductController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Product
    public function createProduct(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Product = ProductDetails::create($data);

        $response->getBody()->write(json_encode($Product));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Products
    public function getProducts(Request $request, Response $response)
    {
        $Products = ProductDetails::all();

        $response->getBody()->write(json_encode($Products));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Product by ID
    public function getProductById(Request $request, Response $response, $args)
    {
        $Product = ProductDetails::find($args['id']);

        if (!$Product) {
            $response->getBody()->write(json_encode(['message' => 'Product not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Product));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Product
    public function updateProduct(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Product = ProductDetails::find($args['id']);

        if (!$Product) {
            $response->getBody()->write(json_encode(['message' => 'Product not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Product->update($data);

        $response->getBody()->write(json_encode($Product));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Product
    public function deleteProduct(Request $request, Response $response, $args)
    {
        $Product = ProductDetails::find($args['id']);

        if (!$Product) {
            $response->getBody()->write(json_encode(['message' => 'Product not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Product->delete();

        $response->getBody()->write(json_encode(['message' => 'Product deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
