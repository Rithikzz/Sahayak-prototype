# Debugging & All Fixes Applied

This document captures every bug found, diagnosed, and fixed in the SAHAYAK system
across all development sessions.

---

## Bug 1 — 0-Byte Audio Stream Proxy Drop (STT)

**Symptom:**  
The STT service returned an empty `{"text": "", "language": "en"}` instantly,
locking the kiosk in an infinite voice loop with no transcribed text.

**Root Cause:**  
FastAPI's `UploadFile` wraps the audio as a `SpooledTemporaryFile`. When forwarded
directly through `httpx` as a file handle, it sends 0 bytes after the first read.

**Fix applied in `backend/api/routes/voice.py`:**
```python
@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()   # must materialize fully into memory first
    files = {'file': (audio.filename, audio_bytes, audio.content_type)}
    # now safe to proxy via httpx
```

---

## Bug 2 — passlib vs bcrypt Library Conflict

**Symptom:**  
`staff_login` raised `ValueError: password cannot be longer than 72 bytes` even
for short PINs like `1234`.

**Root Cause:**  
`passlib[bcrypt]` version pinned in requirements was incompatible with Python 3.11
bcrypt internals and introduced a length restriction bug.

**Fix:**  
Removed `passlib` entirely from `requirements.txt`. Replaced with direct `bcrypt`
package calls:
```python
import bcrypt

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
```

---

## Bug 3 — "Loading Forms..." Infinite Screen

**Symptom:**  
After staff login, kiosk remained stuck on a loading spinner indefinitely.
`ServiceSelectionScreen` showed no tiles.

**Root Cause:**  
`AppStateContext.jsx` fetched form templates but was missing the proper `useEffect`
dependency management, causing the state to never update in the component tree.

**Fix in `src/context/AppStateContext.jsx`:**
```javascript
useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/forms/templates');
        if (response.ok) {
          const data = await response.json();
          setFormTemplates(data);     // triggers re-render of ServiceSelectionScreen
        }
      } catch (err) {
        console.error("Error connecting to backend API:", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);   // ← runs once on mount
```

---

## Bug 4 — Voice "Auto-Advance" IVR Not Working

**Symptom:**  
Users had to manually click "Next" after each voice response. The automatic IVR
progression (speak → listen → advance) was broken.

**Root Cause:**  
`InputController.jsx` used `useState` for `isListening` but the handler function
was stale inside the `audio.onended` callback (closure over old state).

**Fix:**  
Introduced `isListeningRef` and `handleVoiceStartRef` to keep live references:
```javascript
const isListeningRef = useRef(isListening);
const handleVoiceStartRef = useRef(null);

useEffect(() => {
    isListeningRef.current = isListening;
});

// In audio.onended:
audio.onended = () => {
    if (handleVoiceStartRef.current) {
        handleVoiceStartRef.current(true); // autoStart = true
    }
};
```

---

## Bug 5 — Staff Table Always Empty in Admin Portal

**Symptom:**  
The Staff management page in the admin portal showed an empty table even though
the backend had staff records.

**Root Cause:**  
`Staff.jsx` used `setStaffList(data.staff || [])` but the backend
`/api/admin/staff` endpoint returns a plain JSON array, not `{ staff: [...] }`.

**Fix in `Sahayak_admin/src/pages/Staff.jsx`:**
```javascript
// Before (broken):
setStaffList(data.staff || []);

// After (fixed):
setStaffList(Array.isArray(data) ? data : (data.staff || []));
```

---

## Bug 6 — Admin Login Shows No Error on Wrong Password

**Symptom:**  
Entering a wrong email/password on the admin login page produced no error message
— the form appeared to submit successfully but silently did nothing.

**Root Cause:**  
`apiClient.js` had a global 401 interceptor that called `clearToken()` and
redirected to `/login` on any 401 response — including the login call itself.
This meant the login error response was caught by the redirect before the Login
component could read it and display the error message.

**Fix in `Sahayak_admin/src/utils/apiClient.js`:**
```javascript
// Before (broken — intercepted its own 401):
if (error.response?.status === 401) {
    clearToken();
    window.location.href = '/login';
}

// After (fixed — skip redirect when it IS the login call):
if (error.response?.status === 401) {
    const path = error.config?.url || '';
    if (!path.includes('auth/login')) {
        clearToken();
        window.location.href = '/login';
    }
}
```

---

## Bug 7 — Reports Page Blank / Wrong Data Keys

**Symptom:**  
The Reports page in the admin portal showed empty charts for Usage and Error Trend.

**Root Cause:**  
The backend response keys didn't match what the frontend expected:
- `/reports/usage` returns `{ by_service: [...] }` but frontend read `usageData.usage`
- `/reports/errors` returns `{ data: [...] }` but frontend read `errData.errors`
- `/reports/regions` can return `{ regions: [...] }` but code assumed plain array

**Fix in `Sahayak_admin/src/pages/Reports.jsx`:**
```javascript
// Usage chart:
setUsageData(d.by_service || d.usage || []);

// Error trend chart:
setErrorData(d.data || d.errors || []);

// Regional breakdown:
setRegionData(d.regions || []);
```

---

## Bug 8 — Playwright Test 18: Wrong Assertion for /api/forms/templates

**Symptom:**  
Test 18 in `admin.spec.js` failed with `Expected value to be an array`.

**Root Cause:**  
The `/api/forms/templates` endpoint returns a keyed object:
`{ accountOpeningForms: {...}, transactionForms: {...}, ... }` — NOT an array.
The test assertion used `expect(Array.isArray(body)).toBe(true)`.

**Fix in `tests/e2e/admin.spec.js`:**
```javascript
// Before:
expect(Array.isArray(body)).toBe(true);

// After:
expect(typeof body).toBe('object');
expect(Array.isArray(body)).toBe(false); // it's a keyed object
```

---

## Bug 9 — Playwright Test 45: Placeholder Selector Case Mismatch

**Symptom:**  
Test 45 failed: `locator.fill: No element found for selector [placeholder*="savings"]`.

**Root Cause:**  
The actual placeholder text is `"e.g. Savings Account Opening Form"` (capital S).
The test used lowercase `savings`.

**Fix in `tests/e2e/admin.spec.js`:**
```javascript
// Before:
await page.fill('[placeholder*="savings"]', 'Test Form');

// After:
await page.fill('[placeholder*="Savings"]', 'Test Form');
```

---

## Bug 10 — Walkthrough Test: Escape Key Doesn't Close Modal

**Symptom:**  
Admin walkthrough test timed out when trying to close a modal with `page.keyboard.press('Escape')`.

**Root Cause:**  
`Sahayak_admin/src/components/Modal.jsx` has no Escape key handler. The only way
to close the modal is clicking the X button inside `.fixed.inset-0.z-50`.

**Fix in `tests/e2e/walkthrough.spec.js`:**
```javascript
// Before (broken):
await page.keyboard.press('Escape');

// After (correct):
await page.locator('.fixed.inset-0.z-50 button').first().click();
```

---

## Bug 11 — Walkthrough Test: Edit Button Blocked by Stale Overlay

**Symptom:**  
Clicking the "Edit" button on a form template failed because the overlay
from a previously opened modal was still intercepting pointer events.

**Fix:**  
Navigate fresh to `/forms` before the Edit test to ensure a clean DOM state:
```javascript
await page.goto(`${ADMIN_URL}/forms`);
await page.waitForLoadState('networkidle');
// now safe to click Edit
```

---

## Bug 12 — Kiosk Walkthrough: .option-tile Pointer Intercept

**Symptom:**  
`locator('text=English').first().click()` failed — the inner `.tile-label` div
resolved but the parent `.option-tile` div was intercepting pointer events.

**Root Cause:**  
The `text=` locator matched the inner `<div class="tile-label">English</div>`.
Playwright tried to click through it but the parent container intercepted.

**Fix:**  
Always click the container `.option-tile`, not the inner text:
```javascript
// Before (broken):
await page.locator('text=English').first().click();

// After (correct):
await page.locator('.option-tile').filter({ hasText: 'English' }).click();
```

---

## Summary of All Files Modified

| File                                      | What Changed                                |
|-------------------------------------------|---------------------------------------------|
| `backend/api/routes/voice.py`             | SpooledTemporaryFile materialize fix         |
| `backend/api/routes/auth.py`              | Replaced passlib with bcrypt                |
| `backend/main.py`                         | Startup seed for admin, templates, settings |
| `backend/api/models.py`                   | Added admin models (AdminUser, Kiosk, etc.) |
| `backend/api/routes/admin_staff.py`       | New: staff CRUD API                         |
| `backend/api/routes/admin_reports.py`     | New: KPI + usage + error + region endpoints |
| `backend/api/routes/admin_auth.py`        | New: admin JWT auth                         |
| `backend/api/routes/admin_kiosks.py`      | New: kiosk management + heartbeat           |
| `backend/api/routes/admin_forms.py`       | New: form template CRUD + OCR               |
| `backend/api/routes/admin_updates.py`     | New: OTA update management                  |
| `backend/api/routes/admin_settings.py`    | New: system settings CRUD                   |
| `src/context/AppStateContext.jsx`         | Template fetch + heartbeat + OTA check      |
| `Sahayak_admin/src/pages/Staff.jsx`       | Array parse fix (`Array.isArray`)           |
| `Sahayak_admin/src/pages/Reports.jsx`     | Response key fixes (by_service, data)       |
| `Sahayak_admin/src/utils/apiClient.js`    | 401 redirect skip for login endpoint        |
| `Sahayak_admin/src/pages/FormsTemplates.jsx` | Full rewrite with visual field builder   |
| `Sahayak_admin/src/pages/Submissions.jsx` | New page: submissions browser               |
| `Sahayak_admin/src/components/Sidebar.jsx`| Rewrite with full nav + active state        |
| `Sahayak_admin/src/App.jsx`               | Added routes for all admin pages            |
| `tests/e2e/admin.spec.js`                 | Fixed tests 18, 45                          |
| `tests/e2e/walkthrough.spec.js`           | New: 48-check admin walkthrough             |
| `tests/e2e/kiosk_walkthrough.spec.js`     | New: 14-test kiosk connectivity suite       |
