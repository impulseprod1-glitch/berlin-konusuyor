/**
 * Fails the build if the output loads anything from hosts that receive
 * visitors' IP addresses without consent. These all appeared in the site
 * before and were removed; this keeps them from creeping back in.
 * Consent-gated embeds (CARTO tiles, youtube-nocookie) are not listed.
 *
 *   node scripts/check-third-party.mjs   (after vite build)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'images.unsplash.com',
  'svgrepo.com',
  'wttr.in',
  'www.youtube.com/embed',
  'localhost:',
];

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

const hits = [];
for (const file of files('dist').filter((f) => /\.(html|js|css|json)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const host of FORBIDDEN) if (text.includes(host)) hits.push(`${file}: ${host}`);
}

if (hits.length > 0) {
  console.error('Third-party resources found in the build:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('No unconsented third-party hosts in dist/.');
