import { afterEach, describe, expect, it } from 'vitest';
import { PRESETS } from '../src/scenarios/index.js';
import { catalogHtml, headHtml, pageMeta, pagePath, parsePath, SITE } from '../web/site.js';

describe('the site: addresses, what a page says of itself, the catalogue', () => {
  afterEach(() => (SITE.url = ''));

  it('an address names its page and language, the site may live in a folder', () => {
    expect(parsePath('/')).toEqual({ root: '/', locale: null, route: { page: 'lab' } });
    expect(parsePath('/en/')).toEqual({ root: '/', locale: 'en', route: { page: 'lab' } });
    expect(parsePath('/experiments/')).toEqual({ root: '/', locale: null, route: { page: 'catalog' } });
    expect(parsePath('/Spark/en/experiments/pendulum/')).toEqual({ root: '/Spark/', locale: 'en', route: { page: 'experiment', id: 'pendulum' } });
    expect(parsePath('/Spark/experiments/pendulum/index.html').route).toEqual({ page: 'experiment', id: 'pendulum' });
    // An experiment that is not there: the lab.
    expect(parsePath('/experiments/no-such-thing/').route).toEqual({ page: 'lab' });
    for (const p of PRESETS) for (const l of ['uk', 'en'] as const) expect(parsePath(`/${pagePath({ page: 'experiment', id: p.id }, l)}`).route).toEqual({ page: 'experiment', id: p.id });
  });

  it('every experiment page has its own title and description, in both languages, no longer than a preview shows', () => {
    for (const p of PRESETS)
      for (const l of ['uk', 'en'] as const) {
        const m = pageMeta({ page: 'experiment', id: p.id }, l);
        expect(m.title).toContain(SITE.name);
        expect(m.description.length).toBeGreaterThan(40);
        expect(m.description.length).toBeLessThanOrEqual(200);
        const head = headHtml(m);
        for (const tag of ['og:title', 'og:description', 'og:site_name', 'og:type', 'twitter:card', 'application/ld+json']) expect(head).toContain(tag);
      }
  });

  it('with the site’s address: canonical, both languages and og:url, all absolute', () => {
    SITE.url = 'https://spark.example.org';
    const head = headHtml(pageMeta({ page: 'experiment', id: 'pendulum' }, 'en'));
    expect(head).toContain('<link rel="canonical" href="https://spark.example.org/en/experiments/pendulum/" />');
    expect(head).toContain('hreflang="uk" href="https://spark.example.org/experiments/pendulum/"');
    expect(head).toContain('og:url" content="https://spark.example.org/en/experiments/pendulum/"');
  });

  it('without it nothing relative pretends to be absolute', () => {
    const head = headHtml(pageMeta({ page: 'catalog' }, 'uk'));
    expect(head).not.toContain('canonical');
    expect(head).not.toContain('og:url');
  });

  it('the catalogue links every experiment', () => {
    for (const l of ['uk', 'en'] as const) {
      const html = catalogHtml(l, (path) => `/${path}`);
      for (const p of PRESETS) expect(html).toContain(`href="/${pagePath({ page: 'experiment', id: p.id }, l)}"`);
    }
  });
});
