# Contact Forms Testing Checklist

## Test Date: 2026-02-15

All forms have been updated with bot protection (honeypot + timing). Test each form to ensure they submit successfully.

---

## ✅ Forms to Test

### 1. WingConnect Form
**URL:** http://localhost:3000/connect
**Form Location:** Bottom of page (scroll down or click "Join the movement")

**Test Steps:**
1. Fill in Full Name (e.g., "Test User")
2. Fill in Email (e.g., "test@example.com")
3. Leave Phone Number blank (optional field)
4. Select an interest from dropdown
5. Click "Join Now"
6. **Expected:** Success message + redirect to WhatsApp group

**What to Check:**
- ❌ Should NOT show "invalid request" error
- ✅ Should show success message
- ✅ Form should reset after submission
- ✅ WhatsApp group should open in new tab

---

### 2. Hotspots Form
**URL:** http://localhost:3000/hotspots
**Form Location:** Click "Become a Wingside Hotspot" button

**Test Steps:**
1. Click the main CTA button
2. Modal form should appear
3. Fill in Business Name
4. Fill in Contact Name
5. Fill in Email
6. Fill in Phone
7. Select Business Type
8. Add optional message
9. Click "Submit Application"

**Expected:** Success message confirming submission

---

### 3. Sports Events Form
**URL:** http://localhost:3000/sports
**Form Location:** Bottom of page

**Test Steps:**
1. Scroll to "Join the Crew" form
2. Fill in all required fields
3. Select interest
4. Submit form

**Expected:** Success message

---

### 4. Business - Catering
**URL:** http://localhost:3000/business/catering
**Form Location:** Bottom of page

**Test Steps:**
1. Fill in company name
2. Fill in contact details
3. Add message about catering needs
4. Submit

**Expected:** Success confirmation

---

### 5. Business - Meetings
**URL:** http://localhost:3000/business/meetings
**Form Location:** Bottom of page

**Test Steps:**
1. Fill in meeting room inquiry form
2. Submit

**Expected:** Success confirmation

---

### 6. Business - Office Lunch
**URL:** http://localhost:3000/business/officelunch
**Form Location:** Bottom of page

**Test Steps:**
1. Fill in office lunch inquiry
2. Submit

**Expected:** Success confirmation

---

### 7. Business - Wingpost
**URL:** http://localhost:3000/business/wingpost
**Form Location:** Bottom of page

**Test Steps:**
1. Fill in Wingpost partnership form
2. Submit

**Expected:** Success confirmation

---

## 🔍 What to Verify for Each Form

### Success Criteria:
- ✅ Form submits without "invalid request" error
- ✅ Success message displays
- ✅ Form resets after successful submission
- ✅ No console errors in browser DevTools
- ✅ Submission appears in admin panel (contact_submissions table)

### Things to Check:
1. **Honeypot field** is hidden (you shouldn't see a "website" field)
2. **Phone number** can be left blank (optional)
3. **Email validation** works (try invalid email)
4. **Form timing** allows submission after 2+ seconds
5. **CSRF token** is automatically included

---

## 🐛 Common Issues to Watch For

### If "Invalid Request" Still Appears:
1. Check browser console for errors
2. Verify CSRF token is being sent
3. Check network tab in DevTools → Request Payload
4. Ensure `website` field is empty (honeypot check)
5. Ensure `_formStartTime` is included

### If Form Doesn't Submit:
1. Check required field validations
2. Look for JavaScript errors in console
3. Verify API endpoint is responding (check Network tab)

---

## 📊 Testing Results

| Form | Status | Notes |
|------|--------|-------|
| WingConnect | ⏳ Pending | |
| Hotspots | ⏳ Pending | |
| Sports | ⏳ Pending | |
| Business - Catering | ⏳ Pending | |
| Business - Meetings | ⏳ Pending | |
| Business - Office Lunch | ⏳ Pending | |
| Business - Wingpost | ⏳ Pending | |

---

## 🎯 Quick Test Command

```bash
# Start dev server if not running
npm run dev

# Open browser to test each form
start http://localhost:3000/connect
start http://localhost:3000/hotspots
start http://localhost:3000/sports
start http://localhost:3000/business/catering
start http://localhost:3000/business/meetings
start http://localhost:3000/business/officelunch
start http://localhost:3000/business/wingpost
```

---

## ✅ After All Tests Pass

1. Mark this commit as tested: `git tag tested-forms-2026-02-15`
2. Push to production: `git push origin main`
3. Test on live site
4. Monitor contact_submissions table for new entries
