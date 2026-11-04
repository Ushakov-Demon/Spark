import { FluentBundle, FluentResource, type FluentVariable } from '@fluent/bundle';
import { LOCALES, NUMBER_LOCALE, type Locale, type LocalizedText } from './i18n.js';

/**
 * The texts, one file of messages per language (Project Fluent, `locales/<locale>/**\/*.ftl`); the code keeps only a
 * message's id and its numbers. Each language words its own plurals, genders and cases, so a new language is new
 * files, not new code. The files are loaded by whoever runs the core: the page (web/locales.ts), the tests and the
 * scripts (scripts/locales.ts).
 */

/** A message's argument: a number, a word, or one written per language (a formatted quantity, a name); undefined reads «undefined», as in a template. */
export type MessageArg = string | number | undefined | ((l: Locale) => string | number | undefined);
export type MessageArgs = Readonly<Record<string, MessageArg>>;

const bundles = new Map<Locale, FluentBundle>();
/** Strict (the tests): a missing message or argument throws instead of showing the message's id. */
let strict = false;

export function setStrictMessages(on: boolean): void {
  strict = on;
}

/** Adds one file of messages for `locale`; a message defined twice or a syntax error throws, naming the file. */
export function addMessages(locale: Locale, source: string, file = '?'): void {
  let bundle = bundles.get(locale);
  if (!bundle) {
    bundle = new FluentBundle(NUMBER_LOCALE[locale], { useIsolating: false });
    bundles.set(locale, bundle);
  }
  const resource = new FluentResource(source);
  // A syntax error leaves a junk entry and drops the message: count what the file defines against what was parsed.
  const ids = [...source.matchAll(/^(-?[a-zA-Z][\w-]*)\s*=/gm)].map((m) => m[1]!);
  if (ids.length !== resource.body.length) throw new Error(`${file}: ${ids.length - resource.body.length} message(s) failed to parse`);
  const errors = bundle.addResource(resource);
  if (errors.length) throw new Error(`${file}: ${errors.map((e) => e.message).join('; ')}`);
}

/** The ids of the messages loaded for `locale` (terms, `-name`, left out). */
export function messageIds(locale: Locale): string[] {
  const b = bundles.get(locale);
  return b ? [...(b as unknown as { _messages: Map<string, unknown> })._messages.keys()] : [];
}

export const hasMessage = (locale: Locale, id: string): boolean => bundles.get(locale)?.hasMessage(id) ?? false;

/** Where a missing message is looked for next: the language itself, then Ukrainian, then English. */
const chain = (l: Locale): readonly Locale[] => [...new Set<Locale>([l, 'uk', 'en'])];

/** The message `id` in `locale` with its arguments. */
export function t(locale: Locale, id: string, args?: MessageArgs): string {
  for (const l of chain(locale)) {
    const bundle = bundles.get(l);
    const m = bundle?.getMessage(id);
    if (!bundle || !m?.value) continue;
    const values: Record<string, FluentVariable> = {};
    for (const [k, v] of Object.entries(args ?? {})) {
      const x = typeof v === 'function' ? v(locale) : v;
      values[k] = x ?? String(x);
    }
    const errors: Error[] = [];
    const text = bundle.formatPattern(m.value, values, errors);
    if (errors.length && strict) throw new Error(`${l} ${id}: ${errors.map((e) => e.message).join('; ')}`);
    return text;
  }
  if (strict) throw new Error(`No message ${id}`);
  return id;
}

/**
 * The message `id` as a text in every language, worded when read: it stands wherever a `{ uk, en }` literal does, so
 * the code moves to messages a file at a time.
 */
export function msg(id: string, args?: MessageArgs): LocalizedText {
  const text = {} as Record<Locale, string>;
  for (const l of LOCALES) Object.defineProperty(text, l, { enumerable: true, get: () => t(l, id, args) });
  return text;
}

/** No text, in every language. */
export const NO_TEXT: LocalizedText = Object.fromEntries(LOCALES.map((l) => [l, ''])) as Record<Locale, string>;

/** A text in every language from one function of the language (built of messages). */
export const localized = (f: (l: Locale) => string): LocalizedText => Object.fromEntries(LOCALES.map((l) => [l, f(l)])) as Record<Locale, string>;
