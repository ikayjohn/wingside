# Cache Invalidation Fix for Category & Subcategory Name Changes

## Problem
When changing **subcategory** names (e.g., "Matcha Lattes" to "matchas") in admin panel, products weren't showing up on order page because:
1. **CRITICAL BUG**: `products.subcategory` is a VARCHAR field storing the subcategory name as plain text
2. When you renamed "Matcha Lattes" to "matchas" in the `subcategories` table, the `products` table still had the OLD name
3. Order page filters products by `product.subcategory`, so no products matched the new name
4. Cache wasn't properly cleared when subcategories were updated

## Root Cause
### Database Design Issue
- `products.subcategory` is a **VARCHAR(100)** field, NOT a foreign key
- When subcategory names change, products table is NOT automatically updated
- Subcategories table and products.subcategory field can become out of sync

### Cache Issue
- Categories API cached for 24 hours (extended TTL)
- Products API cached for 30 minutes (medium TTL)
- `CacheInvalidation` helper was missing a `categories()` method
- Subcategory endpoints only cleared memory cache, not Redis cache
- Products cache was NOT cleared when subcategories changed

## Solution

### 1. Added Categories Cache Invalidation (`lib/redis.ts`)
Added `categories()` method to `CacheInvalidation` object:
```typescript
async categories() {
  console.log('[Cache Invalidation] Clearing categories cache')
  await deleteFromCache(CACHE_KEYS.CATEGORIES)
  memoryCache.delete(CACHE_KEYS.CATEGORIES)
  memoryCache.delete('categories_all')
  console.log('[Cache Invalidation] Categories cache cleared')
}
```

### 2. Updated Subcategories API to Sync Products

#### PUT (`app/api/subcategories/[id]/route.ts`)
When renaming a subcategory:
```typescript
// Get old subcategory name BEFORE updating
const { data: oldSubcategory } = await supabase
  .from('subcategories')
  .select('name')
  .eq('id', id)
  .single()

// Update subcategory
await supabase.from('subcategories').update({...}).eq('id', id)

// CRITICAL FIX: Update all products that have the old subcategory name
if (oldSubcategory && oldSubcategory.name !== body.name) {
  await supabase
    .from('products')
    .update({ subcategory: body.name })
    .eq('subcategory', oldSubcategory.name)
}
```

#### DELETE (`app/api/subcategories/[id]/route.ts`)
When deleting a subcategory:
```typescript
// Clear subcategory field from affected products
await supabase
  .from('products')
  .update({ subcategory: null })
  .eq('subcategory', oldSubcategory.name)
```

#### POST (`app/api/subcategories/route.ts`)
Added proper cache invalidation:
```typescript
await CacheInvalidation.categories()
await CacheInvalidation.products()
```

### 3. Updated Categories API
- `app/api/categories/route.ts` (POST) - Cache invalidation fix
- `app/api/categories/[id]/route.ts` (PUT) - Cache invalidation fix + added DELETE method

### 4. Created Database Migration for Existing Data (`supabase/migrations/20260127_fix_subcategory_names.sql`)
Fixes products that already have the old subcategory name:
```sql
UPDATE products
SET subcategory = 'matchas'
WHERE subcategory IN ('Matcha Lattes', 'matcha lattes', 'Matcha', 'Matchas');
```

### 5. Created Cache Clear Script (`scripts/clear-cache.ts`)
Script to manually clear all caches:
```bash
npx tsx scripts/clear-cache.ts
```

### 6. Ran Immediate Fixes
- Cleared memory cache
- Need to run SQL migration to fix existing products

## Impact
✅ When subcategory names change, products are automatically updated
✅ Products cache is cleared when subcategories change
✅ Both Redis and memory cache are properly invalidated
✅ Future subcategory name changes will work immediately
✅ Added DELETE endpoint for subcategories
✅ SQL migration available to fix existing data

## Usage

### For Future Subcategory Changes
After renaming a subcategory in admin panel:
1. API automatically updates all products with the old subcategory name
2. Cache is cleared for both categories and products
3. Order page fetches fresh data on next request
4. Products under new subcategory name display immediately

### For Existing "matchas" Issue
Run the SQL migration to fix products that still have the old subcategory name:
```bash
# Connect to your Supabase database and run:
psql -h <host> -U <user> -d <database> -f supabase/migrations/20260127_fix_subcategory_names.sql

# Or use Supabase SQL Editor to run the migration manually
```

Then clear cache:
```bash
npx tsx scripts/clear-cache.ts
```

## Technical Details

### Why This Happened
The `products` table schema has:
```sql
subcategory VARCHAR(100) -- For Wing Cafe subcategories
```

This is a **denormalized design** - subcategory names are duplicated in:
1. `subcategories.name` (source of truth for subcategory definitions)
2. `products.subcategory` (cached copy for filtering)

When the source of truth changes, the cached copies must be updated manually.

### Alternative Design (Not Implemented)
A normalized design would use a foreign key:
```sql
ALTER TABLE products ADD COLUMN subcategory_id UUID REFERENCES subcategories(id);
-- Then update query to JOIN instead of filtering by VARCHAR
```

This would be more maintainable but requires:
- Schema migration
- API query changes
- Frontend updates

The current fix maintains the denormalized design but ensures data consistency.

### 2. Updated Categories POST API (`app/api/categories/route.ts`)
Changed from manual cache deletion to using `CacheInvalidation` helper:
```typescript
// Before:
memoryCache.delete('categories_all')
memoryCache.delete(CACHE_KEYS.CATEGORIES)

// After:
await CacheInvalidation.categories()
await CacheInvalidation.products()  // Also clear products since they reference categories
```

### 3. Updated Categories PUT API (`app/api/categories/[id]/route.ts`)
- Added import for `CacheInvalidation`
- Updated cache invalidation to clear both categories AND products
- Added DELETE method for category deletion

### 4. Created Cache Clear Script (`scripts/clear-cache.ts`)
Script to manually clear all caches:
```bash
npx tsx scripts/clear-cache.ts
```

### 5. Ran Immediate Cache Clear
Executed clear-cache script to fix the immediate issue with "matchas" category.

## Impact
✅ Categories now properly update cache when changed in admin
✅ Products referencing categories also get cache cleared
✅ Both Redis and memory cache are invalidated
✅ Future category name changes will work immediately
✅ Added DELETE endpoint with proper cache invalidation

## Usage
After renaming a category in the admin panel:
1. API automatically clears both categories and products cache
2. Order page fetches fresh data on next request
3. Products under new category name display immediately

## Manual Cache Clear (if needed)
If Redis is configured and you need to manually clear cache:
```bash
npx tsx scripts/clear-cache.ts
```

Or use the admin API endpoint (if implemented):
```bash
POST /api/admin/clear-cache
```
