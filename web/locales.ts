/// <reference types="vite/client" />
import { isLocale, LOCALES, type Locale } from '../src/knowledge/i18n.js';
import { addMessages, setLocalePending } from '../src/knowledge/messages.js';
import { addressParts } from './address.js';
import { store } from './prefs.js';

/**
 * The page's texts (locales/<locale>/**\/*.ftl). Every language's name comes with the page (the language switch shows
 * them all); the rest of a language's files come only for the language the page opens in, and for another one when it
 * is chosen — each language is a chunk of its own (vite.config.ts).
 */
const NAMES = import.meta.glob<string>('../locales/*/language.ftl', { query: '?raw', import: 'default', eager: true });
const FILES = import.meta.glob<string>(['../locales/*/**/*.ftl', '!../locales/*/language.ftl'], { query: '?raw', import: 'default' });

const localeOf = (path: string) => path.split('/')[2] ?? '';
for (const [path, source] of Object.entries(NAMES)) {
  const l = localeOf(path);
  if (isLocale(l)) addMessages(l, source, path);
}
for (const l of LOCALES) setLocalePending(l, true);

const loading = new Map<Locale, Promise<void>>();
/** A language's files, loaded once: the page words nothing in a language before its promise is kept. */
export function loadLocale(l: Locale): Promise<void> {
  let p = loading.get(l);
  if (!p) {
    const files = Object.entries(FILES).filter(([path]) => localeOf(path) === l);
    p = Promise.all(files.map(([, load]) => load())).then((sources) => {
      files.forEach(([path], i) => addMessages(l, sources[i]!, path));
      setLocalePending(l, false);
    });
    loading.set(l, p);
  }
  return p;
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
