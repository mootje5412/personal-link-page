import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconsDir = join(publicDir, "icons");

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6"/>
      <stop offset="50%" style="stop-color:#EC4899"/>
      <stop offset="100%" style="stop-color:#F97316"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0A0A0F"/>
  <circle cx="${size * 0.3}" cy="${size * 0.35}" r="${size * 0.25}" fill="url(#g)" opacity="0.4" filter="url(#blur)"/>
  <circle cx="${size * 0.7}" cy="${size * 0.65}" r="${size * 0.2}" fill="url(#g)" opacity="0.3" filter="url(#blur)"/>
  <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" rx="${size * 0.15}" fill="url(#g)" opacity="0.15"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${size * 0.28}" fill="url(#g)">V</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

await mkdir(iconsDir, { recursive: true });

for (const size of sizes) {
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(join(iconsDir, `icon-${size}x${size}.png`));
}

await sharp(Buffer.from(svg(180)))
  .png()
  .toFile(join(publicDir, "apple-touch-icon.png"));

await writeFile(join(publicDir, "favicon.svg"), svg(32).trim());

console.log("Icons generated successfully");
