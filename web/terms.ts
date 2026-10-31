/**
 * Footnotes on terms: wherever a term from the glossary appears in a text of the lab (an
 * explanation, the Professor's line, a reference card), its first mention is underlined; hovering,
 * focusing or tapping it shows a short definition. The texts themselves stay plain — this only
 * wraps words in the rendered page.
 */
import { termById, termMatcher, type TermMatcher } from '../src/knowledge/glossary.js';
import { tr, type Locale } from '../src/knowledge/i18n.js';
import { getSource } from '../src/knowledge/sources.js';
import { LAB_GLOSSARY } from '../src/scenarios/lab-knowledge.js';

const matchers = new Map<Locale, TermMatcher>();
const matcherFor = (l: Locale): TermMatcher => matchers.get(l) ?? matchers.set(l, termMatcher(LAB_GLOSSARY, l)).get(l)!;

/** Wrap the first mention of each term inside `root` (skipping what is already wrapped, inputs, formulas). */
export function annotate(root: Element, l: Locale, skip?: string): void {
  const { re, termOf } = matcherFor(l);
  const seen = new Set<string>(Array.from(root.querySelectorAll<HTMLElement>('.term')).map((e) => e.dataset['term']!));
  if (skip) seen.add(skip);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || p.closest('.term, button, select, option, input, textarea, script, style, .bl-formula, .bl-numbers, code, pre, svg')) return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  for (const node of nodes) {
    const text = node.nodeValue!;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    let last = 0;
    const frag = document.createDocumentFragment();
    let changed = false;
    while ((m = re.exec(text))) {
      const id = termOf(m[0]);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      changed = true;
      frag.append(text.slice(last, m.index));
      const span = document.createElement('span');
      span.className = 'term';
      span.tabIndex = 0;
      span.dataset['term'] = id;
      span.textContent = m[0];
      frag.append(span);
      last = m.index + m[0].length;
    }
    if (!changed) continue;
    frag.append(text.slice(last));
    node.replaceWith(frag);
  }
}

const ALL_TERMS: Record<Locale, string> = { uk: 'Відкрити в глосарії →', en: 'Open in the glossary →' };
const SOURCE: Record<Locale, string> = { uk: 'Джерело', en: 'Source' };
const PHOTO: Record<Locale, string> = { uk: 'Фото', en: 'Photo' };

/** A term's source as a link: «Джерело: en.wikipedia.org» (opens in a new tab); '' when it has none. `photo` — «Фото: …». */
export function termSourceHtml(id: string | undefined, l: Locale, photo = false): string {
  const s = id ? getSource(id as never) : undefined;
  if (!s?.url) return '';
  const host = new URL(s.url).hostname.replace(/^www\./, '');
  const attr = (x: string) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<a class="term-source" href="${attr(s.url)}" target="_blank" rel="noopener" title="${attr(s.title)}">${(photo ? PHOTO : SOURCE)[l]}: ${host}</a>`;
}

/** The footnote card: one for the page, placed next to the term; hover, focus or tap shows it. */
/** `glossary` — the address of a term on the glossary's page. */
export function installFootnotes(locale: () => Locale, glossary: (id: string) => string): void {
  const card = document.createElement('div');
  card.className = 'term-card';
  card.setAttribute('role', 'tooltip');
  card.hidden = true;
  document.body.append(card);
  let current: HTMLElement | null = null;
  const show = (el: HTMLElement) => {
    // (Already showing this one: leave it where it is.)
    if (current === el && !card.hidden) return;
    const t = termById(el.dataset['term'] ?? '', LAB_GLOSSARY);
    if (!t) return;
    current = el;
    card.innerHTML = `<strong>${tr(t.name, locale())}</strong><p>${tr(t.text, locale())}</p>${termSourceHtml(t.source, locale())}${termSourceHtml(t.photo, locale(), true)}${t.reference ? '' : `<a href="${glossary(t.id)}" class="term-more">${ALL_TERMS[locale()]}</a>`}`;
    card.hidden = false;
    const r = el.getBoundingClientRect();
    const w = Math.min(320, window.innerWidth - 24);
    card.style.width = `${w}px`;
    card.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2))}px`;
    const below = r.bottom + 8;
    card.style.top = `${below + card.offsetHeight > window.innerHeight - 8 ? Math.max(8, r.top - card.offsetHeight - 8) : below}px`;
  };
  let hideTimer = 0;
  const hide = () => {
    window.clearTimeout(hideTimer);
    card.hidden = true;
    current = null;
  };
  /** Off the term, the card waits a moment: time to move the pointer onto it (to the glossary link). */
  const HIDE_AFTER = 600;
  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element | null)?.closest?.('.term') as HTMLElement | null;
    const onCard = !!(e.target as Element).closest?.('.term-card');
    if (el || onCard) window.clearTimeout(hideTimer);
    if (el) show(el);
    else if (current && !onCard) {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hide, HIDE_AFTER);
    }
  });
  document.addEventListener('focusin', (e) => {
    const el = (e.target as Element | null)?.closest?.('.term') as HTMLElement | null;
    if (el) show(el);
  });
  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest?.('.term') as HTMLElement | null;
    if (el) {
      if (current === el && !card.hidden) hide();
      else show(el);
    } else if (!(e.target as Element).closest?.('.term-card')) hide();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && hide());
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('hashchange', hide);
}
