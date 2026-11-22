import { relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const version = readFileSync(new URL('VERSION', root), 'utf8').trim();
const dist = fileURLToPath(new URL('dist/', root));
const assets = readdirSync(dist, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => relative(dist, entry.parentPath + sep + entry.name).split(sep).join('/'))
  .filter(name => name !== 'sw.js')
  .sort();
const template = readFileSync(new URL('scripts/sw-template.js', root), 'utf8');
const output = template.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(assets, null, 2));
const target = new URL('dist/sw.js', root);
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Run node scripts/build-offline.mjs before release');
} else writeFileSync(target, output);
