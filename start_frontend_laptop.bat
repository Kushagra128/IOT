@echo off
REM Frontend Startup Script for Windows Laptop
REM Connects to Raspberry Pi backend at http://10.124.101.100:5000

echo ==========================================
echo   Meeting Transcriber Frontend
echo   Connecting to Raspberry Pi Backend
echo ==========================================
echo.

cd frontend

echo [1/3] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo [OK] Node.js found
echo.

echo [2/3] Installing dependencies...
if not exist "node_modules" (
    echo Installing packages... This may take a few minutes.
    call npm install
) else (
    echo [OK] Dependencies already installed
)
echo.

echo [3/3] Starting frontend...
echo.
echo ==========================================
echo   Frontend Starting
echo ==========================================
echo.
echo Backend: http://10.124.101.100:5000
echo Frontend will open at: http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev

pause
