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
async function validate(directory, assets = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await validate(path, assets);
    else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
      const image = sharp(path, { failOn: 'error' });
      const metadata = await image.metadata();
      await image.raw().toBuffer();
      assets.push({
        path,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        format: metadata.format ?? 'unknown',
        bytes: (await stat(path)).size,
      });
    }
  }
  return assets;
}
const assets = await validate('public');
console.log('Media audit: public raster assets decode successfully.');
for (const asset of assets.sort((a, b) => a.path.localeCompare(b.path))) {
  console.log(
    `  ${asset.path}: ${asset.width}x${asset.height} ${asset.format} ${Math.round(asset.bytes / 1024)} KiB`,
  );
}
