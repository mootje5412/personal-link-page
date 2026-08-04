import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const iconsDir = join(dir, "icons");

const svg = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#030308"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.32}" fill="url(#g)" opacity="0.2"/>
  <path d="M${size*0.35} ${size*0.3} L${size*0.65} ${size*0.3} L${size*0.72} ${size*0.55} L${size*0.5} ${size*0.75} L${size*0.28} ${size*0.55} Z" fill="url(#g)"/>
</svg>`;

await mkdir(iconsDir, { recursive: true });
for (const s of [192, 512]) {
  await sharp(Buffer.from(svg(s))).png().toFile(join(iconsDir, `icon-${s}.png`));
}
await sharp(Buffer.from(svg(180))).png().toFile(join(dir, "apple-touch-icon.png"));
await writeFile(join(dir, "favicon.svg"), svg(32));
console.log("Icons generated");
