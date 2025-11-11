<?php
// license-check.php - Backend validation
$secretKey = "YOUR-SUPER-SECRET-KEY-32-CHARS-LONG-HERE";  // SAME KEY

function validateLicense($licenseKey, $secretKey) {
    if (empty($licenseKey)) {
        return ['valid' => false, 'error' => 'No license key provided'];
    }
    
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
        $expectedSignature = hash_hmac('sha256', $dataString, $secretKey);
        if (!hash_equals($signature, $expectedSignature)) {
            return ['valid' => false, 'error' => 'Invalid license signature'];
        }
        
        // Parse data
        $licenseData = json_decode($dataString, true);
        if (!$licenseData) {
            return ['valid' => false, 'error' => 'Invalid license data'];
        }
        
        // CHECK: Never expire (lifetime) license
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
                'expired_on' => $licenseData['expires'],
                'days_left' => $daysLeft
            ];
        }
        
        // Check if expiring soon (warning)
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
        
    } catch (Exception $e) {
        return ['valid' => false, 'error' => $e->getMessage()];
    }
}

// Only check for non-health endpoints
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
if ($requestUri === '/health' || $requestUri === '/health.php') {
    return; // Skip license check for health endpoint
}

// Get license from environment
$licenseKey = getenv('LICENSE_KEY');
$validation = validateLicense($licenseKey, $secretKey);

if (!$validation['valid']) {
    http_response_code(403);
    header('Content-Type: application/json');
    die(json_encode([
        'error' => 'License Error',
        'message' => $validation['error'],
        'expired_on' => $validation['expired_on'] ?? null,
        'contact' => 'support@yourcompany.com',
        'code' => 'LICENSE_INVALID'
    ]));
}

// Show warning or lifetime status in response headers
if (isset($validation['warning'])) {
    header('X-License-Warning: ' . $validation['warning']);
} else if (isset($validation['lifetime']) && $validation['lifetime']) {
    header('X-License-Type: Lifetime');
}
