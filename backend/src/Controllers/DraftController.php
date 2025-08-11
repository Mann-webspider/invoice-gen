<?php

namespace Shelby\OpenSwoole\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\Draft;
use Shelby\OpenSwoole\Models\User;

class DraftController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function createDraft(Request $request, Response $response){
        $data = $request->getParsedBody();
        

        // Create draft
        $draft = Draft::create([
            
            'data' => json_encode($data['data']),
            'last_page' => $data['last_page'] ?? '',
            'invoice_number' => $data['invoice_number'] ?? '',
            'is_submitted' => 0,
        ]);
        $response->getBody()->write(json_encode($draft));
        
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }
    public function getDrafts(Request $request, Response $response){
        $drafts = Draft::all();
        $response->getBody()->write(json_encode($drafts));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getDraftById(Request $request, Response $response, $args){
        $draft = Draft::find($args['id']);
        if (!$draft) {
            $response->getBody()->write(json_encode(['message' => 'Draft not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
        $response->getBody()->write(json_encode($draft));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function updateDraft(Request $request, Response $response, $args){
        $data = $request->getParsedBody();
        $draft = Draft::find($args['id']);
        if (!$draft) {
            $response->getBody()->write(json_encode(['message' => 'Draft not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // Update draft
        $draft->data = json_encode($data['data']);
        $draft->last_page = $data['last_page'] ?? '';
        $draft->is_submitted = 0;
        $draft->save();

        $response->getBody()->write(json_encode($draft));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function deleteDraft(Request $request, Response $response, $args){
        $draft = Draft::find($args['id']);
        if (!$draft) {
            $response->getBody()->write(json_encode(['message' => 'Draft not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        // Delete draft
        $draft->delete();
        return $response->withStatus(204);
    }
    public function deleteAllDrafts(Request $request, Response $response){
        $drafts = Draft::all();
        foreach ($drafts as $draft) {
            $draft->delete();
        }
        return $response->withStatus(204);
    }

}
