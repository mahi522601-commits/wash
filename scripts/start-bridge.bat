@echo off
REM Tech Wash Local Windows Storage Bridge Startup Script
REM Uses dynamic directory path (%~dp0) - works on any Windows PC without hardcoded user paths!

cd /d "%~dp0.."

if exist "techwash-terminal.json" (
    echo Using configuration from techwash-terminal.json...
) else (
    echo [NOTICE] techwash-terminal.json not found, defaulting to counter-1 (POS-01 Main Branch).
)

echo Starting Tech Wash Local Storage Bridge Service on 127.0.0.1:9123...
node scripts/pos-bridge.js
pause
