import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/*
 * Fonts are inlined as data URIs so a slide renders identically on any
 * machine, with no network access and no system fonts involved. Turkish
 * needs latin-ext (ğ, ş, İ), hence two subsets per face.
 */

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

interface Face {
  family: string;
  pkg: string;
  style: 'normal' | 'italic';
  /** File name with a {subset} placeholder. */
  file: string;
}

const FACES: Face[] = [
  { family: 'Fraunces', pkg: '@fontsource-variable/fraunces', style: 'normal', file: 'fraunces-{subset}-full-normal.woff2' },
  { family: 'Fraunces', pkg: '@fontsource-variable/fraunces', style: 'italic', file: 'fraunces-{subset}-full-italic.woff2' },
  { family: 'Inter', pkg: '@fontsource-variable/inter', style: 'normal', file: 'inter-{subset}-opsz-normal.woff2' },
];

let cached: string | undefined;

export function fontFaceCss(): string {
  if (cached) return cached;
  const rules: string[] = [];
  for (const face of FACES) {
    for (const [subset, range] of [['latin', LATIN], ['latin-ext', LATIN_EXT]] as const) {
      const name = face.file.replace('{subset}', subset);
      const path = fileURLToPath(new URL(`../../node_modules/${face.pkg}/files/${name}`, import.meta.url));
      const data = readFileSync(path).toString('base64');
      rules.push(
        `@font-face{font-family:'${face.family}';font-style:${face.style};font-weight:100 900;` +
          `src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${range};}`,
      );
    }
  }
  cached = rules.join('\n');
  return cached;
}
