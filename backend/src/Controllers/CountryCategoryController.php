<?php
namespace Shelby\OpenSwoole\Controllers;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\FinalDestinationDropdown;
use PDO;
use Exception;

class CountryCategoryController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Country
    public function createCountryCategory(Request $request, Response $response)
    {
        try {
            $data = $request->getParsedBody();
            
            if (empty($data)) {
                throw new Exception('Invalid input data');
            }

            $Country = FinalDestinationDropdown::create($data);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Country
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

    // READ all Countrys
    public function getCountriesCategory(Request $request, Response $response)
    {
        try {
            $Countrys = FinalDestinationDropdown::all();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Countrys
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to fetch Countries: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // READ Country by ID
    public function getCountryCategoryById(Request $request, Response $response, $args)
    {
        try {
            if (!isset($args['id']) ) {
                throw new Exception('Invalid Country ID');
            }

            $Country = FinalDestinationDropdown::find($args['id']);

            if (!$Country) {
                $response->getBody()->write(json_encode([
                    'status' => 'error',
                    'message' => 'Country not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Country
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

    // UPDATE Country
    public function updateCountryCategory(Request $request, Response $response, $args)
    {
        try {
            if (!isset($args['id']) ) {
                throw new Exception('Invalid Country ID');
            }

            $data = $request->getParsedBody();
            if (empty($data)) {
                throw new Exception('Invalid input data');
            }

            $Country = FinalDestinationDropdown::find($args['id']);

            if (!$Country) {
                $response->getBody()->write(json_encode([
                    'status' => 'error',
                    'message' => 'Country not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $Country->update($data);

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'data' => $Country
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

    // DELETE Country
    public function deleteCountryCategory(Request $request, Response $response, $args)
    {
        try {
            if (!isset($args['id'])) {
                throw new Exception('Invalid Country ID');
            }

            $Country = FinalDestinationDropdown::find($args['id']);

            if (!$Country) {
                $response->getBody()->write(json_encode([
                    'status' => 'error',
                    'message' => 'Country not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $Country->delete();

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'message' => 'Country deleted successfully'
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
