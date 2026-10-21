/**
 * Footnotes on terms: wherever a term from the glossary appears in a text of the lab (an
 * explanation, the Professor's line, a reference card), its first mention is underlined; hovering,
 * focusing or tapping it shows a short definition. The texts themselves stay plain — this only
 * wraps words in the rendered page.
 */
import { GLOSSARY, termById } from '../src/knowledge/glossary.js';
import { tr, type Locale } from '../src/knowledge/i18n.js';

/** One regular expression per language: every stem at a word start, then any letters (longest first). */
const patterns = new Map<Locale, { re: RegExp; byStem: Map<string, string> }>();
function patternFor(l: Locale) {
  const cached = patterns.get(l);
  if (cached) return cached;
  const byStem = new Map<string, string>();
  for (const t of GLOSSARY) for (const s of t.stems[l]) byStem.set(s.toLowerCase(), t.id);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A stem takes any ending; a «=word» is matched whole.
  const alts = [...byStem.keys()].sort((a, b) => b.length - a.length).map((s) => (s.startsWith('=') ? `${esc(s.slice(1))}(?![\\p{L}])` : `${esc(s)}[\\p{L}’'-]*`));
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts.join('|')})`, 'giu');
  const p = { re, byStem };
  patterns.set(l, p);
  return p;
}

/** Which term a matched word is: by the longest stem it starts with. */
function termOf(word: string, byStem: Map<string, string>): string | undefined {
  const w = word.toLowerCase();
  let best: string | undefined;
  let len = 0;
  for (const [s, id] of byStem) {
    const exact = s.startsWith('=');
    const stem = exact ? s.slice(1) : s;
    if ((exact ? w === stem : w.startsWith(stem)) && stem.length > len) (best = id), (len = stem.length);
  }
  return best;
}

/** Wrap the first mention of each term inside `root` (skipping what is already wrapped, inputs, formulas). */
export function annotate(root: Element, l: Locale): void {
  const { re, byStem } = patternFor(l);
  const seen = new Set<string>(Array.from(root.querySelectorAll<HTMLElement>('.term')).map((e) => e.dataset['term']!));
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
      const id = termOf(m[0], byStem);
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

/** The footnote card: one for the page, placed next to the term; hover, focus or tap shows it. */
export function installFootnotes(locale: () => Locale): void {
  const card = document.createElement('div');
  card.className = 'term-card';
  card.setAttribute('role', 'tooltip');
  card.hidden = true;
  document.body.append(card);
  let current: HTMLElement | null = null;
  const show = (el: HTMLElement) => {
    const t = termById(el.dataset['term'] ?? '');
    if (!t) return;
    current = el;
    card.innerHTML = `<strong>${tr(t.name, locale())}</strong><p>${tr(t.text, locale())}</p>`;
    card.hidden = false;
    const r = el.getBoundingClientRect();
    const w = Math.min(320, window.innerWidth - 24);
    card.style.width = `${w}px`;
    card.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2))}px`;
    const below = r.bottom + 8;
    card.style.top = `${below + card.offsetHeight > window.innerHeight - 8 ? Math.max(8, r.top - card.offsetHeight - 8) : below}px`;
  };
  const hide = () => {
    card.hidden = true;
    current = null;
  };
  document.addEventListener('mouseover', (e) => {
    const el = (e.target as Element | null)?.closest?.('.term') as HTMLElement | null;
    if (el) show(el);
    else if (current && !(e.target as Element).closest?.('.term-card')) hide();
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
}
