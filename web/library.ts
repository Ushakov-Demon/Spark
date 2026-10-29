/**
 * The lab's library ("Довідник"): a page of its own beside the lab, with a link for each part —
 * /glossary/ (every term the footnotes explain), /substances/ (everything on the shelf),
 * /equipment/ (every device and vessel). Read from the same data the lab uses: a new term,
 * substance or device appears here by itself. A card opens the full reference card.
 */
import { COMPONENTS, type ComponentId } from '../src/components/index.js';
import { EQUIPMENT } from '../src/equipment/catalog.js';
import { CATEGORIES } from '../src/equipment/taxonomy.js';
import type { CategoryId, EquipmentItem } from '../src/equipment/types.js';
import { tr, type Locale } from '../src/knowledge/i18n.js';
import { getSource } from '../src/knowledge/sources.js';
import { textFor, type Level } from '../src/knowledge/levels.js';
import { LAB_GLOSSARY } from '../src/scenarios/lab-knowledge.js';
import { SUBSTANCE_FAMILIES, SUBSTANCES } from '../src/substances/catalog.js';
import type { SubstanceItem } from '../src/substances/types.js';

/** A term's source under its text: «Джерело: en.wikipedia.org» (the full title on hover); `photo` — «Фото: …». */
function sourceLink(id: string | undefined, l: Locale, photo = false): string {
  const s = id ? getSource(id as never) : undefined;
  if (!s?.url) return '';
  return `<p class="lib-source"><a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${photo ? (l === 'uk' ? 'Фото' : 'Photo') : l === 'uk' ? 'Джерело' : 'Source'}: ${esc(new URL(s.url).hostname.replace(/^www\./, ''))}</a></p>`;
}

export const LIBRARY_PAGES = ['glossary', 'substances', 'equipment'] as const;
export type LibraryPage = (typeof LIBRARY_PAGES)[number];

/** An old address, "#glossary/cathode" (the library was once on the lab's page) → the page and the item on it; anything else — null. */
export function libraryRoute(hash: string): { page: LibraryPage; item?: string } | null {
  const [page, item] = hash.replace(/^#/, '').split('/') as [string, string | undefined];
  if (!(LIBRARY_PAGES as readonly string[]).includes(page)) return null;
  return item ? { page: page as LibraryPage, item: decodeURIComponent(item) } : { page: page as LibraryPage };
}

export const LIBRARY_UI: Record<Locale, { open: string; law: string; title: string; back: string; search: string; more: string; nothing: string; allTerms: string; tabs: Record<LibraryPage, string>; intro: Record<LibraryPage, string>; count: (n: number) => string }> = {
  uk: {
    open: 'Довідник',
    law: 'закон',
    title: 'Довідник лабораторії',
    back: '← До лабораторії',
    search: 'Пошук…',
    more: 'Довідка →',
    nothing: 'Нічого не знайдено.',
    allTerms: 'Усі терміни →',
    tabs: { glossary: 'Глосарій', substances: 'Речовини й матеріали', equipment: 'Обладнання' },
    intro: {
      glossary: 'Терміни й закони, які трапляються в лабораторії. У текстах дослідів вони підкреслені пунктиром: торкніться слова, щоб побачити пояснення.',
      substances: 'Усе, що є на полиці лабораторії. У довідці кожної речовини — її властивості, умови, за яких їх виміряно, і джерела.',
      equipment: 'Прилади й посуд, з якими можна працювати в лабораторії, з їхніми характеристиками.',
    },
    count: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'запис' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'записи' : 'записів'}`,
  },
  en: {
    open: 'Library',
    law: 'law',
    title: 'Lab library',
    back: '← Back to the lab',
    search: 'Search…',
    more: 'Details →',
    nothing: 'Nothing found.',
    allTerms: 'All terms →',
    tabs: { glossary: 'Glossary', substances: 'Substances and materials', equipment: 'Equipment' },
    intro: {
      glossary: 'Terms and laws you meet in the lab. In the experiments’ texts they are underlined with dots: tap a word to see what it means.',
      substances: 'Everything on the lab’s shelf. Each substance’s card gives its properties, the conditions they were measured under, and the sources.',
      equipment: 'The devices and vessels you can work with in the lab, with their specifications.',
    },
    count: (n) => `${n} ${n === 1 ? 'entry' : 'entries'}`,
  },
};

interface Ctx {
  readonly locale: Locale;
  readonly level: Level;
  /** The shelf's picture of a substance (bottle, block, ball). */
  readonly picOf: (s: SubstanceItem) => string;
  /** A device's icon (drawn by the lab: the icons come with its build). */
  readonly iconOf: (look: EquipmentItem['look']) => string;
  /** The addresses of the library's pages and of the lab. */
  readonly href: (to: LibraryPage | 'lab') => string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const other = (l: Locale): Locale => (l === 'uk' ? 'en' : 'uk');

/** Glossary: alphabetical, a letter bar on top; each term also named in the other language. */
function glossaryHtml(c: Ctx): string {
  const u = LIBRARY_UI[c.locale];
  const terms = [...LAB_GLOSSARY].sort((a, b) => tr(a.name, c.locale).localeCompare(tr(b.name, c.locale), c.locale));
  const letters = [...new Set(terms.map((x) => tr(x.name, c.locale)[0]!.toUpperCase()))];
  const bar = `<nav class="lib-letters">${letters.map((l) => `<a href="#letter-${encodeURIComponent(l)}">${esc(l)}</a>`).join('')}</nav>`;
  const groups = letters
    .map((l) => {
      const items = terms
        .filter((x) => tr(x.name, c.locale)[0]!.toUpperCase() === l)
        .map(
          (x) => `<article class="lib-term lib-entry" id="term-${x.id}" data-term-id="${x.id}">
  <h3><a href="#${x.id}" class="lib-anchor">${esc(tr(x.name, c.locale))}</a> <span class="muted lib-other" lang="${other(c.locale)}">${esc(tr(x.name, other(c.locale)))}</span>${x.law ? ` <span class="lib-badge">${esc(u.law)}</span>` : ''}</h3>
  <p class="lib-desc">${esc(tr(x.text, c.locale))}</p>${x.more ? `<p class="lib-desc lib-more">${esc(tr(x.more, c.locale))}</p>` : ''}${sourceLink(x.source, c.locale)}${sourceLink(x.photo, c.locale, true)}
</article>`,
        )
        .join('');
      return `<section class="lib-group" id="letter-${esc(l)}"><h2 class="lib-letter">${esc(l)}</h2>${items}</section>`;
    })
    .join('');
  return bar + groups;
}

const formulaOf = (s: SubstanceItem): string => (s.component ? (COMPONENTS[s.component as ComponentId]?.formula ?? '') : '');

/** Substances: by the shelf's families, a card each. */
function substancesHtml(c: Ctx): string {
  const u = LIBRARY_UI[c.locale];
  const uk = c.locale === 'uk';
  const num = (x: number) => x.toLocaleString(c.locale === 'uk' ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 1 });
  return SUBSTANCE_FAMILIES.map((f) => {
    const items = Object.values(SUBSTANCES).filter((x) => f.categories.includes(x.category));
    if (!items.length) return '';
    const cards = items
      .map((x) => {
        const facts = [
          x.melt ? `${uk ? 'плавиться' : 'melts'} ${num(x.melt.point.value)} °C` : x.freezing ? `${uk ? 'замерзає' : 'freezes'} ${num(x.freezing.point.value)} °C` : null,
          x.boiling ? `${uk ? 'кипить' : 'boils'} ${num(x.boiling.point.value)} °C` : null,
          `ρ ${num(x.liquid.density.value)} ${uk ? 'кг/м³' : 'kg/m³'}`,
        ].filter((f): f is string => !!f);
        const formula = formulaOf(x);
        return `<article class="lib-card lib-entry" id="item-${x.id}">
  <div class="lib-pic">${c.picOf(x)}</div>
  <div class="lib-body">
    <h3>${esc(tr(x.name, c.locale))}${formula ? ` <span class="lib-formula">${esc(formula)}</span>` : ''}</h3>
    <p class="lib-desc">${esc(tr(textFor(x.description, c.level), c.locale))}</p>
    <p class="lib-facts muted small">${facts.map(esc).join(' · ')}</p>
    <button type="button" class="link" data-ref="substance:${x.id}">${esc(u.more)}</button>
  </div>
</article>`;
      })
      .join('');
    return `<section class="lib-group"><h2>${esc(tr(f.name, c.locale))}</h2><div class="lib-grid">${cards}</div></section>`;
  }).join('');
}

/** Equipment: by the taxonomy's leaves (household / laboratory heaters, vessels…), a card each. */
function equipmentHtml(c: Ctx): string {
  const u = LIBRARY_UI[c.locale];
  const leaves = CATEGORIES.filter((cat) => EQUIPMENT.some((i) => i.category === cat.id));
  return leaves
    .map((cat) => {
      const cards = EQUIPMENT.filter((i) => i.category === (cat.id as CategoryId))
        .map(
          (i) => `<article class="lib-card lib-entry" id="item-${i.id}">
  <div class="lib-pic">${c.iconOf(i.look)}</div>
  <div class="lib-body">
    <h3>${esc(tr(i.name, c.locale))}</h3>
    <p class="lib-desc">${esc(tr(textFor(i.description, c.level), c.locale))}</p>
    <button type="button" class="link" data-ref="equipment:${i.id}">${esc(u.more)}</button>
  </div>
</article>`,
        )
        .join('');
      return `<section class="lib-group"><h2>${esc(tr(cat.name, c.locale))}</h2><div class="lib-grid">${cards}</div></section>`;
    })
    .join('');
}

const COUNT: Record<LibraryPage, () => number> = {
  glossary: () => LAB_GLOSSARY.length,
  substances: () => Object.keys(SUBSTANCES).length,
  equipment: () => EQUIPMENT.length,
};

/** The whole page: head with tabs and search, then the chosen part. */
export function libraryHtml(page: LibraryPage, c: Ctx): string {
  const u = LIBRARY_UI[c.locale];
  const tabs = LIBRARY_PAGES.map((p) => `<a href="${esc(c.href(p))}" class="chip${p === page ? ' selected' : ''}"${p === page ? ' aria-current="page"' : ''}>${esc(u.tabs[p])}</a>`).join('');
  const body = page === 'glossary' ? glossaryHtml(c) : page === 'substances' ? substancesHtml(c) : equipmentHtml(c);
  return `<div class="lib-head">
  <a href="${esc(c.href('lab'))}" class="lib-back">${esc(u.back)}</a>
  <h1>${esc(u.title)}</h1>
  <nav class="chips lib-tabs" aria-label="${esc(u.title)}">${tabs}</nav>
  <p class="muted">${esc(u.intro[page])} <span class="small">(${esc(u.count(COUNT[page]()))})</span></p>
  <input type="search" class="search lib-search" placeholder="${esc(u.search)}" aria-label="${esc(u.search)}" autocomplete="off" />
</div>
<div class="lib-content">${body}<p class="muted lib-nothing" hidden>${esc(u.nothing)}</p></div>`;
}
