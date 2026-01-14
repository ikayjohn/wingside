# How to Connect Resend to Supabase for Password Reset Emails

## Step 1: Get Your Resend SMTP Credentials

1. Go to https://resend.com/api-keys
2. Create an API key or find your existing one
3. You'll need:
   - SMTP Host: smtp.resend.com
   - SMTP Port: 587 (or 465 for SSL)
   - SMTP Username: resend
   - SMTP Password: Your Resend API Key

## Step 2: Configure Supabase to Use Resend

1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/settings/auth
2. Scroll to **"SMTP Settings"** section
3. Click **"Enable Custom SMTP"**
4. Enter these settings:
   - **Sender email**: Your verified Resend domain email (e.g., noreply@wingside.ng)
   - **Sender name**: Wingside
   - **SMTP Host**: smtp.resend.com
   - **SMTP Port**: 587
   - **SMTP User**: resend
   - **SMTP Password**: Your Resend API Key
   - **SMTP Max Frequency**: Leave default
5. Click **"Save"**

## Step 3: Verify Email Domain in Resend

1. Go to https://resend.com/domains
2. Ensure your domain (wingside.ng) is verified
3. Note: You can use Resend's default @resend.com for testing

## Step 4: Test Password Reset

After configuring:

1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/auth/templates
2. Find "Reset Password" template
3. Ensure it's enabled
4. Test by going to your forgot password page and entering your email
5. Check the email arrives

## Quick Test Script

Run this to test after configuration:

```bash
node scripts/test-resend-smtp.js
```

## Troubleshooting

### "Email not sent"
- Check Resend API key is valid
- Verify sender email is verified in Resend
- Check SMTP settings in Supabase are saved

### "Invalid sender email"
- Verify your domain in Resend: https://resend.com/domains
- Or use noreply@yourdomain.resend.com (Resend's default)

### "Rate limit exceeded"
- Resend free tier: 100 emails/day
- Check your usage: https://resend.com/api-keys

### No error but no email
- Check spam folder
- Verify Resend dashboard: https://resend.com/logs
- Check sender email matches verified domain
