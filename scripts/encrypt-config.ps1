# Encrypt configuration file
$key = "YOUR-SECRET-KEY-32-CHARACTERS-LONG"
$configPath = "app-config.json"
$encryptedPath = "app-config.json.enc"

# Read config
$config = Get-Content $configPath -Raw

# Encrypt using AES
$secureKey = $key | ConvertTo-SecureString -AsPlainText -Force
$encrypted = ConvertFrom-SecureString -String $config -SecureKey $secureKey

# Save encrypted
Set-Content -Path $encryptedPath -Value $encrypted

Write-Host "Configuration encrypted: $encryptedPath"
