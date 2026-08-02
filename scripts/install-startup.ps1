# Install startup service for Invoice System
$appPath = $PSScriptRoot
$scriptPath = Join-Path $appPath "start-service.ps1"

# Create startup script
$startupScript = @"
# Wait for Docker to be ready
Start-Sleep -Seconds 60

# Check if Docker is running
`$dockerRunning = `$false
for (`$i = 0; `$i -lt 30; `$i++) {
    if (docker info 2>`$null) {
        `$dockerRunning = `$true
        break
    }
    Start-Sleep -Seconds 5
}

if (-not `$dockerRunning) {
    Write-Host "Docker failed to start"
    exit 1
}

# Start application
cd "$appPath"
docker-compose up -d

# Log startup
Add-Content -Path "$appPath\logs\startup.log" -Value "`$(Get-Date) - Application started"
"@

Set-Content -Path $scriptPath -Value $startupScript

# Create Task Scheduler task
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = 'PT2M'  # 2 minute delay after boot

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName "InvoiceSystemAutoStart" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Auto-start Invoice System on boot" `
    -Force

Write-Host "✓ Auto-startup installed successfully!"
Write-Host "Application will start automatically on system boot"
