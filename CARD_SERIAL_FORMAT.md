# Wingside Card Serial Format - CORRECTED

**Date:** 2026-02-06
**Status:** ✅ Updated Throughout Codebase

---

## ✅ Correct Format

**Format:** 8 alphanumeric characters (hexadecimal)
**Characters:** 0-9 and A-F
**Case:** Uppercase (stored and displayed)

### Valid Examples:
```
372FB056
A1B2C3D4
00000001
FFFFFFFF
1234ABCD
9F8E7D6C
```

### Invalid Examples:
```
WS123456     ❌ No prefix
372FB05      ❌ Only 7 characters
372FB056G    ❌ 9 characters
372fb056     ❌ Lowercase (will be converted to uppercase)
GHIJK123     ❌ Contains G, H, I, J, K (not hex)
```

---

## 🔧 What Was Fixed

### 1. Validation Function (`lib/embedly/tap-client.ts`)

**Before (WRONG):**
```typescript
export function validateCardSerial(cardSerial: string): boolean {
  return /^WS\d{6}$/.test(cardSerial);
}
```

**After (CORRECT):**
```typescript
export function validateCardSerial(cardSerial: string): boolean {
  // Format: 8 alphanumeric characters (e.g., 372FB056)
  return /^[0-9A-F]{8}$/i.test(cardSerial);
}
```

---

### 2. Card Generator (`app/admin/wingside-cards/page.tsx`)

**Before (WRONG):**
```typescript
// Generate WS + 6 digits
const randomNum = Math.floor(100000 + Math.random() * 900000);
const serial = `${prefix}${randomNum}`;
// Example output: WS123456
```

**After (CORRECT):**
```typescript
// Generate 8-character hex code
const randomHex = Math.floor(Math.random() * 0xFFFFFFFF)
  .toString(16)
  .toUpperCase()
  .padStart(8, '0');
// Example output: 372FB056
```

---

### 3. Onboard API Validation (`app/api/wingside-card/onboard/route.ts`)

**Before (WRONG):**
```typescript
if (!/^WS\d{6}$/.test(card_serial)) {
  return NextResponse.json(
    { error: 'Invalid card serial format. Expected: WS123456' },
    { status: 400 }
  );
}
```

**After (CORRECT):**
```typescript
if (!/^[0-9A-F]{8}$/i.test(card_serial)) {
  return NextResponse.json(
    { error: 'Invalid card serial format. Expected: 8 alphanumeric characters (e.g., 372FB056)' },
    { status: 400 }
  );
}
```

---

### 4. User Input Form (`app/my-account/cards/page.tsx`)

**Before (WRONG):**
```tsx
<input
  type="text"
  placeholder="WS123456"
  pattern="WS\d{6}"
  title="Format: WS followed by 6 digits (e.g., WS123456)"
/>
```

**After (CORRECT):**
```tsx
<input
  type="text"
  placeholder="372FB056"
  pattern="[0-9A-F]{8}"
  title="Format: 8 alphanumeric characters (e.g., 372FB056)"
  maxLength={8}
/>
```

---

## 📊 Format Specifications

### Technical Details

| Property | Value |
|----------|-------|
| **Length** | Exactly 8 characters |
| **Character Set** | Hexadecimal (0-9, A-F) |
| **Case Sensitivity** | Stored as uppercase, accepts lowercase |
| **Total Possible** | 4,294,967,296 unique serials (2^32) |
| **Regex Pattern** | `/^[0-9A-F]{8}$/i` |
| **Example** | 372FB056 |

---

## 🎯 How Serials Are Generated

### Admin Panel Generator

When admin clicks "Generate Card Serial":

```typescript
// Step 1: Generate random 32-bit number
const randomNumber = Math.floor(Math.random() * 0xFFFFFFFF);
// Example: 922570838 (decimal)

// Step 2: Convert to hexadecimal
const hexString = randomNumber.toString(16);
// Example: "36feb056"

// Step 3: Convert to uppercase
const uppercase = hexString.toUpperCase();
// Example: "36FEB056"

// Step 4: Pad to 8 characters if needed
const serial = uppercase.padStart(8, '0');
// Example: "36FEB056" (already 8 chars)
// OR if short: "00000001"

// Step 5: Check uniqueness in database
// If exists, generate new one
// If unique, return serial
```

**Result:** `36FEB056` or `372FB056` or similar

---

## 🏷️ Card Printing Specifications

### What to Print on Physical Cards

**Front of Card:**
```
┌─────────────────────────────────┐
│                                 │
│        [WINGSIDE LOGO]          │
│                                 │
│    Card Number: 372FB056        │
│                                 │
│         TAP TO PAY              │
│                                 │
└─────────────────────────────────┘
```

**Back of Card:**
```
┌─────────────────────────────────┐
│                                 │
│  Activate at:                   │
│  wingside.ng/cards              │
│                                 │
│  Customer Service:              │
│  +234-809-019-1999             │
│                                 │
└─────────────────────────────────┘
```

**Important:**
- Print serial number clearly in large font
- Use monospace font for readability
- Consider QR code with serial encoded
- Include activation instructions

---

## 📱 User Experience

### Customer Journey

**1. Customer receives card at store**
```
Staff: "Your card number is 372FB056.
        Your PIN is 1234.
        Type these at wingside.ng to activate."

Customer sees on card: 372FB056
```

**2. Customer goes to website**
```
Website shows:
┌─────────────────────────────────┐
│  Link Your Wingside Card        │
│                                 │
│  Card Number:                   │
│  [372FB056        ]             │
│                                 │
│  PIN:                           │
│  [••••]                         │
│                                 │
│  [Link Card]                    │
└─────────────────────────────────┘
```

**3. Customer enters serial**
- Types: `372fb056` (lowercase OK)
- System converts to: `372FB056`
- Validates: ✅ 8 characters, hex format
- Links to wallet

---

## 🔍 Validation Examples

### Test Cases

```typescript
// Valid serials
validateCardSerial('372FB056')  // ✅ true
validateCardSerial('00000001')  // ✅ true
validateCardSerial('FFFFFFFF')  // ✅ true
validateCardSerial('A1B2C3D4')  // ✅ true
validateCardSerial('12345678')  // ✅ true

// Invalid serials
validateCardSerial('WS123456')  // ❌ false - has prefix
validateCardSerial('372FB05')   // ❌ false - only 7 chars
validateCardSerial('372FB0567') // ❌ false - 9 chars
validateCardSerial('GHIJK123')  // ❌ false - invalid hex chars
validateCardSerial('372F B056') // ❌ false - contains space
validateCardSerial('')          // ❌ false - empty
```

---

## 🗄️ Database Storage

### wingside_cards Table

```sql
CREATE TABLE wingside_cards (
  id UUID PRIMARY KEY,
  card_serial TEXT UNIQUE NOT NULL,  -- Stores: "372FB056"
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active',
  -- ... other columns
);

-- Example data:
INSERT INTO wingside_cards (card_serial, ...)
VALUES ('372FB056', ...);

-- Searches are case-insensitive:
SELECT * FROM wingside_cards
WHERE UPPER(card_serial) = UPPER('372fb056');
-- Returns: 372FB056
```

---

## 🚀 Migration Guide

### If You Have Old Format Cards

**Scenario:** You already have cards printed with "WS123456" format

**Option 1: Reprint Cards (Recommended)**
- Generate new serials in correct format
- Print new cards
- Distribute new cards going forward

**Option 2: Support Both Formats**
```typescript
export function validateCardSerial(cardSerial: string): boolean {
  // Accept both formats temporarily
  const newFormat = /^[0-9A-F]{8}$/i.test(cardSerial);
  const oldFormat = /^WS\d{6}$/.test(cardSerial);
  return newFormat || oldFormat;
}
```

**Option 3: Convert Old to New**
```sql
-- Update old serials to new format
-- WS123456 → Convert to hex
UPDATE wingside_cards
SET card_serial = LPAD(
  TO_HEX((SUBSTRING(card_serial, 3))::INTEGER),
  8,
  '0'
)
WHERE card_serial LIKE 'WS%';
```

---

## 📖 Documentation Updates

All documentation has been updated:

- ✅ `QUICK_START_TESTING.md` - Updated examples
- ✅ `EMBEDLY_TAP_TESTING_GUIDE.md` - Updated test data
- ✅ `EMBEDLY_CARDS_CORRECTIONS.md` - Updated API examples
- ✅ Code comments throughout
- ✅ Error messages in API routes
- ✅ UI placeholders and help text

---

## 💡 Why This Format?

**Hexadecimal 8-character format advantages:**

1. **More Unique IDs:** 4.3 billion possible combinations vs 1 million with WS######
2. **Industry Standard:** Same format as many NFC card systems
3. **Shorter:** No prefix needed, easier to type
4. **Database Efficient:** Can store as BIGINT if needed
5. **Scalable:** Won't run out of serials
6. **Professional:** Looks like standard card numbers

---

## 🧪 Testing Checklist

After format change:

- [x] Validation function updated
- [x] Card generator updated
- [x] API validation updated
- [x] User form updated
- [x] Admin panel updated
- [ ] Test card generation (generate 10 serials)
- [ ] Test card linking (link a test serial)
- [ ] Test validation (try invalid formats)
- [ ] Update any printed materials
- [ ] Update customer service scripts

---

## 📞 Customer Support Script

**Customer:** "What format is the card number?"

**Support Response:**
```
"The card number is 8 characters with numbers
and letters. It looks like this: 372FB056

You can find it printed on the front of your
card. Type it exactly as shown - letters can
be uppercase or lowercase, we'll accept both."
```

---

## 🎨 Design Mockup

### Card Front (Recommended Design)

```
┌───────────────────────────────────────┐
│                                       │
│  [WING LOGO]        WINGSIDE          │
│                                       │
│                                       │
│     372FB056                          │
│     ████████                          │
│     8-character card number           │
│                                       │
│                                       │
│     TAP TO PAY                        │
│     [NFC ICON]                        │
│                                       │
└───────────────────────────────────────┘
```

**Design Notes:**
- Card number in large, bold font
- Monospace font (like Courier) for clarity
- High contrast (black on white)
- Number should be at least 5mm tall
- Consider embossed/raised printing

---

**Summary:** Card format is now **372FB056** (8 hex characters), not ~~WS123456~~. All code updated! ✅
