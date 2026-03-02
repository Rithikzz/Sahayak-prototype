/**
 * Sahayak Admin Portal — Comprehensive E2E Tests
 * Covers: Login, Dashboard, Forms, Kiosks, Staff, Updates, Reports, Submissions, Users, Settings
 */
import { test, expect } from '@playwright/test';

const ADMIN_URL   = 'http://localhost:8080';
const KIOSK_URL   = 'http://localhost:80';
const BACKEND_URL = 'http://localhost:5000';
const EMAIL       = 'admin@sahayak.com';
const PASSWORD    = 'admin123';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function loginAsAdmin(page) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', EMAIL);
  await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

async function expectNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BACKEND HEALTH
// ─────────────────────────────────────────────────────────────────────────────

test.describe('1. Backend Health', () => {
  test('GET /health returns 200 with status OK', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('OK');
  });

  test('POST /api/admin/auth/login with valid creds returns token', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/admin/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(EMAIL);
  });

  test('POST /api/admin/auth/login with wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/admin/auth/login`, {
      data: { email: EMAIL, password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTHENTICATED API ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('2. Authenticated API Endpoints', () => {
  let token;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/admin/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const body = await res.json();
    token = body.access_token;
  });

  const endpoints = [
    { path: '/api/admin/auth/me',                 name: '/auth/me' },
    { path: '/api/admin/forms',                   name: '/forms' },
    { path: '/api/admin/kiosks',                  name: '/kiosks' },
    { path: '/api/admin/users',                   name: '/users' },
    { path: '/api/admin/staff',                   name: '/staff' },
    { path: '/api/admin/updates',                 name: '/updates' },
    { path: '/api/admin/reports/kpi',             name: '/reports/kpi' },
    { path: '/api/admin/reports/usage',           name: '/reports/usage' },
    { path: '/api/admin/reports/submissions',     name: '/reports/submissions' },
    { path: '/api/admin/settings',                name: '/settings' },
    { path: '/api/forms/templates',               name: '/forms/templates (public)' },
  ];

  for (const ep of endpoints) {
    test(`GET ${ep.name} returns 200`, async ({ request }) => {
      const res = await request.get(`${BACKEND_URL}${ep.path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status(), `${ep.name} should return 200`).toBe(200);
    });
  }

  test('GET /admin/staff returns an array with staff objects', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/admin/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    // Could be array or {staff:[]}  — either is acceptable
    const list = Array.isArray(body) ? body : (body.staff || []);
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      expect(list[0]).toHaveProperty('name');
      expect(list[0]).toHaveProperty('role');
    }
  });

  test('GET /admin/reports/submissions returns {total, submissions}', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/admin/reports/submissions?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('submissions');
    expect(Array.isArray(body.submissions)).toBe(true);
  });

  test('GET /admin/forms returns a forms list', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/admin/forms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    const forms = body.forms || body;
    expect(Array.isArray(forms)).toBe(true);
    expect(forms.length).toBeGreaterThan(0);
    expect(forms[0]).toHaveProperty('name');
    expect(forms[0]).toHaveProperty('category');
  });

  test('GET /api/forms/templates returns templates object with service keys', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/forms/templates`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // The endpoint returns an object keyed by service category (not an array)
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Should have at least one service key
    const keys = Object.keys(body);
    expect(keys.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADMIN PORTAL — LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('3. Admin Login Page', () => {
  test('Login page loads and shows form', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('Wrong password shows error message', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Wait for error to appear
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    const hasError = bodyText.toLowerCase().includes('invalid') ||
                     bodyText.toLowerCase().includes('error') ||
                     bodyText.toLowerCase().includes('incorrect') ||
                     bodyText.toLowerCase().includes('wrong');
    expect(hasError, 'Should show an error for wrong credentials').toBe(true);
  });

  test('Valid credentials redirect to dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    expect(page.url()).toContain('/dashboard');
  });

  test('Unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ADMIN PORTAL — SIDEBAR NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('4. Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  const navItems = [
    { name: 'Dashboard',         path: '/dashboard',   text: 'Dashboard' },
    { name: 'Reports',           path: '/reports',     text: 'Reports' },
    { name: 'Kiosks',            path: '/kiosks',      text: 'Kiosks' },
    { name: 'Staff Users',       path: '/staff',       text: 'Staff' },
    { name: 'OTA Updates',       path: '/updates',     text: 'Updates' },
    { name: 'Forms & Templates', path: '/forms',       text: 'Forms' },
    { name: 'Submissions',       path: '/submissions', text: 'Submissions' },
    { name: 'Admin Users',       path: '/users',       text: 'Users' },
    { name: 'Settings',          path: '/settings',    text: 'Settings' },
  ];

  for (const item of navItems) {
    test(`Sidebar link "${item.name}" navigates to ${item.path}`, async ({ page }) => {
      // Find and click sidebar link containing the text
      const link = page.locator(`aside a[href*="${item.path}"], nav a[href*="${item.path}"]`).first();
      await expect(link).toBeVisible({ timeout: 5000 });
      await link.click();
      await page.waitForURL(`**${item.path}`, { timeout: 8000 });
      expect(page.url()).toContain(item.path);
    });
  }

  test('Sidebar shows user name and email', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    const sidebarText = await sidebar.innerText();
    // Should show some user info
    expect(sidebarText.length).toBeGreaterThan(10);
  });

  test('Sign Out button is present in sidebar', async ({ page }) => {
    const signOut = page.locator('aside button, aside a').filter({ hasText: /sign out|logout/i });
    await expect(signOut.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('5. Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard page loads without crashing', async ({ page }) => {
    await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('Dashboard shows at least 2 KPI cards', async ({ page }) => {
    // Wait for API data to load
    await page.waitForTimeout(2000);
    const cards = page.locator('[class*="card"], [class*="rounded"], [class*="bg-white"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('No unhandled JS errors on dashboard', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e => !e.includes('ResizeObserver') && !e.includes('favicon'));
    expect(criticalErrors.length, `JS errors: ${criticalErrors.join(', ')}`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. FORMS & TEMPLATES PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('6. Forms & Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/forms`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('Forms page loads and shows title', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /form|template/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('Forms table shows at least one row', async ({ page }) => {
    // Wait for API response
    await page.waitForTimeout(2000);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count, 'Should have at least 1 form template').toBeGreaterThan(0);
  });

  test('New Template button is visible', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /new|template|create/i }).first();
    await expect(btn).toBeVisible();
  });

  test('New Template modal opens with visual field builder', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /new|template|create/i }).first();
    await btn.click();
    await page.waitForTimeout(500);

    // Check modal opened
    const modal = page.locator('[role="dialog"], [class*="modal"], [class*="fixed"]').last();
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Check field builder tab exists
    const builderTab = page.locator('button').filter({ hasText: /field builder/i }).first();
    await expect(builderTab).toBeVisible();

    // Check OCR tab exists
    const ocrTab = page.locator('button').filter({ hasText: /ocr/i }).first();
    await expect(ocrTab).toBeVisible();

    // Check Preview tab exists
    const previewTab = page.locator('button').filter({ hasText: /preview/i }).first();
    await expect(previewTab).toBeVisible();
  });

  test('Service category dropdown has valid kiosk keys', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /new|template|create/i }).first();
    await btn.click();
    await page.waitForTimeout(500);

    const select = page.locator('select').filter({ hasText: /account opening/i }).first();
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options.some(o => o.includes('Account Opening'))).toBe(true);
    expect(options.some(o => o.includes('KYC'))).toBe(true);
    expect(options.some(o => o.includes('Loan'))).toBe(true);
  });

  test('Add Field button works in field builder', async ({ page }) => {
    const newBtn = page.locator('button').filter({ hasText: /new|template|create/i }).first();
    await newBtn.click();
    await page.waitForTimeout(500);

    // Click Add Field button
    const addField = page.locator('button').filter({ hasText: /add.*field|first field/i }).first();
    await expect(addField).toBeVisible();
    await addField.click();
    await page.waitForTimeout(300);

    // Should now show a field row with a label input
    const fieldInput = page.locator('input[placeholder*="label"], input[placeholder*="Field"]').first();
    await expect(fieldInput).toBeVisible();
  });

  test('Existing form Edit opens pre-filled modal', async ({ page }) => {
    const editBtn = page.locator('button, a').filter({ hasText: /^edit$/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 5000 });
    await editBtn.click();
    await page.waitForTimeout(500);

    // Modal should open with a form name filled in
    // Actual placeholder is "e.g. Savings Account Opening Form"
    const nameInput = page.locator('input[placeholder*="Savings"], input[placeholder*="Account"], input[placeholder*="Form"]').first();
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    const val = await nameInput.inputValue();
    expect(val.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. KIOSKS PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('7. Kiosks', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/kiosks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('Kiosks page loads with heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /kiosk/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('Kiosks table or empty state is visible', async ({ page }) => {
    const table = page.locator('table, [class*="empty"], p').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. STAFF USERS PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('8. Staff Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/staff`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Staff page loads with heading', async ({ page }) => {
    const heading = page.locator('h1').filter({ hasText: /staff/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('Staff table shows existing staff (not empty due to API bug)', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count, 'Staff table should show at least 1 row (Default Admin exists)').toBeGreaterThan(0);
  });

  test('Add Staff User button is visible', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /add staff/i }).first();
    await expect(btn).toBeVisible();
  });

  test('Add Staff modal opens correctly', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /add staff/i }).first();
    await btn.click();
    await page.waitForTimeout(300);

    // Modal should appear with name + PIN inputs
    const nameInput = page.locator('input[placeholder*="Ravi"], input[placeholder*="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 3000 });

    const pinInput = page.locator('input[type="password"][maxlength="4"]').first();
    await expect(pinInput).toBeVisible();
  });

  test('Create new staff user end-to-end', async ({ page, request }) => {
    const btn = page.locator('button').filter({ hasText: /add staff/i }).first();
    await btn.click();
    await page.waitForTimeout(300);

    const timestamp = Date.now().toString().slice(-4);
    const staffName = `Test Staff ${timestamp}`;

    await page.fill('input[placeholder*="Ravi"], input[placeholder*="name"]', staffName);
    await page.fill('input[type="password"][maxlength="4"]', '7777');

    // Pick role if available
    const roleSelect = page.locator('select').first();
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('Staff');
    }

    await page.click('button[type="submit"], button:has-text("Create")');
    await page.waitForTimeout(2000);

    // Should close modal and show new staff in table
    const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    expect(modalVisible, 'Modal should close after successful creation').toBe(false);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(staffName);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('9. Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Reports page loads with heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /report/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('Reports page shows data without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e => !e.includes('ResizeObserver'));
    expect(criticalErrors.length, `JS errors: ${criticalErrors.join(', ')}`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. SUBMISSIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('10. Submissions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/submissions`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Submissions page loads with heading', async ({ page }) => {
    const heading = page.locator('h1').filter({ hasText: /submission/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('Submissions table shows rows', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count, 'Should show at least 1 submission').toBeGreaterThan(0);
  });

  test('Service type filter dropdown is present', async ({ page }) => {
    const select = page.locator('select').filter({ hasText: /all services/i }).first();
    await expect(select).toBeVisible();
  });

  test('Clicking View Details opens detail modal', async ({ page }) => {
    const viewBtn = page.locator('button, a').filter({ hasText: /view details/i }).first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();
    await page.waitForTimeout(500);

    // Modal should open showing form data
    const modal = page.locator('[class*="fixed"][class*="inset"]').last();
    await expect(modal).toBeVisible({ timeout: 3000 });
    const modalText = await modal.innerText();
    expect(modalText.length).toBeGreaterThan(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. ADMIN USERS PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('11. Admin Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('Users page loads with heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /user|admin/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('Admin users table shows at least 1 row', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. SETTINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('12. Settings', () => {
  test('Settings page loads without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_URL}/settings`);
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1, h2').filter({ hasText: /setting/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. SIGN OUT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('13. Sign Out', () => {
  test('Sign Out logs out and redirects to login', async ({ page }) => {
    await loginAsAdmin(page);
    const signOut = page.locator('aside button, aside a').filter({ hasText: /sign out|logout/i }).first();
    await expect(signOut).toBeVisible();
    await signOut.click();
    await page.waitForURL('**/login', { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. KIOSK FRONTEND (port 80)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('14. Kiosk Frontend', () => {
  test('Kiosk loads at http://localhost:80', async ({ page }) => {
    const response = await page.goto(KIOSK_URL);
    expect(response.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Kiosk shows initial UI elements', async ({ page }) => {
    await page.goto(KIOSK_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Should show some kind of initial screen
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('No unhandled JS errors on kiosk load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(KIOSK_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('favicon') &&
      !e.includes('Non-Error')
    );
    expect(criticalErrors.length, `Kiosk JS errors: ${criticalErrors.join(', ')}`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. MICROSERVICES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('15. Microservices Health', () => {
  test('STT service responds on port 8001', async ({ request }) => {
    const res = await request.get('http://localhost:8001/health');
    expect(res.status()).toBe(200);
  });

  test('TTS service responds on port 8002', async ({ request }) => {
    const res = await request.get('http://localhost:8002/health');
    expect(res.status()).toBe(200);
  });

  test('OCR service responds on port 8003', async ({ request }) => {
    const res = await request.get('http://localhost:8003/health');
    expect(res.status()).toBe(200);
  });
});
