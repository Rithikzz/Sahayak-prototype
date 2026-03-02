# Testing — Complete Guide

SAHAYAK uses Playwright for end-to-end testing. Three test suites cover the
admin API, admin UI walkthrough, and kiosk connectivity / full user flow.

---

## Setup

```bash
# Install dependencies (run once)
cd /home/lebi/projects/allen/Sahayak--kiosk
npm install
npx playwright install chromium
```

Ensure all Docker containers are running before testing:
```bash
docker compose ps
# all 7 containers should show STATUS: Up (healthy) or Up
```

---

## Test Files Overview

```
tests/
└── e2e/
    ├── admin.spec.js            66 tests — admin API + UI (headless)
    ├── walkthrough.spec.js       1 test  — admin UI full walkthrough (headed, 48 checks)
    └── kiosk_walkthrough.spec.js 14 tests — kiosk connectivity + UI (headed)
```

---

## Test Suite 1 — Admin API + UI Tests (`admin.spec.js`)

**Tests:** 66 total | **Expected pass:** 61–66

Covers:
- All admin API endpoints (health, auth, users, kiosks, staff, forms, reports, settings, updates)
- Admin UI pages (login, dashboard, sidebar navigation)
- Form template operations (list, create, edit)
- Staff management operations
- Submission viewing

Run:
```bash
npx playwright test tests/e2e/admin.spec.js --reporter=list
```

Key assertions:
- `/health` returns `{ status: "OK" }`
- Admin login returns JWT token
- `/api/forms/templates` returns a **keyed object** (not array) with 9 keys
- Edit form modal pre-fills with placeholder `*="Savings"` (capital S)

---

## Test Suite 2 — Admin UI Walkthrough (`walkthrough.spec.js`)

**Tests:** 1 test | **Checks:** 48 | **Result:** 48 / 48 PASSED | **Time:** ~38 seconds

A single continuous browser session that navigates every page of the admin portal
like a human would — one browser, one login, never closing.

### Sections tested:

| Section            | What is checked                                          |
|--------------------|----------------------------------------------------------|
| Health             | Direct API health check (port 5000)                      |
| Login              | Admin login form, JWT obtained                           |
| Dashboard          | Heading, KPI cards visible                               |
| Sidebar nav        | All 8 nav links navigate to correct pages                |
| Reports            | Heading renders, charts area visible                     |
| Kiosks             | Heading renders, table visible                           |
| Staff              | 7 staff rows visible in table                            |
| Staff E2E          | Create new staff → verify in table                       |
| OTA Updates        | Heading renders                                          |
| Forms              | 9 template cards visible                                 |
| New Template modal | Opens via "+ New Template" button                        |
| Field builder      | Add a field to the new template                          |
| Close modal        | X button click closes modal                              |
| Edit form          | Click Edit → modal pre-fills with existing data          |
| Submissions        | Heading renders, filter area visible                     |
| Admin Users        | Heading renders, table visible                           |
| Settings           | Toggle switches visible                                  |
| Sign out           | Logs out → redirected to login page                      |
| Kiosk frontend     | http://localhost loads SAHAYAK kiosk UI                  |
| Microservices      | STT :8001, TTS :8002, OCR :8003 all return HTTP 200      |

### Key implementation details:

```javascript
// Custom helper to skip sidebar brand heading
async function pageHeading(page) {
  return page.locator('h1, h2')
    .filter({ hasNotText: /^Sahayak$/ })
    .first();
}

// Modal close (Escape not supported — must click X button)
await page.locator('.fixed.inset-0.z-50 button').first().click();

// Staff modal uses custom class (not shared Modal component)
await page.locator('.bg-white.rounded-xl').waitFor({ state: 'visible' });

// Navigate fresh before Edit test to avoid stale overlay
await page.goto(`${ADMIN_URL}/forms`);
await page.waitForLoadState('networkidle');
```

Run:
```bash
npx playwright test tests/e2e/walkthrough.spec.js --headed --project=chromium --reporter=list
```

---

## Test Suite 3 — Kiosk Connectivity Tests (`kiosk_walkthrough.spec.js`)

**Tests:** 14 | **Result:** 14 / 14 PASSED | **Time:** ~14 seconds

Tests kiosk-to-backend connectivity and full kiosk user journey.

### Tests:

| # | Test                                             | Result |
|---|--------------------------------------------------|--------|
| 1 | Backend /health responds 200                     | ✅     |
| 2 | /api/forms/templates returns 9 categories        | ✅     |
| 3 | Staff-login PIN 1234 → JWT token                 | ✅     |
| 4 | /api/kiosk/pending-update responds               | ✅     |
| 5 | /api/kiosk/heartbeat route exists (404 = unregistered = correct) | ✅ |
| 6 | /api/forms/submit endpoint exists                | ✅     |
| 7 | Kiosk Nginx proxy /api/forms/templates → backend | ✅     |
| 8 | Kiosk Nginx proxy /api/auth/staff-login → backend| ✅     |
| 9 | Admin and kiosk templates are IDENTICAL           | ✅     |
|10 | Full kiosk UI walkthrough (all 15 sub-checks)    | ✅     |
|11 | Form submitted on kiosk visible in admin reports  | ✅     |
|12 | STT :8001/health → 200                           | ✅     |
|13 | TTS :8002/health → 200                           | ✅     |
|14 | OCR :8003/health → 200                           | ✅     |

### Kiosk UI walkthrough sub-checks (test 10):

```
✅ Welcome screen loaded
✅ English language selected
✅ Authentication screen loaded
✅ Account number digits entered: 1234567890
✅ PIN entered: 1234
✅ OTP Verification screen loaded
✅ OTP entered (123456), verifying...
✅ Auth Success screen — Authentication Successful!
✅ Mode Selection screen loaded (Protected route passed ✅)
✅ Service Selection screen loaded
✅ Service categories visible: 3/4 checked
✅ Input screen loaded (form fields from backend templates)
✅ First form field shown: "Transaction Type (Deposit or Withdrawal)"
✅ Templates loaded from backend successfully
✅ No JS errors on kiosk page
✅ OTA banner: not shown (no pending updates)
```

### Key connectivity verified:

```
test 9 proves:
  Admin Backend (port 5000) templates === Kiosk (port 80) proxy templates
  → Admin and kiosk share IDENTICAL form definitions from the same DB

test 11 proves:
  Kiosk POST /api/forms/submit → Backend saves to DB
  Admin GET /api/admin/reports/submissions → sees the new submission
  → End-to-end data flow is fully connected
```

Run:
```bash
npx playwright test tests/e2e/kiosk_walkthrough.spec.js --headed --project=chromium --reporter=list
```

---

## Running All Tests Together

```bash
# All tests, headless
npx playwright test --reporter=list

# All tests, generate HTML report
npx playwright test --reporter=html
npx playwright show-report

# Specific test with full debug logging
DEBUG=pw:api npx playwright test tests/e2e/kiosk_walkthrough.spec.js --headed
```

---

## Test Configuration (`playwright.config.js`)

```javascript
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,                 // retry once on flaky network
  workers: 1,                 // sequential (1 browser at a time)
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    actionTimeout: 15_000,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
```

---

## Common Test Selectors Reference

| What you want                          | Selector                                    |
|----------------------------------------|---------------------------------------------|
| Page heading (exclude sidebar brand)   | `h1, h2` filtered `hasNotText: /^Sahayak$/` |
| Admin modal inner card                 | `.bg-white.rounded-lg.shadow-xl`            |
| Staff custom modal                     | `.bg-white.rounded-xl`                      |
| Close any modal (X button)             | `.fixed.inset-0.z-50 button` (first)        |
| Kiosk language tile                    | `.option-tile` filter `{ hasText: 'English' }`|
| Kiosk mode tile                        | `.option-tile` filter `{ hasText: /Touch Only/i }` |
| Kiosk service category tile            | `text=Transaction Forms` (first)            |
| On-screen keypad digit                 | `button` filter `{ hasText: /^5$/ }`        |

---

## Debugging a Failed Test

```bash
# View Playwright trace for a failed test
npx playwright show-trace test-results/<test-name>/trace.zip

# Run a single test with browser visible and slow-motion
npx playwright test --headed --project=chromium --grep "Staff" --slow-mo=500

# Print all locators on current page snapshot
# (add this to test temporarily)
console.log(await page.content());
```
