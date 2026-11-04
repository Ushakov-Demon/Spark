import { LOCALES, type Locale, type LocalizedText } from './i18n.js';
import { attribute, byLocale, localized, msg, t as tl } from './messages.js';
import { lawWhen, type LawSpec } from './types.js';

/**
 * Terms explained in a footnote wherever they appear in the lab's texts (explanations, the
 * Professor's lines, reference cards). `stems` match the word in any of its forms: a stem is followed
 * by any letters ("катод" → катода, катоді, катодом, катодний). Definitions are Spark's own short
 * texts; the lab grows — new terms are added here, nothing else changes. Laws are not written here:
 * every law of the lab's knowledge becomes a term by itself (`lawTerms`).
 */
export interface Term {
  readonly id: string;
  readonly name: LocalizedText;
  /**
   * Word stems in each language, matched at a word start; the longest stem wins. A stem starting with «=» is a whole word
   * (no other endings: «=розчин», «=розчину» — not «розчиняти»). «*» inside a stem takes any ending there: «закон* ома» —
   * «закону Ома», «законом Ома».
   */
  readonly stems: Readonly<Record<Locale, readonly string[]>>;
  readonly text: LocalizedText;
  /** Made from a law of the lab's knowledge (its id there). */
  readonly law?: string;
  /** More about it — shown in the glossary, while a footnote keeps to `text`. */
  readonly more?: LocalizedText;
  /** Where the facts of the text come from (a source of the lab's knowledge): linked under the footnote and in the glossary. */
  readonly source?: string;
  /** A photograph of it (a source too): linked beside the source. */
  readonly photo?: string;
  /**
   * A reference of an experiment's story (a person, a map, an event — not a physics term): footnoted where it appears,
   * but not listed in the glossary.
   */
  readonly reference?: boolean;
}

/** A term worded in locales/<language>/knowledge/glossary.ftl: `term-<id>` (its stems — `.stems`, by commas), `term-<id>-text`. */
const term = (id: string): Term => ({ id, name: msg(`term-${id}`), stems: byLocale((l) => (attribute(l, `term-${id}`, 'stems') ?? '').split(', ')), text: msg(`term-${id}-text`) });

/** A piece of equipment: a short footnote, and more about it in the glossary (`term-<id>-more`). */
const equipment = (id: string): Term => ({ ...term(id), more: msg(`term-${id}-more`) });

export const GLOSSARY: readonly Term[] = [
  // ---------------------------------------------------------------- electricity and electrochemistry
  term('cathode'),
  term('anode'),
  term('electrode'),
  term('electrolysis'),
  term('electrolyte'),
  term('ion'),
  term('electrode-potential'),
  term('voltage'),
  term('current'),
  term('resistance'),
  // ---------------------------------------------------------------- heat
  term('specific-heat'),
  term('latent-heat'),
  term('thermal-equilibrium'),
  term('efficiency'),
  term('conduction'),
  term('radiation'),
  // ---------------------------------------------------------------- states of matter
  term('evaporation'),
  term('boiling'),
  term('crystallisation'),
  term('eutectic'),
  // ---------------------------------------------------------------- solutions
  term('solution'),
  term('solubility'),
  term('heat-of-solution'),
  term('supersaturated'),
  term('mass-fraction'),
  term('saturated'),
  term('precipitate'),
  term('distillation'),
  term('oxidation'),
  // ---------------------------------------------------------------- substances
  term('stearic-acid'),
  // ---------------------------------------------------------------- mechanics
  { ...term('airship'), source: 'wikipedia-zeppelin-nt' },
  { ...term('planck-constant'), source: 'wikipedia-planck-constant' },
  { ...term('kibble-balance'), source: 'wikipedia-kibble-balance' },
  { ...term('pale-blue-dot'), source: 'wikipedia-pale-blue-dot', photo: 'nasa-pale-blue-dot-photo', reference: true },
  { ...term('hindenburg'), source: 'wikipedia-hindenburg-disaster', photo: 'commons-hindenburg-photo', reference: true },
  { ...term('beauplan'), source: 'wikipedia-beauplan', reference: true },
  { ...term('beauplan-map'), source: 'wikipedia-beauplan', reference: true },
  { ...term('led-zeppelin'), source: 'wikipedia-led-zeppelin-album', reference: true },
  term('density'),
  term('buoyancy'),
  // ---------------------------------------------------------------- equipment
  equipment('resistor'),
  equipment('rheostat'),
  equipment('ammeter'),
  equipment('voltmeter'),
  equipment('power-source'),
  equipment('switch'),
  equipment('multimeter'),
  equipment('diode'),
  equipment('transistor'),
  equipment('dynamometer'),
  equipment('measuring-cylinder'),
  equipment('calorimeter'),
  equipment('stopwatch'),
  equipment('stand'),
  equipment('lever-balance'),
  equipment('thermometer'),
  equipment('test-tube'),
];

/** A term by its id (`terms` — the lab's whole glossary, laws included). */
export const termById = (id: string, terms: readonly Term[] = GLOSSARY): Term | undefined => terms.find((x) => x.id === id);

// ---------------------------------------------------------------- laws as terms

/** The name as it is said in a sentence: without a qualifier («…: плавлення і кипіння», «… для електролізу»). */
const spokenName = (name: string): string => name.split(/:| для /)[0]!.trim().toLowerCase();

/**
 * Stems a law is found by in a text. Ukrainian: the first word changes («закон» → «закону», «законом»;
 * «рівняння» → «рівнянням»), the rest stays as it is («Ома», «Фарадея», «теплового балансу»). English:
 * «Faraday’s law of electrolysis» is said «Faraday’s law(s)».
 */
export function lawStems(name: LocalizedText): Term['stems'] {
  const uk = spokenName(name.uk).split(/\s+/);
  const first = uk[0]!.replace(/[аеєиіїоуюяьй]+$/u, '');
  const en = spokenName(name.en);
  const possessive = /^(.*?(?:[’']s|s[’']))\s+(law|principle)\b/u.exec(en);
  return { uk: [[`${first}*`, ...uk.slice(1)].join(' ')], en: [possessive ? `${possessive[1]} ${possessive[2]}` : en] };
}

/** «Відкрив Майкл Фарадей (1833–1834).» — from the law's own sourced history. */
function whoFound(law: LawSpec, l: Locale): string {
  const h = law.history;
  const names = h.people.map((p) => p.name[l]);
  if (!names.length) return '';
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} ${tl(l, 'glossary-and')} ${names[names.length - 1]}` : names[0]!;
  const date = lawWhen(law, l);
  const when = date !== '—' ? ` (${date})` : '';
  return ` ${tl(l, h.role === 'associated' ? 'glossary-associated' : 'glossary-discovered', { count: names.length, list, when })}`;
}

/** Does the name start with a word some term of `terms` already explains (latent heat, heat balance)? */
function explainedBy(terms: readonly Term[], name: LocalizedText): boolean {
  return LOCALES.some((l) => {
    const spoken = spokenName(name[l]);
    return terms.some((t) => t.stems[l].some((st) => !st.startsWith('=') && !st.includes('*') && spoken.startsWith(st.toLowerCase())));
  });
}

/**
 * Every law (not a definition or a model) as a glossary term: its name, its school statement and who found
 * it. A law whose name a written term already explains is left to that term.
 */
export function lawTerms(laws: readonly LawSpec[], terms: readonly Term[] = GLOSSARY): Term[] {
  return laws
    .filter((law) => law.kind === 'law' && !explainedBy(terms, law.name))
    .map((law) => ({
      id: `law-${law.id}`,
      law: law.id,
      name: law.name,
      stems: lawStems(law.name),
      text: localized((l: Locale) => law.statement.school[l] + whoFound(law, l)),
    }));
}

// ---------------------------------------------------------------- finding terms in a text

export interface TermMatcher {
  /** Every stem at a word start, then any letters (longest first); global, so reset `lastIndex`. */
  readonly re: RegExp;
  /** Which term a matched word is: by the longest stem it fits. */
  termOf(word: string): string | undefined;
}

const escRe = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
const ENDING = "[\\p{L}’'ʼ-]*";
/** A stem as a regular expression: «*» is any ending, a space any spaces, an apostrophe any apostrophe. */
function stemSource(stem: string): string {
  const exact = stem.startsWith('=');
  const body = [...(exact ? stem.slice(1) : stem).replace(/\s+/g, ' ')]
    .map((ch) => (ch === '*' ? ENDING : ch === ' ' ? '\\s+' : /[’'ʼ]/.test(ch) ? "[’'ʼ]" : escRe(ch)))
    .join('');
  return exact ? `${body}(?![\\p{L}])` : `${body}${ENDING}`;
}

/** The matcher for the terms in one language. */
export function termMatcher(terms: readonly Term[], l: Locale): TermMatcher {
  const stems: { id: string; len: number; re: RegExp; src: string }[] = [];
  for (const t of terms)
    for (const s of t.stems[l]) {
      const src = stemSource(s.toLowerCase());
      stems.push({ id: t.id, len: s.replace(/[=*]/g, '').length, re: new RegExp(`^${src}$`, 'iu'), src });
    }
  stems.sort((a, b) => b.len - a.len);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${stems.map((x) => x.src).join('|')})`, 'giu');
  return { re, termOf: (word) => stems.find((x) => x.re.test(word))?.id };
}
