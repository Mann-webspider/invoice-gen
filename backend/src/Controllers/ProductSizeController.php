<?php
namespace Shelby\OpenSwoole\Controllers;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ProductSizeDropdown;
use PDO;

class ProductSizeController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Product
    public function createProductSize(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Product = ProductSizeDropdown::create($data);

        $response->getBody()->write(json_encode($Product));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Products
    public function getProductsSize(Request $request, Response $response)
    {
        $Products = ProductSizeDropdown::all();

        $response->getBody()->write(json_encode($Products));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Product by ID
    public function getProductSizeById(Request $request, Response $response, $args)
    {
        $Product = ProductSizeDropdown::find($args['id']);

        if (!$Product) {
            $response->getBody()->write(json_encode(['message' => 'Product not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Product));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Product
    public function updateProductSize(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Product = ProductSizeDropdown::find($args['id']);

        if (!$Product) {
            $response->getBody()->write(json_encode(['message' => 'Product not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Product->update($data);

        $response->getBody()->write(json_encode($Product));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Product
    public function deleteProductSize(Request $request, Response $response, $args)
    {
        $Product = ProductSizeDropdown::find($args['id']);

        if (!$Product) {
            $response->getBody()->write(json_encode(['message' => 'Product not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Product->delete();

        $response->getBody()->write(json_encode(['message' => 'Product deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
