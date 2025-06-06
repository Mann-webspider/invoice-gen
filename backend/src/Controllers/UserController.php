<?php
namespace Shelby\OpenSwoole\Controllers;
use Firebase\JWT\Key;
use PDO;
use Exception;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Shelby\OpenSwoole\Models\User;
use Shelby\OpenSwoole\Models\TokenSession;

class UserController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // CREATE Supplier
    public function createUser(Request $request, Response $response)
    {
        $data = $request->getParsedBody();

        $Supplier = User::create($data);

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }

    // READ all Suppliers
    public function getUsers(Request $request, Response $response)
    {
        $Suppliers = User::all();

        $response->getBody()->write(json_encode($Suppliers));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // READ Supplier by ID
    public function getUserById(Request $request, Response $response, $args)
    {
        $Supplier = User::find($args['id']);

        if (!$Supplier) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // UPDATE Supplier
    public function updateUser(Request $request, Response $response, $args)
    {
        $data = $request->getParsedBody();
        $Supplier = User::find($args['id']);

        if (!$Supplier) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Supplier->update($data);

        $response->getBody()->write(json_encode($Supplier));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // DELETE Supplier
    public function deleteUser(Request $request, Response $response, $args)
    {
        $Supplier = User::find($args['id']);

        if (!$Supplier) {
            $response->getBody()->write(json_encode(['message' => 'Supplier not found']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $Supplier->delete();

        $response->getBody()->write(json_encode(['message' => 'Supplier deleted successfully']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // Add registration with ORM
    public function register(Request $request, Response $response)
    {
        try{

            $data = $request->getParsedBody();
            $email = $data['email'] ?? null;
            $password = $data['password'] ?? null;
            $role = $data['role'] ?? 'user';

        if (!$email || !$password) {
            $response->getBody()->write(json_encode(['message' => 'Email and password are required']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Check if user already exists using ORM
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            $response->getBody()->write(json_encode(['message' => 'User already exists']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(409);
        }

        // Create new user using ORM
        $user = User::create([
            'email' => $email,
            'name' => $data['name'] ?? null, // Optional field
            'password' => $password, // For testing purposes, use plain password
            'role' => $role,
        ]);
        // $user->email = $email;
        // $user->password = password_hash($password, PASSWORD_BCRYPT);
        // $user->password = $password; // For testing purposes, use plain password
        // $user->name = $data['name'] ?? null; // Optional field
        // $user->role = $role;
        // $user->save();

        $response->getBody()->write(json_encode(['message' => 'User registered successfully', 'user' => $user]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }catch (Exception $e) {
            $response->getBody()->write(json_encode(['message' => 'An error occurred during registration', 'error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // Generate token for user
    public function generateToken($userId)
    {
        $key = getenv('JWT_SECRET') ?: 'your-secret-key';
        $payload = [
            'iss' => 'invoice-gen',
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24) // Token valid for 1 day
        ];

        return JWT::encode($payload, $key, 'HS256');
    }

    // Add token session management
    public function createTokenSession($userId, $token)
    {
        // Store token in the database
        $session = TokenSession::create([
            'user_id' => $userId,
            'token' => $token,
        ]);
        return $session;
        
    }

    public function validateTokenSession($token)
    {
        // Validate token from the database
        $session = TokenSession::where('token', $token)->first();

        if (!$session) {
            throw new Exception('Invalid or expired token');
        }

        return $session;
    }

    // Add login with ORM
    public function login(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            $response->getBody()->write(json_encode(['message' => 'Email and password are required']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $user = User::where('email', $email)->first();

            if (!$user ||  $user->password !== $password) { // For testing purposes, use plain password
                $response->getBody()->write(json_encode(['message' => 'Invalid credentials']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
            }

            $token = $this->generateToken($user);
            $this->createTokenSession($user->id, $token);

            $response->getBody()->write(json_encode(['message' => 'Login successful', 'token' => $token, 'user' => $user]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['message' => 'An error occurred during login', 'error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function logout(Request $request, Response $response) {
        // grab tpken from local storage
        
        $authHeader = $request->getHeader('Authorization');

        if (!$authHeader || !isset($authHeader[0])) {
            $response->getBody()->write(json_encode(['message' => 'Authorization header missing']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = str_replace('Bearer ', '', $authHeader[0]);

        try {
            // Validate token session
            $this->validateTokenSession($token);

            // Delete token session from the database
            TokenSession::where('token', $token)->delete();

            $response->getBody()->write(json_encode(['message' => 'Logout successful']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['message' => 'An error occurred during logout', 'error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function checkSession(Request $request, Response $response) {
        $authHeader = $request->getHeader('Authorization');

        if (!$authHeader || !isset($authHeader[0])) {
            $response->getBody()->write(json_encode(['message' => 'Authorization header missing']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = str_replace('Bearer ', '', $authHeader[0]);

        try {
            $key = getenv('JWT_SECRET') ?: 'your-secret-key';
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            $response->getBody()->write(json_encode(['message' => 'Session valid', 'user' => $decoded]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['message' => 'Invalid or expired token', 'error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
    }
}
