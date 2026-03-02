# Sahayak Admin Portal - Automated Setup Script
# Run this to automatically organize all files into the correct project structure

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Sahayak Bank Admin Portal Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$source = "C:\Users\RITHIK S\uihack"
$dest = "C:\Users\RITHIK S\uihack\sahayak-admin"

# Check if destination already exists
if (Test-Path $dest) {
    Write-Host "Warning: sahayak-admin folder already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
    Remove-Item -Path $dest -Recurse -Force
}

Write-Host "Creating directory structure..." -ForegroundColor Green

# Create all directories
$directories = @(
    "$dest\src",
    "$dest\src\components",
    "$dest\src\components\Layout",
    "$dest\src\components\Dashboard",
    "$dest\src\components\Common",
    "$dest\src\pages",
    "$dest\src\data",
    "$dest\public"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "  ✓ Created: $dir" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Copying configuration files..." -ForegroundColor Green

# Configuration files mapping
$configFiles = @{
    "sahayak-package.json" = "package.json"
    "sahayak-index.html" = "index.html"
    "sahayak-vite.config.js" = "vite.config.js"
    "sahayak-tailwind.config.js" = "tailwind.config.js"
    "sahayak-postcss.config.js" = "postcss.config.js"
}

foreach ($file in $configFiles.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $configFiles[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($configFiles[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying source files..." -ForegroundColor Green

# Source files mapping
$sourceFiles = @{
    "sahayak-src-main.jsx" = "src\main.jsx"
    "sahayak-src-App.jsx" = "src\App.jsx"
    "sahayak-src-index.css" = "src\index.css"
}

foreach ($file in $sourceFiles.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $sourceFiles[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($sourceFiles[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying data files..." -ForegroundColor Green

$dataFiles = @{
    "sahayak-src-data-mockData.js" = "src\data\mockData.js"
}

foreach ($file in $dataFiles.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $dataFiles[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($dataFiles[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying layout components..." -ForegroundColor Green

$layoutComponents = @{
    "sahayak-components-Layout.jsx" = "src\components\Layout\Layout.jsx"
    "sahayak-components-Sidebar.jsx" = "src\components\Layout\Sidebar.jsx"
    "sahayak-components-Header.jsx" = "src\components\Layout\Header.jsx"
}

foreach ($file in $layoutComponents.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $layoutComponents[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($layoutComponents[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying dashboard components..." -ForegroundColor Green

$dashboardComponents = @{
    "sahayak-components-KPICard.jsx" = "src\components\Dashboard\KPICard.jsx"
}

foreach ($file in $dashboardComponents.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $dashboardComponents[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($dashboardComponents[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying common components..." -ForegroundColor Green

$commonComponents = @{
    "sahayak-components-Badge.jsx" = "src\components\Common\Badge.jsx"
    "sahayak-components-Button.jsx" = "src\components\Common\Button.jsx"
    "sahayak-components-Modal.jsx" = "src\components\Common\Modal.jsx"
    "sahayak-components-Table.jsx" = "src\components\Common\Table.jsx"
}

foreach ($file in $commonComponents.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $commonComponents[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($commonComponents[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Copying page components..." -ForegroundColor Green

$pages = @{
    "sahayak-pages-Dashboard.jsx" = "src\pages\Dashboard.jsx"
    "sahayak-pages-FormsTemplates.jsx" = "src\pages\FormsTemplates.jsx"
    "sahayak-pages-Kiosks.jsx" = "src\pages\Kiosks.jsx"
    "sahayak-pages-Updates.jsx" = "src\pages\Updates.jsx"
    "sahayak-pages-Reports.jsx" = "src\pages\Reports.jsx"
    "sahayak-pages-Users.jsx" = "src\pages\Users.jsx"
    "sahayak-pages-Settings.jsx" = "src\pages\Settings.jsx"
}

foreach ($file in $pages.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = Join-Path $dest $pages[$file]
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath
        Write-Host "  ✓ $file → $($pages[$file])" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete! ✓" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd sahayak-admin" -ForegroundColor Cyan
Write-Host "  2. npm install" -ForegroundColor Cyan
Write-Host "  3. npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "The application will open at http://localhost:5173" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to install dependencies now
$install = Read-Host "Do you want to install dependencies now? (y/n)"
if ($install -eq 'y') {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Green
    Set-Location $dest
    npm install
    
    Write-Host ""
    $run = Read-Host "Do you want to start the development server? (y/n)"
    if ($run -eq 'y') {
        Write-Host ""
        Write-Host "Starting development server..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
        npm run dev
    }
}
