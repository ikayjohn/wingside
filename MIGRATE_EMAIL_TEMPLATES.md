# Migrate Email Templates to Database

## ✅ What Changed

All email templates are now **database-driven and fully editable** through the admin UI!

Instead of hard-coded HTML in `lib/emails/service.ts`, emails now:
- Pull templates from the `email_templates` database table
- Support `{{variable}}` syntax for dynamic content
- Support conditional blocks `{{#customMessage}}...{{/customMessage}}`
- Can be edited visually in `/admin/notifications` → Email Templates tab

## 🚀 Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to** https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. **Copy** the contents of `supabase/migrations/20260124_add_transactional_email_templates.sql`
3. **Paste** into the SQL editor
4. **Click** "Run"
5. **Verify** - You should see "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd /c/Users/ikayj/Documents/wingside

# Run the migration
supabase db push

# Or run the specific file
supabase db execute < supabase/migrations/20260124_add_transactional_email_templates.sql
```

## 📧 Templates Added

The migration adds 5 templates:

| Template Key | Name | Description |
|---|---|---|
| `referral_invitation` | Referral Invitation | Sent when users share referral codes |
| `order_confirmation` | Order Confirmation | Sent when customer places order |
| `payment_confirmation` | Payment Confirmation | Sent when payment succeeds |
| `order_notification_admin` | Order Notification (Admin) | Sent to admin for new orders |
| `contact_notification` | Contact Form Notification | Sent when contact form submitted |

## ✏️ How to Edit Templates

1. **Go to** `/admin/notifications`
2. **Click** "Email Templates" tab
3. **Select** a template from the list
4. **Edit** the subject and HTML content
5. **Use** the variable buttons to insert {{variables}}
6. **Click** "Preview" to see how it looks
7. **Click** "Save Changes"

## 🔧 Template Variables

Each template has specific variables you can use:

### Referral Invitation
- `{{referrerName}}` - Name of person sending referral
- `{{referralCode}}` - Unique referral code
- `{{referralLink}}` - Full signup link with code
- `{{customMessage}}` - Optional personal message

### Order Confirmation
- `{{orderNumber}}` - Order number (e.g., WS12345)
- `{{customerName}}` - Customer's name
- `{{status}}` - Order status
- `{{trackingLink}}` - Link to track order

### Payment Confirmation
- `{{orderNumber}}` - Order number
- `{{customerName}}` - Customer's name
- `{{amount}}` - Payment amount (formatted)

### Order Notification (Admin)
- `{{orderNumber}}` - Order number
- `{{total}}` - Order total (formatted)
- `{{customerName}}` - Customer's name
- `{{customerEmail}}` - Customer's email
- `{{customerPhone}}` - Customer's phone
- `{{adminLink}}` - Link to view in admin

### Contact Form Notification
- `{{formType}}` - Type of form submission
- `{{name}}` - Submitter's name
- `{{email}}` - Submitter's email
- `{{message}}` - Message content

## 🎨 Conditional Blocks

You can show/hide content based on variables:

```html
{{#customMessage}}
<div class="message">
  <p><strong>Personal Message:</strong></p>
  <p>"{{customMessage}}"</p>
</div>
{{/customMessage}}
```

This will only show if `customMessage` has a value.

## ✅ Verify Migration

After running the migration:

1. **Check Database**
   ```sql
   SELECT template_key, name, is_active FROM email_templates;
   ```
   Should return 5 rows.

2. **Check Admin UI**
   - Go to `/admin/notifications` → Email Templates
   - You should see 5 templates listed
   - Click each one to verify HTML content loaded

3. **Test Referral Email**
   - Go to `/admin/notifications` → Dashboard
   - Click "Send Test Email"
   - Or use the existing referral sharing feature
   - Verify email uses database template

## 🔄 How It Works

### Before (Hard-Coded)
```typescript
const html = `
  <html>
    <body>
      <h1>You've Been Invited!</h1>
      <p>Hello ${referrerName}...</p>
    </body>
  </html>
`;
```

### After (Database-Driven)
```typescript
// Fetches template from database
// Replaces {{referrerName}} with actual value
// Sends email
return sendTemplatedEmail('referral_invitation', email, { referrerName });
```

## 📝 Template Editing Tips

1. **Preview First**: Always preview before saving
2. **Use Variables**: Click variable buttons to insert them
3. **Test After Editing**: Send a test email to yourself
4. **Keep Backup**: Database tracks changes via updated_at
5. **Brand Colors**: Use #F7C400 (yellow) and #552627 (brown)

## 🐛 Troubleshooting

### Template Not Found Error
**Issue**: Email functions can't find template
**Fix**: Run the migration - templates aren't in database yet

### Variables Not Replacing
**Issue**: Email shows {{variable}} instead of value
**Fix**: Check variable name matches exactly (case-sensitive)

### Conditional Blocks Not Working
**Issue**: {{#var}}...{{/var}} always shows or never shows
**Fix**:
- Variable must exist in variables object
- Empty string/null/undefined = hidden
- Any other value = shown

### Styling Broken
**Issue**: Email looks plain or unstyled
**Fix**: HTML emails require inline styles. Use the `<style>` tag in `<head>`.

## 🎉 Benefits

**For Admins:**
- ✅ Edit emails without touching code
- ✅ Visual preview before sending
- ✅ No deployment needed for changes
- ✅ Consistent branding across all emails

**For Developers:**
- ✅ Cleaner code (no HTML in TypeScript)
- ✅ Single source of truth (database)
- ✅ Easy to add new templates
- ✅ Version control through database

**For Users:**
- ✅ Better looking emails
- ✅ Consistent experience
- ✅ Faster template updates

## 🚀 Next Steps

1. **Run the migration** (see above)
2. **Verify** templates appear in admin
3. **Test** referral email still works
4. **Customize** templates to your liking
5. **Send** test emails to verify changes

---

**Status**: Ready to migrate
**Migration File**: `supabase/migrations/20260124_add_transactional_email_templates.sql`
**Affected Tables**: `email_templates`
