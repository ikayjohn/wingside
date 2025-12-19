# Zoho CRM API Setup Guide 🔐

**Complete walkthrough to get your Zoho CRM API credentials**

---

## 📋 What You'll Get

By the end of this guide, you'll have:
- ✅ `ZOHO_CLIENT_ID`
- ✅ `ZOHO_CLIENT_SECRET`
- ✅ `ZOHO_REFRESH_TOKEN`

**Time Required:** ~15-20 minutes

---

## Step 1: Create Zoho CRM Account

### **1.1 Sign Up for Zoho CRM**

1. Go to: **https://www.zoho.com/crm/**
2. Click **"Sign Up for Free"**
3. Choose your region:
   - **United States** → `https://www.zohoapis.com`
   - **Europe** → `https://www.zohoapis.eu`
   - **India** → `https://www.zohoapis.in`
   - **Australia** → `https://www.zohoapis.com.au`
   - **China** → `https://www.zohoapis.com.cn`

   **⚠️ IMPORTANT:** Remember your region! You'll need it later.

4. Fill in:
   - Email
   - Password
   - Company Name: "Wingside" (or your restaurant name)
   - Number of employees: Select appropriate option
   - Your role: "Owner" or "Administrator"

5. Verify email and complete signup

### **1.2 Access Zoho CRM Dashboard**

1. Login to: **https://crm.zoho.com**
2. You should see the CRM dashboard
3. **Note:** Free plan includes up to 3 users and 5,000 records

---

## Step 2: Create OAuth Client

### **2.1 Go to Zoho API Console**

1. Open: **https://api-console.zoho.com/**
2. Click **"Get Started"** or **"Add Client"**

### **2.2 Register Your Application**

1. **Client Type:** Select **"Server-based Applications"**

2. **Fill in the form:**

   **Client Name:**
   ```
   Wingside Integration
   ```

   **Homepage URL:**
   ```
   http://localhost:3000
   ```

   **Authorized Redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback
   ```

   _(Add this URI - you can add multiple, separated by commas)_

3. Click **"Create"**

### **2.3 Get Client ID & Secret**

After creation, you'll see:

```
Client ID: 1000.XXXXXXXXXXXXXXXXXXXXXX
Client Secret: YYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

**✅ Save these!** You'll need them in Step 4.

---

## Step 3: Generate Authorization Code

### **3.1 Build Authorization URL**

Replace these values in the URL below:

- `{CLIENT_ID}` → Your Client ID from Step 2.3
- `{REDIRECT_URI}` → `http://localhost:3000/api/auth/callback` (URL encoded: `http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback`)
- `{SCOPE}` → `ZohoCRM.modules.ALL,ZohoCRM.settings.ALL`

**Authorization URL Template:**
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id={CLIENT_ID}&response_type=code&access_type=offline&redirect_uri={REDIRECT_URI}
```

**Example (filled in):**
```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id=1000.ABCD1234EFGH5678&response_type=code&access_type=offline&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback
```

### **3.2 Get Authorization Code**

1. **Paste the URL** (with your Client ID) into your browser
2. You'll be redirected to Zoho login
3. **Login** with your Zoho CRM account
4. **Authorize** the application
5. You'll be redirected to:
   ```
   http://localhost:3000/api/auth/callback?code=1000.XXXXX...&location=us&accounts-server=https://accounts.zoho.com
   ```

6. **Copy the `code` parameter** from the URL
   - It starts with `1000.`
   - Example: `1000.abcd1234efgh5678ijkl9012mnop3456`

   **⚠️ IMPORTANT:** This code expires in **60 seconds**! Use it immediately in Step 4.

---

## Step 4: Generate Refresh Token

### **4.1 Exchange Code for Refresh Token**

You need to make a POST request. Choose one method:

#### **Option A: Using PowerShell (Windows)**

Open PowerShell and run:

```powershell
$body = @{
    grant_type = "authorization_code"
    client_id = "YOUR_CLIENT_ID"
    client_secret = "YOUR_CLIENT_SECRET"
    code = "YOUR_AUTHORIZATION_CODE"
    redirect_uri = "http://localhost:3000/api/auth/callback"
}

$response = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"

Write-Host "Access Token: $($response.access_token)"
Write-Host "Refresh Token: $($response.refresh_token)"
Write-Host "Expires In: $($response.expires_in) seconds"
```

**Replace:**
- `YOUR_CLIENT_ID`
- `YOUR_CLIENT_SECRET`
- `YOUR_AUTHORIZATION_CODE` (from Step 3.2)

#### **Option B: Using cURL (Mac/Linux/Git Bash)**

```bash
curl -X POST \
  https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_AUTHORIZATION_CODE" \
  -d "redirect_uri=http://localhost:3000/api/auth/callback"
```

#### **Option C: Using Postman**

1. Open Postman
2. Create **POST** request to:
   ```
   https://accounts.zoho.com/oauth/v2/token
   ```
3. Body → **x-www-form-urlencoded**
4. Add parameters:
   - `grant_type`: `authorization_code`
   - `client_id`: `YOUR_CLIENT_ID`
   - `client_secret`: `YOUR_CLIENT_SECRET`
   - `code`: `YOUR_AUTHORIZATION_CODE`
   - `redirect_uri`: `http://localhost:3000/api/auth/callback`
5. Click **Send**

### **4.2 Save the Response**

You'll get a response like:

```json
{
  "access_token": "1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "refresh_token": "1000.yyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "expires_in": 3600,
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer"
}
```

**✅ Save the `refresh_token`!** This is what you need for `.env.local`

---

## Step 5: Configure Your Application

### **5.1 Update .env.local**

Open `C:\Users\ikayj\Documents\wingside\.env.local` and update:

```env
# Zoho CRM Configuration
ZOHO_CLIENT_ID=1000.ABCD1234EFGH5678
ZOHO_CLIENT_SECRET=1234567890abcdefghijklmnop
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_API_DOMAIN=https://www.zohoapis.com
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
```

**Region-specific domains:**
- **US:** `https://www.zohoapis.com` / `https://accounts.zoho.com`
- **EU:** `https://www.zohoapis.eu` / `https://accounts.zoho.eu`
- **IN:** `https://www.zohoapis.in` / `https://accounts.zoho.in`
- **AU:** `https://www.zohoapis.com.au` / `https://accounts.zoho.com.au`
- **CN:** `https://www.zohoapis.com.cn` / `https://accounts.zoho.com.cn`

### **5.2 Restart Dev Server**

```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

---

## Step 6: Test Your Integration

### **6.1 Test Manual Sync**

1. Go to: **http://localhost:3000/admin/customers**
2. Click on the sample customer: **"Chinedu Okafor"**
3. Scroll to **"Integration Status"**
4. Click **"Sync Customer"** button
5. You should see:
   ```
   ✅ Customer synced successfully!

   ● Zoho CRM              [Synced]
     ID: 5847693000001234567
   ```

### **6.2 Verify in Zoho CRM**

1. Go to: **https://crm.zoho.com**
2. Click **"Contacts"** in the left menu
3. You should see **"Chinedu Okafor"** in the list
4. Click to view details - all info should match!

---

## 🎉 Success Checklist

✅ Zoho CRM account created
✅ OAuth client registered
✅ Client ID obtained
✅ Client Secret obtained
✅ Authorization code generated
✅ Refresh token obtained
✅ `.env.local` updated
✅ Dev server restarted
✅ Test sync successful
✅ Contact visible in Zoho CRM

---

## 🔧 Troubleshooting

### **Problem: "Invalid code" error**

**Cause:** Authorization code expired (60 seconds)

**Solution:**
1. Go back to Step 3
2. Generate a new authorization code
3. Use it immediately in Step 4

### **Problem: "Invalid client" error**

**Cause:** Wrong Client ID or Client Secret

**Solution:**
1. Go to: https://api-console.zoho.com/
2. Click on your client
3. Copy the correct credentials

### **Problem: "Invalid redirect URI" error**

**Cause:** Redirect URI mismatch

**Solution:**
1. Ensure redirect URI in authorization URL matches exactly what's in API Console
2. Use URL-encoded version: `http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback`

### **Problem: "Insufficient scope" error**

**Cause:** Missing required scopes

**Solution:**
Use this scope in authorization URL:
```
ZohoCRM.modules.ALL,ZohoCRM.settings.ALL
```

### **Problem: Sync button doesn't work**

**Cause:** Server not restarted after .env.local update

**Solution:**
1. Stop dev server (Ctrl+C)
2. Restart: `npm run dev`

### **Problem: Region/domain mismatch**

**Cause:** Using wrong API domain for your region

**Solution:**
Check your Zoho CRM URL:
- `crm.zoho.com` → US → `https://www.zohoapis.com`
- `crm.zoho.eu` → EU → `https://www.zohoapis.eu`
- `crm.zoho.in` → IN → `https://www.zohoapis.in`

---

## 📚 Additional Resources

- **Zoho CRM API Docs:** https://www.zoho.com/crm/developer/docs/api/v6/
- **OAuth Guide:** https://www.zoho.com/crm/developer/docs/api/v6/auth-request.html
- **API Console:** https://api-console.zoho.com/
- **CRM Dashboard:** https://crm.zoho.com

---

## 🔐 Security Best Practices

1. **Never commit `.env.local` to Git**
   - Already in `.gitignore`

2. **Refresh tokens don't expire** (unless revoked)
   - Store securely
   - Regenerate if compromised

3. **Use different clients for different environments**
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

4. **Limit API scopes** to only what you need
   - Current scope: `ZohoCRM.modules.ALL,ZohoCRM.settings.ALL`
   - Adjust if you want more restrictive access

---

## ✅ Quick Reference

**Files Updated:**
- `.env.local` (credentials)

**Integration Active For:**
- ✅ User signups
- ✅ Guest checkouts
- ✅ Order completions
- ✅ Manual sync (admin UI)

**What Gets Synced:**
- **Contacts:** Customer profiles
- **Deals:** Orders
- **Notes:** Order details on contact

---

## 🎯 Next Steps

After completing this guide:

1. ✅ **Test with real signup**
   - Create new account
   - Check it appears in Zoho CRM

2. ✅ **Test with order**
   - Place test order
   - Verify deal created in Zoho

3. ✅ **Monitor logs**
   - Check server console for sync confirmations
   - Look for: `✅ Synced to Zoho CRM: xxxxx`

4. ✅ **Configure production**
   - When deploying, create production OAuth client
   - Use production domain as redirect URI
   - Add production credentials to environment variables

---

**Setup Complete!** 🎉

Your Wingside app is now fully integrated with Zoho CRM for automatic customer and order syncing!

---

**Created:** 2025-12-19
**Version:** 1.0
**Status:** Production Ready ✅
