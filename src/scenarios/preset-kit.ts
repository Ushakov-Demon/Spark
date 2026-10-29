import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import type { Choice, Preset, PresetValues, PresetVary } from './presets.js';

/**
 * What the ready-made experiments are written with, wherever they live: a choice, the lab's usual room and beaker
 * (a bench experiment keeps the vessel's parameters though it does not use them), the programmes' topic names.
 */
export const ch = (id: string, uk: string, en: string): Choice => ({ id, label: { uk, en } });
export const room = { roomTemp: 20, lid: false } as const;
export const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;
/** A text in both languages from one function. */
export const both = (f: (l: Locale) => string): LocalizedText => ({ uk: f('uk'), en: f('en') });
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
