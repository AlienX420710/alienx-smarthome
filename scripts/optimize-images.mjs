import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

// Preserve the original artwork and create a reproducible, smaller social image.
const source = 'public/alienx-social-preview.jpg';
const output = 'public/alienx-social-preview.webp';
const inputStat = await stat(source);
const outputStat = await stat(output).catch(() => null);
if (!outputStat || outputStat.mtimeMs < inputStat.mtimeMs) {
  await sharp(source)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(output);
}
async function validate(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await validate(path);
    else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
      await sharp(path, { failOn: 'error' }).raw().toBuffer();
    }
  }
}
await validate('public');
console.log(
  'Social image generated; public raster images decoded successfully.',
);
