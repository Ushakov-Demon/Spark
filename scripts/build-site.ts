/**
 * Writes the site's pages from the built lab (dist-web/index.html): the lab itself, the catalogue of all
 * experiments and one page per experiment, in Ukrainian and in English (/en/…), each with its own title,
 * description, link preview (Open Graph) and structured data — and the description itself in the HTML.
 * Search engines and the previews of shared links read the HTML as it comes and run no scripts; people
 * get the same lab, the experiment chosen. Plus sitemap.xml and robots.txt.
 *
 *   npm run web:build                       (the site's address: SPARK_SITE_URL=https://… npm run web:build)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LOCALES, type Locale } from '../src/knowledge/i18n.js';
import { PRESETS } from '../src/scenarios/index.js';
import { labSheetHtml, predictsFirst } from '../web/experiment-sheet.js';
import { catalogHtml, headHtml, pageMeta, pagePath, SITE, type Route } from '../web/site.js';

const OUT = 'dist-web';
if (process.env['SPARK_SITE_URL']) SITE.url = process.env['SPARK_SITE_URL'];
if (process.env['SPARK_SITE_IMAGE']) SITE.image = process.env['SPARK_SITE_IMAGE'];

const template = readFileSync(join(OUT, 'index.html'), 'utf8');
const swap = (html: string, from: string | RegExp, to: string) => {
  if (typeof from === 'string' ? !html.includes(from) : !from.test(html)) throw new Error(`build-site: the template has no ${String(from)} — run the whole «npm run web:build» (this script rewrites dist-web/index.html; the template is the fresh one from vite), or did web/index.html change?`);
  return html.replace(from, () => to);
};

function page(route: Route, l: Locale): string {
  const path = pagePath(route, l);
  // The pages lie in folders (experiments/melt-ice/): the lab's files are reached from there.
  const up = '../'.repeat(path.split('/').filter(Boolean).length);
  let html = template.replaceAll('"./assets/', `"${up}assets/`);
  html = swap(html, /<html lang="[^"]*">/, `<html lang="${l}">`);
  // The header's link to all the experiments, from here and in this page's language (the lab sets it again, the same).
  html = swap(html, '<a id="catalog-open" class="library-open" href="/experiments/">', `<a id="catalog-open" class="library-open" href="${up}${pagePath({ page: 'catalog' }, l)}">`);
  html = swap(html, /<!--site:head-->[\s\S]*?<!--\/site:head-->/, headHtml(pageMeta(route, l)));
  if (route.page === 'catalog') {
    html = swap(html, '<body>', '<body class="in-catalog">');
    html = swap(html, '<section id="catalog" class="catalog" hidden><!--site:catalog-->', `<section id="catalog" class="catalog">${catalogHtml(l, (to) => `${up}${to}`)}`);
  }
  if (route.page === 'experiment') {
    const p = PRESETS.find((x) => x.id === route.id)!;
    // Its description, for robots, where people read it: in the notebook window (closed till «ⓘ»; the lab writes it there again when opened).
    const sheet = labSheetHtml(p, l, { predicting: predictsFirst(p), actions: '' });
    html = swap(html, '<div id="lab-sheet-body"><!--site:experiment-->', `<div id="lab-sheet-body">${sheet}`);
  }
  return html;
}

const routes: Route[] = [{ page: 'lab' }, { page: 'catalog' }, ...PRESETS.map((p) => ({ page: 'experiment', id: p.id }) as const)];
let count = 0;
for (const l of LOCALES) {
  for (const r of routes) {
    const file = join(OUT, pagePath(r, l), 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page(r, l));
    count++;
  }
}

// The sitemap needs the site's full address; without it robots still find every page by the links.
const base = SITE.url.replace(/\/$/, '');
if (base) {
  const url = (r: Route) => `  <url>\n    <loc>${base}/${pagePath(r, 'uk')}</loc>\n${LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${base}/${pagePath(r, l)}"/>`).join('\n')}\n  </url>`;
  const all = routes.flatMap((r) => LOCALES.map((l) => ({ r, l })));
  writeFileSync(
    join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${all.map(({ r, l }) => url(r).replace(`${base}/${pagePath(r, 'uk')}</loc>`, `${base}/${pagePath(r, l)}</loc>`)).join('\n')}\n</urlset>\n`,
  );
}
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
console.log(`build-site: ${count} pages${base ? `, sitemap for ${base}` : ' (no SPARK_SITE_URL: no sitemap, canonical or og:url)'}`);
