/**
 * Fails when the Impressum still contains placeholders. Run before every
 * production deploy: a site without a valid Impressum is an easy Abmahnung,
 * so a missing name or address must stop the release, not slip through.
 */
import { OWNER } from '../src/data/owner.js';

const missing = Object.entries(OWNER).filter(([, value]) => !value || /\[[^\]]+\]/.test(value));
if (missing.length > 0) {
  console.error(`Impressum incomplete – fill in src/data/owner.js: ${missing.map(([key]) => key).join(', ')}`);
  process.exit(1);
}
console.log('Impressum complete.');
