@echo off
title Sunveil Interactive Kanban - Server Mode (24/7)
cd /d "%~dp0"

echo =======================================================
echo   Sunveil Interactive Kanban ^& Mindmap - Server Mode
echo =======================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js wurde nicht im System-Pfad gefunden.
    echo Bitte installiere Node.js (https://nodejs.org/) um den Server zu hosten.
    echo.
    pause
    exit /b 1
)

set SUNVEIL_SERVER=true
set NODE_ENV=production

echo Starting Sunveil Server on 0.0.0.0 (Port 40293)...
echo Druecke Strg+C um den Server zu beenden.
echo.
node server.js --server
pause

