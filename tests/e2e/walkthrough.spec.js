/**
 * SAHAYAK ADMIN PORTAL — FULL HUMAN WALKTHROUGH TEST
 * One browser. One login. Every page inspected in order.
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL   = 'http://localhost:8080';
const BACKEND_URL = 'http://localhost:5000';
const KIOSK_URL   = 'http://localhost:80';
const EMAIL       = 'admin@sahayak.com';
const PASSWORD    = 'admin123';

test.setTimeout(120_000);
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 });

// Skip the sidebar <h1>Sahayak</h1> — get the actual page heading
const pageHeading = (page) =>
  page.locator('h1, h2').filter({ hasNotText: /^Sahayak$/ }).first();

test('Full Sahayak Admin Walkthrough', async ({ page }) => {
  const results = [];
  const pass = (label, detail = '') => {
    results.push({ ok: true, label, detail });
    console.log(`✅  ${label}${detail ? '  →  ' + detail : ''}`);
  };
  const fail = (label, detail = '') => {
    results.push({ ok: false, label, detail });
    console.error(`❌  ${label}${detail ? '  →  ' + detail : ''}`);
  };
  const sec = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 55 - t.length))}`);

  // ── 1. Backend health ─────────────────────────────────────────────────────
  sec('1. Backend Health');
  try {
    const res = await page.request.get(`${BACKEND_URL}/health`);
    const body = await res.json();
    res.ok() && /ok/i.test(body.status)
      ? pass('GET /health', `status="${body.status}"`)
      : fail('GET /health', `HTTP ${res.status()}`);
  } catch (e) { fail('GET /health', e.message); }

  // ── 2. Login page UI ──────────────────────────────────────────────────────
  sec('2. Login Page');
  await page.goto(`${ADMIN_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const emailEl = page.locator('input[type="email"], input[name="email"]').first();
  const passEl  = page.locator('input[type="password"]').first();
  const loginEl = page.locator('button[type="submit"]').first();

  (await emailEl.isVisible()) ? pass('Email input') : fail('Email input');
  (await passEl.isVisible())  ? pass('Password input') : fail('Password input');
  (await loginEl.isVisible()) ? pass('Submit button') : fail('Submit button');

  // ── 3. Wrong password shows error ─────────────────────────────────────────
  sec('3. Wrong-password error');
  await emailEl.fill(EMAIL);
  await passEl.fill('wrongpassword_xyz_abc');
  await loginEl.click();
  await page.waitForTimeout(2200);
  const badText = await page.locator('body').innerText();
  /invalid|error|incorrect|wrong|failed/i.test(badText)
    ? pass('Error message shown for bad credentials')
    : fail('Error message shown for bad credentials', 'Nothing matching invalid/error/wrong in body');

  // ── 4. Successful login ───────────────────────────────────────────────────
  sec('4. Successful Login');
  await passEl.fill(PASSWORD);
  await loginEl.click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  page.url().includes('/dashboard')
    ? pass('Redirect to /dashboard', page.url())
    : fail('Redirect to /dashboard', page.url());

  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));

  // ── 5. Dashboard ──────────────────────────────────────────────────────────
  sec('5. Dashboard');
  await page.waitForTimeout(1500);
  const dashH = await pageHeading(page).innerText().catch(() => '');
  dashH ? pass('Dashboard heading visible', dashH) : fail('Dashboard heading');
  const kpiCount = await page.locator('[class*="bg-white"][class*="rounded"]').count();
  kpiCount >= 2 ? pass('KPI cards rendered', `${kpiCount} found`) : fail('KPI cards', `${kpiCount}`);

  // ── 6. Sidebar links ──────────────────────────────────────────────────────
  sec('6. Sidebar Navigation');
  for (const lbl of ['Reports','Kiosks','Staff','OTA Updates','Forms','Submissions','Admin Users','Settings']) {
    const a = page.locator('nav a, aside a, [class*="sidebar"] a').filter({ hasText: new RegExp(lbl, 'i') }).first();
    (await a.isVisible().catch(() => false)) ? pass(`Nav: ${lbl}`) : fail(`Nav: ${lbl}`);
  }
  const sideBody = await page.locator('body').innerText();
  /admin@sahayak\.com/i.test(sideBody) ? pass('Sidebar: email') : fail('Sidebar: email');
  /super admin|admin/i.test(sideBody)  ? pass('Sidebar: role')  : fail('Sidebar: role');

  // ── 7. Reports ────────────────────────────────────────────────────────────
  sec('7. Reports Page');
  await page.goto(`${ADMIN_URL}/reports`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
  const repH = await pageHeading(page).innerText().catch(() => '');
  /report/i.test(repH) ? pass('Reports heading', repH) : fail('Reports heading', `"${repH}"`);
  const boldNums = await page.locator('[class*="text-3xl"], [class*="font-bold"]').count();
  boldNums >= 2 ? pass('Reports: KPI data rendered', `${boldNums} elements`) : fail('Reports: no data', `${boldNums}`);

  // ── 8. Kiosks ─────────────────────────────────────────────────────────────
  sec('8. Kiosks Page');
  await page.goto(`${ADMIN_URL}/kiosks`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const kiosksH = await pageHeading(page).innerText().catch(() => '');
  /kiosk/i.test(kiosksH) ? pass('Kiosks heading', kiosksH) : fail('Kiosks heading', `"${kiosksH}"`);
  (await page.locator('table, [class*="empty"], p').first().isVisible())
    ? pass('Kiosks: content visible') : fail('Kiosks: nothing visible');

  // ── 9. Staff Users ────────────────────────────────────────────────────────
  sec('9. Staff Users Page');
  await page.goto(`${ADMIN_URL}/staff`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const staffH = await pageHeading(page).innerText().catch(() => '');
  /staff/i.test(staffH) ? pass('Staff heading', staffH) : fail('Staff heading', `"${staffH}"`);
  const staffRowCount = await page.locator('table tbody tr').count();
  staffRowCount > 0
    ? pass('Staff table populated', `${staffRowCount} row(s)`)
    : fail('Staff table empty', '0 rows — check API array parsing');

  const addBtn = page.locator('button').filter({ hasText: /add staff/i }).first();
  if (await addBtn.isVisible().catch(() => false)) {
    pass('Add Staff button');
    await addBtn.click();
    await page.waitForTimeout(700);

    // The modal inner white card — contains "Add Staff User" h2
    const card = page.locator('.bg-white.rounded-xl').filter({ hasText: /Add Staff User/ }).first();
    if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
      pass('Add Staff modal opens');
      const staffName = `Tester ${Math.floor(Math.random() * 9000) + 1000}`;
      await card.locator('input').nth(0).fill(staffName);
      await card.locator('input').nth(1).fill('5678');
      const roleEl = card.locator('select').first();
      if (await roleEl.isVisible()) await roleEl.selectOption('Staff');
      await card.locator('button[type="submit"]').click();
      await page.waitForTimeout(1800);
      const bodyNow = await page.locator('body').innerText();
      bodyNow.includes(staffName)
        ? pass('Create staff E2E', `"${staffName}" in table`)
        : fail('Create staff E2E', `"${staffName}" missing after submit`);
    } else fail('Add Staff modal opens', 'Card not visible');
  } else fail('Add Staff button');

  // ── 10. OTA Updates ───────────────────────────────────────────────────────
  sec('10. OTA Updates Page');
  await page.goto(`${ADMIN_URL}/updates`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const updH = await pageHeading(page).innerText().catch(() => '');
  /update|ota/i.test(updH) ? pass('OTA Updates heading', updH) : fail('OTA Updates heading', `"${updH}"`);

  // ── 11. Forms & Templates ─────────────────────────────────────────────────
  sec('11. Forms & Templates Page');
  await page.goto(`${ADMIN_URL}/forms`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const formsH = await pageHeading(page).innerText().catch(() => '');
  /form/i.test(formsH) ? pass('Forms heading', formsH) : fail('Forms heading', `"${formsH}"`);
  const formRowCount = await page.locator('table tbody tr').count();
  formRowCount > 0 ? pass('Forms table', `${formRowCount} template(s)`) : fail('Forms table empty');

  // New Template modal
  const newBtn = page.locator('button').filter({ hasText: /new template|add template|create/i }).first();
  if (await newBtn.isVisible().catch(() => false)) {
    pass('New Template button');
    await newBtn.click();
    await page.waitForTimeout(700);
    // The modal is the LAST .bg-white card (modal renders after sidebar)
    // Modal component uses rounded-lg shadow-xl (not rounded-xl)
    const tplCard = page.locator('.bg-white.rounded-lg.shadow-xl').last();
    if (await tplCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      pass('New Template modal opens');
      // Category dropdown
      const cat = tplCard.locator('select').first();
      if (await cat.isVisible()) {
        const opts = await cat.locator('option').allInnerTexts();
        const validKeys = opts.filter(o => /account|transaction|loan|kyc|service|transfer|investment|enquiry|closure/i.test(o));
        validKeys.length >= 9
          ? pass('Category dropdown: all 9 service keys', validKeys.slice(0,3).join(', ') + '…')
          : fail('Category dropdown: missing keys', `${validKeys.length}/9`);
      } else fail('Category dropdown visible');
      // Add Field
      const addFieldBtn = tplCard.locator('button').filter({ hasText: /add.*(field|first)/i }).first();
      if (await addFieldBtn.isVisible().catch(() => false)) {
        await addFieldBtn.click();
        await page.waitForTimeout(400);
        const fieldRow = tplCard.locator('input[placeholder*="label"], input[placeholder*="Field"]').first();
        (await fieldRow.isVisible())
          ? pass('Field builder: row added')
          : fail('Field builder: row missing');
      } else fail('Field builder: Add Field button');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    } else fail('New Template modal opens');
    // Close the modal by clicking its X button (Modal component has no Escape handler)
    const xCloseBtn = page.locator('.fixed.inset-0.z-50 button').first();
    if (await xCloseBtn.isVisible({ timeout: 2000 }).catch(() => false))
      await xCloseBtn.click().catch(() => {});
    await page.waitForTimeout(600);
  } else fail('New Template button');

  // Edit existing form — reload the page first to guarantee no modal is open
  await page.goto(`${ADMIN_URL}/forms`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const editBtn = page.locator('button').filter({ hasText: /^edit$/i }).first();
  if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editBtn.click();
    await page.waitForTimeout(700);
    // Edit Template modal — same Modal component (bg-white rounded-lg shadow-xl)
    const editCard = page.locator('.bg-white.rounded-lg.shadow-xl').last();
    if (await editCard.isVisible({ timeout: 6000 }).catch(() => false)) {
      const nameIn = editCard.locator('input[placeholder*="Savings"], input[placeholder*="Opening"], input[placeholder*="Form"]').first();
      if (await nameIn.isVisible({ timeout: 4000 }).catch(() => false)) {
        const v = await nameIn.inputValue();
        v.length > 0 ? pass('Edit form: name pre-filled', `"${v}"`) : fail('Edit form: name empty');
      } else fail('Edit form: name input not found');
    } else fail('Edit form modal opens');
    // Close via X button
    const xClose2 = page.locator('.fixed.inset-0.z-50 button').first();
    if (await xClose2.isVisible({ timeout: 2000 }).catch(() => false))
      await xClose2.click().catch(() => {});
    await page.waitForTimeout(400);
  } else fail('Edit button on forms table');

  // ── 12. Submissions ───────────────────────────────────────────────────────
  sec('12. Submissions Page');
  await page.goto(`${ADMIN_URL}/submissions`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const subsH = await pageHeading(page).innerText().catch(() => '');
  /submission/i.test(subsH) ? pass('Submissions heading', subsH) : fail('Submissions heading', `"${subsH}"`);
  const subRowCount = await page.locator('table tbody tr').count();
  subRowCount > 0 ? pass('Submissions table', `${subRowCount} row(s)`) : fail('Submissions table empty');
  (await page.locator('select').first().isVisible()) ? pass('Filter dropdown') : fail('Filter dropdown');
  const viewBtn = page.locator('button').filter({ hasText: /view|details/i }).first();
  if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await viewBtn.click();
    await page.waitForTimeout(700);
    const detM = page.locator('.bg-white.rounded-lg.shadow-xl, .bg-white.rounded-xl').last();
    (await detM.isVisible({ timeout: 4000 }).catch(() => false))
      ? pass('Submission detail modal') : fail('Submission detail modal');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  } else fail('View Details button');

  // ── 13. Admin Users ───────────────────────────────────────────────────────
  sec('13. Admin Users Page');
  await page.goto(`${ADMIN_URL}/users`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const usersH = await pageHeading(page).innerText().catch(() => '');
  /admin|user/i.test(usersH) ? pass('Admin Users heading', usersH) : fail('Admin Users heading', `"${usersH}"`);
  const uRows = await page.locator('table tbody tr').count();
  uRows >= 1 ? pass('Admin Users table', `${uRows} user(s)`) : fail('Admin Users table empty');

  // ── 14. Settings ──────────────────────────────────────────────────────────
  sec('14. Settings Page');
  await page.goto(`${ADMIN_URL}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const settH = await pageHeading(page).innerText().catch(() => '');
  /setting/i.test(settH) ? pass('Settings heading', settH) : fail('Settings heading', `"${settH}"`);
  const critErr = jsErrors.filter(e => !e.includes('ResizeObserver'));
  critErr.length === 0 ? pass('No JS errors (whole session)') : fail('JS errors', critErr.slice(0,3).join(' | '));

  // ── 15. Sign Out ──────────────────────────────────────────────────────────
  sec('15. Sign Out');
  const soBtn = page.locator('button').filter({ hasText: /sign out|logout|log out/i }).first();
  if (await soBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await soBtn.click();
    await page.waitForURL('**/login', { timeout: 8000 });
    page.url().includes('/login')
      ? pass('Sign Out → /login', page.url())
      : fail('Sign Out redirect', page.url());
  } else fail('Sign Out button visible');

  // ── 16. Kiosk frontend ────────────────────────────────────────────────────
  sec('16. Kiosk Frontend');
  await page.goto(KIOSK_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const kioskTxt = await page.locator('body').innerText().catch(() => '');
  kioskTxt.length > 20
    ? pass('Kiosk frontend loads', kioskTxt.slice(0, 70).replace(/\n/g, ' ') + '…')
    : fail('Kiosk frontend', 'Empty body');

  // ── 17. Microservices ─────────────────────────────────────────────────────
  sec('17. Microservices Health');
  for (const [name, port] of [['STT', 8001], ['TTS', 8002], ['OCR', 8003]]) {
    try {
      const r = await page.request.get(`http://localhost:${port}/health`);
      r.ok() ? pass(`${name} :${port}`, `HTTP ${r.status()}`) : fail(`${name} :${port}`, `HTTP ${r.status()}`);
    } catch (e) { fail(`${name} :${port}`, e.message); }
  }

  // ── Final Report ──────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log('\n' + '═'.repeat(72));
  console.log('  SAHAYAK ADMIN PORTAL — WALKTHROUGH RESULTS');
  console.log('═'.repeat(72));
  for (const r of results)
    console.log(`  ${r.ok ? '✅' : '❌'}  ${r.label}${r.detail ? '  →  ' + r.detail : ''}`);
  console.log('─'.repeat(72));
  console.log(`  ${passed} PASSED  |  ${failed} FAILED  |  ${passed + failed} TOTAL`);
  console.log('═'.repeat(72) + '\n');

  expect(failed, `${failed} check(s) failed — see output above`).toBe(0);
});
