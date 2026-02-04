# 🔧 Embedly Wallet Payment Error - Fix Guide

## The Issue

**Error**: "Failed to process wallet payment" (500 Internal Server Error)

**Root Cause**: You don't have an Embedly wallet created yet!

---

## ✅ Quick Fix

### Step 1: Check Your Wallet Status

Run this command while logged in:
```bash
curl https://www.wingside.ng/api/embedly/wallet-status \
  -H "Cookie: your-session-cookie"
```

Or visit: **My Account → Wallet Section**

### Step 2: Create Your Wallet

You need to call the auto-wallet creation endpoint:

```bash
# From your browser console (while logged in):
fetch('/api/embedly/auto-wallet', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log(data))
```

**Or we can add a "Create Wallet" button to your account page.**

### Step 3: Fund Your Wallet

Once created, you'll get a virtual bank account. Transfer funds to it:
- **Bank**: Sterling Bank (or other supported bank)
- **Account Number**: Provided after wallet creation
- **Account Name**: Your name

### Step 4: Pay with Wallet

After funding, you can pay for orders with your wallet balance!

---

## 🔍 What's Happening

### The Problem Flow

1. You try to pay with wallet
2. System checks for `embedly_wallet_id` in your profile
3. **Not found** → Returns 500 error (should be 400, but that's a bug)

### What Should Happen

1. **Before paying**: Create wallet (one-time setup)
2. **Auto-wallet endpoint**: Creates customer + wallet in Embedly
3. **Virtual account**: You get bank account number
4. **Fund wallet**: Transfer money to virtual account
5. **Pay**: Use wallet balance for orders

---

## 🛠️ Technical Details

### Required Environment Variables

Check if these are set:
```bash
# Check your environment
vercel env ls | grep EMBEDLY
```

**Required:**
- ✅ `EMBEDLY_API_KEY` - Should be set
- ❓ `EMBEDLY_ORG_ID` - **MUST BE SET** for auto-wallet creation
- ✅ `EMBEDLY_MERCHANT_WALLET_ID` - Already set correctly

### Missing: EMBEDLY_ORG_ID

This is **required** to create customers and wallets!

**To fix:**

1. Get your Organization ID from Embedly Dashboard
2. Add to environment:
   ```bash
   vercel env add EMBEDLY_ORG_ID production
   # Paste your organization ID
   ```

3. Redeploy:
   ```bash
   vercel --prod
   ```

---

## 📝 For Developers: Auto-Create Wallet on Payment

Let's modify the wallet-payment endpoint to auto-create wallet if missing:

### Option 1: Create Wallet Before Payment

```typescript
// In wallet-payment/route.ts, add this after line 72:

if (!profile.embedly_wallet_id) {
  // Auto-create wallet
  const autoWalletResponse = await fetch('/api/embedly/auto-wallet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || ''
    }
  });

  if (!autoWalletResponse.ok) {
    return NextResponse.json({
      error: 'Wallet not found. Please create a wallet first.',
      details: 'Go to My Account to create your wallet'
    }, { status: 400 });
  }

  // Refresh profile data
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('embedly_wallet_id')
    .eq('id', user.id)
    .single();

  if (updatedProfile?.embedly_wallet_id) {
    profile.embedly_wallet_id = updatedProfile.embedly_wallet_id;
  }
}
```

### Option 2: Better Error Message

```typescript
// Replace line 66-71 in wallet-payment/route.ts:

if (!profile.embedly_wallet_id) {
  return NextResponse.json({
    error: 'Wallet not found',
    message: 'You need to create a wallet before you can pay with it',
    actionRequired: 'CREATE_WALLET',
    nextSteps: [
      '1. Go to My Account',
      '2. Click "Create Wallet"',
      '3. Fund your wallet via bank transfer',
      '4. Return to complete your payment'
    ],
    createWalletEndpoint: '/api/embedly/auto-wallet'
  }, { status: 400 });
}
```

---

## 🎯 Recommended Action Plan

### For Immediate Fix (User):

1. **Create wallet manually**:
   - Log into your account
   - Call `POST /api/embedly/auto-wallet`
   - Note your virtual account number

2. **Fund wallet**:
   - Transfer funds to virtual account
   - Wait for confirmation

3. **Retry payment**:
   - Go back to checkout
   - Select wallet payment
   - Complete order

### For Long-term Fix (Developer):

1. **Add "Create Wallet" button** to account page
2. **Auto-create wallet** when user selects wallet payment
3. **Show wallet balance** at checkout
4. **Better error messages** guiding users

---

## 🔧 Checklist

Before wallet payments can work:

- [ ] `EMBEDLY_API_KEY` configured ✅
- [ ] `EMBEDLY_ORG_ID` configured ❓ **CHECK THIS**
- [ ] `EMBEDLY_MERCHANT_WALLET_ID` configured ✅
- [ ] User has `embedly_customer_id` in profile
- [ ] User has `embedly_wallet_id` in profile
- [ ] User wallet is active
- [ ] User wallet has sufficient balance

---

## 🚨 Most Likely Issue

**EMBEDLY_ORG_ID is missing!**

Check:
```bash
vercel env ls | grep EMBEDLY_ORG_ID
```

If not set:
1. Get Org ID from Embedly Dashboard
2. Add to environment
3. Redeploy
4. Try creating wallet again

---

## 💡 How to Test

Once wallet is created:

```bash
# 1. Check wallet status
curl https://www.wingside.ng/api/embedly/wallet-status

# 2. Check wallet balance
curl https://www.wingside.ng/api/embedly/wallet-check

# 3. Test with small amount first
# Create an order for ₦50 and try wallet payment
```

---

## Need Help?

1. Check wallet status: `/api/embedly/wallet-status`
2. Check system diagnostics: `/api/embedly/test`
3. Check Embedly dashboard for customer/wallet status
4. Review server logs for detailed error messages

---

## Summary

**Issue**: No wallet created yet  
**Fix**: Create wallet via `/api/embedly/auto-wallet`  
**Blocker**: Missing `EMBEDLY_ORG_ID` environment variable  
**Time to fix**: ~5 minutes (once Org ID is obtained)

Would you like me to:
1. Add auto-create wallet to the payment flow?
2. Add a "Create Wallet" button to your account page?
3. Help you get the `EMBEDLY_ORG_ID`?
