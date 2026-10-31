import type { MeasurementRecord } from '../../core/trace.js';
import { groundDistance } from '../../domains/mechanics/formulas.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MAP_TEXT, scaleText, type MapCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Дві карти різного масштабу, лінійка', en: 'Two maps of different scales, a ruler' };

export const text = (c: MapCommand): StepText => MAP_TEXT['lab.map'](c);

/** The ruler is laid on the map. */
export const busy = (): LocalizedText => ({ uk: 'Прикладаю лінійку…', en: 'Laying the ruler on…' });

/** Kilometres, as many figures as the ruler's millimetre allows at this scale. */
export const km = (m: number, scale: number, l: Locale): string => {
  const step = (0.001 * scale) / 1000;
  const digits = Math.max(0, Math.min(3, Math.ceil(-Math.log10(step))));
  return `${new Intl.NumberFormat(l === 'uk' ? 'uk-UA' : 'en-GB', { maximumFractionDigits: digits }).format(m / 1000)} ${l === 'uk' ? 'км' : 'km'}`;
};
const cm = (x: number | null, l: Locale) => formatMeasured('length', x ?? 0, 0.001, l);

export function shown(c: MapCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  return `${cm(r.value, locale)} → ${km(groundDistance(r.value, c.scale), c.scale, locale)}`;
}

/** What the ruler showed, and how much ground it is. */
export function say(c: MapCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r || r.value === null) return '';
  const L = groundDistance(r.value, c.scale);
  const pm = (0.0005 * c.scale) / 1000;
  return uk
    ? `На карті — ${cm(r.value, locale)}, тобто ≈ ${km(L, c.scale, locale)} на місцевості (міліметр лінійки тут — ${km(c.scale * 0.001, c.scale, locale)}, похибка ± ${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 3 }).format(pm)} км).`
    : `On the map — ${cm(r.value, locale)}, that is ≈ ${km(L, c.scale, locale)} on the ground (a millimetre of the ruler is ${km(c.scale * 0.001, c.scale, locale)} here, an error of ± ${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 }).format(pm)} km).`;
}

/** The board: for each map — the ruler's length and the ground's. */
export function board(c: MapCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const r = trace[0];
  if (!r || r.value === null) return [];
  return [{ id: `mk:${i}`, title: uk ? `карта ${scaleText(c.scale, true)}` : `the map at ${scaleText(c.scale, false)}`, formula: 'L = l · N', numbers: `${cm(r.value, locale)} · ${new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB').format(c.scale)} ≈ ${km(groundDistance(r.value, c.scale), c.scale, locale)}` }];
}
