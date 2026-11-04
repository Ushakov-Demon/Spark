import { COMPONENTS } from '../components/index.js';
import { sig } from '../explain/format.js';
import { LOCALES, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { t } from '../knowledge/messages.js';
import type { Choice, Preset, PresetValues, PresetVary } from './presets.js';

/**
 * What the ready-made experiments are written with, wherever they live: a choice, the lab's usual room and beaker
 * (a bench experiment keeps the vessel's parameters though it does not use them), the programmes' topic names.
 */
/** A choice: its id and its text (a message; the two languages' strings while a file still has them). */
export const ch = (id: string, label: LocalizedText | string, en = ''): Choice => ({ id, label: typeof label === 'string' ? { uk: label, en } : label });
export const room = { roomTemp: 20, lid: false } as const;
export const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;
/** A text in every language from one function. */
export const both = (f: (l: Locale) => string): LocalizedText => Object.fromEntries(LOCALES.map((l) => [l, f(l)])) as Record<Locale, string>;
/** The values a preset starts with. */
export const defaultValues = (p: Preset, locale: Locale = 'uk'): PresetValues => Object.fromEntries((p.vary?.controls ?? []).map((c) => [c.id, c.kind === 'place' && locale === 'en' ? c.en : c.value]));
/** Define a preset whose setup depends on values: it is built with the defaults, and keeps how to rebuild it. */
export const varied = (base: Omit<Preset, 'params' | 'question'> & Partial<Preset>, vary: PresetVary): Preset => {
  const p = { ...base, vary } as Preset;
  return { ...p, ...vary.build(defaultValues(p)) };
};
/** The defaults where the height and the clock matter: Kyiv (179 m — Вікіпедія), New York (10 m — GeoNames). */
export const PLACE_KYIV = 'Київ|50.4500|30.5233|179|Europe/Kyiv';
export const PLACE_NEW_YORK = 'New York|40.7143|-74.0060|10|America/New_York';

export const INTRO: LocalizedText = { uk: 'Фізика як природнича наука. Пізнання природи', en: 'Physics as a natural science. Knowing nature' };
export const MOTION: LocalizedText = { uk: 'Механічний рух', en: 'Mechanical motion' };
export const INTERACTION: LocalizedText = { uk: 'Взаємодія тіл. Сила', en: 'Interaction of bodies. Force' };
export const PRESSURE: LocalizedText = { uk: 'Тиск твердих тіл, рідин і газів', en: 'Pressure of solids, liquids and gases' };
export const WORK: LocalizedText = { uk: 'Механічна робота. Механічна енергія', en: 'Mechanical work. Mechanical energy' };
export const MEDIA: LocalizedText = { uk: 'Електричний струм у різних середовищах', en: 'Electric current in different media' };
export const MAGNETIC: LocalizedText = { uk: 'Магнітні та електромагнітні явища', en: 'Magnetic and electromagnetic phenomena' };
export const ELECTRIC: LocalizedText = { uk: 'Електричні явища', en: 'Electric phenomena' };
/** "у 3 рази", "у 2,4 раза", "у 5 разів" — "3 times". */
export const times = (x: number, l: Locale): string => t(l, 'count-times', { v: sig(x, 2, l), k: Number(sig(x, 2, 'en').replace(/,/g, '')) });
/** Water's density, kg/m³ (the component model's). */
export const WATER = COMPONENTS.water.phases.liquid!.density!.value;

/**
 * The steps of a run in an answer's text, each on a line of its own, and what follows them on a new line too:
 * `steps.map(stepLine).join(';') + STEPS_END`. (A punctuation mark after the list stays on its last line — `answerLines`.)
 */
export const stepLine = (step: string): string => `\n${step}`;
export const STEPS_END = '\n';
/** An answer's text in lines: trimmed, and a line that starts with a punctuation mark gives it back to the line before. */
export const answerLines = (text: string): readonly string[] =>
  text
    .replace(/\n\s*([.,:;)])[ \t]*/g, '$1\n')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
