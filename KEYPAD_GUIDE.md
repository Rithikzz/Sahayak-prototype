# Numeric Keypad Implementation Guide

## Overview
The on-screen numeric keypad is a critical component of the banking kiosk authentication flow, providing a touch-friendly interface for entering account numbers, PINs, and OTPs.

## Design Specifications

### Layout
- **Grid**: 3 columns × 4 rows
- **Button Size**: 120px × 120px (minimum)
- **Gap**: 16px between buttons
- **Total Footprint**: ~400px × 550px

### Button Configuration
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
├─────┼─────┼─────┤
│  7  │  8  │  9  │
├─────┼─────┼─────┤
│  ⌫  │  0  │Clear│
└─────┴─────┴─────┘
```

### Button Types
1. **Number Buttons (1-9, 0)**
   - Primary blue background
   - White text
   - Font size: 42px
   - Font weight: bold

2. **Backspace Button (⌫)**
   - Secondary background
   - Icon: ⌫ (Unicode: U+232B)
   - Font size: 32px
   - Deletes last character

3. **Clear Button**
   - Outlined style (white bg, blue border)
   - Text label (translated)
   - Font size: 24px
   - Same function as backspace

## Implementation Example

### React Component Pattern
```jsx
const handleKeypadPress = (digit) => {
  if (currentValue.length < maxLength) {
    setValue(currentValue + digit);
  }
};

const handleClear = () => {
  setValue(currentValue.slice(0, -1));
};

// Keypad JSX
<div className="keypad-grid" style={{ gap: '16px' }}>
  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
    <button
      key={digit}
      onClick={() => handleKeypadPress(digit.toString())}
      className="btn btn-primary keypad-btn"
      style={{
        minWidth: '120px',
        minHeight: '120px',
        fontSize: '42px'
      }}
    >
      {digit}
    </button>
  ))}
  <button onClick={handleClear} className="btn btn-secondary keypad-btn">
    ⌫
  </button>
  <button onClick={() => handleKeypadPress('0')} className="btn btn-primary keypad-btn">
    0
  </button>
  <button onClick={handleClear} className="btn btn-outline keypad-btn">
    {t.clear}
  </button>
</div>
```

## Input Field Integration

### Authentication Screen
**Two Input Fields:**
1. **Account Number Field**
   - Max length: 16 digits
   - Display: Plain text (e.g., "1234567890")
   - Active indicator: Blue border (#040466)

2. **PIN Field**
   - Max length: 4 digits
   - Display: Masked as dots (●●●●)
   - Active indicator: Blue border (#040466)

**Field Switching:**
```jsx
const [currentField, setCurrentField] = useState('account');

// Click handler for field selection
<div onClick={() => setCurrentField('account')}>
  Account Number Field
</div>
<div onClick={() => setCurrentField('pin')}>
  PIN Field
</div>

// Keypad routes input to active field
const handleKeypadPress = (digit) => {
  if (currentField === 'account') {
    if (accountNumber.length < 16) {
      setAccountNumber(accountNumber + digit);
    }
  } else {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  }
};
```

### OTP Screen
**Single Input Field:**
- Max length: 6 digits
- Display: Spaced digits (1 2 3 4 5 6)
- Auto-verify: When 6 digits entered

```jsx
const handleKeypadPress = (digit) => {
  if (otp.length < 6) {
    const newOtp = otp + digit;
    setOtp(newOtp);
    
    // Auto-verify
    if (newOtp.length === 6) {
      handleVerify(newOtp);
    }
  }
};
```

## Visual Feedback

### Button Press Animation
```css
.btn:active {
  transform: scale(0.96);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

.btn::before {
  /* Ripple effect */
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  /* Animation on press */
}
```

### Field Active State
```css
.input-field.active {
  border: 4px solid #040466;
  background-color: #e6e6ff;
}
```

## Accessibility Features

### Touch Optimization
✓ **Minimum Touch Target**: 120px (exceeds 60px WCAG requirement)
✓ **Gap Spacing**: 16px (prevents accidental taps)
✓ **Immediate Feedback**: Visual response on press
✓ **High Contrast**: Blue on white (4.5:1+ ratio)

### Visual Clarity
✓ **Large Font**: 42px for numbers
✓ **Clear Icons**: Backspace symbol easily recognizable
✓ **Consistent Layout**: Standard phone keypad arrangement
✓ **No Hover States**: Touch-optimized (no mouse hover needed)

### Language Support
```javascript
const translations = {
  en: { clear: 'Clear' },
  hi: { clear: 'साफ़ करें' },
  ta: { clear: 'அழி' }
};
```

## Input Validation

### Numeric Only
- Keypad enforces numeric input (no alphabetic characters)
- No need for keyboard input validation
- Prevents user error

### Length Limits
```javascript
// Account Number
if (accountNumber.length < 16) {
  setAccountNumber(accountNumber + digit);
}

// PIN
if (pin.length < 4) {
  setPin(pin + digit);
}

// OTP
if (otp.length < 6) {
  setOtp(otp + digit);
}
```

### PIN Masking
```jsx
// Display
{pin ? '●'.repeat(pin.length) : '—'}

// CSS
style={{
  letterSpacing: '8px',  // Space out dots
  fontFamily: 'monospace'  // Consistent spacing
}}
```

## Performance Considerations

### Optimization
- Use `React.memo` for keypad component if needed
- Debounce rapid taps (though not typically necessary)
- Prevent double-submit with disabled state during verification

### State Management
```javascript
// Efficient state updates
const handleKeypadPress = (digit) => {
  setOtp(prev => prev.length < 6 ? prev + digit : prev);
};
```

## Testing Checklist

### Functionality
- [ ] All number buttons (0-9) respond to touch
- [ ] Backspace removes last character
- [ ] Clear button functions same as backspace
- [ ] Input limits enforced (16/4/6 digits)
- [ ] PIN properly masked
- [ ] Field switching works correctly
- [ ] Auto-verify triggers on OTP completion

### Visual
- [ ] Buttons are large and easy to tap
- [ ] Active field clearly indicated
- [ ] Press animation plays
- [ ] Layout doesn't shift during input
- [ ] Text is crisp and readable
- [ ] Colors meet contrast requirements

### Multi-Language
- [ ] "Clear" button text updates with language
- [ ] All instructions in correct language
- [ ] Number symbols work in all languages (0-9 universal)

### Edge Cases
- [ ] Rapidly tapping doesn't cause issues
- [ ] Switching fields mid-entry works
- [ ] Back navigation clears data appropriately
- [ ] Maximum length doesn't allow overflow

## Browser Compatibility

### Tested On
- Chrome 90+ (Recommended for kiosks)
- Edge 90+
- Firefox 88+

### CSS Features Used
- Flexbox/Grid (universal support)
- CSS animations (universal support)
- Box-shadow (universal support)
- Border-radius (universal support)

### Touch Events
- `onClick` handler (works on touch devices)
- No mouse-specific events (hover, mouseenter, etc.)
- Touch-action CSS property for responsiveness

## Production Deployment Notes

### Kiosk Setup
1. **Disable Virtual Keyboard**: OS-level setting to prevent system keyboard popup
2. **Fullscreen Mode**: Use browser kiosk mode (`--kiosk` flag)
3. **Touch Calibration**: Ensure accurate touch detection
4. **Screen Orientation**: Lock to landscape mode

### Security
- No data stored in localStorage or sessionStorage
- State cleared on success/timeout
- PIN never logged or transmitted in plain text
- Keypad input not captured by browser autofill

---

**Last Updated**: February 6, 2026
**Component Locations**: 
- AuthenticationScreen.jsx (lines 90-160)
- OTPVerificationScreen.jsx (lines 140-210)
