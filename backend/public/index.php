<?php


use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Shelby\OpenSwoole\Models\User;
use DI\Container;
use Psr\Http\Server\RequestHandlerInterface;

use Slim\Psr7\Response as SlimResponse;
use \Slim\Log;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../bootstrap.php';

// Create Container
$container = new Container();

// Initialize PDO
$container->set('db', function() {
    $pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
});

// Create App with Container
AppFactory::setContainer($container);
$app = AppFactory::create();

// CORS middleware
$app->add(function (Request $request, RequestHandlerInterface $handler): Response {
    $response = $handler->handle($request);

    

    // Allow all origins - development only
    $response =  $response
    ->withHeader('Access-Control-Allow-Origin', '*')
    ->withHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept')
    ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    ->withHeader('Access-Control-Allow-Credentials', 'true');

    return $response;
});

// Add error middleware
$app->addErrorMiddleware(true, true, true);

// Add body parsing middleware
$app->addBodyParsingMiddleware();

$app->add(function (Request $request, RequestHandlerInterface $handler): Response {
    $response = $handler->handle($request);
    error_log("Middleware intercepted with status: " . $response->getStatusCode());
    return $response;
});
$app->add(function (Request $request, RequestHandlerInterface $handler): Response {
    error_log('Incoming request: ' . $request->getMethod() . ' ' . $request->getUri()->getPath());
    return $handler->handle($request);
});

$app->add(function (Request $request, RequestHandlerInterface $handler): Response {
    error_log("🔍 Incoming request: " . $request->getMethod() . " " . $request->getUri()->getPath());
    return $handler->handle($request);
});


$app->options('/{routes:.+}', function ($request, SlimResponse $response, $args) {
    return $response    
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        ->withHeader('Access-Control-Allow-Credentials', 'true'); // No Content
        
});
// Test route
$app->get('/', function (Request $request, Response $response) {
    $response->getBody()->write('Hello from Slim!');
    return $response;
});



// Include routes
(require __DIR__ . '/../src/routes.php')($app);

$app->run();
