@echo off
REM Change directory to where this script is located
cd /d "%~dp0"

REM Check if Python is available
where python >nul 2>nul
if errorlevel 1 (
    echo Python is not installed or not in PATH.
    pause
    exit /b
)

REM Start Python HTTP server on port 8000

echo Starting local server at http://localhost:8001
start http://localhost:8001
python -m http.server 8001