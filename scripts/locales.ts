import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isLocale } from '../src/knowledge/i18n.js';
import { addMessages } from '../src/knowledge/messages.js';

/** The message files for the tests and the scripts, loaded on import — import this first (the page bundles them itself, web/locales.ts). */
export const LOCALES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales');

/** Every .ftl file under locales/, by language: [locale, path]. */
export function localeFiles(): [string, string][] {
  return readdirSync(LOCALES_DIR, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ftl'))
    .map((f) => [f.split(/[\\/]/)[0] ?? '', join(LOCALES_DIR, f)]);
}

let loaded = false;

export function loadLocales(): void {
  if (loaded) return;
  loaded = true;
  for (const [locale, path] of localeFiles()) if (isLocale(locale)) addMessages(locale, readFileSync(path, 'utf8'), relative(LOCALES_DIR, path));
}

loadLocales();
