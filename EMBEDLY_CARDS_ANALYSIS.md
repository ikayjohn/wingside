# Embedly Cards Setup Analysis

**Generated:** 2026-02-06
**Purpose:** Comprehensive analysis of Embedly card integration for Wingside

---

## Executive Summary

Your Embedly setup includes **TWO DISTINCT CARD SYSTEMS** with different purposes and implementations:

### 1. **Wingside Physical Tap Cards** ✅ FULLY IMPLEMENTED
- **Status:** Production-ready
- **Purpose:** Physical NFC/tap cards for in-store payments
- **API:** Embedly TAP API
- **Database:** `wingside_cards` table
- **User Access:** `/my-account/cards`

### 2. **Embedly Virtual/Physical Cards** ⚠️ PARTIALLY IMPLEMENTED
- **Status:** Client code exists, no frontend implementation
- **Purpose:** Virtual debit cards for online/offline purchases
- **API:** Embedly Card Middleware API
- **Database:** `cards` and `card_transactions` tables (webhook handlers exist)
- **User Access:** Not available in UI

---

## System 1: Wingside Tap Cards (IMPLEMENTED)

### Overview
Physical tap-to-pay cards that customers can link to their Wingside wallet for contactless payments at your stores.

### Technical Architecture

#### API Integration
```typescript
// lib/embedly/tap-client.ts
Base URL: https://api.embedly.com/tap/v1
Authentication: Bearer token (EMBEDLY_TAP_API_KEY)

Functions:
- onboardCard() - Link physical card to wallet
- getCardBalance() - Fetch current balance
- getCardHistory() - Transaction history
- topUpCard() - Add funds from wallet
- updateCardStatus() - Suspend/activate card
- verifyCardPin() - Validate PIN for POS
```

#### Database Schema
```sql
Table: wingside_cards
- id (UUID, Primary Key)
- user_id (Foreign Key to profiles)
- embedly_customer_id (Links to Embedly customer)
- embedly_wallet_id (Links to Embedly wallet)
- card_serial (Unique, e.g., WS123456)
- card_pin_hash (SHA-256 encrypted)
- status (active, suspended, lost, stolen, expired, terminated)
- card_type (standard, gift, corporate)
- max_debit (Transaction limit, default ₦50,000)
- total_transactions (Counter)
- total_spent (Cumulative)
- linked_at, last_used_at

Constraints:
- ONE card per user (enforced via unique index on active/suspended cards)
- Card serial must be unique across all users
```

#### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/wingside-card/onboard` | POST | Link physical card to user wallet |
| `/api/wingside-card/status` | GET | Get user's card details |
| `/api/wingside-card/status` | PUT | Update card status (suspend, report lost) |
| `/api/wingside-card/balance` | GET | Get card balance (same as wallet) |
| `/api/wingside-card/history` | GET | Transaction history |
| `/api/wingside-card/top-up` | POST | Add funds from wallet to card |
| `/api/wingside-card/webhook` | POST | Handle transaction webhooks |

#### User Flow
1. **Customer gets physical card** at Wingside store (card serial: WS######)
2. **Navigate to** `/my-account/cards`
3. **Click "Link Your Card"**
4. **Enter:**
   - Card Serial (WS123456 format)
   - Card PIN (4-6 digits)
5. **System validates:**
   - User doesn't already have an active card (ONE per customer)
   - Card serial is unique (not linked to another account)
   - User has Embedly wallet set up
6. **API calls Embedly TAP** to onboard card
7. **Card stored** in database with hashed PIN
8. **Customer can now:**
   - Tap card at POS to pay
   - View balance (shared with wallet)
   - See transaction history
   - Suspend/reactivate card
   - Report lost/stolen

#### Security Features
- **PIN hashing:** SHA-256 before storage
- **One card per user:** Database constraint enforces
- **Card serial validation:** WS + 6 digits regex
- **PIN validation:** 4-6 digits only
- **Status management:** Users can suspend immediately if lost
- **Transaction limits:** Max ₦50,000 per transaction (configurable)
- **RLS policies:** Users can only view their own cards

#### Current UI
**Location:** `/app/my-account/cards/page.tsx`

**Features:**
- Visual card display with gradient background
- Real-time balance sync
- Card information panel
- Quick actions (Add Money, View History, Manage Card)
- Onboarding modal for linking new cards
- Status management modal
- Transaction history (via wallet history)

---

## System 2: Embedly Virtual/Physical Cards (NOT IMPLEMENTED IN UI)

### Overview
Virtual or physical debit cards issued via Embedly's Card Middleware API for online purchases, ATM withdrawals, and POS payments.

### Technical Architecture

#### API Integration
```typescript
// lib/embedly/client.ts (lines 656-726)
Base URL: https://waas-card-middleware-api-prod.embedly.ng
Authentication: x-api-key header

Functions:
- createCard() - Issue virtual or physical card
- getCards() - Get customer's cards
- getCardDetails() - Get specific card info
- blockCard() / unblockCard() - Block/unblock
- freezeCard() / unfreezeCard() - Temporary freeze
- fundCard() - Add money to card
- updateCardLimit() - Set spending limits
```

#### Card Types
```typescript
interface EmbedlyCard {
  id: string
  cardId: string
  customerId: string
  walletId: string
  cardType: 'VIRTUAL' | 'PHYSICAL'
  cardStatus: 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'TERMINATED'
  maskedPan: string // e.g., 5399********2345
  expiryDate: string
  balance: number
  cardPinSet: boolean
  spendLimit?: number
  dailyLimit?: number
  monthlyLimit?: number
  isDefault: boolean
}
```

#### Database Schema
```sql
Table: cards (inferred from webhook handler)
- id
- user_id (Foreign Key)
- card_id (Embedly card ID)
- account_number (Linked wallet account)
- masked_pan (Card number)
- wallet_id (Embedly wallet ID)
- status (ACTIVE, FROZEN, BLOCKED, TERMINATED)
- type (VIRTUAL, PHYSICAL)
- balance
- created_at, updated_at

Table: card_transactions (inferred)
- id
- card_id (Foreign Key)
- user_id
- type (ATM, POS, CHECKOUT)
- amount
- currency
- status
- payment_reference
- date_of_transaction
- stan, rrn (transaction identifiers)
- description
```

#### Webhook Handler
**Location:** `/app/api/embedly/webhooks/cards/route.ts`

**Supported Events:**
1. `card.management.updateInfo` - Card details updated
2. `card.management.relink` - Card relinked to wallet
3. `card.transaction.atm` - ATM withdrawal
4. `card.transaction.pos` - POS payment
5. `checkout.payment.success` - Card top-up via checkout wallet

**Security:**
- IP allowlisting (optional, via `EMBEDLY_ALLOWED_IPS`)
- Custom webhook token validation (`EMBEDLY_WEBHOOK_TOKEN`)
- Content-Type validation (must be application/json)

#### Missing Components
❌ **No API endpoints** to create/manage these cards
❌ **No frontend UI** for users to request/manage virtual cards
❌ **No database migrations** for `cards` and `card_transactions` tables
❌ **No user flow** documented or implemented

---

## Comparison: Two Card Systems

| Feature | Wingside Tap Cards | Embedly Virtual Cards |
|---------|-------------------|----------------------|
| **Purpose** | In-store tap payments | Online/ATM/POS payments |
| **Card Type** | Physical NFC card | Virtual or physical debit card |
| **Card Number** | Serial (WS123456) | 16-digit PAN (5399****2345) |
| **Usage** | Wingside stores only | Anywhere cards accepted |
| **Balance** | Shared with Wingside wallet | Separate card balance |
| **Issuance** | Pre-printed, distributed in-store | Issued via Embedly API on demand |
| **PIN** | Set at issuance, hashed locally | Set via Embedly API |
| **Limits** | Transaction limit (₦50k) | Daily/monthly limits |
| **Implementation** | ✅ Complete | ⚠️ Backend only |
| **User Limit** | ONE per customer | Multiple allowed |
| **Revocation** | Suspend/lost/stolen status | Block/freeze/terminate |
| **Webhooks** | Custom `/webhook` endpoint | `/webhooks/cards` endpoint |
| **Database** | `wingside_cards` table | `cards` + `card_transactions` |

---

## Issues & Recommendations

### Current Setup Issues

#### 1. **Duplicate Card Systems**
**Problem:** Two overlapping card systems may confuse users and developers.

**Recommendation:**
- **Option A:** Focus on Wingside Tap Cards (current implementation) and remove unused Embedly virtual card code
- **Option B:** Fully implement Embedly virtual cards for online shopping use case
- **Option C:** Keep both but clearly distinguish use cases in UI/documentation

#### 2. **Incomplete Embedly Virtual Cards**
**Problem:** Webhook handlers and client functions exist, but no way for users to create/manage cards.

**Recommendation:**
- If keeping virtual cards, implement:
  - `/api/embedly/cards` endpoints (create, list, manage)
  - Frontend UI at `/my-account/virtual-cards`
  - Database migrations for `cards` and `card_transactions` tables
  - User documentation
- If removing, delete unused code:
  - `lib/embedly/client.ts` lines 656-726 (card functions)
  - `/app/api/embedly/webhooks/cards/route.ts`
  - Webhook event handlers

#### 3. **Missing Database Tables**
**Problem:** Webhook handlers reference `cards` and `card_transactions` tables that may not exist.

**Recommendation:**
- If tables don't exist, create migrations:
  ```sql
  -- supabase/migrations/create_embedly_virtual_cards.sql
  CREATE TABLE cards (...);
  CREATE TABLE card_transactions (...);
  ```
- Or remove webhook handlers if not using virtual cards

#### 4. **Embedly TAP API Configuration**
**Problem:** Using placeholder URL `https://api.embedly.com/tap/v1` (may not be actual endpoint).

**Recommendation:**
- Verify correct Embedly TAP API base URL
- Update `lib/embedly/tap-client.ts` line 6
- Add environment variable: `EMBEDLY_TAP_API_URL`

#### 5. **PIN Security**
**Problem:** Using SHA-256 for PIN hashing (not ideal for passwords).

**Recommendation:**
- Upgrade to bcrypt or argon2 for PIN hashing
- Example:
  ```typescript
  import bcrypt from 'bcryptjs';
  const cardPinHash = await bcrypt.hash(card_pin, 10);
  ```

#### 6. **Card Balance Source**
**Problem:** Wingside Tap Cards claim to share wallet balance, but balance is stored separately in card record.

**Recommendation:**
- Clarify architecture:
  - If sharing balance: Always fetch from Embedly wallet API, don't store on card
  - If separate balance: Update UI to reflect "Card Balance" vs "Wallet Balance"
- Current UI says "Same balance as your Wingside wallet" but card table has `balance` field

#### 7. **No Card Provisioning Workflow**
**Problem:** Cards must be pre-issued physically before users can link them.

**Recommendation:**
- Document card serial number generation/assignment process
- Create admin tool to:
  - Generate card serial numbers
  - Print cards with QR codes
  - Mark cards as "issued" vs "available"
  - Track card inventory

#### 8. **Webhook Security**
**Problem:** Webhook validation relies on optional environment variables that may not be configured.

**Recommendation:**
- Make `EMBEDLY_WEBHOOK_TOKEN` required for production
- Implement request signature validation if Embedly supports it
- Add IP allowlisting for production webhooks
- Log all webhook attempts for security monitoring

---

## Recommended Adjustments

### Immediate Actions (Priority 1)

1. **Decide on Card Strategy**
   ```bash
   # Choose ONE approach:

   # Option A: Keep only Wingside Tap Cards (recommended)
   - Remove Embedly virtual card code
   - Document current tap card system
   - Focus on improving tap card UX

   # Option B: Implement both systems
   - Complete virtual card implementation
   - Clearly differentiate in UI ("Tap Card" vs "Virtual Card")
   - Update documentation for both
   ```

2. **Verify TAP API Configuration**
   ```bash
   # Add to .env.production
   EMBEDLY_TAP_API_URL=https://actual-tap-api-url.embedly.ng
   EMBEDLY_TAP_API_KEY=your_tap_api_key_here
   ```

3. **Secure Webhook Endpoints**
   ```bash
   # Required environment variables
   EMBEDLY_WEBHOOK_TOKEN=generate_random_secure_token
   EMBEDLY_ALLOWED_IPS=ip1,ip2,ip3  # Get from Embedly docs
   ```

4. **Database Health Check**
   ```sql
   -- Verify required tables exist
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('wingside_cards', 'cards', 'card_transactions');
   ```

### Medium-Term Improvements (Priority 2)

5. **Upgrade PIN Security**
   ```typescript
   // Install bcrypt
   npm install bcryptjs
   npm install -D @types/bcryptjs

   // Update onboard route
   import bcrypt from 'bcryptjs';
   const cardPinHash = await bcrypt.hash(card_pin, 10);
   ```

6. **Add Card Admin Panel**
   - Create `/admin/wingside-cards` page
   - Features:
     - View all cards and statuses
     - Card serial generation tool
     - Manual card linking/unlinking
     - Transaction monitoring
     - Bulk card operations

7. **Improve Error Handling**
   ```typescript
   // Add retry logic for Embedly API calls
   // Add fallback for failed card onboarding
   // Implement transaction rollback on errors
   ```

8. **Add Card Analytics**
   - Track card usage metrics
   - Monitor transaction success rates
   - Alert on suspicious patterns
   - Generate card usage reports

### Long-Term Enhancements (Priority 3)

9. **Card QR Code System**
   - Generate QR codes for card serials
   - Allow scanning QR for instant linking
   - Print QR on physical cards

10. **Multi-Card Support** (if needed)
    - Remove ONE card per user constraint
    - Add card nicknames
    - Allow primary card selection
    - Card-specific spending limits

11. **Card Rewards Integration**
    - Earn extra points for card usage
    - Card-exclusive promotions
    - Streak bonuses for frequent card users

12. **Mobile Wallet Integration**
    - Apple Pay / Google Pay support
    - Virtual card provisioning
    - Push notifications for transactions

---

## Environment Variables Checklist

### Currently Required
```bash
# Embedly Core (for wallets)
EMBEDLY_API_KEY=your_api_key
EMBEDLY_BASE_URL=https://waas-prod.embedly.ng/api/v1
EMBEDLY_PAYOUT_URL=https://payout-prod.embedly.ng/api/Payout
EMBEDLY_CHECKOUT_URL=https://checkout-prod.embedly.ng
EMBEDLY_CARD_URL=https://waas-card-middleware-api-prod.embedly.ng
```

### Missing (TAP Cards)
```bash
# Embedly TAP API (for physical cards)
EMBEDLY_TAP_API_URL=<verify with Embedly>
EMBEDLY_TAP_API_KEY=<get from Embedly dashboard>
```

### Recommended (Security)
```bash
# Webhook Security
EMBEDLY_WEBHOOK_TOKEN=<generate random secure string>
EMBEDLY_ALLOWED_IPS=<get from Embedly support>
```

---

## Testing Checklist

### Wingside Tap Cards
- [ ] Card onboarding flow (new user)
- [ ] Duplicate card prevention (one per user)
- [ ] Card serial uniqueness validation
- [ ] PIN validation (4-6 digits)
- [ ] Card status updates (suspend/activate)
- [ ] Balance display accuracy
- [ ] Transaction recording
- [ ] Report lost/stolen flow
- [ ] Webhook handling for transactions

### Embedly Virtual Cards (if implementing)
- [ ] Card creation API
- [ ] Virtual vs physical card types
- [ ] Card limit setting
- [ ] Card blocking/freezing
- [ ] Card funding
- [ ] Webhook: card.management.updateInfo
- [ ] Webhook: card.transaction.atm
- [ ] Webhook: card.transaction.pos
- [ ] Card transaction history
- [ ] Multiple cards per user

---

## Code Cleanup Suggestions

### If keeping ONLY Wingside Tap Cards:

**Delete these files:**
```bash
app/api/embedly/webhooks/cards/route.ts
```

**Remove these functions from `lib/embedly/client.ts`:**
```typescript
// Lines 656-726
createCard()
getCards()
getCardDetails()
blockCard()
unblockCard()
freezeCard()
unfreezeCard()
fundCard()
updateCardLimit()
```

**Remove these interfaces from `lib/embedly/client.ts`:**
```typescript
// Lines 42-78
EmbedlyCard
CreateCardRequest
FundCardRequest
UpdateCardLimitRequest
```

### If implementing BOTH systems:

**Rename for clarity:**
```bash
# Current: wingside_cards → wingside_tap_cards
# Add: embedly_virtual_cards (new table)

# Update all references:
app/my-account/cards → app/my-account/tap-cards
app/api/wingside-card → app/api/tap-card
```

**Create new routes:**
```bash
app/api/embedly/cards/route.ts           # Create/list virtual cards
app/api/embedly/cards/[id]/route.ts      # Get/update specific card
app/api/embedly/cards/[id]/fund/route.ts # Fund card
app/my-account/virtual-cards/page.tsx    # User UI
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CUSTOMER                                │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Wingside Tap    │              │ Embedly Virtual  │        │
│  │     Card UI      │              │    Card UI       │        │
│  │  /my-account/    │              │  /my-account/    │        │
│  │     cards        │              │ virtual-cards    │        │
│  └────────┬─────────┘              └─────────┬────────┘        │
│           │                                   │                 │
└───────────┼───────────────────────────────────┼─────────────────┘
            │                                   │
            │ HTTP                              │ HTTP
            │                                   │
┌───────────▼───────────────────────────────────▼─────────────────┐
│                     WINGSIDE API SERVER                         │
│                                                                 │
│  ┌─────────────────────┐       ┌──────────────────────┐        │
│  │ /api/wingside-card/ │       │   /api/embedly/      │        │
│  │   • onboard         │       │     cards/           │        │
│  │   • status          │       │   • create           │        │
│  │   • balance         │       │   • fund             │        │
│  │   • history         │       │   • manage           │        │
│  │   • webhook         │       │                      │        │
│  └──────────┬──────────┘       └──────────┬───────────┘        │
│             │                              │                    │
│             │                              │                    │
│  ┌──────────▼──────────────────────────────▼───────────┐       │
│  │          lib/embedly/                               │       │
│  │    • tap-client.ts (TAP cards)                      │       │
│  │    • client.ts (Virtual cards + wallets)            │       │
│  └──────────┬──────────────────────────────┬───────────┘       │
└─────────────┼──────────────────────────────┼───────────────────┘
              │                              │
              │ HTTPS                        │ HTTPS
              │                              │
┌─────────────▼──────────────┐  ┌───────────▼────────────────────┐
│   Embedly TAP API          │  │  Embedly Card Middleware API   │
│   tap.embedly.ng           │  │  waas-card-middleware-api      │
│                            │  │                                │
│   • Card onboarding        │  │  • Issue virtual/physical      │
│   • Balance queries        │  │  • Card management             │
│   • Transaction history    │  │  • Spending limits             │
│   • Status updates         │  │  • Card controls               │
└────────────────────────────┘  └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                            │
│                                                                 │
│  ┌──────────────────────┐       ┌─────────────────────┐        │
│  │  wingside_cards      │       │   cards             │        │
│  │  (TAP cards)         │       │   (Virtual cards)   │        │
│  │                      │       │                     │        │
│  │  • card_serial       │       │   • card_id         │        │
│  │  • user_id           │       │   • masked_pan      │        │
│  │  • card_pin_hash     │       │   • wallet_id       │        │
│  │  • status            │       │   • balance         │        │
│  │  • max_debit         │       │   • type (V/P)      │        │
│  │  • total_spent       │       │   • status          │        │
│  └──────────────────────┘       └─────────────────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │           card_transactions                      │          │
│  │           (All card transactions)                │          │
│  │                                                  │          │
│  │  • card_id (FK to cards)                         │          │
│  │  • type (ATM, POS, CHECKOUT)                     │          │
│  │  • amount, currency                              │          │
│  │  • payment_reference                             │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

### What to do now:

1. **Review this analysis** and decide on card strategy (Tap only vs Both systems)

2. **Run database check:**
   ```sql
   -- Check if all tables exist
   SELECT * FROM wingside_cards LIMIT 1;
   SELECT * FROM cards LIMIT 1;
   SELECT * FROM card_transactions LIMIT 1;
   ```

3. **Verify environment variables:**
   ```bash
   # Check if TAP API is configured
   echo $EMBEDLY_TAP_API_URL
   echo $EMBEDLY_TAP_API_KEY
   ```

4. **Test Wingside Tap Card flow:**
   - Create test user
   - Generate test card serial
   - Link card via UI
   - Verify in database

5. **Choose one of the recommendations:**
   - **A:** Clean up unused virtual card code
   - **B:** Complete virtual card implementation
   - **C:** Keep both but improve documentation

---

## Questions to Answer

Before making adjustments, clarify:

1. **Do you want to support Embedly virtual cards?**
   - If YES → Need to complete implementation
   - If NO → Remove unused code

2. **What is the actual Embedly TAP API URL?**
   - Current placeholder may not work
   - Need real endpoint from Embedly

3. **How are physical cards currently distributed?**
   - Manual serial generation?
   - Pre-printed batch?
   - On-demand printing?

4. **Should card balance be separate or shared with wallet?**
   - Current UI says "shared"
   - Database structure suggests separate
   - Clarify intended behavior

5. **Do `cards` and `card_transactions` tables exist in production?**
   - If YES → Keep virtual card webhooks
   - If NO → Remove or create migrations

---

**End of Analysis**

Would you like me to help with any specific adjustments based on this analysis?
