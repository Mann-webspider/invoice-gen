@echo off
echo ======================================
echo Invoice System - Network Setup
echo ======================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set IP=%%a
set IP=%IP:~1%

echo Your server IP: %IP%
echo.

REM Add to Windows hosts file for local DNS
echo Adding invoice.zeric.com to hosts file...
echo %IP% invoice.zeric.com >> C:\Windows\System32\drivers\etc\hosts

echo.
echo Network devices can access via:
echo   - http://%IP%
echo   - http://invoice.zeric.com (on this machine)
echo.
echo For other devices, add this to their hosts file:
echo   %IP% invoice.zeric.com
echo.
pause
