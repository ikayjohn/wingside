# Subcategory Renaming Bug - Fixed! ✅

## What Was Wrong

When you renamed the **subcategory** "Matcha Lattes" to "matchas" in the admin panel:

1. ❌ The `subcategories` table was updated (✓)
2. ❌ BUT the `products` table still had the OLD subcategory name
3. ❌ Cache wasn't cleared properly
4. ❌ Order page filters by `product.subcategory`, so NO products matched "matchas"

## Database Issue

Your `products` table has a `subcategory` **VARCHAR field**, not a foreign key:

```sql
CREATE TABLE products (
  ...
  subcategory VARCHAR(100),  -- Plain text, NOT a reference!
  ...
);
```

When you change the subcategory name in the `subcategories` table, the `products` table is NOT automatically updated!

## What I Fixed

### 1. Subcategories API Now Updates Products
**File**: `app/api/subcategories/[id]/route.ts`

When renaming a subcategory, the API now:
1. ✅ Gets the OLD subcategory name
2. ✅ Updates the `subcategories` table
3. ✅ **Automatically updates ALL products** that had the old subcategory name
4. ✅ Clears cache (categories + products)

```typescript
// Get old name
const oldSubcategory = await supabase
  .from('subcategories')
  .select('name')
  .eq('id', id)

// Update subcategory
await supabase.from('subcategories').update({...})

// UPDATE ALL PRODUCTS with old name ✨
if (oldSubcategory.name !== newName) {
  await supabase.from('products')
    .update({ subcategory: newName })
    .eq('subcategory', oldSubcategory.name)
}
```

### 2. Added Subcategory DELETE Endpoint
**File**: `app/api/subcategories/[id]/route.ts`

When deleting a subcategory:
1. ✅ Clears `subcategory` field from affected products
2. ✅ Properly invalidates cache

### 3. Fixed Cache Invalidation
**Files**:
- `lib/redis.ts` - Added `categories()` method
- `app/api/categories/route.ts` - POST now clears cache
- `app/api/categories/[id]/route.ts` - PUT & DELETE clear cache
- `app/api/subcategories/route.ts` - POST clears cache

### 4. Created SQL Migration
**File**: `supabase/migrations/20260127_fix_subcategory_names.sql`

Fixes EXISTING products that have the old subcategory name:
```sql
UPDATE products
SET subcategory = 'matchas'
WHERE subcategory IN ('Matcha Lattes', 'matcha lattes', 'Matcha', 'Matchas');
```

## How to Fix Your "matchas" Issue

### Step 1: Run the SQL Migration
You need to update the existing products in your database.

**Option A - Use Supabase SQL Editor:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Fix products with old "Matcha Lattes" subcategory name
UPDATE products
SET subcategory = 'matchas'
WHERE subcategory IN ('Matcha Lattes', 'matcha lattes', 'Matcha', 'Matchas', 'matchas');

-- Verify the fix
SELECT
    subcategory,
    COUNT(*) as count
FROM products
WHERE subcategory IS NOT NULL
GROUP BY subcategory
ORDER BY count DESC;
```

**Option B - Use the migration file:**
```bash
# If you have local psql access
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260127_fix_subcategory_names.sql
```

### Step 2: Clear Cache
```bash
npx tsx scripts/clear-cache.ts
```

### Step 3: Test!
Go to `/order/` and:
1. Click on **"Wing Cafe"** category
2. Click on **"matchas"** subcategory
3. Products should now appear! ✅

## Future Changes

Now, when you rename a subcategory in the admin panel:
1. ✅ All products with that subcategory are automatically updated
2. ✅ Cache is cleared
3. ✅ Order page shows products immediately
4. ✅ No manual database fixes needed!

## Files Modified

1. `lib/redis.ts` - Added `categories()` cache invalidation
2. `app/api/categories/route.ts` - Fixed cache invalidation
3. `app/api/categories/[id]/route.ts` - Fixed cache invalidation + added DELETE
4. `app/api/subcategories/route.ts` - Fixed cache invalidation
5. `app/api/subcategories/[id]/route.ts` - Auto-update products + cache invalidation + added DELETE
6. `scripts/clear-cache.ts` - New utility script
7. `supabase/migrations/20260127_fix_subcategory_names.sql` - Fixes existing data

## Root Cause Summary

This bug occurred because of **denormalized database design**:
- Subcategory names are stored in TWO places:
  1. `subcategories.name` (source of truth)
  2. `products.subcategory` (cached copy)

When the source of truth changes, the cached copy must be manually updated.

**Future improvement**: Add a foreign key (`subcategory_id`) to products table for automatic referential integrity.

---

**Status**: 🐛 Bug Fixed ✅ | ✅ Code Deployed | ⏳ Database Fix Required
