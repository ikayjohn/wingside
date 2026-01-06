# Maintenance Mode - Complete Rebuild Instructions

## 📋 The Issue

The JSON parse error is likely caused by one of these:
1. Browser/cached code using old fetchSettings
2. Conflicting components loading
3. Database connection issues

## 🔧 Complete Fix

### Step 1: Run SQL in Supabase

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
2. Copy and paste the entire SQL from `supabase/migrations/20250106_maintenance_mode_clean.sql`
3. Click "Run"
4. Verify you see the maintenance settings returned

### Step 2: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then run:
npm run dev
```

### Step 4: Test in Incognito

1. Open an incognito/private window
2. Go to http://localhost:3000/admin/maintenance
3. Check if the error still occurs

### Step 5: Check Network Tab

If error still occurs:
1. Open DevTools Network tab
2. Refresh the page
3. Look for failed requests (red)
4. Click on each failed request
5. Check the "Response" tab to see what was actually returned

## 🎯 What This Does

### Database Side:
- ✅ Completely drops old table and functions
- ✅ Creates clean table structure
- ✅ Creates simple JSON-returning functions
- ✅ Proper permissions and RLS
- ✅ Default access code: WINGSIDE2025

### Code Side:
- ✅ Disabled access code checking (maintenance shows immediately when enabled)
- ✅ Better error handling in all API routes
- ✅ Graceful degradation on errors
- ✅ Extensive logging for debugging

## ✨ Expected Result

After setup, the maintenance mode should:
1. Show maintenance page when enabled (no access code needed)
2. Allow admins to manage settings at `/admin/maintenance`
3. Not crash on any errors
4. Log detailed information for debugging

## 🐛 If Still Failing

Please provide:
1. Screenshot of Network tab showing failed requests
2. Server console output
3. Browser console errors (all of them, not just the JSON parse one)

This will help identify the exact failing endpoint.
