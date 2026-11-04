/// <reference types="vite/client" />
import { isLocale, LOCALES, type Locale } from '../src/knowledge/i18n.js';
import { addMessages, setLocalePending } from '../src/knowledge/messages.js';
import { addressParts } from './address.js';
import { store } from './prefs.js';

/**
 * The page's texts (locales/<locale>/**\/*.ftl). Every language's name comes with the page (the language switch shows
 * them all); the rest of a language's files come only for the language the page opens in, and for another one when it
 * is chosen — each language is a chunk of its own (vite.config.ts). An experiment's run (its steps, board, answer:
 * experiments/<folder>.run.ftl) comes with the experiment, when it opens (`loadRunTexts`); its card is with the rest.
 */
const NAMES = import.meta.glob<string>('../locales/*/language.ftl', { query: '?raw', import: 'default', eager: true });
const FILES = import.meta.glob<string>(['../locales/*/**/*.ftl', '!../locales/*/language.ftl', '!../locales/*/experiments/*.run.ftl'], { query: '?raw', import: 'default' });
const RUNS = import.meta.glob<string>('../locales/*/experiments/*.run.ftl', { query: '?raw', import: 'default' });

const localeOf = (path: string) => path.split('/')[2] ?? '';
for (const [path, source] of Object.entries(NAMES)) {
  const l = localeOf(path);
  if (isLocale(l)) addMessages(l, source, path);
}
for (const l of LOCALES) setLocalePending(l, true);

const loading = new Map<Locale, Promise<void>>();
/** The experiments whose run's texts are wanted (opened so far): a language loaded later brings theirs too. */
const runs = new Set<string>();
const runLoading = new Map<string, Promise<void>>();
/** One experiment's run texts in one language, once. */
function loadRun(l: Locale, folder: string): Promise<void> {
  const path = `../locales/${l}/experiments/${folder}.run.ftl`;
  const load = RUNS[path];
  if (!load) return Promise.resolve();
  let p = runLoading.get(path);
  if (!p) {
    p = load().then(
      (source) => addMessages(l, source, path),
      (e: unknown) => {
        runLoading.delete(path);
        throw e;
      },
    );
    runLoading.set(path, p);
  }
  return p;
}

/** A language's files, loaded once: the page words nothing in a language before its promise is kept. */
export function loadLocale(l: Locale): Promise<void> {
  let p = loading.get(l);
  if (!p) {
    const files = Object.entries(FILES).filter(([path]) => localeOf(path) === l);
    p = Promise.all([Promise.all(files.map(([, load]) => load())), ...[...runs].map((f) => loadRun(l, f))]).then(([sources]) => {
      files.forEach(([path], i) => addMessages(l, sources[i]!, path));
      setLocalePending(l, false);
    });
    loading.set(l, p);
  }
  return p;
}

/** An experiment's run texts (experiments/<folder>.run.ftl), in every language the page has or is loading. */
export function loadRunTexts(folder: string): Promise<void> {
  runs.add(folder);
  return Promise.all([...loading.keys()].map((l) => loadRun(l, folder))).then(() => undefined);
}

const browserLocale = (): Locale => (navigator.language.toLowerCase().startsWith('en') ? 'en' : 'uk');
/**
 * The language the page opens in. A page of the site is in the language of its address (it was found, or shared, in
 * it); the lab's front door — as chosen before, else the browser's.
 */
export function openingLocale(): Locale {
  const a = addressParts(location.pathname);
  if (a?.locale) return a.locale;
  if (a?.section) return 'uk';
  const s = store.get('locale');
  return s && isLocale(s) ? s : browserLocale();
}
