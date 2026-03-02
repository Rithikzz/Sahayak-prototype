@echo off
echo Creating Sahayak Admin Portal directory structure...

mkdir sahayak-admin 2>nul
mkdir sahayak-admin\src 2>nul
mkdir sahayak-admin\src\components 2>nul
mkdir sahayak-admin\src\components\Layout 2>nul
mkdir sahayak-admin\src\components\Dashboard 2>nul
mkdir sahayak-admin\src\components\Common 2>nul
mkdir sahayak-admin\src\pages 2>nul
mkdir sahayak-admin\src\data 2>nul
mkdir sahayak-admin\src\utils 2>nul
mkdir sahayak-admin\public 2>nul

echo Directory structure created successfully!
echo.
echo Next steps:
echo 1. Run this batch file
echo 2. Copy all the component files into their respective directories
echo 3. Run: cd sahayak-admin
echo 4. Run: npm install
echo 5. Run: npm run dev
echo.
pause
