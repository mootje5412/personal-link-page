import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

async function generate() {
  const sharp = (await import('sharp')).default;
  const source512 = join(iconsDir, 'icon-512.png');

  await sharp(source512).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
  console.log('PWA icons ready from official Phantom assets');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
