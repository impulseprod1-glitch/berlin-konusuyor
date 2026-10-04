import { describe, expect, it } from 'vitest';
import { editionSlides, escapeHtml } from '../src/render/templates.ts';
import { SAMPLE_STORIES } from '../src/sample.ts';

describe('editionSlides', () => {
  it('renders a cover plus one slide per story, in order', () => {
    const slides = editionSlides(SAMPLE_STORIES, '2026-10-05');
    expect(slides.map((s) => s.name)).toEqual(['00-cover', '01-story', '02-story', '03-story', '04-story', '05-story']);
    expect(slides[2]!.html).toContain('02 / 05');
  });

  it('never lets story text inject markup', () => {
    const [, slide] = editionSlides([{ ...SAMPLE_STORIES[0]!, headline: '<script>x</script>' }], '2026-10-05');
    expect(slide!.html).not.toContain('<script>x</script>');
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });
});
