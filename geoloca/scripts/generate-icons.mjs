import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

function createSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#042f2e"/>
  <circle cx="256" cy="256" r="170" fill="url(#g)" opacity="0.25"/>
  <circle cx="256" cy="220" r="72" fill="url(#g)" stroke="#ecfdf5" stroke-width="16"/>
  <path d="M256 292 L256 390" stroke="#ecfdf5" stroke-width="18" stroke-linecap="round"/>
  <circle cx="256" cy="220" r="24" fill="#ecfdf5"/>
</svg>`;
}

writeFileSync(join(iconsDir, 'icon.svg'), createSvg(512));

async function generate() {
  const sharp = (await import('sharp')).default;
  for (const size of [192, 512]) {
    await sharp(Buffer.from(createSvg(size)))
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));
  }
  console.log('Icons generated in public/icons');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
