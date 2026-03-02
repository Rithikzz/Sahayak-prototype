const fs = require('fs');
const path = require('path');

const dirs = [
  'sahayak-admin',
  'sahayak-admin/src',
  'sahayak-admin/src/components',
  'sahayak-admin/src/pages',
  'sahayak-admin/src/data',
  'sahayak-admin/src/utils',
  'sahayak-admin/public'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

console.log('Directory structure created successfully!');
