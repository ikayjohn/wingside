# WebP Image Conversion Guide

## What is WebP?
WebP is a modern image format that provides:
- **25-35% smaller** file sizes than JPEG
- **Better compression** than PNG
- **Same visual quality** with smaller files
- **Broad browser support** (95%+ of users)

## Quick Start

### Option 1: Automated Conversion (Recommended)

#### Windows:
1. Install cwebp encoder:
   - Download: https://developers.google.com/speed/webp/download
   - Extract and add to your PATH

2. Run the conversion script:
   ```bash
   node scripts/convert-images-to-webp.js
   ```

#### Linux/Mac:
```bash
# Install cwebp
sudo apt-get install webp  # Ubuntu/Debian
brew install webp          # Mac

# Convert images
node scripts/convert-images-to-webp.js
```

### Option 2: Online Conversion
Use free online tools:
- https://squoosh.app (by Google)
- https://cloudconvert.com/jpg-to-webp
- https://convertio.com/png-webp

Batch upload all images from your `public/` folder.

### Option 3: Photoshop (If you have it)
- File > Export > Export As
- Choose WebP format
- Quality: 80-85%

## After Conversion

### Step 1: Update your images to use WebP component
Replace `<img>` tags with `<WebPPicture>` component:

**Before:**
```tsx
<img src="/image.jpg" alt="Description" className="..." />
```

**After:**
```tsx
import WebPPicture from '@/components/WebPPicture'

<WebPPicture src="/image.jpg" alt="Description" className="..." />
```

### Step 2: Deploy and test
```bash
git add .
git commit -m "feat: Add WebP images with fallback"
git push
```

## Expected Results
- **25-35% faster** image load times
- **Reduced bandwidth** usage
- **Better Lighthouse scores**
- **Same quality** images

## Important Notes
- Original PNG/JPG files remain (backup)
- WebP images auto-fallback to original for old browsers
- No code changes needed - works automatically
- Supabase Storage images need manual conversion

## Troubleshooting

**Script fails?**
- Make sure cwebp is installed: `cwebp -version`
- Try Option 2 (online conversion) instead

**Images not loading?**
- Check WebP files exist in public/ folder
- Clear browser cache and reload
- Check browser console for errors
