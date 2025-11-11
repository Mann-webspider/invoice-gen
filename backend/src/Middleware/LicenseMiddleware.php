<?php
namespace  Shelby\OpenSwoole\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class LicenseMiddleware implements MiddlewareInterface
{
    private $secretKey = "YOUR-SUPER-SECRET-KEY-32-CHARS-LONG-HERE";
    
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Skip license check for health endpoint
        $uri = $request->getUri()->getPath();
        if ($uri === '/health' || $uri === '/api/health') {
            return $handler->handle($request);
        }
        
        // Get license from environment
        $licenseKey = $_ENV['LICENSE_KEY'];
        
        if (empty($licenseKey)) {
            return $this->errorResponse('No license key provided');
        }
        
        $validation = $this->validateLicense($licenseKey);
        
        if (!$validation['valid']) {
            return $this->errorResponse(
                $validation['error'],
                $validation['expired_on'] ?? null
            );
        }
        
        // Add license info to request attributes
        $request = $request->withAttribute('license', $validation['data']);
        
        // Add headers for warnings or lifetime status
        $response = $handler->handle($request);
        
        if (isset($validation['warning'])) {
            $response = $response->withHeader('X-License-Warning', $validation['warning']);
        } else if (isset($validation['lifetime']) && $validation['lifetime']) {
            $response = $response->withHeader('X-License-Type', 'Lifetime');
        } else if (isset($validation['days_left'])) {
            $response = $response->withHeader('X-License-Days-Left', $validation['days_left']);
        }
        
        return $response;
    }
    
    private function validateLicense($licenseKey)
    {
        try {
            $decoded = base64_decode($licenseKey);
            if ($decoded === false) {
                return ['valid' => false, 'error' => 'Invalid license format'];
            }
            
            $parts = explode('::', $decoded);
            if (count($parts) !== 2) {
                return ['valid' => false, 'error' => 'Invalid license structure'];
            }
            
            list($dataString, $signature) = $parts;
            
            // Verify signature
            $expectedSignature = hash_hmac('sha256', $dataString, $this->secretKey);
            if (!hash_equals($signature, $expectedSignature)) {
                return ['valid' => false, 'error' => 'Invalid license signature'];
            }
            
            // Parse data
            $licenseData = json_decode($dataString, true);
            if (!$licenseData) {
                return ['valid' => false, 'error' => 'Invalid license data'];
            }
            
            // Check for lifetime license
            if (isset($licenseData['expires']) && strtolower($licenseData['expires']) === 'never') {
                return [
                    'valid' => true,
                    'data' => $licenseData,
                    'lifetime' => true
                ];
            }
            
            // Regular expiry check
            $expiryDate = strtotime($licenseData['expires']);
            $daysLeft = ceil(($expiryDate - time()) / 86400);
            
            if (time() > $expiryDate) {
                return [
                    'valid' => false, 
                    'error' => 'License expired',
                    'expired_on' => $licenseData['expires']
                ];
            }
            
            // Warning for expiring soon
            if ($daysLeft <= 7 && $daysLeft > 0) {
                return [
                    'valid' => true,
                    'warning' => "License expires in $daysLeft days",
                    'data' => $licenseData,
                    'days_left' => $daysLeft
                ];
            }
            
            return [
                'valid' => true, 
                'data' => $licenseData,
                'days_left' => $daysLeft
            ];
            
        } catch (\Exception $e) {
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }
    
    private function errorResponse($message, $expiredOn = null)
    {
        $response = new \Slim\Psr7\Response();
        
        $data = [
            'error' => 'License Error',
            'message' => $message,
            'contact' => 'support@yourcompany.com',
            'code' => 'LICENSE_INVALID'
        ];
        
        if ($expiredOn) {
            $data['expired_on'] = $expiredOn;
        }
        
        $response->getBody()->write(json_encode($data));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(403);
    }
}
