# Hero Slideshow System Setup

## Overview
The hero slideshow system replaces the video background with a dynamic image slideshow that can be managed from the admin dashboard.

## Features
- ✅ Dynamic slideshow with Ken Burns (slow zoom/pan) effects
- ✅ Admin dashboard for managing slides
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ **Image upload functionality** - Upload directly from the admin panel
- ✅ Customizable headline, description, and image
- ✅ Slide ordering and active/inactive status
- ✅ Auto-play with 6-second intervals
- ✅ Navigation arrows and dot indicators
- ✅ Support for colored text in headlines (using [yellow] and [white] tags)

## Setup Instructions

### 1. Apply Database Migrations

You need to apply **TWO** migration files:

**Migration 1: Storage Bucket** (Required for image uploads)
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20250126_create_hero_images_bucket.sql`
3. Paste and run the script

**Migration 2: Hero Slides Table** (Required for slideshow)
1. In the same SQL Editor
2. Copy the contents of `supabase/migrations/20250126_create_hero_slides.sql`
3. Paste and run the script

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy the contents of `supabase/migrations/20250126_create_hero_slides.sql`
5. Paste and run the script

**Option B: Via Script**
```bash
node scripts/apply-hero-slides-migration.js
```

### 2. Verify Installation

After migration, a default slide will be created automatically. You can verify by:
1. Visiting the homepage - you should see the slideshow
2. Going to `/admin/hero-slides` - you should see the slides management page

### 3. Add Your Slides

1. Navigate to `/admin/hero-slides`
2. Click "Add New Slide"
3. Fill in the form:
   - **Title**: Internal name (e.g., "Summer Campaign 2025")
   - **Headline**: Displayed text at the top with optional color tags
   - **Description**: Subtitle text (optional)
   - **Slide Image**: Upload an image OR enter an image URL
   - **Display Order**: Number to determine slide sequence (0 = first)
   - **Status**: Active or Inactive

#### Image Upload Options:

**Option A: Upload Image** (Recommended)
1. Click "Upload Image" button
2. Select an image from your computer
3. Image will be automatically uploaded to Supabase storage
4. Supported formats: JPG, PNG, WEBP, GIF (max 5MB)

**Option B: Enter Image URL**
- Paste a direct URL to an image
- Can be from your `/public` folder (e.g., `/hero-slide-1.jpg`)
- Or from external sources (e.g., CDN, external hosting)

### 4. Upload Images

#### Using Supabase Storage (Recommended):
- Images are automatically uploaded when you use the "Upload Image" button
- Stored in the `hero-images` bucket in Supabase
- Public URL is generated automatically
- No need to manually add files to the project

#### Using Public Folder (Alternative):
Add your hero images to the `/public` folder:
```
public/
  ├── hero-slide-1.jpg
  ├── hero-slide-2.jpg
  └── hero-slide-3.jpg
```
Then reference them in the slide settings as `/hero-slide-1.jpg`, etc.

## Text Formatting

You can add colors to your headlines using simple tags:

- `[yellow]text[/yellow]` - Makes text yellow (#F7C400)
- `[white]text[/white]` - Makes text white

**Example:**
```
Where [yellow]Flavor[/yellow] takes [white]Flight[/white]
```

This will display: "Where **Flavor** takes **Flight**" (with colors)

## Ken Burns Effects

The slideshow automatically applies different Ken Burns effects to each slide:
- Slide 1: Zoom in
- Slide 2: Zoom in + pan left
- Slide 3: Zoom in + pan right
- Slide 4: Zoom in + pan down

Effects cycle through these options for additional slides.

## Customization

### Change Slide Duration

Edit `components/HeroSlideshow.tsx`, line 37:
```typescript
const interval = setInterval(() => {
  setCurrentIndex((prev) => (prev + 1) % slides.length);
}, 6000); // Change 6000 to desired milliseconds
```

### Modify Ken Burns Effects

Edit the `getKenBurnsEffect` function in `components/HeroSlideshow.tsx`:
```typescript
const effects = [
  { scale: 1.1, translateX: 0, translateY: 0 }, // Adjust these values
  // Add more effects as needed
];
```

## API Endpoints

- `GET /api/hero-slides/public` - Fetch active slides (public)
- `GET /api/hero-slides` - Fetch all slides (admin only)
- `POST /api/hero-slides` - Create new slide (admin only)
- `PATCH /api/hero-slides/[id]` - Update slide (admin only)
- `DELETE /api/hero-slides/[id]` - Delete slide (admin only)
- `POST /api/upload` - Upload image to Supabase storage (admin only)
  - Send `FormData` with `file` and `folder` (set to "hero-images")

## Troubleshooting

### Slides not showing?
- Check browser console for errors
- Verify database migration was applied successfully
- Ensure at least one slide is marked as "Active"
- Check image URLs are correct

### Images not loading?
- Verify images are in the `/public` folder
- Check image paths start with `/`
- Test image URL directly in browser

### Admin panel not accessible?
- Ensure user has admin role in `profiles` table
- Check RLS policies are correctly applied

## Database Schema

```sql
hero_slides (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Files Created

1. `supabase/migrations/20250126_create_hero_images_bucket.sql` - Storage bucket setup
2. `supabase/migrations/20250126_create_hero_slides.sql` - Database schema
3. `app/api/hero-slides/route.ts` - CRUD API endpoints
4. `app/api/hero-slides/[id]/route.ts` - Individual slide operations
5. `app/api/hero-slides/public/route.ts` - Public slides endpoint
6. `app/api/upload/route.ts` - Image upload endpoint (updated)
7. `app/admin/hero-slides/page.tsx` - Admin management page with upload
8. `components/HeroSlideshow.tsx` - Slideshow component
9. `scripts/apply-hero-slides-migration.js` - Migration helper script

## Support

For issues or questions, check:
1. Supabase dashboard > SQL Editor for database issues
2. Browser console for frontend errors
3. Network tab for API errors
