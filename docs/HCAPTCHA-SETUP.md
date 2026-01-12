# Quick Start: hCaptcha (NO DNS Changes Required!)

## What is hCaptcha?

hCaptcha is a **FREE** CAPTCHA service that:
- ✅ Requires **ZERO DNS changes**
- ✅ Works immediately
- ✅ Privacy-focused
- ✅ Pays websites to use it (you can earn money!)
- ✅ Drop-in replacement for reCAPTCHA

## Step 1: Get hCaptcha Keys (2 minutes)

1. Go to https://www.hcaptcha.com/
2. Click **"Sign Up"** (top right)
3. Fill in your info (email, password)
4. Verify your email
5. Click **"Register a new site"**
6. Fill in:
   - **Site Key**: Any name (e.g., "Wingside Production")
   - **Site URL**: `https://your-site.com` (or `localhost` for testing)
   - **Checkbox**: ✅ Check "Submit Form on success"
7. Click **"Register"**
8. **Copy your keys:**
   - **Site Key** (starts with `0x...`)
   - **Secret Key** (starts with `0x...`)

## Step 2: Add to Environment Variables

Create or update `.env.local`:

```bash
# hCaptcha (FREE, no DNS changes needed!)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=0xYourSiteKeyHere
HCAPTCHA_SECRET_KEY=0xYourSecretKeyHere
```

## Step 3: Update Signup Page

Change the CAPTCHA component in `app/(auth)/signup/page.tsx`:

**Find this line:**
```tsx
import Turnstile from '@/components/Turnstile';
```

**Change to:**
```tsx
import { Hcaptcha } from '@/components/Hcaptcha';
```

**Find the Turnstile component:**
```tsx
<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
  onSuccess={setCaptchaToken}
  ...
/>
```

**Change to:**
```tsx
<Hcaptcha
  siteKey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
  onSuccess={setCaptchaToken}
  onError={() => {
    setError('CAPTCHA verification failed. Please try again.');
    setCaptchaToken(null);
  }}
  onExpire={() => {
    setCaptchaToken(null);
  }}
  theme="light"
/>
```

**Update the verification URL:**

**Find:**
```tsx
const verifyResponse = await fetch('/api/captcha/verify', {
```

**Change to:**
```tsx
const verifyResponse = await fetch('/api/hcaptcha/verify', {
```

## Step 4: Test It!

1. Restart your dev server: `npm run dev`
2. Go to `/signup`
3. You should see an hCaptcha checkbox
4. Test submitting the form
5. Done!

## How hCaptcha Compares

| Feature | hCaptcha | Cloudflare Turnstile |
|---------|----------|---------------------|
| **DNS Changes Required** | ❌ NO | ❌ NO |
| **Setup Time** | 2 min | 2 min |
| **Free Tier** | 1M requests/month | 1M requests/month |
| **User Experience** | Good (checkbox) | Better (invisible) |
| **Privacy** | ✅ Privacy-first | ✅ Privacy-first |
| **Earn Money** | ✅ Yes! | ❌ No |
| **Bot Detection** | Excellent | Excellent |

## Why hCaptcha Might Be Better for You

1. **NO DNS confusion** - Just copy keys and go
2. **You can earn money** - hCaptcha pays sites that use it
3. **More familiar** - Traditional checkbox style
4. **Great documentation** - Easy to troubleshoot

## Optional: Use Both!

You can actually use **both** on different pages:
- hCaptcha on signup (familiar to users)
- Turnstile on login (invisible, faster)

## Troubleshooting

### "Invalid site key" error
- Make sure you copied the right key from hCaptcha dashboard
- Check your `.env.local` file

### "Verification failed" error
- Make sure you added the secret key (not site key)
- Check server logs for details

### CAPTCHA not showing
- Check browser console for errors
- Make sure hCaptcha script is loading
- Try clearing browser cache

## Need Help?

- hCaptcha Docs: https://docs.hcaptcha.com/
- hCaptcha Support: https://www.hcaptcha.com/contact

## Switching Back to Turnstile (If You Want)

If you want to try Turnstile later, just reverse the changes above. Both services work great!
