/**
 * Content languages. Ukrainian is the primary language: every text must
 * exist in `uk`; English is required as the international fallback.
 * More locales are added as optional keys and fall back to `uk`, then `en`.
 */
export const LOCALES = ['uk', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export interface LocalizedText {
  readonly uk: string;
  readonly en: string;
}

export const tr = (t: LocalizedText, locale: Locale): string => t[locale] || t.uk || t.en;

export const NUMBER_LOCALE: Readonly<Record<Locale, string>> = { uk: 'uk-UA', en: 'en-GB' };

export const isLocale = (s: string): s is Locale => (LOCALES as readonly string[]).includes(s);
