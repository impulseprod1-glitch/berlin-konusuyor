/**
 * Downloads the Unsplash photos the site references into public/img/stock/.
 *
 * The site used to hotlink images.unsplash.com, which hands every visitor's
 * IP address to a third party before consent. The photos are now served from
 * our own domain. Unsplash's licence allows that, no attribution required.
 *
 * The references themselves are the source of truth: every
 * "/img/stock/photo-<id>.jpg" in the code is fetched once. The files are not
 * committed; the deploy workflow runs this before `vite build`.
 *
 *   node scripts/stock-images.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/img/stock';
const SCAN = ['index.html', 'admin.html', 'profile.html', 'src', 'public/data'];
const REF = /\/img\/stock\/(photo-[A-Za-z0-9-]+)\.jpg/g;

function files(path) {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((name) => files(join(path, name)));
}

const ids = new Set();
for (const root of SCAN.filter((p) => existsSync(p))) {
  for (const file of files(root).filter((f) => /\.(html|js|css|json)$/.test(f))) {
    for (const match of readFileSync(file, 'utf8').matchAll(REF)) ids.add(match[1]);
  }
}

mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const id of ids) {
  const target = join(OUT, `${id}.jpg`);
  if (existsSync(target)) continue;
  const res = await fetch(`https://images.unsplash.com/${id}?w=1200&q=80&fm=jpg&fit=crop`);
  if (!res.ok) {
    console.error(`✗ ${id}: HTTP ${res.status}`);
    failed++;
    continue;
  }
  writeFileSync(target, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${id}`);
}
console.log(`${ids.size} stock images referenced, ${failed} failed`);
// A missing photo degrades to the card's background colour, so it should not
// block a deploy; it is reported above.
