import { readFileSync, writeFileSync } from 'node:fs';
const path = new URL('../worker-configuration.d.ts', import.meta.url);
const source = readFileSync(path, 'utf8');
// Keep Worker runtime globals (including HTMLRewriter's Element) out of browser scripts.
const marker = '\nexport type { Env };\n';
if (!source.includes(marker)) writeFileSync(path, source + marker);
