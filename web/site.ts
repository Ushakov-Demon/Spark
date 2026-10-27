/**
 * The site around the lab: its addresses, what each page says about itself to search engines and to
 * messengers that show a preview of a shared link (title, description, picture), and the catalogue of
 * all the ready-made experiments. No DOM: the lab uses it, and scripts/build-site.ts writes the static
 * pages from it — one per experiment and the catalogue, in Ukrainian and in English — because robots and
 * link previews read the HTML as it comes and run no scripts.
 *
 *   /                          the lab              /en/                          the same in English
 *   /experiments/              all experiments      /en/experiments/
 *   /experiments/<id>/         the lab with that experiment chosen, its description under it
 */
import { tr, type Locale } from '../src/knowledge/i18n.js';
import { getCurriculum } from '../src/knowledge/curricula.js';
import type { Subject } from '../src/knowledge/types.js';
import { PRESETS, presetAsk, presetGradesIn, presetPrograms, presetSubjects, type Preset } from '../src/scenarios/index.js';
import { esc, presetEquipment, presetLabNumber, presetTopic } from './experiment-sheet.js';
import { UI } from './ui-text.js';

export const SITE: { name: string; url: string; image: string; readonly description: Readonly<Record<Locale, string>> } = {
  name: 'Spark',
  /**
   * The site's address, for the links a page gives of itself (canonical, og:url, the sitemap): they must be
   * absolute. Not known yet — then those are left out; set it here, or SPARK_SITE_URL when building.
   */
  url: '',
  /** The picture of a shared link (og:image), from the site's root; none yet. */
  image: '',
  description: {
    uk: 'Безкоштовна віртуальна лабораторія з фізики та хімії для школи: став дослід і дивись, що відбувається і чому, — зі справжніми числами й формулами.',
    en: 'A free virtual physics and chemistry lab for school: set up an experiment and see what happens and why — with real numbers and formulas.',
  },
};

const CATALOG_UI: Record<Locale, { title: string; intro: string; all: string; back: string; question: string; topic: string; takes: string; programs: string; share: string; copied: string; more: string; search: string; allSubjects: string; allGrades: string; allPrograms: string; program: string; nothing: string; shown: (n: number, of: number) => string; count: (n: number) => string }> = {
  uk: {
    title: 'Усі досліди',
    intro: 'Готові досліди лабораторії Spark: лабораторні роботи й демонстрації з фізики та хімії за шкільними програмами України. Кожен відкривається в лабораторії одним клацанням, і ним можна поділитися посиланням.',
    all: '📋 Усі досліди',
    back: '← До лабораторії',
    question: 'Питання',
    topic: 'Тема',
    takes: 'Обладнання',
    programs: 'Програми',
    share: 'Поділитися дослідом',
    copied: 'Посилання скопійовано',
    more: 'ⓘ Детальніше',
    search: 'Пошук: назва, тема, прилад, речовина…',
    allSubjects: 'Усі предмети',
    allGrades: 'Усі класи',
    allPrograms: 'Усі програми',
    program: 'Програма',
    nothing: 'Нічого не знайдено. Зміни пошук або фільтри.',
    shown: (n, of) => `Показано ${n} з ${of}`,
    count: (n) => `${n} дослідів`,
  },
  en: {
    title: 'All experiments',
    intro: 'The ready-made experiments of the Spark lab: lab works and demonstrations in physics and chemistry, following Ukraine’s school programmes. Each opens in the lab in one click and can be shared by a link.',
    all: '📋 All experiments',
    back: '← Back to the lab',
    question: 'Question',
    topic: 'Topic',
    takes: 'Equipment',
    programs: 'Programmes',
    share: 'Share the experiment',
    copied: 'Link copied',
    more: 'ⓘ Details',
    search: 'Search: name, topic, instrument, substance…',
    allSubjects: 'All subjects',
    allGrades: 'All grades',
    allPrograms: 'All programmes',
    program: 'Programme',
    nothing: 'Nothing found. Change the search or the filters.',
    shown: (n, of) => `Showing ${n} of ${of}`,
    count: (n) => `${n} experiments`,
  },
};
export const catalogUi = (l: Locale) => CATALOG_UI[l];

// ---------- addresses ----------
export type Route = { readonly page: 'lab' } | { readonly page: 'catalog' } | { readonly page: 'experiment'; readonly id: string };
/** A page's path from the site's root, in a language: '', 'experiments/', 'en/experiments/melt-ice/'. */
export function pagePath(r: Route, l: Locale): string {
  const lang = l === 'uk' ? '' : `${l}/`;
  return r.page === 'lab' ? lang : r.page === 'catalog' ? `${lang}experiments/` : `${lang}experiments/${r.id}/`;
}
/**
 * Where an address points: the site's root (the site may live in a folder), the language it names (none for
 * Ukrainian) and the page. Unknown experiments are the lab.
 */
export function parsePath(pathname: string): { readonly root: string; readonly locale: Locale | null; readonly route: Route } {
  const m = /^(.*?\/)(?:(en)\/)?(?:experiments\/(?:([a-z0-9-]+)\/?)?)?(?:index\.html)?$/.exec(pathname);
  if (!m) return { root: '/', locale: null, route: { page: 'lab' } };
  const [, root = '/', lang, id] = m;
  const inCatalog = /experiments\/?(?:index\.html)?$/.test(pathname) || id !== undefined;
  const route: Route = id && PRESETS.some((p) => p.id === id) ? { page: 'experiment', id } : inCatalog && !id ? { page: 'catalog' } : { page: 'lab' };
  return { root, locale: lang === 'en' ? 'en' : null, route };
}
const absolute = (path: string) => (SITE.url ? `${SITE.url.replace(/\/$/, '')}/${path}` : '');

// ---------- what a page says about itself ----------
export interface PageMeta {
  readonly title: string;
  readonly description: string;
  readonly locale: Locale;
  readonly route: Route;
  readonly type: 'website' | 'article';
  readonly jsonLd: object;
}
const clip = (s: string, n = 200) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

/** An experiment in one line: kind and grade, topic, the question (no answer). */
export function presetDescription(p: Preset, l: Locale): string {
  const u = UI[l];
  const number = presetLabNumber(p);
  const kind = number ? u.details.labWork(number) : u.details.experiment;
  const grade = p.grade === null ? u.forEveryone : u.grade(p.grade);
  return clip(`${kind}, ${grade.toLowerCase()}. ${presetTopic(p, l)}. ${tr(presetAsk(p), l)}`);
}

export function pageMeta(route: Route, l: Locale): PageMeta {
  const site = { '@type': 'WebSite', name: SITE.name, url: absolute(pagePath({ page: 'lab' }, l)) || undefined };
  if (route.page === 'experiment') {
    const p = PRESETS.find((x) => x.id === route.id)!;
    const description = presetDescription(p, l);
    const grades = presetSubjects(p).flatMap((s) => presetGradesIn(p, s)).filter((g): g is number => g !== null);
    return {
      title: `${tr(p.title, l)} · ${SITE.name}`,
      description,
      locale: l,
      route,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: tr(p.title, l),
        description,
        inLanguage: l,
        learningResourceType: presetLabNumber(p) ? 'lab work' : 'experiment',
        interactivityType: 'active',
        isAccessibleForFree: true,
        about: presetTopic(p, l),
        teaches: tr(presetAsk(p), l),
        ...(grades.length ? { educationalLevel: [...new Set(grades)].map((g) => UI[l].grade(g)) } : {}),
        educationalAlignment: presetPrograms(p).filter((x) => x.match !== 'related').map((x) => ({ '@type': 'AlignmentObject', alignmentType: 'educationalSubject', targetName: tr(getCurriculum(x.program)!.short ?? getCurriculum(x.program)!.name, l) })),
        url: absolute(pagePath(route, l)) || undefined,
        isPartOf: site,
      },
    };
  }
  if (route.page === 'catalog') {
    const c = CATALOG_UI[l];
    return {
      title: `${c.title} · ${SITE.name}`,
      description: clip(c.intro),
      locale: l,
      route,
      type: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: c.title,
        numberOfItems: PRESETS.length,
        itemListElement: PRESETS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: tr(p.title, l), url: absolute(pagePath({ page: 'experiment', id: p.id }, l)) || `/${pagePath({ page: 'experiment', id: p.id }, l)}` })),
      },
    };
  }
  return {
    title: `${SITE.name} — ${l === 'uk' ? 'віртуальна лабораторія фізики та хімії' : 'a virtual physics and chemistry lab'}`,
    description: SITE.description[l],
    locale: l,
    route,
    type: 'website',
    jsonLd: { '@context': 'https://schema.org', ...site, description: SITE.description[l], inLanguage: l },
  };
}

/** The <head> tags of a page: title, description, its address in both languages, the link preview, structured data. */
export function headHtml(m: PageMeta): string {
  const a = (k: string, v: string) => (v ? `<meta property="${k}" content="${esc(v)}" />` : '');
  const n = (k: string, v: string) => (v ? `<meta name="${k}" content="${esc(v)}" />` : '');
  const here = absolute(pagePath(m.route, m.locale));
  const alt = (l: Locale) => absolute(pagePath(m.route, l));
  const image = SITE.image ? absolute(SITE.image) : '';
  const ogLocale = { uk: 'uk_UA', en: 'en_US' } as const;
  return [
    `<title>${esc(m.title)}</title>`,
    n('description', m.description),
    here ? `<link rel="canonical" href="${esc(here)}" />` : '',
    ...(here ? (['uk', 'en'] as const).map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(alt(l))}" />`) : []),
    here ? `<link rel="alternate" hreflang="x-default" href="${esc(alt('uk'))}" />` : '',
    a('og:site_name', SITE.name),
    a('og:type', m.type),
    a('og:title', m.title),
    a('og:description', m.description),
    a('og:url', here),
    a('og:locale', ogLocale[m.locale]),
    a('og:locale:alternate', ogLocale[m.locale === 'uk' ? 'en' : 'uk']),
    a('og:image', image),
    n('twitter:card', image ? 'summary_large_image' : 'summary'),
    n('twitter:title', m.title),
    n('twitter:description', m.description),
    n('twitter:image', image),
    `<script type="application/ld+json">${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');
}

// ---------- the catalogue ----------
/** All the experiments, by subject and grade, each with what it is about; `href` makes a page's link from its path. */
export function catalogHtml(l: Locale, href: (path: string) => string): string {
  const u = UI[l];
  const c = CATALOG_UI[l];
  const subjects: Subject[] = ['physics', 'chemistry'];
  const sections = subjects
    .map((s) => {
      const mine = PRESETS.filter((p) => presetSubjects(p).includes(s));
      if (!mine.length) return '';
      const grades = [...new Set(mine.flatMap((p) => presetGradesIn(p, s)))].sort((a, b) => (a ?? 99) - (b ?? 99));
      const groups = grades
        .map((g) => {
          const list = mine.filter((p) => presetGradesIn(p, s)[0] === g);
          if (!list.length) return '';
          return `<section class="cat-grade"><h3>${g === null ? u.forEveryone : u.grade(g)}</h3><div class="cat-list">${list.map((p) => catalogCard(p, s, l, href)).join('')}</div></section>`;
        })
        .join('');
      return `<section class="cat-subject" id="cat-${s}"><h2>${u.subjects[s]}</h2>${groups}</section>`;
    })
    .join('');
  // Filters (the lab makes them work): subject, grade, programme, and a search through the cards' text.
  const grades = [...new Set(PRESETS.flatMap((p) => presetSubjects(p).flatMap((s) => presetGradesIn(p, s))))].sort((a, b) => (a ?? 99) - (b ?? 99));
  const programs = [...new Set(PRESETS.flatMap((p) => presetPrograms(p).map((x) => x.program)))];
  const chip = (attr: string, value: string, label: string, on = false) => `<button type="button" class="chip${on ? ' selected' : ''}" data-${attr}="${esc(value)}" aria-pressed="${on}">${esc(label)}</button>`;
  const filters = `<div class="cat-filters">
    <input type="search" class="search cat-search" placeholder="${esc(c.search)}" aria-label="${esc(c.search)}" autocomplete="off" />
    <div class="chips cat-subjects">${chip('subject', '', c.allSubjects, true)}${subjects.map((s) => chip('subject', s, u.subjects[s])).join('')}</div>
    <div class="chips cat-grades">${chip('grade', '', c.allGrades, true)}${grades.map((g) => chip('grade', g === null ? 'all' : String(g), g === null ? u.forEveryone : u.grade(g))).join('')}</div>
    <label class="cat-program-pick"><span class="muted">${c.program}:</span> <select class="cat-program"><option value="">${esc(c.allPrograms)}</option>${programs.map((id) => `<option value="${esc(id)}">${esc(tr(getCurriculum(id)!.short ?? getCurriculum(id)!.name, l))}</option>`).join('')}</select></label>
  </div>`;
  return `<div class="cat-head"><a class="lib-back" href="${esc(href(pagePath({ page: 'lab' }, l)))}">${c.back}</a><h1>${c.title}</h1><p>${esc(c.intro)}</p>${filters}<p class="muted small cat-count">${c.count(PRESETS.length)}</p></div>${sections}<p class="muted cat-nothing" hidden>${esc(c.nothing)}</p>`;
}

function catalogCard(p: Preset, subject: Subject, l: Locale, href: (path: string) => string): string {
  const u = UI[l];
  const c = CATALOG_UI[l];
  const number = presetLabNumber(p);
  const link = esc(href(pagePath({ page: 'experiment', id: p.id }, l)));
  const programs = presetPrograms(p)
    .map((x) => `${tr(getCurriculum(x.program)!.short ?? getCurriculum(x.program)!.name, l)}${x.grade !== undefined ? ` · ${u.grade(x.grade)}` : ''}`)
    .filter((x, i, all) => all.indexOf(x) === i)
    .join(', ');
  // What the filters look at: the grades it is under in this subject (all of them: schools work by either programme), its programmes.
  const grades = presetGradesIn(p, subject).map((g) => (g === null ? 'all' : String(g))).join(' ');
  const progIds = [...new Set(presetPrograms(p).map((x) => x.program))].join(' ');
  return `<article class="cat-item" data-id="${p.id}" data-grades="${grades}" data-programs="${esc(progIds)}">
    <p class="cat-kind">${number ? u.details.labWork(number) : u.details.experiment}</p>
    <h4><a href="${link}">${esc(tr(p.title, l))}</a></h4>
    <p><span class="muted">${c.question}:</span> ${esc(tr(presetAsk(p), l))}</p>
    <p><span class="muted">${c.topic}:</span> ${esc(presetTopic(p, l))}</p>
    <p><span class="muted">${c.takes}:</span> ${esc(presetEquipment(p, l).join('; '))}</p>
    ${programs ? `<p class="small"><span class="muted">${c.programs}:</span> ${esc(programs)}</p>` : ''}
    <div class="cat-actions"><a class="primary cat-start" href="${link}">${u.presetStart}</a><button type="button" class="cat-more" data-sheet="${p.id}">${c.more}</button><button type="button" class="cat-share" data-share="${p.id}" title="${esc(c.share)}" aria-label="${esc(c.share)}">🔗</button></div>
  </article>`;
}
