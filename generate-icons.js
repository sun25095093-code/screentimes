import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sizes = [
  { name: 'favicon.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 }
];

async function generate() {
  console.log('Generating PWA icons from SVG...');
  for (const item of sizes) {
    const outputPath = path.join(publicDir, item.name);
    await sharp(svgPath)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }
  console.log('All PWA icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
