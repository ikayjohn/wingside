# Email Referral Sharing - Testing Guide

## ✅ What Was Implemented

Email referral sharing is now fully functional. Users can send beautifully designed referral invitation emails directly from the dashboard.

### Features
- **Professional Email Template**: Wingside-branded HTML email
- **Referral Code Display**: Prominently shows the unique referral code
- **Working Signup Link**: Direct link to signup page with ref parameter
- **Custom Messages**: Users can add personal messages
- **Benefits Listed**: Shows ₦1,000 bonus, 15 points, flavors, etc.
- **Success/Error Feedback**: Clear UI indicators
- **Share Tracking**: Logs all email shares in database

## 🧪 Testing Methods

### Method 1: Manual UI Test (Recommended)

1. **Start the app**
   ```bash
   npm run dev
   ```

2. **Login to your account**
   - Go to http://localhost:3000
   - Login with your credentials

3. **Navigate to Dashboard**
   - Go to "My Account" → "Dashboard"
   - Find the "Refer & Earn" section

4. **Send Test Email**
   - Click "Share Referral" button
   - Select "Email" option (📧)
   - Enter recipient email (use your own email for testing)
   - Optionally add custom message
   - Click "Share"

5. **Verify**
   - ✓ Success message appears
   - ✓ Modal closes after 2 seconds
   - ✓ Check recipient inbox for email

### Method 2: API Test

1. **Get Session Token**
   - Login to the app
   - Open DevTools (F12)
   - Go to Application > Cookies
   - Find and copy session token

2. **Test API Directly**
   ```bash
   curl -X POST http://localhost:3000/api/referrals/share \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie-here" \
     -d '{
       "shareMethod": "email",
       "recipientEmail": "test@example.com",
       "customMessage": "Hey! You should try Wingside!"
     }'
   ```

3. **Expected Response**
   ```json
   {
     "success": true,
     "referralLink": "https://www.wingside.ng/signup?ref=ABC123",
     "referralCode": "ABC123",
     "messages": { ... }
   }
   ```

### Method 3: Database Verification

1. **Check referral_shares table**
   ```sql
   SELECT * FROM referral_shares
   WHERE share_method = 'email'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Verify fields**
   - `user_id`: User who sent the referral
   - `share_method`: Should be 'email'
   - `recipient_email`: Email address
   - `custom_message`: Optional message
   - `referral_code_used`: User's referral code
   - `created_at`: Timestamp

## 📧 Email Content Verification

When you receive the test email, verify it contains:

### Header Section
- ✓ Wingside logo/branding
- ✓ "You've Been Invited!" headline
- ✓ Referrer's name

### Main Content
- ✓ Personal greeting
- ✓ Referrer's name mentioned
- ✓ Custom message (if provided)

### Benefits Section
All four benefits displayed:
- ✓ ₦1,000 Welcome Bonus
- ✓ 15 Bonus Points
- ✓ 20+ Amazing Flavors
- ✓ Fast Delivery

### Referral Code
- ✓ Clearly displayed code (e.g., ABC123)
- ✓ Easy to copy

### Call-to-Action
- ✓ "Join Wingside & Get ₦1,000" button
- ✓ Button links to signup page
- ✓ Referral link shown as text alternative

### Footer
- ✓ Social media links
- ✓ Contact email
- ✓ Copyright notice
- ✓ Unsubscribe context

## 🔗 Link Testing

Click the referral link in the email and verify:

1. **URL Format**
   ```
   https://www.wingside.ng/signup?ref=ABC123
   ```

2. **Signup Page**
   - Page loads correctly
   - Referral code pre-filled (if signup page supports it)
   - User can complete signup

3. **Referral Tracking**
   - After signup, check `referrals` table
   - Should have record with `referred_user_id`
   - Status should be `signed_up`

## ✅ Success Criteria

- [ ] Email sends successfully (no errors)
- [ ] Email arrives in inbox (not spam)
- [ ] Email displays correctly (HTML rendering)
- [ ] All sections visible and formatted
- [ ] Referral code displayed correctly
- [ ] Links are clickable and work
- [ ] Custom message appears (if provided)
- [ ] Share logged in database
- [ ] Success message shown in UI
- [ ] No console errors

## 🐛 Troubleshooting

### Email Not Sending

**Check RESEND_API_KEY**
```bash
# .env.local should have:
RESEND_API_KEY=re_your_key_here
```

**Verify in logs**
```bash
# Look for:
✅ Referral email sent successfully to test@example.com

# Or error:
❌ Failed to send referral email: ...
```

### Email in Spam

- Check sender domain verification in Resend
- Add SPF/DKIM records
- Use verified sending domain

### Link Not Working

- Verify NEXT_PUBLIC_APP_URL is set correctly
- Check referral code in database
- Test ref parameter handling in signup page

### Custom Message Not Showing

- Ensure message is not empty string
- Check API payload includes customMessage
- Verify email template renders message block

## 📊 Production Checklist

Before deploying to production:

- [ ] RESEND_API_KEY set in production env
- [ ] FROM_EMAIL domain verified in Resend
- [ ] SPF/DKIM records configured
- [ ] Test email sends from production
- [ ] Test email arrives and displays correctly
- [ ] Links point to correct production domain
- [ ] referral_shares table exists
- [ ] Share tracking works
- [ ] Error handling tested
- [ ] Rate limiting configured (if needed)

## 🎯 Test Scenarios

### Scenario 1: Basic Email Send
1. User sends email with just recipient address
2. No custom message
3. Verify default message appears

### Scenario 2: Custom Message
1. User sends email with custom message
2. Verify custom message appears in email
3. Verify formatting is correct

### Scenario 3: Multiple Sends
1. Send to 3 different recipients
2. Verify all 3 emails sent
3. Check database has 3 records

### Scenario 4: Invalid Email
1. Enter invalid email format
2. Verify validation works
3. Clear error message shown

### Scenario 5: Error Handling
1. Temporarily disable Resend API key
2. Try to send email
3. Verify error message shown
4. Verify user can retry

## 📝 Sample Test Data

```javascript
// Test Case 1: Basic
{
  "recipientEmail": "friend1@example.com"
}

// Test Case 2: With Message
{
  "recipientEmail": "friend2@example.com",
  "customMessage": "I've been enjoying Wingside for months! You'll love the Suya Spice flavor."
}

// Test Case 3: Long Message
{
  "recipientEmail": "friend3@example.com",
  "customMessage": "Hey! I wanted to share this amazing chicken wing place with you. They have over 20 flavors and the quality is incredible. Use my referral code and you'll get ₦1,000 after your first order. Trust me, you won't regret it!"
}
```

## 🎉 Success!

If all tests pass, email referral sharing is working correctly!

Users can now:
- Share referrals via email directly from dashboard
- Add personal messages to invitations
- Track which friends they've invited
- Recipients get beautiful, branded emails
- Links work seamlessly for signup
