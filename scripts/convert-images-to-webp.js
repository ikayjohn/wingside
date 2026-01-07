#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');

// Find all PNG and JPG images
function findImages(dir) {
  const images = [];

  function scanDir(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
        images.push(filePath);
      }
    }
  }

  scanDir(dir);
  return images;
}

// Convert image to WebP using sharp
async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 85, effort: 4 })
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(`✓ ${path.relative(publicDir, inputPath)} (-${savings}% size)`);
  } catch (error) {
    throw new Error(`Failed to convert ${inputPath}: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Scanning for images...\n');
  const images = findImages(publicDir);
  console.log(`📊 Found ${images.length} images to convert\n`);

  let converted = 0;
  let failed = 0;
  let skipped = 0;
  let totalOriginalSize = 0;
  let totalWebpSize = 0;

  for (const image of images) {
    const webpPath = image.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    // Skip if WebP already exists and is newer
    if (fs.existsSync(webpPath)) {
      const originalTime = fs.statSync(image).mtime;
      const webpTime = fs.statSync(webpPath).mtime;

      if (webpTime >= originalTime) {
        skipped++;
        continue;
      }
    }

    try {
      const originalSize = fs.statSync(image).size;
      await convertToWebP(image, webpPath);
      const webpSize = fs.statSync(webpPath).size;

      totalOriginalSize += originalSize;
      totalWebpSize += webpSize;
      converted++;
    } catch (error) {
      console.error(`✗ Failed: ${path.relative(publicDir, image)}`);
      console.error(`  ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 Conversion Summary:');
  console.log('='.repeat(60));
  console.log(`✓ Converted: ${converted} images`);
  console.log(`✗ Failed:    ${failed} images`);
  console.log(`⊘ Skipped:   ${skipped} images (already converted)`);
  console.log('─'.repeat(60));

  if (converted > 0) {
    const totalSavings = ((1 - totalWebpSize / totalOriginalSize) * 100).toFixed(1);
    const originalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const webpMB = (totalWebpSize / 1024 / 1024).toFixed(2);
    const savedMB = ((totalOriginalSize - totalWebpSize) / 1024 / 1024).toFixed(2);

    console.log(`📦 Size reduction: ${totalSavings}%`);
    console.log(`📊 Original size: ${originalMB} MB`);
    console.log(`📊 WebP size:     ${webpMB} MB`);
    console.log(`💾 Space saved:  ${savedMB} MB`);
  }

  console.log('='.repeat(60));
  console.log('\n✅ All done! Your images are now in WebP format.');
  console.log('💡 Tip: Use the WebPPicture component to serve WebP with fallback support.\n');
}

main().catch(console.error);
