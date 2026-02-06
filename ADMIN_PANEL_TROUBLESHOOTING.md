# Admin Panel Troubleshooting Guide

**Issue:** Error fetching cards in admin panel

---

## Common Errors & Solutions

### Error 1: "Error fetching cards: {}"

**Symptoms:**
- Admin panel loads but shows error
- Console shows empty error object
- No cards displayed

**Possible Causes:**

#### A. Row Level Security (RLS) Policy Issue

**Check:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'wingside_cards';

-- Check existing policies
SELECT * FROM pg_policies
WHERE tablename = 'wingside_cards';
```

**Expected Policies:**
```sql
-- Policy for users to view their own cards
"Users can view own cards"
FOR SELECT
USING (auth.uid() = user_id)

-- Policy for service role (used by admin)
"Service role can manage cards"
FOR ALL
USING (true)
WITH CHECK (true)
```

**Fix if Missing:**
```sql
-- The migration should have created these, but if missing:

-- Enable RLS
ALTER TABLE wingside_cards ENABLE ROW LEVEL SECURITY;

-- Users can view own cards
CREATE POLICY "Users can view own cards"
ON wingside_cards
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can manage all cards
CREATE POLICY "Service role can manage cards"
ON wingside_cards
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON wingside_cards TO authenticated;
GRANT ALL ON wingside_cards TO service_role;
```

#### B. Admin Not Using Service Role

**Problem:** Admin panel uses anon key, not service role key

**Check in Code:**
```typescript
// In app/admin/wingside-cards/page.tsx
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ❌ Limited by RLS
);
```

**Fix:** Create an API route that uses service role

**Option 1: Use API Route (Recommended)**

Create: `app/api/admin/wingside-cards/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use admin client to fetch cards (bypasses RLS)
    const admin = createAdminClient();

    const { data: cardsData, error: cardsError } = await admin
      .from('wingside_cards')
      .select('*')
      .order('linked_at', { ascending: false });

    if (cardsError) throw cardsError;

    // Fetch profiles
    if (cardsData && cardsData.length > 0) {
      const userIds = cardsData.map((card: any) => card.user_id);
      const { data: profilesData } = await admin
        .from('profiles')
        .select('id, email, full_name, phone_number')
        .in('id', userIds);

      const cardsWithUser = cardsData.map((card: any) => {
        const profile = profilesData?.find((p: any) => p.id === card.user_id);
        return {
          ...card,
          user_email: profile?.email || 'N/A',
          user_name: profile?.full_name || 'Unknown User',
          user_phone: profile?.phone_number || null
        };
      });

      return NextResponse.json({ success: true, cards: cardsWithUser });
    }

    return NextResponse.json({ success: true, cards: [] });

  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

// GET stats
export async function POST(request: NextRequest) {
  // Similar auth checks...

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('wingside_cards')
    .select('status, total_spent, total_transactions');

  if (error) throw error;

  const stats = {
    total_cards: data.length,
    active_cards: data.filter((c: any) => c.status === 'active').length,
    suspended_cards: data.filter((c: any) => c.status === 'suspended').length,
    total_value: data.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0),
    total_transactions: data.reduce((sum: number, c: any) => sum + (c.total_transactions || 0), 0)
  };

  return NextResponse.json({ success: true, stats });
}
```

Update admin panel to use API:
```typescript
const fetchCards = async () => {
  try {
    setLoading(true);

    const response = await fetch('/api/admin/wingside-cards');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cards');
    }

    setCards(data.cards);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching cards:', err);
    setError(`Failed to load cards: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};
```

**Option 2: Add Admin RLS Policy**

```sql
-- Add policy for admins to view all cards
CREATE POLICY "Admins can view all cards"
ON wingside_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

Then update admin panel:
```typescript
// Current code should work with this policy
```

#### C. Table Doesn't Exist

**Check:**
```sql
SELECT * FROM wingside_cards LIMIT 1;
```

**If Error:** Table doesn't exist

**Fix:** Run migration
```bash
# Via psql
psql -d your_database -f supabase/migrations/20260201_create_wingside_cards.sql

# Or via Supabase dashboard
# SQL Editor → Run migration file
```

#### D. Profiles Join Issue

**Check:**
```sql
-- Test if profiles exist for card users
SELECT
  wc.id,
  wc.card_serial,
  wc.user_id,
  p.email,
  p.full_name
FROM wingside_cards wc
LEFT JOIN profiles p ON p.id = wc.user_id
LIMIT 5;
```

**If NULL profiles:** Users missing from profiles table

**Fix:** Ensure all users have profiles
```sql
-- Check orphaned cards
SELECT wc.*
FROM wingside_cards wc
LEFT JOIN profiles p ON p.id = wc.user_id
WHERE p.id IS NULL;
```

---

## Error 2: "Admin access required"

**Cause:** User is not an admin

**Check:**
```sql
SELECT id, email, role
FROM profiles
WHERE email = 'your.email@example.com';
```

**Fix:**
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your.email@example.com';
```

---

## Error 3: "You must be logged in"

**Cause:** Not authenticated

**Fix:**
1. Navigate to `/login`
2. Login with admin account
3. Navigate back to `/admin/wingside-cards`

---

## Error 4: Loading Forever

**Causes:**
- Network timeout
- Infinite loop
- Missing error handling

**Debug:**
```typescript
// Add logging in admin panel
const fetchCards = async () => {
  console.log('[Admin] Fetching cards...');
  try {
    setLoading(true);
    console.log('[Admin] Making request...');

    const { data, error } = await supabase...

    console.log('[Admin] Response:', { data, error });
    // ... rest of code
  }
};
```

---

## Quick Diagnostic Script

Run this to check your setup:

```sql
-- 1. Check table exists
SELECT COUNT(*) as card_count FROM wingside_cards;

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'wingside_cards';

-- 3. Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'wingside_cards';

-- 4. Check admin user exists
SELECT id, email, role
FROM profiles
WHERE role = 'admin';

-- 5. Check cards with profiles
SELECT
  wc.card_serial,
  wc.status,
  p.email,
  p.full_name
FROM wingside_cards wc
LEFT JOIN profiles p ON p.id = wc.user_id
LIMIT 5;
```

---

## Recommended Solution

**Best approach:** Use API route with service role (Option 1 above)

**Why:**
- ✅ Bypasses RLS complexity
- ✅ Server-side only (secure)
- ✅ Proper admin authentication
- ✅ Easy to add more admin endpoints
- ✅ Follows Next.js best practices

**Implementation:**
1. Create `app/api/admin/wingside-cards/route.ts`
2. Use `createAdminClient()` for queries
3. Update admin panel to fetch from API
4. Test thoroughly

---

## Testing After Fix

```bash
# 1. Login as admin
# Navigate to /login

# 2. Open admin panel
# Navigate to /admin/wingside-cards

# 3. Check console
# Should see no errors

# 4. Check data loads
# Stats should show (even if 0)
# Cards table should show (even if empty)

# 5. Test search
# Type in search box - should filter

# 6. Test generate
# Click "Generate Card Serial" - should work
```

---

## Still Not Working?

1. **Check browser console** for detailed error messages
2. **Check server logs** in terminal
3. **Check Supabase dashboard** logs
4. **Verify environment variables** are set
5. **Try incognito mode** to rule out cache issues

---

## Get More Help

If still stuck:

1. Export error details:
```typescript
console.log('Full error:', JSON.stringify(error, null, 2));
```

2. Check Supabase logs in dashboard

3. Verify migration ran:
```sql
SELECT * FROM _prisma_migrations; -- or your migration tracking table
```

4. Test with curl:
```bash
curl http://localhost:3000/api/admin/wingside-cards \
  -H "Cookie: your-auth-cookie"
```

---

**Last Updated:** 2026-02-06
