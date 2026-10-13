import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { site } from '../scripts/site-config.mjs';

test('image generation can decode and replace outputs from an earlier build', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'image-generation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = await sharp({
    create: { width: 16, height: 16, channels: 3, background: '#336699' },
  })
    .png()
    .toBuffer();
  for (const job of site.images) {
    await mkdir(dirname(join(root, job.input)), { recursive: true });
    await writeFile(join(root, job.input), source);
  }
  const script = fileURLToPath(
    new URL('../scripts/optimize-images.mjs', import.meta.url),
  );
  const firstBuild = new Map();
  for (let build = 0; build < 2; build++) {
    execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' });
    for (const job of site.images) {
      const bytes = await readFile(join(root, job.output));
      const image = sharp(bytes);
      const metadata = await image.metadata();
      assert.ok(metadata.width > 0 && metadata.height > 0);
      assert.ok((await image.raw().toBuffer()).length > 0);
      if (build === 0) firstBuild.set(job.output, bytes);
      else assert.deepEqual(bytes, firstBuild.get(job.output));
    }
  }
});
