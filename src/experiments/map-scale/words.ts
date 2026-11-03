import type { MeasurementRecord } from '../../core/trace.js';
import { groundDistance } from '../../domains/mechanics/formulas.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MAP_TEXT, scaleText, type MapCommand } from './bench.js';

export const setup: LocalizedText = msg('map-scale-setup');

export const text = (c: MapCommand): StepText => MAP_TEXT['lab.map'](c);

/** The ruler is laid on the map. */
export const busy = (): LocalizedText => msg('map-scale-busy');

/** Kilometres, as many figures as `digits`. */
const kmText = (km: number, digits: number, l: Locale): string => t(l, 'unit-km', { value: new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: digits }).format(km) });

/** Kilometres, as many figures as the ruler's millimetre allows at this scale. */
export const km = (m: number, scale: number, l: Locale): string => {
  const step = (0.001 * scale) / 1000;
  return kmText(m / 1000, Math.max(0, Math.min(3, Math.ceil(-Math.log10(step)))), l);
};

/** The ruler's half-millimetre on the ground, in kilometres (to three decimals). */
export const halfMillimetre = (scale: number, l: Locale): string => kmText((0.0005 * scale) / 1000, 3, l);

const cm = (x: number | null, l: Locale) => formatMeasured('length', x ?? 0, 0.001, l);

export function shown(c: MapCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  return `${cm(r.value, locale)} → ${km(groundDistance(r.value, c.scale), c.scale, locale)}`;
}

/** What the ruler showed, and how much ground it is. */
export function say(c: MapCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  return t(locale, 'map-scale-said', { onMap: cm(r.value, locale), ground: km(groundDistance(r.value, c.scale), c.scale, locale), mm: km(c.scale * 0.001, c.scale, locale), error: halfMillimetre(c.scale, locale) });
}

/** The board: for each map — the ruler's length and the ground's. */
export function board(c: MapCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  return [{ id: `mk:${i}`, title: t(locale, 'map-scale-board', { scale: scaleText(c.scale, locale) }), formula: 'L = l · N', numbers: `${cm(r.value, locale)} · ${new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(c.scale)} ≈ ${km(groundDistance(r.value, c.scale), c.scale, locale)}` }];
}
