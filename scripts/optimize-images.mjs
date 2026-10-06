import { site } from './site-config.mjs';
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
// Decode every shipped raster before generation: metadata alone misses corruption.
for (const file of await readdir('public', { recursive: true })) {
  if (/\.(png|jpe?g|webp|avif)$/i.test(file)) {
    const path = `public/${file}`;
    const image = sharp(path, { failOn: 'error' });
    const metadata = await image.metadata();
    await image.raw().toBuffer();
    console.log(
      `${path}: ${metadata.width}x${metadata.height} ${metadata.format} ${Math.round((await stat(path)).size / 1024)} KiB`,
    );
  }
}
for (const job of site.images) {
  let image = sharp(job.input);
  if (job.rotate) image = image.rotate();
  image = image.resize(job.resize);
  await image[job.format](job.options).toFile(job.output);
}
console.log('Public raster decoding and configured image generation passed.');
