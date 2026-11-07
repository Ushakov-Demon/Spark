import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MANDARIN_TEXT, partName, type MandarinCommand } from './bench.js';

export const text = (c: MandarinCommand): StepText => MANDARIN_TEXT['lab.mandarin'](c);

/** Every step moves: put on the balance, peeled, lowered into the beaker. */
export const busy = (c: MandarinCommand): LocalizedText => (c.step === 'peel' ? msg('mandarin-float-busy-peel') : c.step === 'dunk' ? msg('mandarin-float-busy-dunk') : msg('mandarin-float-busy-weigh'));

const mass = (r: MeasurementRecord, l: Locale) => formatMeasured('mass', r.value, r.inputs?.['division'] ?? 1e-5, l);
/** A body under the liquid: its volume from what the balance showed, mL. */
export const volumeOf = (r: MeasurementRecord): number => (r.value ?? 0) / (r.inputs?.['liquid'] ?? 1000);
/** Its density, from the readings: its mass over its volume, kg/m³. */
export const densityOf = (r: MeasurementRecord): number => (r.inputs?.['mass'] ?? 0) / Math.max(1e-12, volumeOf(r));
const mL = (V: number, l: Locale) => `${sig(V * 1e6, 3, l)} ${t(l, 'unit-sym-mL')}`;
export const gcm3 = (rho: number, l: Locale) => `${sig(rho / 1000, 3, l)} ${t(l, 'unit-sym-g-per-cm3')}`;

export function shown(c: MandarinCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'weigh') return `m = ${mass(r, locale)}`;
  if (c.step === 'peel') return t(locale, 'mandarin-float-shown-peel', { flesh: mass(r, locale), peel: recs[1] ? mass(recs[1], locale) : '' });
  return t(locale, 'mandarin-float-shown-dunk', { floats: r.inputs?.['floats'] ? 'yes' : 'no', V: mL(volumeOf(r), locale), rho: gcm3(densityOf(r), locale) });
}

/** What the Professor says when it is done. */
export function say(c: MandarinCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'weigh') return t(locale, 'mandarin-float-say-weigh', { m: mass(r, locale) });
  if (c.step === 'peel') return t(locale, 'mandarin-float-say-peel', { flesh: mass(r, locale), peel: recs[1] ? mass(recs[1], locale) : '' });
  const share = Math.round((r.inputs?.['share'] ?? 1) * 100);
  return t(locale, 'mandarin-float-say-dunk', { part: c.part, floats: r.inputs?.['floats'] ? 'yes' : 'no', share: String(share), dm: mass(r, locale), V: mL(volumeOf(r), locale), rho: gcm3(densityOf(r), locale), liquid: gcm3(r.inputs?.['liquid'] ?? 1000, locale) });
}

/** The board: the masses; for each part under the liquid — its volume (Δm / ρ_р) and its density (m / V). */
export function board(c: MandarinCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  if (c.step === 'weigh') return [{ id: `mm:${i}`, title: t(locale, 'mandarin-float-board-mass'), formula: `m = ${mass(r, locale)}` }];
  if (c.step === 'peel') return [{ id: `mp:${i}`, title: t(locale, 'mandarin-float-board-parts'), formula: `m_м = ${mass(r, locale)}; m_шк = ${trace[1] ? mass(trace[1], locale) : ''}` }];
  if (c.step !== 'dunk') return [];
  const part = tr(partName(c.part), locale);
  const rhoL = r.inputs?.['liquid'] ?? 1000;
  const m = formatMeasured('mass', r.inputs?.['mass'] ?? 0, r.inputs?.['massDivision'] ?? 1e-5, locale);
  const rho = densityOf(r);
  return [
    { id: `mv:${i}`, title: t(locale, 'mandarin-float-board-volume', { part, liquid: c.salt > 0 ? 'salt' : 'water' }), formula: 'V = Δm / ρ_р', numbers: `${mass(r, locale)} / ${gcm3(rhoL, locale)} ≈ ${mL(volumeOf(r), locale)}` },
    { id: `md:${i}`, title: t(locale, 'mandarin-float-board-density', { part }), formula: 'ρ = m / V', numbers: `${m} / ${mL(volumeOf(r), locale)} ≈ ${gcm3(rho, locale)} ${rho < rhoL ? '<' : '>'} ${gcm3(rhoL, locale)}` },
  ];
}
