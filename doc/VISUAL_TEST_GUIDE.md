# Quick Visual Test - Service Categories

## 🎯 VISUAL TEST CHECKLIST

### What You Should See:

```
┌────────────────────────────────────────────────────┐
│  🏦 SAHAYAK                      English           │
├────────────────────────────────────────────────────┤
│                                                    │
│              Select a Service                      │
│     Select the type of banking form you need      │
│                                                    │
│  ┌─────────────────────┬───────────────────────┐ │
│  │ 📋 Blue             │ 💰 Green              │ │
│  │ Account Opening     │ Transaction Forms     │ │
│  │ Forms               │ (Deposit / Withdraw)  │ │
│  │                     │                       │ │
│  │ Documents for...    │ Slips used for...     │ │
│  └─────────────────────┴───────────────────────┘ │
│                                                    │
│  ┌─────────────────────┬───────────────────────┐ │
│  │ 🏦 Purple           │ 🆔 Orange             │ │
│  │ Loan Application    │ KYC (Know Your        │ │
│  │ Forms               │ Customer) Forms       │ │
│  │                     │                       │ │
│  │ Forms for...        │ Documents used...     │ │
│  └─────────────────────┴───────────────────────┘ │
│                                                    │
│  ┌─────────────────────┬───────────────────────┐ │
│  │ 📞 Teal             │ ↔️ Cyan               │ │
│  │ Service Request     │ Transfer &            │ │
│  │ Forms               │ Remittance Forms      │ │
│  │                     │                       │ │
│  │ Requests for...     │ Instructions for...   │ │
│  └─────────────────────┴───────────────────────┘ │
│                                                    │
│  ▼ SCROLL DOWN TO SEE MORE ▼       [Scrollbar]   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## ✅ VERIFICATION STEPS

### Step 1: Initial Load
- [ ] Screen loads successfully
- [ ] Header shows "🏦 SAHAYAK" logo
- [ ] Language indicator shows selected language
- [ ] Title "Select a Service" visible
- [ ] Subtitle "Select the type of banking form you need" visible

### Step 2: Category Display
- [ ] **6 tiles visible** initially (3 rows x 2 columns)
- [ ] Each tile shows:
  - [ ] Large emoji icon (56px)
  - [ ] Bold title (24px)
  - [ ] Gray description text (18px)
- [ ] Tiles properly aligned in 2-column grid
- [ ] Proper spacing between tiles (24px gap)

### Step 3: Color Verification
Verify each category has correct color:
- [ ] 📋 Account Opening = **Blue** (#0056b3)
- [ ] 💰 Transaction = **Green** (#28a745)
- [ ] 🏦 Loan = **Purple** (#6610f2)
- [ ] 🆔 KYC = **Orange** (#fd7e14)
- [ ] 📞 Service = **Teal** (#20c997)
- [ ] ↔️ Transfer = **Cyan** (#17a2b8)
- [ ] 📈 Investment = **Pink** (#e83e8c)
- [ ] ❓ Enquiry = **Yellow** (#ffc107)
- [ ] 🔒 Closure = **Red** (#dc3545)

### Step 4: Scroll Test
- [ ] Scroll indicator visible: "↕️ Scroll to see more options"
- [ ] Scrollbar visible on right side
- [ ] Scrollbar styled (blue thumb, gray track)
- [ ] Mouse wheel scrolls smoothly
- [ ] Can scroll down to see remaining 3 categories
- [ ] Can scroll back up

### Step 5: Hover/Interaction Test
- [ ] Hover over tile → slight scale/shadow effect
- [ ] Click tile → no delay
- [ ] Click navigates to `/input` route
- [ ] Back button returns to mode selection

### Step 6: Language Test
Go back to welcome and change language:

**Hindi:**
- [ ] Titles in Hindi (e.g., "खाता खोलने के फॉर्म")
- [ ] Descriptions in Hindi
- [ ] All 9 categories translated

**Tamil:**
- [ ] Titles in Tamil (e.g., "கணக்கு திறப்பு படிவங்கள்")
- [ ] Descriptions in Tamil
- [ ] All 9 categories translated

### Step 7: Touch Test (if on touchscreen)
- [ ] Touch scroll works (swipe up/down)
- [ ] Touch targets are large enough (180px height)
- [ ] No accidental clicks when scrolling
- [ ] Tiles respond to touch immediately

### Step 8: Responsive Test
**1920x1080:**
- [ ] 2 columns maintained
- [ ] All tiles fit properly
- [ ] No horizontal scroll

**1366x768:**
- [ ] 2 columns maintained
- [ ] Tiles scale appropriately
- [ ] Vertical scroll available

---

## 🐛 COMMON ISSUES TO CHECK

### Visual Issues
- ❌ Icons not rendering → Check emoji support
- ❌ Colors not showing → Check CSS variables loaded
- ❌ Tiles misaligned → Check grid CSS
- ❌ Scroll not visible → Check container height
- ❌ Descriptions cut off → Check tile min-height

### Functional Issues
- ❌ Click not working → Check onClick handler
- ❌ Wrong navigation → Check route in navigate()
- ❌ Language not changing → Check translations loaded
- ❌ Scroll jerky → Check CSS overflow property
- ❌ Scrollbar ugly → Check webkit-scrollbar styles

### Data Issues
- ❌ Fewer than 9 categories → Check formCategories array
- ❌ Missing translations → Check mockData.js
- ❌ Wrong form fields → Check formTemplates keys
- ❌ Category key mismatch → Check template names match category keys

---

## 📸 VISUAL REFERENCE

### Expected Tile Appearance:
```
┌───────────────────────────────┐
│  📋 (56px icon, blue)         │  ← Icon size & color
│                               │
│  Account Opening Forms        │  ← Title (24px, bold, dark)
│  (24px, bold)                 │
│                               │
│  Documents for setting up new │  ← Description (18px, gray)
│  savings, current, or fixed   │     Line height 1.4
│  deposit accounts.            │     Wraps naturally
│                               │
└───────────────────────────────┘
  180px min-height
  28px padding all around
  Border radius 20px
  Shadow on hover
```

### Scrollbar Appearance:
```
┌──┐
│  │ ← 14px wide
│██│ ← Blue thumb (#040466)
│██│
│  │ ← Gray track (#f1f1f1)
│  │
│██│
│██│
└──┘
```

---

## ✅ PASS CRITERIA

The update is **SUCCESSFUL** if:
- ✅ All 9 categories display correctly
- ✅ All icons, colors, titles, descriptions correct
- ✅ Scroll works smoothly
- ✅ All 3 languages work
- ✅ Touch interaction works
- ✅ Navigation works
- ✅ No console errors
- ✅ Responsive on different resolutions

---

## 🎯 QUICK TEST (30 seconds)

```bash
npm run dev
```

1. Open http://localhost:5173
2. English → PIN 1234 → Voice+IVR mode
3. **Service Selection screen should show:**
   - 9 tiles in 2 columns
   - First 6 visible immediately
   - Scroll down shows remaining 3
   - Click any tile → Goes to input screen
4. ✅ **Pass** if all above work correctly

---

## 📝 TEST RESULT TEMPLATE

```
Date: __________
Tester: __________
Browser: __________

VISUAL TEST RESULTS:
[ ] Initial load ✅ / ❌
[ ] 9 categories display ✅ / ❌
[ ] Colors correct ✅ / ❌
[ ] Scroll works ✅ / ❌
[ ] Hover effects ✅ / ❌
[ ] Click navigation ✅ / ❌
[ ] English translations ✅ / ❌
[ ] Hindi translations ✅ / ❌
[ ] Tamil translations ✅ / ❌
[ ] Touch interaction ✅ / ❌
[ ] Responsive ✅ / ❌

OVERALL: PASS ✅ / FAIL ❌

Notes:
_________________________________
_________________________________
```

---

**Ready to test? Run `npm run dev` and go through this checklist!** 🚀
