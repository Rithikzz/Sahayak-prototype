# SAHAYAK Bank Kiosk - Quick Start Script
# For PowerShell users

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SAHAYAK Bank Kiosk - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Dependencies already installed." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Access the kiosk at:" -ForegroundColor White
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Test Flow:" -ForegroundColor White
Write-Host "  1. Select language (English/Hindi/Tamil)" -ForegroundColor Gray
Write-Host "  2. Enter staff PIN: 1234" -ForegroundColor Gray
Write-Host "  3. Choose 'Voice + IVR' mode" -ForegroundColor Gray
Write-Host "  4. Select 'Deposit' service" -ForegroundColor Gray
Write-Host "  5. Complete all fields" -ForegroundColor Gray
Write-Host "  6. Staff approves with any 4-digit PIN" -ForegroundColor Gray
Write-Host "  7. See success and auto-reset" -ForegroundColor Gray
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
