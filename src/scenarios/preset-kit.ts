import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import type { Choice } from './presets.js';

/**
 * What the ready-made experiments are written with, wherever they live: a choice, the lab's usual room and beaker
 * (a bench experiment keeps the vessel's parameters though it does not use them), the programmes' topic names.
 */
export const ch = (id: string, uk: string, en: string): Choice => ({ id, label: { uk, en } });
export const room = { roomTemp: 20, lid: false } as const;
export const beaker = { vessel: 'beaker', size: 0.25, material: 'glass', liters: 0.2 } as const;
/** A text in both languages from one function. */
export const both = (f: (l: Locale) => string): LocalizedText => ({ uk: f('uk'), en: f('en') });

export const INTRO: LocalizedText = { uk: 'Фізика як природнича наука. Пізнання природи', en: 'Physics as a natural science. Knowing nature' };
export const MOTION: LocalizedText = { uk: 'Механічний рух', en: 'Mechanical motion' };
export const INTERACTION: LocalizedText = { uk: 'Взаємодія тіл. Сила', en: 'Interaction of bodies. Force' };
export const PRESSURE: LocalizedText = { uk: 'Тиск твердих тіл, рідин і газів', en: 'Pressure of solids, liquids and gases' };
export const WORK: LocalizedText = { uk: 'Механічна робота. Механічна енергія', en: 'Mechanical work. Mechanical energy' };
