# Sahayak Admin Portal - Authentication System Installer
# This script adds login/logout functionality to your existing project

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Sahayak Authentication System Installer" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$source = "C:\Users\RITHIK S\uihack"
$dest = "C:\Users\RITHIK S\uihack\sahayak-admin"

# Check if project exists
if (-not (Test-Path $dest)) {
    Write-Host "Error: sahayak-admin folder not found!" -ForegroundColor Red
    Write-Host "Please run setup-project.ps1 first to create the base project." -ForegroundColor Yellow
    exit
}

Write-Host "Found existing project at: $dest" -ForegroundColor Green
Write-Host ""

# Confirm before proceeding
$response = Read-Host "This will add authentication (login/logout) to your project. Continue? (y/n)"
if ($response -ne 'y') {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Installing authentication system..." -ForegroundColor Green
Write-Host ""

# Step 1: Create hooks folder
Write-Host "Step 1: Creating hooks folder..." -ForegroundColor Cyan
$hooksDir = "$dest\src\hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir | Out-Null
    Write-Host "  ✓ Created src/hooks folder" -ForegroundColor Gray
} else {
    Write-Host "  ✓ Hooks folder already exists" -ForegroundColor Gray
}

# Step 2: Copy new files
Write-Host ""
Write-Host "Step 2: Copying new authentication files..." -ForegroundColor Cyan

$newFiles = @{
    "sahayak-pages-Login.jsx" = "$dest\src\pages\Login.jsx"
    "sahayak-hooks-useAuth.jsx" = "$dest\src\hooks\useAuth.jsx"
    "sahayak-components-ProtectedRoute.jsx" = "$dest\src\components\ProtectedRoute.jsx"
}

foreach ($file in $newFiles.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = $newFiles[$file]
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath -Force
        Write-Host "  ✓ Copied: $file" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

# Step 3: Backup existing files
Write-Host ""
Write-Host "Step 3: Backing up existing files..." -ForegroundColor Cyan

$backupDir = "$dest\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir | Out-Null

$filesToBackup = @(
    "$dest\src\App.jsx",
    "$dest\src\components\Layout\Sidebar.jsx",
    "$dest\src\components\Layout\Header.jsx"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Copy-Item $file "$backupDir\$fileName" -Force
        Write-Host "  ✓ Backed up: $fileName" -ForegroundColor Gray
    }
}

Write-Host "  ✓ Backups saved to: $backupDir" -ForegroundColor Green

# Step 4: Replace updated files
Write-Host ""
Write-Host "Step 4: Updating existing files with auth integration..." -ForegroundColor Cyan

$updatedFiles = @{
    "sahayak-src-App-updated.jsx" = "$dest\src\App.jsx"
    "sahayak-components-Sidebar-updated.jsx" = "$dest\src\components\Layout\Sidebar.jsx"
    "sahayak-components-Header-updated.jsx" = "$dest\src\components\Layout\Header.jsx"
}

foreach ($file in $updatedFiles.Keys) {
    $sourcePath = Join-Path $source $file
    $destPath = $updatedFiles[$file]
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $destPath -Force
        Write-Host "  ✓ Updated: $(Split-Path $destPath -Leaf)" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Authentication System Installed! ✓" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Display demo credentials
Write-Host "📝 Demo Login Credentials:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Super Admin:" -ForegroundColor Cyan
Write-Host "    Email: rajesh.kumar@bank.com" -ForegroundColor White
Write-Host "    Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "  Regional Admin:" -ForegroundColor Cyan
Write-Host "    Email: priya.sharma@bank.com" -ForegroundColor White
Write-Host "    Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "  Read-Only:" -ForegroundColor Cyan
Write-Host "    Email: sneha.reddy@bank.com" -ForegroundColor White
Write-Host "    Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "✅ Features Added:" -ForegroundColor Yellow
Write-Host "  • Login page with beautiful UI" -ForegroundColor Gray
Write-Host "  • Protected routes (auth required)" -ForegroundColor Gray
Write-Host "  • User session management" -ForegroundColor Gray
Write-Host "  • Logout functionality in sidebar" -ForegroundColor Gray
Write-Host "  • Quick login buttons for testing" -ForegroundColor Gray
Write-Host "  • Role-based user display" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. cd sahayak-admin" -ForegroundColor Cyan
Write-Host "  2. npm run dev" -ForegroundColor Cyan
Write-Host "  3. Visit http://localhost:5173" -ForegroundColor Cyan
Write-Host "  4. You'll see the login page!" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  • Click quick login buttons for instant access" -ForegroundColor Gray
Write-Host "  • Try different user roles to see differences" -ForegroundColor Gray
Write-Host "  • Logout button is in the sidebar" -ForegroundColor Gray
Write-Host "  • Session persists on page refresh" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentation: Read AUTH_UPDATE_GUIDE.md for details" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to start the app
$run = Read-Host "Do you want to start the dev server now? (y/n)"
if ($run -eq 'y') {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "The login page will open automatically!" -ForegroundColor Cyan
    Write-Host ""
    Set-Location $dest
    npm run dev
}
