/// <reference types="vite/client" />
import { isLocale } from '../src/knowledge/i18n.js';
import { addMessages } from '../src/knowledge/messages.js';

/** The page's texts: every language's message files, bundled with the page (locales/<locale>/**\/*.ftl). */
const FILES = import.meta.glob<string>('../locales/*/**/*.ftl', { query: '?raw', import: 'default', eager: true });

for (const [path, source] of Object.entries(FILES)) {
  const locale = path.split('/')[2] ?? '';
  if (isLocale(locale)) addMessages(locale, source, path);
}
