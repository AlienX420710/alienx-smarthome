import { readFileSync } from 'node:fs';
export const site = JSON.parse(
  readFileSync(new URL('../engineering.config.json', import.meta.url), 'utf8'),
);
if (
  !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(site.repository) ||
  !/^[a-z][a-z0-9-]*$/.test(site.releaseRefPrefix)
)
  throw Error('Invalid engineering site identity');
