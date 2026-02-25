# SAHAYAK Kiosk - Quick Testing Checklist

## 🧪 Manual Testing Checklist

### ✅ 1. Language Selection & Authentication
- [ ] Start app at `/`
- [ ] See welcome screen with SAHAYAK logo
- [ ] Language selector shows: English, Hindi, Tamil
- [ ] Click English → Border highlights, background changes
- [ ] Click "Touch to Start" → Navigate to `/authentication`
- [ ] See staff login screen with lock icon 🔐
- [ ] PIN display shows "— — — —"
- [ ] Click keypad numbers → PIN shows as dots (●●●●)
- [ ] Enter `1234` → "Confirm" button enables
- [ ] Click "Confirm" → Navigate to `/mode-selection`
- [ ] ❌ Enter wrong PIN (e.g., `9999`) → Error message, PIN clears

### ✅ 2. Mode Selection
- [ ] See 3 mode tiles: Voice+IVR, Touch Only, Assisted
- [ ] Voice+IVR has green border and "⭐ Recommended" badge
- [ ] Click "Voice + IVR" → Navigate to `/service-selection`
- [ ] Header shows selected language
- [ ] Back button navigates to welcome (loses auth)

### ✅ 3. Service Selection - Deposit
- [ ] See 4 service tiles: Deposit 💰, Withdrawal 💸, Account Opening 📝, Address Update 🏠
- [ ] Click "Deposit" → Navigate to `/input`
- [ ] See "Field 1 of 4" progress indicator
- [ ] Title: "Account Number"
- [ ] See numeric keypad (large buttons)
- [ ] Enter account number → Display updates
- [ ] Click "Next" → Move to field 2 (Amount)
- [ ] See ₹ symbol with amount display
- [ ] Enter 5000 → Shows "₹ 5000"
- [ ] Click "Next" → Move to field 3 (Depositor Name)

### ✅ 4. Voice Input (Voice Mode)
- [ ] See large microphone icon 🎤 (not listening yet)
- [ ] See voice bubble with "Speak Now..."
- [ ] Click large "Speak Now" button → Listening state activates
- [ ] Microphone animates with pulse effect
- [ ] Text shows "Listening... Please speak clearly"
- [ ] After 3 seconds → Mock value appears "Ramesh Kumar"
- [ ] Value displays in large green box with checkmark ✓
- [ ] Click "Next" → Move to field 4 (Phone Number)
- [ ] Same voice input flow
- [ ] After last field → Navigate to `/field-confirmation`

### ✅ 5. Field Confirmation
- [ ] See last entered field displayed
- [ ] Large text shows the value
- [ ] Two buttons: "Repeat" and "Confirm"
- [ ] Click "Confirm" → Navigate to `/form-preview`

### ✅ 6. Form Preview
- [ ] See all 4 fields in read-only list
- [ ] Each field shows label and value
- [ ] Zoom controls show "100%"
- [ ] Click "🔍 +" → Zoom increases to 120%
- [ ] Click "🔍 −" → Zoom decreases
- [ ] Info box explains form is final
- [ ] Click "Proceed to Verification" → Navigate to `/voice-verification`

### ✅ 7. Voice Verification
- [ ] See IVR-style confirmation text:
  - "Your name is Ramesh Kumar."
  - "Amount is five thousand rupees."
  - "Press 1 to confirm."
- [ ] Yellow info box with instructions
- [ ] Two buttons: "Edit" and "Confirm"
- [ ] Click "Confirm" → Shows spinner, then navigate to `/human-verification`

### ✅ 8. Human Verification
- [ ] See staff icon 👨‍💼
- [ ] Message: "Waiting for bank staff approval"
- [ ] Staff PIN prompt
- [ ] 4 empty circles for PIN display
- [ ] Numeric keypad (0-9)
- [ ] Enter any 4 digits → Circles fill with blue
- [ ] Click checkmark ✓ → Shows "Verifying..." spinner
- [ ] After 2 seconds → Navigate to `/success`

### ✅ 9. Success & Auto-Reset
- [ ] See large green checkmark ✓ in circle
- [ ] Success pop animation
- [ ] Message: "Form Approved"
- [ ] Printing animation (printer icon 🖨️ + moving paper)
- [ ] Thank you message
- [ ] Notice: "Returning to home screen in a few seconds..."
- [ ] Wait 8 seconds → Auto-navigate to `/`
- [ ] Language resets to default
- [ ] Auth state cleared

### ✅ 10. Protected Route Testing
- [ ] Clear browser session/localStorage
- [ ] Try to visit `/service-selection` directly
- [ ] Should redirect to `/authentication`
- [ ] Enter PIN `1234` and confirm
- [ ] Now can access `/service-selection`

### ✅ 11. Touch Mode (Different from Voice)
- [ ] Start fresh from welcome
- [ ] Select language and authenticate
- [ ] Choose "Touch Only" mode
- [ ] Select "Account Opening" service
- [ ] For text fields: See text input box (not microphone)
- [ ] Type directly into input
- [ ] No voice UI elements shown
- [ ] Same flow through to success

### ✅ 12. Language Switching
- [ ] Start app
- [ ] Select "हिंदी" (Hindi)
- [ ] All UI text changes to Hindi
- [ ] Button labels in Hindi
- [ ] Error messages in Hindi
- [ ] Complete flow in Hindi
- [ ] Try Tamil (தமிழ்) similarly

### ✅ 13. Back Navigation
- [ ] On Mode Selection → Click "Back"
- [ ] Should navigate to welcome (auth cleared)
- [ ] On Service Selection → Click "Back"
- [ ] Should navigate to mode selection (auth retained)
- [ ] During input → Click "Back"
- [ ] If first field → Go to service selection
- [ ] If not first → Go to previous field

### ✅ 14. Error Handling
- [ ] Authentication: Enter 3 digits → Confirm button disabled
- [ ] Authentication: Enter wrong PIN → Error shows, can retry
- [ ] Input: Try to proceed with empty field → Alert or button disabled
- [ ] Form preview: All fields must have values

### ✅ 15. Visual Design Checks
- [ ] All buttons have 80px+ height
- [ ] Primary action buttons are 120px height
- [ ] Font sizes: Titles 48px+, content 28px+
- [ ] High contrast: Text easily readable
- [ ] Borders are 3-4px thick
- [ ] Colors match bank theme (blues #040466)
- [ ] No hover effects (touch-only)
- [ ] Active states show scale down
- [ ] Animations are subtle and calm

### ✅ 16. Responsive Behavior
- [ ] Test on 1920x1080 resolution
- [ ] Test on 1366x768 resolution
- [ ] All content fits without scrolling (except form preview)
- [ ] Buttons remain touch-friendly
- [ ] Text remains readable

## 🚨 Expected Behaviors

### Authentication
- ✅ Mock PIN is `1234`
- ✅ Any other PIN shows error
- ✅ PIN is masked as dots
- ✅ Clear button removes one digit
- ✅ Can enter up to 6 digits

### Voice Mode
- ✅ Shows large microphone icon
- ✅ Listening state animates (pulse)
- ✅ Mock voice input appears after 3 seconds
- ✅ No real speech recognition (simulated)
- ✅ Mock values are pre-defined in code

### Protected Routes
- ✅ Cannot access services without auth
- ✅ Redirect to authentication if not logged in
- ✅ Auth state persists during session
- ✅ Auth clears on auto-reset

### Auto-Reset
- ✅ Triggered after 8 seconds on success screen
- ✅ Clears all form data
- ✅ Clears authentication state
- ✅ Returns to welcome screen
- ✅ Language resets to default (English)

## 📊 Test Results Template

```
Date: __________
Tester: __________

✅ PASS | ❌ FAIL | ⚠️ PARTIAL

[ ] Authentication Flow
[ ] Mode Selection
[ ] Service Selection (All 4 services)
[ ] Voice Input Mode
[ ] Touch Input Mode
[ ] Form Preview
[ ] Voice Verification
[ ] Human Verification
[ ] Success & Auto-Reset
[ ] Protected Routes
[ ] Language Support (All 3)
[ ] Back Navigation
[ ] Error Handling
[ ] Visual Design
[ ] Responsive Behavior

Notes:
_________________________________
_________________________________
_________________________________
```

## 🎯 Critical Test Scenarios

### Scenario 1: Illiterate User with Voice Mode
1. Bank staff selects language for user
2. Staff authenticates with PIN
3. Staff selects "Voice + IVR" for user
4. User selects service (icons help)
5. User speaks into microphone for each field
6. Staff reviews and approves

### Scenario 2: Elderly User with Touch Mode
1. User selects Tamil (understands Tamil)
2. Staff authenticates
3. Staff selects "Touch Only" (user prefers typing)
4. User slowly types each field
5. Staff verifies and approves

### Scenario 3: Quick Cash Deposit
1. User selects English
2. Staff authenticates instantly
3. Select "Voice + IVR"
4. Select "Deposit"
5. Keypad for account (fast numeric entry)
6. Keypad for amount
7. Quick voice for name and phone
8. Staff approves
9. Success in under 2 minutes

## 🐛 Known Limitations (By Design)

- Voice input is simulated (no real STT)
- Staff PIN is hardcoded `1234` (mock)
- Human verification accepts any 4-digit PIN (mock)
- No backend API calls
- No real receipt printing
- Language resets after each session (security)
- No session persistence across page refresh

## ✅ Definition of Done

A test is complete when:
- [ ] All checklist items pass
- [ ] No console errors
- [ ] Smooth navigation between all screens
- [ ] Auth gating works correctly
- [ ] Auto-reset completes successfully
- [ ] Voice and touch modes behave differently
- [ ] All 3 languages work
- [ ] All 4 services can be completed
- [ ] Visual design meets bank-grade standards
- [ ] No data leakage between sessions
