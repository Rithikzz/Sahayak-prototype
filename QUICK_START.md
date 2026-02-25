# Quick Start Guide - Banking Kiosk UI

## Prerequisites
- Node.js 18 or higher
- npm (comes with Node.js)
- Modern web browser (Chrome, Edge, or Firefox)

## Installation & Running

### 1. Navigate to Project Directory
```bash
cd "C:\Users\RITHIK S\kioskui"
```

### 2. Install Dependencies (if not already done)
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5173` (or next available port).

### 4. Open in Browser
- Open your browser to the URL shown in terminal
- For kiosk testing, press F11 for fullscreen mode

## Testing the Complete Flow

### Test Scenario 1: English Language Flow
1. **Start**: Open `http://localhost:5173`
2. **Language**: Click "English" tile
3. **Start**: Click "Touch to Start →" button
4. **Account**: 
   - Click on Account Number field (should highlight blue)
   - Use keypad to enter: `1234567890`
5. **PIN**: 
   - Click on PIN field (should highlight blue)
   - Use keypad to enter: `1234` (displays as ●●●●)
6. **Confirm**: Click "Confirm →" button
7. **OTP**: 
   - Keypad appears automatically
   - Enter 6 digits: `123456`
   - Auto-verifies when 6 digits entered
8. **Success**: 
   - View success screen
   - Wait 5 seconds for auto-redirect
9. **Reset**: Returns to language selection

### Test Scenario 2: Hindi Language Flow
1. **Language**: Click "हिंदी (Hindi)" tile
2. **Start**: Click "शुरू करने के लिए स्पर्श करें →"
3. **Account**: Enter `9876543210`
4. **PIN**: Enter `5678`
5. **Confirm**: Click "पुष्टि करें →"
6. **OTP**: Enter `654321`
7. **Success**: View success in Hindi
8. **Verify**: All text should be in Hindi throughout

### Test Scenario 3: Tamil Language Flow
1. **Language**: Click "தமிழ் (Tamil)" tile
2. **Follow**: Same steps as Hindi
3. **Verify**: All text displays in Tamil

## Feature Testing

### A. Keypad Functionality
**Test Steps:**
1. Click each number button (0-9)
2. Verify number appears in active field
3. Click backspace (⌫) button
4. Verify last digit removed
5. Click "Clear" button
6. Verify last digit removed (same as backspace)
7. Rapid tap several buttons
8. Verify no duplicates or skipped inputs

**Expected:** All buttons responsive, no lag, clear visual feedback

### B. Field Switching
**Test Steps:**
1. On authentication screen, enter digits in account field
2. Click PIN field
3. Verify blue border moves to PIN field
4. Enter digits with keypad
5. Verify digits go to PIN field (masked)
6. Click account field again
7. Enter more digits
8. Verify digits append to account number

**Expected:** Active field clearly indicated, input routes correctly

### C. Input Validation
**Test Steps:**
1. **Account Number:**
   - Try to enter more than 16 digits
   - Verify it stops at 16
   - Try to confirm with less than 10 digits
   - Verify confirm button disabled

2. **PIN:**
   - Try to enter more than 4 digits
   - Verify it stops at 4
   - Try to confirm with less than 4 digits
   - Verify confirm button disabled

3. **OTP:**
   - Try to enter more than 6 digits
   - Verify it stops at 6
   - Verify auto-verification at 6 digits

**Expected:** All limits enforced, confirm button properly enabled/disabled

### D. OTP Timer
**Test Steps:**
1. Navigate to OTP screen
2. Observe timer countdown (starts at 60)
3. Wait for timer to reach 0
4. Verify "Resend OTP" button appears
5. Click "Resend OTP"
6. Verify:
   - OTP input clears
   - Timer resets to 60
   - Countdown starts again

**Expected:** Timer accurate, resend works properly

### E. Back Navigation
**Test Steps:**
1. From Authentication screen:
   - Enter some data
   - Click "← Back"
   - Verify returns to language selection
   - Verify data cleared

2. From OTP screen:
   - Enter some OTP digits
   - Click "← Back"
   - Verify returns to authentication screen
   - Verify OTP cleared but account/PIN preserved
   - Navigate forward again
   - Verify timer resets

**Expected:** Navigation works, appropriate data cleared

### F. Success & Auto-Reset
**Test Steps:**
1. Complete full flow to success screen
2. Observe:
   - Large checkmark animation
   - Success message
   - "Returning to home in 5 seconds..."
3. Wait 5 seconds
4. Verify:
   - Returns to language selection
   - All data cleared
   - Ready for next user

**Expected:** Auto-reset after 5 seconds, clean state

### G. Visual & Accessibility
**Test Steps:**
1. **Contrast:**
   - Verify blue (#040466) on white is easy to read
   - Check all text is legible

2. **Touch Targets:**
   - Keypad buttons easy to tap
   - No accidental taps on adjacent buttons
   - All buttons respond immediately

3. **Active State:**
   - Active field clearly highlighted
   - Confirm button visually changes when enabled/disabled

4. **Animations:**
   - Button press animation smooth
   - Success checkmark animates
   - Spinner during verification

**Expected:** Professional, accessible, easy to use

## Common Issues & Solutions

### Issue: Port Already in Use
**Solution:**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Or use different port
npm run dev -- --port 3000
```

### Issue: Dependencies Not Installing
**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Browser Not Updating
**Solution:**
- Hard refresh: Ctrl + Shift + R (Windows/Linux) or Cmd + Shift + R (Mac)
- Clear browser cache
- Try incognito/private mode

### Issue: Touch Not Working (Desktop Testing)
**Solution:**
- Mouse clicks work same as touch on desktop
- For true touch testing, deploy to actual touchscreen device
- Or use browser DevTools device emulation (F12 → Toggle Device Toolbar)

## Build for Production

### Create Production Build
```bash
npm run build
```

Output will be in `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

### Deploy to Kiosk

**Option 1: Local Server**
```bash
# After build, serve dist folder
npx serve dist
```

**Option 2: Chrome Kiosk Mode**
```bash
chrome.exe --kiosk --app=http://localhost:5173
```

**Option 3: Package as Electron App** (for offline kiosks)
- Use Electron builder
- Package entire app
- Run without browser

## Performance Tips

### For Optimal Kiosk Performance:
1. **Use Chrome**: Best performance and touch support
2. **Fullscreen Mode**: F11 or `--kiosk` flag
3. **Disable Browser UI**: Hide address bar, tabs, etc.
4. **Hardware Acceleration**: Enable in browser settings
5. **Auto-Start**: Set kiosk to launch on boot
6. **Watchdog**: Auto-restart on crash

### Recommended Kiosk Hardware:
- **CPU**: Intel i3 or equivalent (minimum)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 128GB SSD
- **Display**: 15-17" touchscreen, 1920×1080
- **Touch**: Capacitive (10-point multi-touch)

## Monitoring & Maintenance

### Check Application Health:
```bash
# View console for errors (F12 in browser)
# Look for:
- React errors (red text)
- Network errors (failed requests)
- Warning messages (yellow text)
```

### Regular Maintenance:
1. **Weekly**: Check for npm package updates
2. **Monthly**: Review and update dependencies
3. **Quarterly**: Test full flow on actual kiosk hardware

### Logs to Monitor:
- Browser console logs
- Network tab (for future API integration)
- Performance metrics (React DevTools)

## Development Tools

### Useful Browser Extensions:
- **React Developer Tools**: Inspect component state
- **Redux DevTools**: (if Redux added later)
- **Lighthouse**: Performance and accessibility audit

### VS Code Extensions:
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **ES7+ React/Redux/React-Native snippets**: Speed up development

## Support & Documentation

### Project Documentation:
- `README.md` - Project overview and setup
- `IMPLEMENTATION.md` - Implementation details
- `FLOW_DIAGRAM.md` - Visual flow diagrams
- `KEYPAD_GUIDE.md` - Keypad implementation guide
- This file - Quick start and testing guide

### Code Locations:
- **Components**: `src/components/`
- **State Management**: `src/context/AppStateContext.jsx`
- **Translations**: `src/data/mockData.js`
- **Styles**: `src/App.css`
- **Routes**: `src/App.jsx`

### Get Help:
- Check browser console for errors
- Review component source code
- Refer to React Router documentation
- Check React Context API documentation

---

## Quick Command Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

---

**Ready to Test!** 🚀

Open your terminal, navigate to the project, run `npm run dev`, and start testing the banking kiosk authentication flow!
