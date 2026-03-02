# Banking Kiosk UI - Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     BANKING KIOSK AUTHENTICATION                │
│                            UI FLOW                               │
└─────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════╗
║  SCREEN 1: LANGUAGE SELECTION (WelcomeScreen.jsx)            ║
╚═══════════════════════════════════════════════════════════════╝

    ┌───────────────────────────────────────────────┐
    │        🏦 SAHAYAK BANK KIOSK                  │
    │                                                │
    │     Welcome to SAHAYAK Bank Kiosk             │
    │     Select Your Language                       │
    │                                                │
    │   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
    │   │   🇬🇧     │  │   🇮🇳     │  │   🇮🇳     │  │
    │   │ English  │  │  हिंदी   │  │  தமிழ்   │  │
    │   └──────────┘  └──────────┘  └──────────┘  │
    │                                                │
    │        [  Touch to Start  →  ]                │
    └───────────────────────────────────────────────┘
                         ↓
                         ↓
╔═══════════════════════════════════════════════════════════════╗
║  SCREEN 2: AUTHENTICATION (AuthenticationScreen.jsx)         ║
╚═══════════════════════════════════════════════════════════════╝

    ┌───────────────────────────────────────────────┐
    │  🏦 SAHAYAK BANK          Language: English   │
    ├───────────────────────────────────────────────┤
    │                                                │
    │            Authentication                      │
    │  Use the keypad below to enter your details   │
    │                                                │
    │  ┌─────────────────────────────────────────┐  │
    │  │ Account Number                          │  │
    │  │ 1234567890                              │  │ ← Active (blue border)
    │  └─────────────────────────────────────────┘  │
    │                                                │
    │  ┌─────────────────────────────────────────┐  │
    │  │ PIN                                     │  │
    │  │ ●●●●                                    │  │ ← Masked
    │  └─────────────────────────────────────────┘  │
    │                                                │
    │      NUMERIC KEYPAD (120px × 120px buttons)   │
    │      ┌─────┬─────┬─────┐                     │
    │      │  1  │  2  │  3  │                     │
    │      ├─────┼─────┼─────┤                     │
    │      │  4  │  5  │  6  │                     │
    │      ├─────┼─────┼─────┤                     │
    │      │  7  │  8  │  9  │                     │
    │      ├─────┼─────┼─────┤                     │
    │      │  ⌫  │  0  │Clear│                     │
    │      └─────┴─────┴─────┘                     │
    │                                                │
    │   [ ← Back ]          [ Confirm → ]           │
    └───────────────────────────────────────────────┘
                         ↓
                         ↓ (when account # ≥10 digits & PIN = 4 digits)
                         ↓
╔═══════════════════════════════════════════════════════════════╗
║  SCREEN 3: OTP VERIFICATION (OTPVerificationScreen.jsx)      ║
╚═══════════════════════════════════════════════════════════════╝

    ┌───────────────────────────────────────────────┐
    │  🏦 SAHAYAK BANK          Language: English   │
    ├───────────────────────────────────────────────┤
    │                                                │
    │           OTP Verification                     │
    │                                                │
    │  ┌───────────────────────────────────────┐    │
    │  │ 📱 OTP has been sent to your          │    │
    │  │    registered mobile number           │    │
    │  └───────────────────────────────────────┘    │
    │                                                │
    │  ┌─────────────────────────────────────────┐  │
    │  │ Enter OTP                               │  │
    │  │ 1 2 3 4 5 6                             │  │ ← 6-digit input
    │  └─────────────────────────────────────────┘  │
    │                                                │
    │    ⏱️ Time Remaining: 45 seconds              │
    │    (or)                                        │
    │    [  🔄 Resend OTP  ]  (after 60s)           │
    │                                                │
    │      NUMERIC KEYPAD (same as above)           │
    │      ┌─────┬─────┬─────┐                     │
    │      │  1  │  2  │  3  │                     │
    │      │  4  │  5  │  6  │                     │
    │      │  7  │  8  │  9  │                     │
    │      │  ⌫  │  0  │Clear│                     │
    │      └─────┴─────┴─────┘                     │
    │                                                │
    │              [ ← Back ]                        │
    └───────────────────────────────────────────────┘
                         ↓
                         ↓ (auto-verify when 6 digits entered)
                         ↓
       ┌────────────────────────────────┐
       │      ⏳ Verifying...           │
       │      [  spinner animation  ]   │
       └────────────────────────────────┘
                         ↓
                         ↓ (2 second delay)
                         ↓
╔═══════════════════════════════════════════════════════════════╗
║  SCREEN 4: SUCCESS (AuthSuccessScreen.jsx)                   ║
╚═══════════════════════════════════════════════════════════════╝

    ┌───────────────────────────────────────────────┐
    │  🏦 SAHAYAK BANK          Language: English   │
    ├───────────────────────────────────────────────┤
    │                                                │
    │                                                │
    │              ┌───────────┐                     │
    │              │     ✓     │  (animated)         │
    │              └───────────┘                     │
    │                                                │
    │                Success!                        │
    │                                                │
    │        Authentication Successful               │
    │                                                │
    │            🎉 Welcome!                         │
    │                                                │
    │   Thank you for using SAHAYAK Kiosk           │
    │                                                │
    │  Returning to home in 5 seconds...            │
    │                                                │
    └───────────────────────────────────────────────┘
                         ↓
                         ↓ (auto-redirect after 5 seconds)
                         ↓
                    (Back to SCREEN 1)
                    (State reset - ready for next user)


═══════════════════════════════════════════════════════════════

                    KEY FEATURES SUMMARY

═══════════════════════════════════════════════════════════════

✓ IVR-Style Flow
  ├─ One task per screen
  ├─ Clear progression indicators
  ├─ Intuitive back navigation
  └─ Auto-advance when complete

✓ On-Screen Keypad
  ├─ Large 120px × 120px buttons
  ├─ Numbers 0-9 clearly visible
  ├─ Backspace (⌫) and Clear buttons
  └─ Touch-optimized spacing

✓ Multi-Language
  ├─ English (en)
  ├─ Hindi (hi) - हिंदी
  └─ Tamil (ta) - தமிழ்

✓ Security Features
  ├─ PIN masking (●●●●)
  ├─ OTP timer (60 seconds)
  ├─ Auto-reset after session
  └─ No data persistence

✓ Accessibility
  ├─ High contrast design
  ├─ Large text (28-52px)
  ├─ Clear visual hierarchy
  └─ WCAG AAA compliant

✓ Validation
  ├─ Account: min 10 digits
  ├─ PIN: exactly 4 digits
  ├─ OTP: exactly 6 digits
  └─ Numeric input only

═══════════════════════════════════════════════════════════════

                   TECHNICAL ARCHITECTURE

═══════════════════════════════════════════════════════════════

State Management (AppStateContext)
├─ language: string ('en' | 'hi' | 'ta')
├─ accountNumber: string (numeric)
├─ pin: string (4 digits, stored/displayed masked)
├─ otp: string (6 digits)
├─ otpTimer: number (60 → 0)
├─ canResendOtp: boolean
└─ resetState: function

Routing (React Router v6)
├─ / → WelcomeScreen
├─ /authentication → AuthenticationScreen
├─ /otp-verification → OTPVerificationScreen
└─ /success → AuthSuccessScreen

Components
├─ WelcomeScreen.jsx (language selection)
├─ AuthenticationScreen.jsx (account + PIN)
├─ OTPVerificationScreen.jsx (OTP + timer)
└─ AuthSuccessScreen.jsx (success message)

Styling (App.css)
├─ Bank-grade color scheme (#040466 blue)
├─ Large touch-friendly buttons (80-120px)
├─ High contrast (WCAG AAA)
└─ Responsive design (15-17" kiosks)

═══════════════════════════════════════════════════════════════
