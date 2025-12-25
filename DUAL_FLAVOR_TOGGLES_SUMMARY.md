# Dual Flavor Toggle System - Implementation Summary

## Overview
Flavors now have three separate toggles for independent control:
1. **Active** - Master toggle (flavor exists in the system)
2. **Show on Homepage** - Controls visibility on the homepage flavor catalog
3. **Available for Products** - Controls whether flavor can be selected when ordering

## Database Changes

### New Columns Added
```sql
ALTER TABLE flavors ADD COLUMN show_on_homepage BOOLEAN DEFAULT true;
ALTER TABLE flavors ADD COLUMN available_for_products BOOLEAN DEFAULT true;
```

## Files Modified

### 1. `scripts/add-flavor-visibility-columns.sql` (NEW)
- SQL script to add the two new columns to the flavors table
- Includes comments explaining each column's purpose

### 2. `app/admin/flavors/page.tsx`
Updated with three separate toggles:
- **Active** (blue checkbox) - Master toggle for flavor existence
- **Show on Homepage** (green checkbox) - Controls homepage visibility
- **Available for Products** (purple checkbox) - Controls ordering availability

Table now shows two status columns:
- **Homepage** column: Shows "Visible" or "Hidden"
- **Products** column: Shows "Available" or "Unavailable"

### 3. `app/page.tsx` (Homepage)
- Updated filter to use `show_on_homepage` flag
- Only flavors with `show_on_homepage = true` will display on homepage

### 4. `app/api/products/route.ts` (Products API)
- Updated flavor query to filter by `available_for_products = true`
- Only flavors available for products will appear in ordering flow

## Usage Scenarios

### Scenario 1: Temporarily Out of Stock
You're out of a specific flavor but want to keep it visible on the homepage:
- ✅ Active: ON
- ✅ Show on Homepage: ON
- ❌ Available for Products: OFF

### Scenario 2: Coming Soon Flavor
Want to showcase a new flavor before it's available for ordering:
- ✅ Active: ON
- ✅ Show on Homepage: ON
- ❌ Available for Products: OFF

### Scenario 3: Seasonal Flavor
Flavor is available but don't want to promote it on homepage:
- ✅ Active: ON
- ❌ Show on Homepage: OFF
- ✅ Available for Products: ON

### Scenario 4: Discontinued Flavor
Completely remove a flavor from all areas:
- ❌ Active: OFF (this disables everything)
- Show on Homepage: N/A
- Available for Products: N/A

## Installation Instructions

### Step 1: Run Database Migration
1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new
2. Open `scripts/add-flavor-visibility-columns.sql`
3. Copy all SQL commands
4. Paste into SQL Editor
5. Click "Run"

### Step 2: Test the Changes
1. Navigate to `/admin/flavors`
2. Edit any flavor to see the three new toggles
3. Test different combinations:
   - Toggle "Show on Homepage" and check homepage
   - Toggle "Available for Products" and check order page

## Benefits

1. **Marketing Flexibility**: Promote flavors on homepage even when not available
2. **Inventory Management**: Hide out-of-stock flavors from ordering while keeping them visible
3. **Seasonal Control**: Feature flavors without making them orderable
4. **Independent Control**: Homepage and product availability are completely separate

## Notes

- The `is_active` column remains as the master toggle
- When `is_active = false`, the flavor is completely disabled
- The two new toggles (`show_on_homepage` and `available_for_products`) only work when `is_active = true`
- All existing flavors default to `true` for both new columns (backwards compatible)
