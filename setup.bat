@echo off
echo Setting up SAHAYAK Kiosk project structure...
echo.

REM Create directories
if not exist "src" mkdir "src"
if not exist "src\components" mkdir "src\components"
if not exist "src\context" mkdir "src\context"
if not exist "src\data" mkdir "src\data"

echo Created directory structure
echo.
echo Moving files...

REM Move files
if exist "src_App.jsx" move "src_App.jsx" "src\App.jsx"
if exist "src_App.css" move "src_App.css" "src\App.css"
if exist "src_main.jsx" move "src_main.jsx" "src\main.jsx"
if exist "src_context_AppStateContext.jsx" move "src_context_AppStateContext.jsx" "src\context\AppStateContext.jsx"
if exist "src_data_mockData.js" move "src_data_mockData.js" "src\data\mockData.js"
if exist "src_components_WelcomeScreen.jsx" move "src_components_WelcomeScreen.jsx" "src\components\WelcomeScreen.jsx"
if exist "src_components_ModeSelectionScreen.jsx" move "src_components_ModeSelectionScreen.jsx" "src\components\ModeSelectionScreen.jsx"
if exist "src_components_ServiceSelectionScreen.jsx" move "src_components_ServiceSelectionScreen.jsx" "src\components\ServiceSelectionScreen.jsx"
if exist "src_components_InputController.jsx" move "src_components_InputController.jsx" "src\components\InputController.jsx"
if exist "src_components_FieldConfirmationScreen.jsx" move "src_components_FieldConfirmationScreen.jsx" "src\components\FieldConfirmationScreen.jsx"
if exist "src_components_FormPreviewScreen.jsx" move "src_components_FormPreviewScreen.jsx" "src\components\FormPreviewScreen.jsx"
if exist "src_components_VoiceVerificationScreen.jsx" move "src_components_VoiceVerificationScreen.jsx" "src\components\VoiceVerificationScreen.jsx"
if exist "src_components_HumanVerificationScreen.jsx" move "src_components_HumanVerificationScreen.jsx" "src\components\HumanVerificationScreen.jsx"
if exist "src_components_SuccessScreen.jsx" move "src_components_SuccessScreen.jsx" "src\components\SuccessScreen.jsx"

echo.
echo Files moved successfully!
echo.
echo Project structure setup complete!
echo.
echo Next steps:
echo 1. Run: npm install
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
pause
