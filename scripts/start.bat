@echo off
title Invoice System - Starting
echo Starting Invoice Application...
docker-compose up -d

timeout /t 10 /nobreak > nul

REM Health check
echo.
echo Checking application health...
curl -s http://localhost/api/health > nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backend is running
) else (
    echo [ERROR] Backend failed to start
)

curl -s http://localhost > nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Frontend is running
) else (
    echo [ERROR] Frontend failed to start
)

echo.
echo Application started successfully!
echo Access via: http://localhost or http://invoice.zeric.com
pause
