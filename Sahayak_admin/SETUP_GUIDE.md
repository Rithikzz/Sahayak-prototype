# 🏦 Sahayak Bank Admin Portal - Setup Instructions

## 📁 Complete Project Structure

```
sahayak-admin/
├── public/
│   └── (empty for now)
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── Dashboard/
│   │   │   └── KPICard.jsx
│   │   └── Common/
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       └── Table.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── FormsTemplates.jsx
│   │   ├── Kiosks.jsx
│   │   ├── Updates.jsx
│   │   ├── Reports.jsx
│   │   ├── Users.jsx
│   │   └── Settings.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🚀 Setup Steps

### Step 1: Create Directory Structure

Run the batch file provided:
```bash
setup-sahayak.bat
```

OR create manually:
```bash
cd uihack
mkdir sahayak-admin
cd sahayak-admin
mkdir src src\components src\components\Layout src\components\Dashboard src\components\Common src\pages src\data public
```

### Step 2: Place Configuration Files

Copy these files from the root `uihack` folder to `sahayak-admin`:

1. `sahayak-package.json` → `sahayak-admin\package.json`
2. `sahayak-index.html` → `sahayak-admin\index.html`
3. `sahayak-vite.config.js` → `sahayak-admin\vite.config.js`
4. `sahayak-tailwind.config.js` → `sahayak-admin\tailwind.config.js`
5. `sahayak-postcss.config.js` → `sahayak-admin\postcss.config.js`

### Step 3: Place Source Files

**Main Files:**
- `sahayak-src-main.jsx` → `src\main.jsx`
- `sahayak-src-App.jsx` → `src\App.jsx`
- `sahayak-src-index.css` → `src\index.css`

**Data:**
- `sahayak-src-data-mockData.js` → `src\data\mockData.js`

**Layout Components:**
- `sahayak-components-Layout.jsx` → `src\components\Layout\Layout.jsx`
- `sahayak-components-Sidebar.jsx` → `src\components\Layout\Sidebar.jsx`
- `sahayak-components-Header.jsx` → `src\components\Layout\Header.jsx`

**Dashboard Components:**
- `sahayak-components-KPICard.jsx` → `src\components\Dashboard\KPICard.jsx`

**Common Components:**
- `sahayak-components-Badge.jsx` → `src\components\Common\Badge.jsx`
- `sahayak-components-Button.jsx` → `src\components\Common\Button.jsx`
- `sahayak-components-Modal.jsx` → `src\components\Common\Modal.jsx`
- `sahayak-components-Table.jsx` → `src\components\Common\Table.jsx`

**Pages:**
- `sahayak-pages-Dashboard.jsx` → `src\pages\Dashboard.jsx`
- `sahayak-pages-FormsTemplates.jsx` → `src\pages\FormsTemplates.jsx`
- `sahayak-pages-Kiosks.jsx` → `src\pages\Kiosks.jsx`
- `sahayak-pages-Updates.jsx` → `src\pages\Updates.jsx`
- `sahayak-pages-Reports.jsx` → `src\pages\Reports.jsx`
- `sahayak-pages-Users.jsx` → `src\pages\Users.jsx`
- `sahayak-pages-Settings.jsx` → `src\pages\Settings.jsx`

### Step 4: Install Dependencies

```bash
cd sahayak-admin
npm install
```

This will install:
- React 18
- React Router DOM
- Vite
- Tailwind CSS
- All necessary dev dependencies

### Step 5: Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Step 6: Build for Production

```bash
npm run build
```

Production build will be in the `dist` folder.

## 📋 File Mapping Reference

| Source File (uihack folder) | Destination (sahayak-admin folder) |
|----------------------------|-----------------------------------|
| sahayak-package.json | package.json |
| sahayak-index.html | index.html |
| sahayak-vite.config.js | vite.config.js |
| sahayak-tailwind.config.js | tailwind.config.js |
| sahayak-postcss.config.js | postcss.config.js |
| sahayak-src-main.jsx | src/main.jsx |
| sahayak-src-App.jsx | src/App.jsx |
| sahayak-src-index.css | src/index.css |
| sahayak-src-data-mockData.js | src/data/mockData.js |
| sahayak-components-Layout.jsx | src/components/Layout/Layout.jsx |
| sahayak-components-Sidebar.jsx | src/components/Layout/Sidebar.jsx |
| sahayak-components-Header.jsx | src/components/Layout/Header.jsx |
| sahayak-components-KPICard.jsx | src/components/Dashboard/KPICard.jsx |
| sahayak-components-Badge.jsx | src/components/Common/Badge.jsx |
| sahayak-components-Button.jsx | src/components/Common/Button.jsx |
| sahayak-components-Modal.jsx | src/components/Common/Modal.jsx |
| sahayak-components-Table.jsx | src/components/Common/Table.jsx |
| sahayak-pages-Dashboard.jsx | src/pages/Dashboard.jsx |
| sahayak-pages-FormsTemplates.jsx | src/pages/FormsTemplates.jsx |
| sahayak-pages-Kiosks.jsx | src/pages/Kiosks.jsx |
| sahayak-pages-Updates.jsx | src/pages/Updates.jsx |
| sahayak-pages-Reports.jsx | src/pages/Reports.jsx |
| sahayak-pages-Users.jsx | src/pages/Users.jsx |
| sahayak-pages-Settings.jsx | src/pages/Settings.jsx |

## 🎯 Quick Start Script (PowerShell)

If you want to automate the file placement, create this PowerShell script:

```powershell
# Save as: setup-project.ps1

$source = "C:\Users\RITHIK S\uihack"
$dest = "C:\Users\RITHIK S\uihack\sahayak-admin"

# Create directories
New-Item -ItemType Directory -Force -Path "$dest\src\components\Layout"
New-Item -ItemType Directory -Force -Path "$dest\src\components\Dashboard"
New-Item -ItemType Directory -Force -Path "$dest\src\components\Common"
New-Item -ItemType Directory -Force -Path "$dest\src\pages"
New-Item -ItemType Directory -Force -Path "$dest\src\data"
New-Item -ItemType Directory -Force -Path "$dest\public"

# Copy config files
Copy-Item "$source\sahayak-package.json" "$dest\package.json"
Copy-Item "$source\sahayak-index.html" "$dest\index.html"
Copy-Item "$source\sahayak-vite.config.js" "$dest\vite.config.js"
Copy-Item "$source\sahayak-tailwind.config.js" "$dest\tailwind.config.js"
Copy-Item "$source\sahayak-postcss.config.js" "$dest\postcss.config.js"

# Copy src files
Copy-Item "$source\sahayak-src-main.jsx" "$dest\src\main.jsx"
Copy-Item "$source\sahayak-src-App.jsx" "$dest\src\App.jsx"
Copy-Item "$source\sahayak-src-index.css" "$dest\src\index.css"

# Copy data
Copy-Item "$source\sahayak-src-data-mockData.js" "$dest\src\data\mockData.js"

# Copy layout components
Copy-Item "$source\sahayak-components-Layout.jsx" "$dest\src\components\Layout\Layout.jsx"
Copy-Item "$source\sahayak-components-Sidebar.jsx" "$dest\src\components\Layout\Sidebar.jsx"
Copy-Item "$source\sahayak-components-Header.jsx" "$dest\src\components\Layout\Header.jsx"

# Copy dashboard components
Copy-Item "$source\sahayak-components-KPICard.jsx" "$dest\src\components\Dashboard\KPICard.jsx"

# Copy common components
Copy-Item "$source\sahayak-components-Badge.jsx" "$dest\src\components\Common\Badge.jsx"
Copy-Item "$source\sahayak-components-Button.jsx" "$dest\src\components\Common\Button.jsx"
Copy-Item "$source\sahayak-components-Modal.jsx" "$dest\src\components\Common\Modal.jsx"
Copy-Item "$source\sahayak-components-Table.jsx" "$dest\src\components\Common\Table.jsx"

# Copy pages
Copy-Item "$source\sahayak-pages-Dashboard.jsx" "$dest\src\pages\Dashboard.jsx"
Copy-Item "$source\sahayak-pages-FormsTemplates.jsx" "$dest\src\pages\FormsTemplates.jsx"
Copy-Item "$source\sahayak-pages-Kiosks.jsx" "$dest\src\pages\Kiosks.jsx"
Copy-Item "$source\sahayak-pages-Updates.jsx" "$dest\src\pages\Updates.jsx"
Copy-Item "$source\sahayak-pages-Reports.jsx" "$dest\src\pages\Reports.jsx"
Copy-Item "$source\sahayak-pages-Users.jsx" "$dest\src\pages\Users.jsx"
Copy-Item "$source\sahayak-pages-Settings.jsx" "$dest\src\pages\Settings.jsx"

Write-Host "✓ Project structure created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. cd sahayak-admin" -ForegroundColor Cyan
Write-Host "2. npm install" -ForegroundColor Cyan
Write-Host "3. npm run dev" -ForegroundColor Cyan
```

Run with:
```powershell
.\setup-project.ps1
```

## ✅ Verification Checklist

After setup, verify:
- [ ] All files are in correct locations
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts the server
- [ ] Browser opens to http://localhost:5173
- [ ] No console errors
- [ ] All 7 pages are accessible via sidebar navigation
- [ ] Mock data displays correctly

## 🎨 Features Included

### 1. Dashboard
- 8 KPI cards with real-time metrics
- Status distribution charts
- Recent activity feed
- System alerts

### 2. Forms & Templates (Core Feature)
- Comprehensive form version control
- Status management (Draft/Published/Archived)
- Compliance tracking
- Deployment monitoring
- Detailed form information modal

### 3. Kiosks
- Real-time status monitoring (Online/Offline/Idle)
- Health metrics (CPU, Memory, Disk)
- Performance statistics
- Regional filtering
- Detailed kiosk information

### 4. Updates (OTA Control)
- Create new deployments
- Regional targeting
- Progress tracking
- Update history
- Status monitoring

### 5. Reports
- Usage statistics
- Top forms analytics
- Error trends
- Language usage
- Regional performance

### 6. Users & Roles
- User management
- Role-based access control
- Regional assignments
- Activity tracking
- User details modal

### 7. Settings & Compliance
- Language configuration
- System settings
- Compliance certifications
- Audit logs
- Security features

## 🛠️ Troubleshooting

### Issue: npm install fails
**Solution:** Ensure Node.js 18+ is installed:
```bash
node --version
npm --version
```

### Issue: Tailwind styles not loading
**Solution:** Verify `index.css` imports Tailwind directives and is imported in `main.jsx`

### Issue: Routing not working
**Solution:** Ensure React Router DOM is installed and `BrowserRouter` wraps the app

### Issue: Components not found
**Solution:** Check file paths in import statements match the actual file structure

## 📚 Tech Stack Details

- **React 18.2.0** - Latest React with Hooks
- **Vite 5.0.8** - Lightning-fast build tool
- **React Router DOM 6.20.0** - Client-side routing
- **Tailwind CSS 3.3.6** - Utility-first CSS
- **PostCSS & Autoprefixer** - CSS processing

## 🎓 Learning Resources

- React Docs: https://react.dev
- Vite Guide: https://vitejs.dev/guide
- Tailwind CSS: https://tailwindcss.com/docs
- React Router: https://reactrouter.com

## 📄 License

Proprietary - Sahayak Banking Platform

---

**Need Help?** All components are well-commented. Read inline documentation for implementation details.
