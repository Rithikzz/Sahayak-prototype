# Setup script to organize SAHAYAK Kiosk project files

Write-Host "Setting up SAHAYAK Kiosk project structure..." -ForegroundColor Green

# Create directory structure
$directories = @(
    "src",
    "src\components",
    "src\context", 
    "src\data"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Cyan
    }
}

# Move files to correct locations
$fileMoves = @{
    "src_App.jsx" = "src\App.jsx"
    "src_App.css" = "src\App.css"
    "src_main.jsx" = "src\main.jsx"
    "src_context_AppStateContext.jsx" = "src\context\AppStateContext.jsx"
    "src_data_mockData.js" = "src\data\mockData.js"
    "src_components_WelcomeScreen.jsx" = "src\components\WelcomeScreen.jsx"
    "src_components_ModeSelectionScreen.jsx" = "src\components\ModeSelectionScreen.jsx"
    "src_components_ServiceSelectionScreen.jsx" = "src\components\ServiceSelectionScreen.jsx"
    "src_components_InputController.jsx" = "src\components\InputController.jsx"
    "src_components_FieldConfirmationScreen.jsx" = "src\components\FieldConfirmationScreen.jsx"
    "src_components_FormPreviewScreen.jsx" = "src\components\FormPreviewScreen.jsx"
    "src_components_VoiceVerificationScreen.jsx" = "src\components\VoiceVerificationScreen.jsx"
    "src_components_HumanVerificationScreen.jsx" = "src\components\HumanVerificationScreen.jsx"
    "src_components_SuccessScreen.jsx" = "src\components\SuccessScreen.jsx"
}

foreach ($move in $fileMoves.GetEnumerator()) {
    $source = $move.Key
    $destination = $move.Value
    
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $destination -Force
        Write-Host "Moved: $source -> $destination" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Project structure setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
