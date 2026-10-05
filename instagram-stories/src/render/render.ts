import { chromium } from 'playwright-core';
import type { SlideSource } from './templates.ts';

export interface RenderedSlide {
  name: string;
  jpeg: Buffer;
  /** data-fit blocks whose text still overflowed at the minimum size. */
  overflow: string[];
}

/**
 * Uses the system Google Chrome (preinstalled on GitHub's Ubuntu runners), so
 * CI does not download a browser every morning. CHROME_PATH overrides it.
 */
export async function renderSlides(slides: SlideSource[]): Promise<RenderedSlide[]> {
  const executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : { channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const rendered: RenderedSlide[] = [];
    for (const slide of slides) {
      await page.setContent(slide.html, { waitUntil: 'load' });
      const overflow = (await page.evaluate('window.__ready()')) as string[];
      // Instagram story containers accept JPEG only.
      const jpeg = await page.screenshot({ type: 'jpeg', quality: 92 });
      rendered.push({ name: slide.name, jpeg, overflow });
    }
    return rendered;
  } finally {
    await browser.close();
  }
}
