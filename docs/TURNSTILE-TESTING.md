# Turnstile Testing & Monitoring Guide

## ✅ Setup Complete!

Your Turnstile CAPTCHA is now configured and ready to use.

## 🧪 Testing Checklist

### 1. Test the Signup Flow

```bash
# Start your dev server
npm run dev
```

1. Navigate to: http://localhost:3000/signup
2. You should see:
   - ✅ All form fields (Name, Email, Phone, Password)
   - ✅ Turnstile CAPTCHA widget (usually a checkbox or invisible challenge)
   - ✅ "Create Account" button disabled until CAPTCHA is verified

3. Test Scenarios:

   **Test A: Valid Submission**
   - Fill in all fields with valid info
   - Complete CAPTCHA
   - Click "Create Account"
   - ✅ Should show: "Account created successfully!"

   **Test B: Missing CAPTCHA**
   - Fill in all fields
   - Don't complete CAPTCHA
   - Try to submit
   - ✅ Button should be disabled

   **Test C: Invalid Email**
   - Use: `test@invalid`
   - Complete CAPTCHA
   - ✅ Should show: "Invalid email"

   **Test D: Passwords Don't Match**
   - Use different passwords
   - Complete CAPTCHA
   - ✅ Should show: "Passwords do not match"

### 2. Test Rate Limiting

```bash
# Run this to test rate limiting
for i in {1..7}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/captcha/verify \
    -H "Content-Type: application/json" \
    -d '{"token":"test"}'
  echo ""
done
```

Expected results:
- Attempts 1-5: Should process (even if token is invalid)
- Attempts 6-7: Should show rate limit error

### 3. Test Honeypot

```bash
# Try to submit with honeypot filled (simulates bot)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User",
    "phone": "+2348000000000",
    "website": "http://spam.com"
  }'
```

Expected: Should be rejected (bot detected)

## 📊 Monitoring Your Spam Prevention

### Check Server Logs

Look for these log messages:

```bash
# Success logs
✅ "Turnstile verification successful"
✅ "Contact notification email sent successfully"

# Spam prevention logs
⚠️ "Potential injection attack detected"
⚠️ "Honeypot validation failed"
⚠️ "Too many requests" (rate limit hit)

# Error logs
❌ "Turnstile verification failed"
❌ "Captcha verification failed"
```

### Metrics to Watch

1. **Signup Success Rate**
   - Normal: 60-80% completion rate
   - Concerning: <20% (too strict)
   - Concerning: >95% (too lenient)

2. **CAPTCHA Failure Rate**
   - Normal: 5-10% fail rate
   - High failure: Users struggling with CAPTCHA

3. **Rate Limit Blocks**
   - Monitor how many IPs get blocked
   - Check if legitimate users are blocked

4. **Honeypot Catches**
   - Should catch basic bots
   - If 0 catches: May not be working

## 🔍 Troubleshooting

### CAPTCHA Not Showing

**Symptoms:** No CAPTCHA widget on page

**Solutions:**
```bash
# 1. Check browser console for errors
# Open DevTools → Console tab

# 2. Verify script is loading
# Look for: challenges.cloudflare.com

# 3. Check your environment variables
echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY
```

**Common fixes:**
- Clear browser cache
- Restart dev server: `npm run dev`
- Check Site Key is correct (starts with `0x...`)

### "Verification Failed" Error

**Symptoms:** CAPTCHA completes but submission fails

**Solutions:**
```bash
# 1. Check server logs
# Look for: "Turnstile verification failed"

# 2. Verify secret key
# Make sure you're using SECRET key (not SITE key)

# 3. Test verification endpoint directly
curl -X POST http://localhost:3000/api/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
```

### Rate Limit Too Aggressive

**Symptoms:** Legitimate users getting blocked

**Solutions:**
```typescript
// In lib/rate-limit.ts, adjust these:
auth: {
  limit: 10,        // Increase from 5 to 10
  window: 15 * 60 * 1000,
  blockDuration: 30 * 60 * 1000, // Reduce from 1 hour to 30 min
}
```

## 📈 Next Steps

### Week 1: Monitor Daily
- [ ] Check signup completion rate
- [ ] Monitor CAPTCHA success rate
- [ ] Review blocked IPs
- [ ] Check for false positives

### Week 2: Adjust If Needed
- [ ] Lower rate limits if too many blocks
- [ ] Increase if too much spam gets through
- [ ] A/B test CAPTCHA position

### Week 3: Expand to Other Forms
- [ ] Add to login page
- [ ] Add to contact form
- [ ] Add to newsletter signup
- [ ] Add to partnership form

### Week 4: Optimize
- [ ] Set up analytics dashboard
- [ ] Create alerts for high spam rates
- [ ] Document what works
- [ ] Share results with team

## 🎯 Success Indicators

Your spam prevention is working if you see:

✅ **Decreased spam signups**
✅ **Stable/better user signup rate**
✅ **No increase in support tickets**
✅ **Clean database (no fake accounts)**
✅ **Rate limits catching abuse**

## 🆘 Need Help?

**Common Issues:**
1. CAPTCHA not loading → Check browser console
2. Verification failing → Check secret key
3. Users blocked → Adjust rate limits
4. Still getting spam → Add more layers

**Resources:**
- Turnstile docs: https://developers.cloudflare.com/turnstile/
- Rate limiting: Check `lib/rate-limit.ts`
- Honeypot: Check `lib/honeypot.ts`

## 📝 Quick Reference

**Environment Variables:**
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...  # Public
TURNSTILE_SECRET_KEY=0x...             # Private (keep secret!)
```

**Key Files:**
- Component: `components/Turnstile.tsx`
- Verification: `app/api/captcha/verify/route.ts`
- Rate Limit: `lib/rate-limit.ts`
- Honeypot: `components/HoneypotField.tsx`

**Test Commands:**
```bash
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
```

---

**You're all set!** 🎉 Your signup form is now protected against spam with multiple layers of defense.
