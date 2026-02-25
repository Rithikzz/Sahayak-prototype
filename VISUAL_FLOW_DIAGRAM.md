# SAHAYAK Kiosk - Complete Visual Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         🏦 SAHAYAK BANK KIOSK                              │
│                    Complete Service Flow Diagram                           │
└────────────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════╗
║                         PUBLIC ACCESS ZONE                                ║
╚═══════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────────────────────┐
    │  1. WELCOME SCREEN (/)              │
    │                                     │
    │  🏦 SAHAYAK BANK                    │
    │  Welcome to Sahayak Bank Kiosk     │
    │                                     │
    │  Select Your Language:              │
    │  ┌────┐  ┌────┐  ┌────┐           │
    │  │ EN │  │ HI │  │ TA │           │
    │  └────┘  └────┘  └────┘           │
    │                                     │
    │     [ Touch to Start → ]            │
    └─────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────┐
    │  2. AUTHENTICATION (/authentication)│
    │                                     │
    │  🔐 Bank Staff Login                │
    │  Please enter your staff PIN        │
    │                                     │
    │  Staff PIN:  ● ● ● ●              │
    │                                     │
    │  ┌───┬───┬───┐                     │
    │  │ 1 │ 2 │ 3 │   Numeric           │
    │  ├───┼───┼───┤   Keypad            │
    │  │ 4 │ 5 │ 6 │   (3x4 grid)       │
    │  ├───┼───┼───┤                     │
    │  │ 7 │ 8 │ 9 │   Mock PIN:         │
    │  ├───┼───┼───┤   "1234"            │
    │  │ ⌫ │ 0 │ C │                     │
    │  └───┴───┴───┘                     │
    │                                     │
    │  [ ← Back ]   [ Confirm → ]        │
    └─────────────────────────────────────┘
                    │
                    │ ✅ authPassed = true
                    ↓

╔═══════════════════════════════════════════════════════════════════════════╗
║                      PROTECTED ACCESS ZONE                                ║
║            (Requires authPassed = true, redirects if false)               ║
╚═══════════════════════════════════════════════════════════════════════════╝

    ┌─────────────────────────────────────┐
    │  3. MODE SELECTION (/mode-selection)│
    │                                     │
    │  Select How You Want to Continue   │
    │                                     │
    │  ┌────────────┬────────────┬──────┐│
    │  │ 🎤 Voice   │ 👆 Touch   │ 🤝  ││
    │  │   + IVR    │   Only     │Assist││
    │  │            │            │      ││
    │  │ Recommended│ Use keypad │Staff ││
    │  │  for easy  │ and screen │helps ││
    │  │   guided   │  controls  │ you  ││
    │  │    input   │            │      ││
    │  │ ⭐ BEST    │            │      ││
    │  └────────────┴────────────┴──────┘│
    │                                     │
    │  [ ← Back ]                         │
    └─────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────┐
    │  4. SERVICE SELECTION               │
    │     (/service-selection)            │
    │                                     │
    │  Select a Service                   │
    │                                     │
    │  ┌────────────┬────────────────┐   │
    │  │ 💰 Deposit │ 💸 Withdrawal  │   │
    │  │            │                │   │
    │  │   Cash     │   Cash or      │   │
    │  │  deposit   │   cheque       │   │
    │  └────────────┴────────────────┘   │
    │  ┌────────────┬────────────────┐   │
    │  │ 📝 Account │ 🏠 Address     │   │
    │  │  Opening   │   Update       │   │
    │  │            │                │   │
    │  │ New savings│ Change your    │   │
    │  │  account   │  address       │   │
    │  └────────────┴────────────────┘   │
    │                                     │
    │  [ ← Back ]                         │
    └─────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────┐
    │  5. INPUT CONTROLLER (/input)       │
    │     (One field at a time)           │
    │                                     │
    │  Field 1 of 4                       │
    │  Account Number                     │
    │                                     │
    │  IF VOICE MODE:                     │
    │  ┌─────────────────────────────┐   │
    │  │  💬 Speak Now...            │   │
    │  │     (voice bubble)          │   │
    │  └─────────────────────────────┘   │
    │                                     │
    │      🎤 (240px, pulse anim)        │
    │  ┌─────────────────────────────┐   │
    │  │   [ 🎤 Speak Now ]          │   │
    │  │     (400px wide button)     │   │
    │  └─────────────────────────────┘   │
    │                                     │
    │  After 3 seconds → Mock value       │
    │  ┌─────────────────────────────┐   │
    │  │  ✓ Ramesh Kumar             │   │
    │  │  (green box, 42px font)     │   │
    │  └─────────────────────────────┘   │
    │                                     │
    │  IF TOUCH MODE (or keypad field):   │
    │  ┌───┬───┬───┐                     │
    │  │ 1 │ 2 │ 3 │   Shows numeric     │
    │  │ 4 │ 5 │ 6 │   keypad for        │
    │  │ 7 │ 8 │ 9 │   amounts or        │
    │  │ C │ 0 │ ⌫ │   text input        │
    │  └───┴───┴───┘                     │
    │                                     │
    │  [ ← Back ]   [ Next → ]           │
    └─────────────────────────────────────┘
              │ (Repeats for each field)
              ↓
    ┌─────────────────────────────────────┐
    │  6. FIELD CONFIRMATION              │
    │     (/field-confirmation)           │
    │                                     │
    │  Please Confirm                     │
    │                                     │
    │  Depositor Name:                    │
    │  ┌─────────────────────────────┐   │
    │  │   Ramesh Kumar              │   │
    │  │   (42px, blue text)         │   │
    │  └─────────────────────────────┘   │
    │                                     │
    │  ℹ️ Please verify this information  │
    │     is correct before proceeding    │
    │                                     │
    │  [ ↻ Re-record ]  [ ✓ Confirm ]    │
    └─────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────┐
    │  7. FORM PREVIEW (/form-preview)    │
    │                                     │
    │  Form Preview                       │
    │                                     │
    │  [ 🔍- ] 100% [ 🔍+ ]              │
    │                                     │
    │  ┌─────────────────────────────┐   │
    │  │ Account Number: 1234567890  │   │
    │  │ Amount: ₹ 5000              │   │
    │  │ Depositor Name: Ramesh      │   │
    │  │ Phone: 9876543210           │   │
    │  │ (scrollable if many fields) │   │
    │  └─────────────────────────────┘   │
    │                                     │
    │  ℹ️ Please review all information   │
    │     carefully. Once submitted,      │
    │     changes require staff approval  │
    │                                     │
    │  [ ← Edit ]  [ Proceed to Verify →]│
    └─────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────┐
    │  8. VOICE VERIFICATION              │
    │     (/voice-verification)           │
    │                                     │
    │  Voice Confirmation                 │
    │                                     │
    │  ┌─────────────────────────────┐   │
    │  │ Your name is Ramesh Kumar.  │   │
    │  │ Amount is five thousand     │   │
    │  │ rupees.                     │   │
    │  │ Press 1 to confirm.         │   │
    │  │ (IVR-style text, 28px)      │   │
    │  └─────────────────────────────┘   │
    │                                     │
    │  ⚠️ Press Confirm if all details    │
    │     are correct                     │
    │     Press Edit to make changes      │
    │                                     │
    │  [ ✏️ Edit ]    [ ✓ Confirm ]       │
    └─────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────┐
    │  9. HUMAN VERIFICATION              │
    │     (/human-verification)           │
    │                                     │
    │  Waiting for Bank Staff Approval   │
    │                                     │
    │        👨‍💼 (80px icon)              │
    │                                     │
    │  Bank Staff: Please Enter Your PIN │
    │                                     │
    │  ○ ○ ○ ○  (circles fill as typed)  │
    │                                     │
    │  ┌───┬───┬───┐                     │
    │  │ 1 │ 2 │ 3 │   Staff enters      │
    │  │ 4 │ 5 │ 6 │   any 4-digit       │
    │  │ 7 │ 8 │ 9 │   PIN (mock)        │
    │  │ C │ 0 │ ✓ │                     │
    │  └───┴───┴───┘                     │
    │                                     │
    │  (Shows "Verifying..." spinner)     │
    └─────────────────────────────────────┘
                    │
                    ↓ (2 second delay)
    ┌─────────────────────────────────────┐
    │  10. SUCCESS SCREEN (/success)      │
    │                                     │
    │        ✓ (180px circle)             │
    │    (pop animation)                  │
    │                                     │
    │     Form Approved                   │
    │                                     │
    │  Printing your acknowledgement...   │
    │                                     │
    │  🖨️     (printer icon)               │
    │  📄     (moving paper animation)    │
    │                                     │
    │  Thank you for using SAHAYAK Kiosk │
    │                                     │
    │  Please collect your printed form   │
    │  from the bank staff                │
    │                                     │
    │  Returning to home screen in a      │
    │  few seconds...                     │
    │                                     │
    │  (8 second countdown)               │
    └─────────────────────────────────────┘
                    │
                    │ Auto-reset triggered:
                    │ - resetState()
                    │ - clearAuthState()
                    │ - language → 'en'
                    │ - formData → {}
                    │ - authPassed → false
                    ↓
        Back to WELCOME SCREEN (step 1)
        Ready for next customer


╔═══════════════════════════════════════════════════════════════════════════╗
║                         KEY FEATURES                                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

Authentication Gating:
  ✅ Steps 1-2: Public access
  ✅ Steps 3-10: Protected (requires authPassed = true)
  ✅ Attempting to access step 3+ without auth → Redirect to step 2

Voice Mode Differences:
  ✅ Large microphone icon with pulse animation
  ✅ Voice bubbles for prompts
  ✅ Listening state: "Listening... Please speak clearly"
  ✅ Captured state: Green box with checkmark
  ✅ 3-second simulated voice input

Touch Mode Differences:
  ✅ Text input boxes for form fields
  ✅ No microphone UI
  ✅ Direct typing allowed

Service Variations:
  Deposit:      4 fields  (Account, Amount, Name, Phone)
  Withdrawal:   3 fields  (Account, Amount, Purpose)
  Account Open: 10 fields (Full form)
  Address:      5 fields  (Account, Address, City, Pin, Proof)

Security:
  ✅ Staff PIN: "1234" (mock)
  ✅ Auth state in React Context
  ✅ Protected routes with redirect
  ✅ Auto-reset after 8 seconds
  ✅ Complete state clearing

Design Principles:
  ✅ One task per screen
  ✅ Large buttons (80-120px)
  ✅ Large text (28-64px)
  ✅ High contrast (#040466 blue)
  ✅ Touch-first (no hover)
  ✅ Calm animations only
  ✅ Professional bank theme


╔═══════════════════════════════════════════════════════════════════════════╗
║                    NAVIGATION PATHS                                       ║
╚═══════════════════════════════════════════════════════════════════════════╝

Forward Flow:
  / → /authentication → /mode-selection → /service-selection →
  /input → /field-confirmation → /form-preview →
  /voice-verification → /human-verification → /success → / (reset)

Back Navigation:
  - Step 3 (Mode) ← Back → Welcome (loses auth)
  - Step 4 (Service) ← Back → Mode
  - Step 5 (Input, field 1) ← Back → Service
  - Step 5 (Input, field 2+) ← Back → Previous field
  - Step 6-9 ← Back → Input or Preview
  - Step 10 (Success) → Auto-reset, no back button

Protected Route Access:
  - Try /service-selection without auth → Redirect to /authentication
  - Login with PIN → Access granted
  - Auto-reset → Auth cleared, redirect if accessing protected route


Built for Indian banking customers with care and precision. 🇮🇳
```
