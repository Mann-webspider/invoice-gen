<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\ExporterDetails;

class ExporterController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Exporter
    public function createExporter(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Exporter = ExporterDetails::create($data);

        $response->getBody()->write(json_encode($Exporter));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Exporters
    public function getExporters(Request $request, Response $response)
    {
        $Exporters = ExporterDetails::all();

        $response->getBody()->write(json_encode($Exporters));
        return $response->withHeader('Content-Type', 'application/json');
       
    }

    // READ Exporter by ID
    public function getExporterById(Request $request, Response $response, $args)
    {
        $Exporter = ExporterDetails::find($args['id']);

        if (!$Exporter) {
            $response->getBody()->write(json_encode(['message' => 'Exporter not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Exporter));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Exporter
    public function updateExporter(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Exporter = ExporterDetails::find($args['id']);

        if (!$Exporter) {
            $response->getBody()->write(json_encode(['message' => 'Exporter not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Exporter->update($data);

        $response->getBody()->write(json_encode($Exporter));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Exporter
    public function deleteExporter(Request $request, Response $response, $args)
    {
        $Exporter = ExporterDetails::find($args['id']);

        if (!$Exporter) {
            $response->getBody()->write(json_encode(['message' => 'Exporter not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Exporter->delete();

        $response->getBody()->write(json_encode(['message' => 'Exporter deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
