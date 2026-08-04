import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const svg = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#000"/>
  <rect x="${size*0.25}" y="${size*0.25}" width="${size*0.5}" height="${size*0.5}" rx="${size*0.08}" fill="none" stroke="#fff" stroke-width="${size*0.02}"/>
  <path d="M${size*0.5} ${size*0.32} L${size*0.62} ${size*0.55} L${size*0.38} ${size*0.55} Z" fill="#fff"/>
</svg>`;

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const iconsDir = join(dir, "icons");
await mkdir(iconsDir, { recursive: true });
for (const s of [192, 512]) {
  await sharp(Buffer.from(svg(s))).png().toFile(join(iconsDir, `icon-${s}.png`));
}
await sharp(Buffer.from(svg(180))).png().toFile(join(dir, "apple-touch-icon.png"));
await writeFile(join(dir, "favicon.svg"), svg(32));
console.log("Icons generated");
