const fs = require('fs');
const path = require('path');

console.log('Setting up SAHAYAK Kiosk project structure...\n');

// Create directories
const directories = [
    'src',
    'src/components',
    'src/context',
    'src/data'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
    }
});

// File moves mapping
const fileMoves = {
    'src_App.jsx': 'src/App.jsx',
    'src_App.css': 'src/App.css',
    'src_main.jsx': 'src/main.jsx',
    'src_context_AppStateContext.jsx': 'src/context/AppStateContext.jsx',
    'src_data_mockData.js': 'src/data/mockData.js',
    'src_components_WelcomeScreen.jsx': 'src/components/WelcomeScreen.jsx',
    'src_components_ModeSelectionScreen.jsx': 'src/components/ModeSelectionScreen.jsx',
    'src_components_ServiceSelectionScreen.jsx': 'src/components/ServiceSelectionScreen.jsx',
    'src_components_InputController.jsx': 'src/components/InputController.jsx',
    'src_components_FieldConfirmationScreen.jsx': 'src/components/FieldConfirmationScreen.jsx',
    'src_components_FormPreviewScreen.jsx': 'src/components/FormPreviewScreen.jsx',
    'src_components_VoiceVerificationScreen.jsx': 'src/components/VoiceVerificationScreen.jsx',
    'src_components_HumanVerificationScreen.jsx': 'src/components/HumanVerificationScreen.jsx',
    'src_components_SuccessScreen.jsx': 'src/components/SuccessScreen.jsx'
};

console.log('\nMoving files to correct locations...');

Object.entries(fileMoves).forEach(([source, dest]) => {
    if (fs.existsSync(source)) {
        fs.renameSync(source, dest);
        console.log(`✓ Moved: ${source} -> ${dest}`);
    }
});

console.log('\n✅ Project structure setup complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run dev');
console.log('3. Open: http://localhost:3000\n');
