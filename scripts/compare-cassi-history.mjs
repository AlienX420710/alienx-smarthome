import {
  inventory as sharedInventory,
  runInventoryCli,
} from './reference-history.mjs';

const options = {
  referenceRepository: 'Cassileigh/cleaning-by-cassi',
  referenceTitle: 'Cleaning by Cassi',
  siteTitle: 'AlienX',
  requestContract: 'ai-context.md#inquiry-security-contract',
  wrapper: 'compare-cassi-history.mjs',
  outputFile: 'cassi-commit-inventory.md',
  mirrorName: 'cassi-reference.git',
};

export const inventory = (reference, date) =>
  sharedInventory(reference, date, options);
await runInventoryCli(import.meta.url, options);
