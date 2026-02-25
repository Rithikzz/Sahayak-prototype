import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Banking Kiosk UI - File Validation ===\n');

// Check all required files exist
const requiredFiles = [
  'src/components/WelcomeScreen.jsx',
  'src/components/AuthenticationScreen.jsx',
  'src/components/OTPVerificationScreen.jsx',
  'src/components/AuthSuccessScreen.jsx',
  'src/context/AppStateContext.jsx',
  'src/data/mockData.js',
  'src/App.jsx',
  'src/App.css',
  'src/main.jsx',
  'index.html',
  'vite.config.js'
];

let allFilesExist = true;

console.log('Checking required files:');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\n=== Summary ===');
if (allFilesExist) {
  console.log('✓ All required files exist!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open browser to: http://localhost:3000');
  console.log('3. Test the complete authentication flow');
} else {
  console.log('✗ Some files are missing. Please check the output above.');
}

console.log('\n=== Component Verification ===');

// Check imports in App.jsx
const appJsx = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
console.log('\nImports in App.jsx:');
console.log(appJsx.match(/import .* from '.*';/g).join('\n'));

// Check translations exist
const mockData = fs.readFileSync(path.join(__dirname, 'src/data/mockData.js'), 'utf8');
const hasEnglish = mockData.includes("en: {");
const hasHindi = mockData.includes("hi: {");
const hasTamil = mockData.includes("ta: {");

console.log('\n=== Translations ===');
console.log(`${hasEnglish ? '✓' : '✗'} English (en)`);
console.log(`${hasHindi ? '✓' : '✗'} Hindi (hi)`);
console.log(`${hasTamil ? '✓' : '✗'} Tamil (ta)`);

console.log('\n=== Routes Configuration ===');
const routes = appJsx.match(/<Route path=".*" element={.*} \/>/g);
if (routes) {
  routes.forEach(route => {
    console.log(`✓ ${route}`);
  });
}

console.log('\n=== Ready for Testing! ===');
