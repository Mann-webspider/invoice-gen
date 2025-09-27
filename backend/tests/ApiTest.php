<?php

use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Slim\App;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\StreamFactory;
use Shelby\OpenSwoole\Models\DropdownOption;
use Shelby\OpenSwoole\Models\DropdownCategory;

class ApiTest extends TestCase
{
    private App $app;
    private PDO $pdo;

    protected function setUp(): void
    {
        // Create test database
        $this->pdo = new PDO('sqlite:' . __DIR__ . '/database/database.sqlite');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Create app instance
        $this->app = require __DIR__ . '/../public/test.php';
    }

    protected function tearDown(): void
    {
        // Clean up test database
        $this->pdo->exec('DELETE FROM dropdown_options');
        $this->pdo->exec('DELETE FROM dropdown_categories');
    }

    private function createRequest(string $method, string $path, array $data = []): ResponseInterface
    {
        $requestFactory = new ServerRequestFactory();
        $streamFactory = new StreamFactory();

        $request = $requestFactory->createServerRequest($method, $path);
        
        if (!empty($data)) {
            $stream = $streamFactory->createStream(json_encode($data));
            $request = $request->withBody($stream)
                              ->withHeader('Content-Type', 'application/json');
        }

        return $this->app->handle($request);
    }

    public function testCreateCategory()
    {
        $data = [
            'name' => 'test_category',
            'description' => 'Test category description'
        ];

        $response = $this->createRequest('POST', '/api/dropdown-categories', $data);
        $this->assertEquals(201, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals($data['name'], $body['data']['name']);
    }

    public function testGetAllCategories()
    {
        // First create a category
        $this->testCreateCategory();

        $response = $this->createRequest('GET', '/api/dropdown-categories');
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertIsArray($body['data']);
        $this->assertNotEmpty($body['data']);
    }

    public function testCreateOption()
    {
        // First create a category
        $this->testCreateCategory();

        $data = [
            'category' => 'test_category',
            'value' => 'test_value',
            'label' => 'Test Label',
            'is_active' => true,
            'sort_order' => 1
        ];

        $response = $this->createRequest('POST', '/api/dropdown-options', $data);
        $this->assertEquals(201, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals($data['value'], $body['data']['value']);
    }

    public function testGetAllOptions()
    {
        // First create an option
        $this->testCreateOption();

        $response = $this->createRequest('GET', '/api/dropdown-options');
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertIsArray($body['data']);
    }

    public function testGetOptionsByCategory()
    {
        // First create an option
        $this->testCreateOption();

        $response = $this->createRequest('GET', '/api/dropdown-options/test_category');
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertIsArray($body['data']);
    }

    public function testUpdateOption()
    {
        // First create an option
        $this->testCreateOption();
        $option = DropdownOption::first();

        $data = [
            'label' => 'Updated Label',
            'is_active' => false
        ];

        $response = $this->createRequest('PUT', '/api/dropdown-options/' . $option->id, $data);
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals($data['label'], $body['data']['label']);
        $this->assertEquals($data['is_active'], $body['data']['is_active']);
    }

    public function testToggleOption()
    {
        // First create an option
        $this->testCreateOption();
        $option = DropdownOption::first();
        $initialStatus = $option->is_active;

        $response = $this->createRequest('PUT', '/api/dropdown-options/' . $option->id . '/toggle');
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertEquals(!$initialStatus, $body['data']['is_active']);
    }

    public function testDeleteOption()
    {
        // First create an option
        $this->testCreateOption();
        $option = DropdownOption::first();

        $response = $this->createRequest('DELETE', '/api/dropdown-options/' . $option->id);
        $this->assertEquals(204, $response->getStatusCode());

        // Verify the option is deleted
        $response = $this->createRequest('GET', '/api/dropdown-options/' . $option->id);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testGetAllDropdowns()
    {
        // First create some data
        $this->testCreateOption();

        $response = $this->createRequest('GET', '/api/all-dropdowns');
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertArrayHasKey('categories', $body['data']);
        $this->assertArrayHasKey('options', $body['data']);
    }

    public function testReorderOptions()
    {
        // Create multiple options
        $this->testCreateCategory();
        $options = [
            ['value' => 'test_value1', 'label' => 'Test Label 1', 'sort_order' => 1],
            ['value' => 'test_value2', 'label' => 'Test Label 2', 'sort_order' => 2],
            ['value' => 'test_value3', 'label' => 'Test Label 3', 'sort_order' => 3]
        ];

        foreach ($options as $option) {
            $option['category'] = 'test_category';
            $this->createRequest('POST', '/api/dropdown-options', $option);
        }

        $data = ['orders' => [3, 1, 2]];
        $response = $this->createRequest('PUT', '/api/dropdown-options/test_category/reorder', $data);
        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('success', $body['status']);
        $this->assertIsArray($body['data']);
        $this->assertCount(3, $body['data']);
    }

    public function testInvalidCategory()
    {
        $response = $this->createRequest('GET', '/api/dropdown-options/invalid_category');
        $this->assertEquals(404, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('error', $body['status']);
    }

    public function testInvalidOptionId()
    {
        $response = $this->createRequest('GET', '/api/dropdown-options/999999');
        $this->assertEquals(404, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('error', $body['status']);
    }

    public function testInvalidOptionData()
    {
        $data = [
            'category' => 'test_category'
            // Missing required fields
        ];

        $response = $this->createRequest('POST', '/api/dropdown-options', $data);
        $this->assertEquals(400, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('error', $body['status']);
        $this->assertArrayHasKey('errors', $body);
    }
} 