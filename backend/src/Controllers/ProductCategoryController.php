<?php
namespace Shelby\OpenSwoole\Controllers;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ProductCategory;
use PDO;
use Exception;

class ProductCategoryController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Product
    public function createProductCategory(Request $request, Response $response)
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data)) {
                throw new Exception('Invalid input data');
            }

            $Product = ProductCategory::create($data);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Product
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    // READ all Products
    public function getProductsCategory(Request $request, Response $response)
    {
        try {
            $Products = ProductCategory::all();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Products
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch products: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // READ Product by ID
    public function getProductCategoryById(Request $request, Response $response, $args)
    {
        try {
            if (!isset($args['id']) ) {
                throw new Exception('Invalid product ID');
            }

            $Product = ProductCategory::find($args['id']);

            if (!$Product) {
                $response->getBody()->write(json_encode([
                    'status' => 'error',
                    'message' => 'Product not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Product
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    // UPDATE Product
    public function updateProductCategory(Request $request, Response $response, $args)
    {
        try {
            if (!isset($args['id']) ) {
                throw new Exception('Invalid product ID');
            }

            $data = $request->getParsedBody();
            if (empty($data)) {
                throw new Exception('Invalid input data');
            }

            $Product = ProductCategory::find($args['id']);

            if (!$Product) {
                $response->getBody()->write(json_encode([
                    'status' => 'error',
                    'message' => 'Product not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $Product->update($data);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Product
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    // DELETE Product
    public function deleteProductCategory(Request $request, Response $response, $args)
    {
        try {
            if (!isset($args['id'])) {
                throw new Exception('Invalid product ID');
            }

            $Product = ProductCategory::find($args['id']);

            if (!$Product) {
                $response->getBody()->write(json_encode([
                    'status' => 'error',
                    'message' => 'Product not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $Product->delete();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'message' => 'Product deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }
}
