@echo off
echo ========================================
echo SAHAYAK Bank Kiosk - Quick Start
echo ========================================
echo.

echo Checking if node_modules exists...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

echo Starting development server...
echo.
echo ========================================
echo   Access the kiosk at:
echo   http://localhost:5173
echo ========================================
echo.
echo   Test Flow:
echo   1. Select language (English/Hindi/Tamil)
echo   2. Enter staff PIN: 1234
echo   3. Choose "Voice + IVR" mode
echo   4. Select "Deposit" service
echo   5. Complete all fields
echo   6. Staff approves with any 4-digit PIN
echo   7. See success and auto-reset
echo.
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev
