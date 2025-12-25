# Flavor Integration - Homepage to Database

## Changes Made

### 1. Updated Homepage to Fetch from Database
**File**: `app/page.tsx`

**Changes**:
- Added `useEffect` to fetch flavors from `/api/flavors` on component mount
- Added loading state while fetching flavors
- Removed hardcoded flavor array
- Added `parseDescription()` helper to split database descriptions into two parts
- Updated flavor rendering to use database fields:
  - `flavor.image` → `flavor.image_url`
  - `flavor.description1/2` → parsed from `flavor.description`
  - `flavor.name` → stays the same

### 2. Created SQL Script to Update Flavor Images
**File**: `scripts/update-flavor-images.sql`

**What it does**:
- Updates all 20 flavors in the database with correct image paths
- Maps each flavor name to its corresponding homepage image file

### 3. Database Schema
The `flavors` table now contains:
- `name`: Flavor name (e.g., "Wingferno", "Dragon Breath")
- `category`: HOT, BBQ, DRY RUB, BOLD & FUN, SWEET, BOOZY
- `description`: Full description (split into two parts on homepage)
- `image_url`: Path to flavor image (e.g., "/flavor-wingferno.png")
- `spice_level`: 0-5 heat scale
- `is_active`: Whether flavor is currently available
- `display_order`: Order for sorting

## Instructions to Apply Changes

### Step 1: Update Flavor Images in Database
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new
2. Open `scripts/update-flavor-images.sql`
3. Copy all SQL commands
4. Paste into SQL Editor
5. Click "Run"

### Step 2: Verify Homepage Works
1. Start development server: `npm run dev`
2. Navigate to homepage
3. Verify flavors load from database
4. Check category tabs work
5. Verify images display correctly

## Flavor Image Mapping

| Flavor Name | Image URL |
|-------------|-----------|
| Wingferno | /flavor-wingferno.png |
| Dragon Breath | /flavor-dragon.png |
| Braveheart | /flavor-brave.png |
| Mango Heat | /flavor-mango.png |
| BBQ Rush | /flavor-bbqrush.png |
| BBQ Fire | /flavor-bbqfire.png |
| Lemon Pepper | /flavor-lemon.png |
| Cameroon Pepper | /flavor-cameroon.png |
| Caribbean Jerk | /flavor-caribbean.png |
| Yaji | /flavor-yaji.png |
| The Italian | /flavor-italian.png |
| Wing of the North | /flavor-wingnorth.png |
| Tokyo | /flavor-tokyo.png |
| Hot Nuts | /flavor-hotnuts.png |
| The Slayer | /flavor-slayer.png |
| Sweet Dreams | /flavor-sweetdreams.png |
| Yellow Gold | /flavor-yellowgold.png |
| Whiskey Vibes | /flavor-whiskeyvibes.png |
| Tequila Wingrise | /flavor-tequila.png |
| Gustavo | /flavor-gustavo.png |

## Benefits

1. **Single Source of Truth**: All flavor data managed in one place
2. **Easy Updates**: Change flavors in admin panel, homepage updates automatically
3. **Consistent Descriptions**: Same descriptions across homepage and admin
4. **Scalable**: Easy to add new flavors without code changes
5. **Image Management**: Images stored with flavor data for easy management
