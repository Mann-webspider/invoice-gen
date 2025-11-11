<?php
// license-generator.php - YOU KEEP THIS SECRET

class LicenseGenerator {
    private $secretKey = "YOUR-SUPER-SECRET-KEY-32-CHARS-LONG-HERE";
    
    public function generateLicense($clientName, $expiryDate, $machineLimit = 1) {
        $licenseData = [
            'client' => $clientName,
            'expires' => $expiryDate,  // Can be "never" or date
            'machines' => $machineLimit,
            'generated' => date('Y-m-d H:i:s'),
            'version' => '1.0'
        ];
        
        $dataString = json_encode($licenseData);
        $signature = hash_hmac('sha256', $dataString, $this->secretKey);
        $license = base64_encode($dataString . '::' . $signature);
        
        return [
            'key' => $license,
            'data' => $licenseData
        ];
    }
    
    public function validateLicense($licenseKey) {
        try {
            $decoded = base64_decode($licenseKey);
            list($dataString, $signature) = explode('::', $decoded);
            
            $expectedSignature = hash_hmac('sha256', $dataString, $this->secretKey);
            if (!hash_equals($signature, $expectedSignature)) {
                return ['valid' => false, 'error' => 'Invalid signature'];
            }
            
            $licenseData = json_decode($dataString, true);
            
            // CHECK: Never expire license
            if (strtolower($licenseData['expires']) === 'never') {
                return [
                    'valid' => true,
                    'data' => $licenseData,
                    'expires_on' => 'Never',
                    'days_left' => 'Unlimited',
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
                    'data' => $licenseData
                ];
            }
            
            return [
                'valid' => true, 
                'data' => $licenseData,
                'days_left' => $daysLeft,
                'expires_on' => $licenseData['expires']
            ];
            
        } catch (Exception $e) {
            return ['valid' => false, 'error' => $e->getMessage()];
        }
    }
}

// CLI Interface
if (php_sapi_name() === 'cli') {
    $generator = new LicenseGenerator();
    
    echo "=================================\n";
    echo "   License Generator v1.0\n";
    echo "=================================\n\n";
    
    echo "Select action:\n";
    echo "1. Generate new license\n";
    echo "2. Validate existing license\n";
    echo "3. Renew license\n";
    echo "4. Generate lifetime license (never expires)\n";  // NEW OPTION
    echo "Choice: ";
    
    $choice = trim(fgets(STDIN));
    
    switch ($choice) {
        case '1':
            // Generate new license
            echo "\nClient Name: ";
            $clientName = trim(fgets(STDIN));
            
            echo "Expiry Date (YYYY-MM-DD): ";
            $expiryDate = trim(fgets(STDIN));
            
            echo "Machine Limit (default 1): ";
            $machineLimit = trim(fgets(STDIN)) ?: 1;
            
            $result = $generator->generateLicense($clientName, $expiryDate, $machineLimit);
            
            echo "\n=== LICENSE GENERATED ===\n";
            echo "Client: {$result['data']['client']}\n";
            echo "Expires: {$result['data']['expires']}\n";
            echo "Machines: {$result['data']['machines']}\n\n";
            echo "License Key:\n{$result['key']}\n\n";
            
            // Save to file
            $filename = "licenses/" . preg_replace('/[^a-z0-9]/i', '_', $clientName) . "_" . date('Y-m-d') . ".txt";
            @mkdir('licenses', 0755, true);
            file_put_contents($filename, $result['key']);
            echo "Saved to: $filename\n";
            break;
            
        case '2':
            // Validate license
            echo "\nLicense Key: ";
            $licenseKey = trim(fgets(STDIN));
            
            $validation = $generator->validateLicense($licenseKey);
            
            if ($validation['valid']) {
                echo "\n✓ LICENSE VALID\n";
                echo "Client: {$validation['data']['client']}\n";
                echo "Expires: {$validation['expires_on']}\n";
                
                if (isset($validation['lifetime']) && $validation['lifetime']) {
                    echo "Type: LIFETIME LICENSE\n";
                    echo "Days Left: Unlimited\n";
                } else {
                    echo "Days Left: {$validation['days_left']}\n";
                }
            } else {
                echo "\n✗ LICENSE INVALID\n";
                echo "Error: {$validation['error']}\n";
                if (isset($validation['expired_on'])) {
                    echo "Expired on: {$validation['expired_on']}\n";
                }
            }
            break;
            
        case '3':
            // Renew license
            echo "\nOld License Key: ";
            $oldKey = trim(fgets(STDIN));
            
            $validation = $generator->validateLicense($oldKey);
            if (!isset($validation['data'])) {
                echo "Error: Cannot read old license\n";
                exit(1);
            }
            
            $clientName = $validation['data']['client'];
            
            echo "\nNew Expiry Date (YYYY-MM-DD) or 'never': ";  // UPDATED
            $newExpiry = trim(fgets(STDIN));
            
            $result = $generator->generateLicense(
                $clientName, 
                $newExpiry, 
                $validation['data']['machines']
            );
            
            echo "\n=== LICENSE RENEWED ===\n";
            echo "Client: {$result['data']['client']}\n";
            echo "New Expires: {$result['data']['expires']}\n\n";
            echo "New License Key:\n{$result['key']}\n\n";
            
            $filename = "licenses/" . preg_replace('/[^a-z0-9]/i', '_', $clientName) . "_renewed_" . date('Y-m-d') . ".txt";
            file_put_contents($filename, $result['key']);
            echo "Saved to: $filename\n";
            break;
            
        case '4':  // NEW CASE - Lifetime License
            echo "\nClient Name: ";
            $clientName = trim(fgets(STDIN));
            
            echo "Machine Limit (default 1): ";
            $machineLimit = trim(fgets(STDIN)) ?: 1;
            
            // Generate with "never" expiry
            $result = $generator->generateLicense($clientName, 'never', $machineLimit);
            
            echo "\n=== LIFETIME LICENSE GENERATED ===\n";
            echo "Client: {$result['data']['client']}\n";
            echo "Expires: NEVER (Lifetime License)\n";
            echo "Machines: {$result['data']['machines']}\n\n";
            echo "License Key:\n{$result['key']}\n\n";
            
            // Save to file
            $filename = "licenses/" . preg_replace('/[^a-z0-9]/i', '_', $clientName) . "_lifetime_" . date('Y-m-d') . ".txt";
            @mkdir('licenses', 0755, true);
            file_put_contents($filename, $result['key']);
            echo "Saved to: $filename\n";
            break;
            
        default:
            echo "Invalid choice\n";
    }
}
