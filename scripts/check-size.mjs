#!/usr/bin/env node
// Zero-dependency gzipped-size gate for Jaga's bundle budget.
// Each public entry point is measured independently because the core
// is bundled into both. Run after `npm run build`.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

// Per-entry gzipped budgets, in bytes.
const BUDGETS = {
  'dist/index.js': 3 * 1024, // `jagajs` (core)
  'dist/sanitize.js': 2.5 * 1024, // `jagajs/sanitize`
};

const fmt = (n) => `${(n / 1024).toFixed(2)}KB`;
const rows = [];
let failed = false;

for (const [file, budget] of Object.entries(BUDGETS)) {
  let size;
  try {
    size = gzipSync(readFileSync(resolve(process.cwd(), file))).length;
  } catch {
    console.error(`✖ Missing build output: ${file} — run \`npm run build\` first.`);
    process.exit(1);
  }
  const ok = size <= budget;
  if (!ok) failed = true;
  rows.push({ file, size, budget, ok });
}

console.log('Gzipped bundle sizes:');
for (const { file, size, budget, ok } of rows) {
  console.log(`  ${ok ? '✓' : '✖'} ${file.padEnd(18)} ${fmt(size).padStart(8)} / ${fmt(budget)} budget`);
}

if (failed) {
  console.error('\n✖ Bundle size budget exceeded.');
  process.exit(1);
}
console.log('\n✓ All bundles within budget.');
