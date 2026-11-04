import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { kineticEnergy, potentialEnergy } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { ENERGY_TEXT, type EnergyCommand } from './bench.js';

export const setup: LocalizedText = msg('rolling-energy-setup');

export const text = (c: EnergyCommand): StepText => ENERGY_TEXT['lab.energy'](c);

/** Weighing just changes the picture; the ball rolls. */
export const busy = (c: EnergyCommand): LocalizedText | null => (c.step === 'roll' ? msg('rolling-energy-busy') : null);

const pick = (recs: readonly MeasurementRecord[], which: number) => recs.find((r) => r.inputs?.['which'] === which);
const frames = (n: number, l: Locale) => tl(l, 'count-frames', { n });

export function shown(c: EnergyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'weigh') return formatMeasured('mass', recs[0]?.value ?? 0, 0.00001, locale);
  const t = pick(recs, 2);
  const n = t?.inputs?.['frames'] ?? 0;
  return tl(locale, 'rolling-energy-shown', { height: String(Math.round(c.height * 100)), n: frames(n, locale) });
}

/** What the scales and the video showed. */
export function say(c: EnergyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'weigh') return tl(locale, 'rolling-energy-say', { value: formatMeasured('mass', recs[0]?.value ?? 0, 0.00001, locale) });
  const t = pick(recs, 2);
  const n = t?.inputs?.['frames'] ?? 0;
  const fps = t?.inputs?.['fps'] ?? 240;
  return tl(locale, 'rolling-energy-say-2', { n: frames(n, locale), fps: String(fps), value: sig(t?.value ?? 0, 3, locale) });
}

const massOf = (before: readonly ExperimentLogEntry<{ readonly type: string }>[]): number | null =>
  before.flatMap((x) => (x.ok && x.command.type === 'lab.energy' && (x.command as { step?: string }).step === 'weigh' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop()?.value ?? null;

/** The board: the mass; for each height the speed, the kinetic energy, the potential one, and their ratio. */
export function board(c: EnergyCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale);
  if (c.step === 'weigh') {
    const m = trace[0]?.value;
    return m === null || m === undefined ? [] : [{ id: `em:${i}`, title: tl(locale, 'rolling-energy-board-title'), formula: `m = ${formatMeasured('mass', m, 0.00001, locale)}` }];
  }
  const h = pick(trace, 1)?.value ?? 0;
  const t = pick(trace, 2);
  const m = massOf(before);
  if (!t || t.value === null || m === null) return [];
  const path = t.inputs?.['path'] ?? 0.5;
  const g = t.inputs?.['g'] ?? 9.81;
  const v = path / t.value;
  const Ek = kineticEnergy(m, v);
  const Ep = potentialEnergy(m, g, h);
  const mJ = (x: number) => `${n(x * 1000)} ${tl(locale, 'unit-sym-mJ')}`;
  const cmH = `${Math.round(h * 100)} ${tl(locale, 'unit-sym-cm')}`;
  return [
    { id: `ev:${i}`, title: tl(locale, 'rolling-energy-board-title-2', { cmH }), formula: 'v = s / t', numbers: `${n(path * 100)} ${tl(locale, 'unit-sym-cm')} / ${n(t.value)} ${tl(locale, 'unit-sym-s')} ≈ ${n(v)} ${tl(locale, 'unit-sym-m-per-s')}` },
    { id: `ek:${i}`, title: tl(locale, 'rolling-energy-board-title-3', { cmH }), formula: 'Eₖ = m·v²/2,  Eₚ = m·g·h', numbers: `${mJ(Ek)} ; ${mJ(Ep)}` },
    { id: `er:${i}`, title: tl(locale, 'rolling-energy-board-title-4', { cmH }), formula: 'Eₖ / Eₚ', numbers: `≈ ${n(Ek / Ep, 2)}` },
  ];
}
