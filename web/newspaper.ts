/**
 * "By the way!.." — the Professor's newspaper. When nobody has done anything
 * for a while, he remembers something and a page of an old newspaper opens
 * with a short piece: who was born on this day (a scientist or an inventor),
 * or a note on a substance or a scientist from the lab itself.
 *
 * The text is fetched live from Wikipedia each time and stored nowhere; the
 * page names the article and its license (CC BY-SA). Without the internet the
 * Professor tells a story from the history of the lab's own laws — those are
 * Spark's texts with sourced dates.
 */
import { COMPONENTS } from '../src/components/index.js';
import { tr, type Locale } from '../src/knowledge/i18n.js';
import { textFor, type Level } from '../src/knowledge/levels.js';
import { getSource } from '../src/knowledge/sources.js';
import type { LawSpec } from '../src/knowledge/types.js';

export interface Article {
  /** The line over the headline: "20 жовтня 1891 року — день народження". */
  readonly kicker: string;
  readonly title: string;
  readonly text: string;
  readonly image?: string;
  readonly source: { readonly label: string; readonly url?: string };
}

const MONTHS_UK = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dateLine = (d: Date, l: Locale) => (l === 'uk' ? `${d.getDate()} ${MONTHS_UK[d.getMonth()]}` : `${MONTHS_EN[d.getMonth()]} ${d.getDate()}`);

/** Who counts as a person of science in a short Wikipedia description. */
const SCIENCE = /фізик|хімік|математик|астроном|винахідник|біолог|біохімік|геолог|інженер|природознав|науковець|physicist|chemist|mathematician|astronomer|inventor|biologist|biochemist|geologist|engineer|naturalist|scientist/i;
/** Ukraine first: no pieces about Russian or Soviet figures. */
const SKIP = /російськ|радянськ|\bросі|russian|soviet/i;

async function getJson(url: string, ms = 6000): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

interface Summary {
  readonly type?: string;
  readonly title: string;
  readonly description?: string;
  readonly extract?: string;
  readonly thumbnail?: { readonly source: string };
  readonly content_urls?: { readonly desktop?: { readonly page?: string } };
}

/** Articles already shown in this visit (kept in memory only): the next newspaper is a new one. */
const shown = new Set<string>();

/** The lead of a Wikipedia article (the REST "summary"). */
async function summary(lang: Locale, title: string): Promise<Summary | null> {
  if (shown.has(`${lang}:${title}`)) return null;
  const s = (await getJson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)) as Summary;
  if (!s?.extract || s.type === 'disambiguation' || s.extract.length < 60) return null;
  if (SKIP.test(`${s.description ?? ''} ${s.extract.slice(0, 220)}`)) return null;
  shown.add(`${lang}:${title}`);
  return s;
}

/** About a newspaper column: whole sentences up to ~900 characters. */
function column(text: string, max = 900): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return end > 200 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

const fromSummary = (s: Summary, kicker: string, lang: Locale): Article => ({
  kicker,
  title: s.title,
  text: column(s.extract!),
  ...(s.thumbnail?.source ? { image: s.thumbnail.source } : {}),
  source: { label: lang === 'uk' ? `Вікіпедія, стаття «${s.title}» (CC BY-SA 4.0)` : `Wikipedia, “${s.title}” (CC BY-SA 4.0)`, ...(s.content_urls?.desktop?.page ? { url: s.content_urls.desktop.page } : {}) },
});

const pick = <T>(a: readonly T[]): T | undefined => a[Math.floor(Math.random() * a.length)];

/** A scientist or an inventor born on this day. */
async function bornToday(lang: Locale, now: Date): Promise<Article | null> {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const feed = (await getJson(`https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/births/${mm}/${dd}`)) as { births?: { year: number; text: string; pages: { titles: { normalized: string }; description?: string }[] }[] };
  const people = (feed.births ?? []).filter((b) => {
    const about = `${b.text} ${b.pages[0]?.description ?? ''}`;
    return b.pages[0] && SCIENCE.test(about) && !SKIP.test(about) && !shown.has(`${lang}:${b.pages[0].titles.normalized}`);
  });
  const b = pick(people);
  if (!b) return null;
  const s = await summary(lang, b.pages[0]!.titles.normalized);
  if (!s) return null;
  const kicker = lang === 'uk' ? `${dateLine(now, lang)} ${b.year} року — день народження` : `Born on this day, ${dateLine(now, lang)} ${b.year}`;
  return fromSummary(s, kicker, lang);
}

/** A substance or a scientist from the lab itself (by its Wikidata id). */
async function labTopic(lang: Locale, ids: readonly string[]): Promise<Article | null> {
  const q = pick(ids);
  if (!q) return null;
  const w = (await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${q}&props=sitelinks&sitefilter=${lang}wiki&format=json&origin=*`)) as { entities?: Record<string, { sitelinks?: Record<string, { title: string }> }> };
  const title = w.entities?.[q]?.sitelinks?.[`${lang}wiki`]?.title;
  if (!title) return null;
  const s = await summary(lang, title);
  return s ? fromSummary(s, lang === 'uk' ? 'Наукова довідка' : 'A science note', lang) : null;
}

/** Without the internet: a story from the history of one of the lab's laws (Spark's own sourced text). */
export function offlineArticle(laws: readonly LawSpec[], lang: Locale, level: Level): Article {
  const law = pick(laws.filter((l) => l.history.people.length)) ?? laws[0]!;
  const people = law.history.people.map((p) => `${tr(p.name, lang)} (${p.born}–${p.died})`).join(', ');
  const sources = [...new Set(law.history.citations.map((c) => getSource(c.source)?.title).filter(Boolean))].join('; ');
  return {
    kicker: lang === 'uk' ? `З історії науки · ${law.history.when}` : `From the history of science · ${law.history.when}`,
    title: tr(law.name, lang),
    text: `${tr(textFor(law.history.story, level), lang)}${people ? `\n\n${people}.` : ''}`,
    source: { label: `Spark${sources ? ` · ${lang === 'uk' ? 'за джерелами' : 'sources'}: ${sources}` : ''}` },
  };
}

/** Wikidata ids of everything in the lab that has an article: substances and the people behind its laws. */
export function labTopics(laws: readonly LawSpec[]): string[] {
  const ids = new Set<string>();
  for (const c of Object.values(COMPONENTS)) if (c.wikidata) ids.add(c.wikidata);
  for (const l of laws) for (const p of l.history.people) ids.add(p.wikidata);
  return [...ids];
}

/** Something to read: born today or a lab topic, a few tries; the history of a law when offline. */
export async function fetchArticle(lang: Locale, laws: readonly LawSpec[], level: Level, now = new Date()): Promise<Article> {
  const ids = labTopics(laws);
  const tries: (() => Promise<Article | null>)[] = Math.random() < 0.5 ? [() => bornToday(lang, now), () => labTopic(lang, ids), () => labTopic(lang, ids), () => labTopic(lang, ids)] : [() => labTopic(lang, ids), () => bornToday(lang, now), () => labTopic(lang, ids), () => labTopic(lang, ids)];
  for (const t of tries) {
    try {
      const a = await t();
      if (a) return a;
    } catch {
      // No network, a timeout, an odd answer: try the next one, then tell a story offline.
    }
  }
  return offlineArticle(laws, lang, level);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** The page of the old newspaper. */
export function paperHtml(a: Article, l: Locale, now = new Date()): string {
  const uk = l === 'uk';
  const paras = a.text.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join('');
  return `<article class="paper">
    <header class="paper-mast">
      <div class="paper-meta"><span>${uk ? 'Лабораторія Spark' : 'Spark Laboratory'}</span><span>${esc(dateLine(now, l))}</span><span>${uk ? 'Ціна: безкоштовно' : 'Price: free'}</span></div>
      <h2 class="paper-name">${uk ? 'Науковий вісник' : 'The Science Gazette'}</h2>
    </header>
    <p class="paper-kicker">${esc(a.kicker)}</p>
    <h3 class="paper-title">${esc(a.title)}</h3>
    <div class="paper-body">${a.image ? `<figure class="paper-fig"><img src="${esc(a.image)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"/></figure>` : ''}${paras}</div>
    <footer class="paper-source">${a.source.url ? `<a href="${esc(a.source.url)}" target="_blank" rel="noopener">${esc(a.source.label)}</a>` : esc(a.source.label)}</footer>
  </article>`;
}
