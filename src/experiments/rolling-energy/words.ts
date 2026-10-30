import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { kineticEnergy, potentialEnergy } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { ENERGY_TEXT, type EnergyCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Жолоб на штативі, сталева кулька (25 мм), лабораторні терези, лінійка, дві крейдяні риски на столі за 50 см одна від одної, телефон зі сповільненою зйомкою', en: 'A groove on a stand, a steel ball (25 mm), a laboratory balance, a ruler, two chalk marks on the table 50 cm apart, a phone filming in slow motion' };

export const text = (c: EnergyCommand): StepText => ENERGY_TEXT['lab.energy'](c);

/** Weighing just changes the picture; the ball rolls. */
export const busy = (c: EnergyCommand): LocalizedText | null => (c.step === 'roll' ? { uk: 'Кулька котиться — телефон знімає…', en: 'The ball rolls — the phone films…' } : null);

const pick = (recs: readonly MeasurementRecord[], which: number) => recs.find((r) => r.inputs?.['which'] === which);
const frames = (n: number, uk: boolean) => (uk ? `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'кадр' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'кадри' : 'кадрів'}` : `${n} frame${n === 1 ? '' : 's'}`);

export function shown(c: EnergyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (c.step === 'weigh') return formatMeasured('mass', recs[0]?.value ?? 0, 0.00001, locale);
  const t = pick(recs, 2);
  const n = t?.inputs?.['frames'] ?? 0;
  return uk ? `з ${Math.round(c.height * 100)} см — ${frames(n, true)} між рисками` : `from ${Math.round(c.height * 100)} cm — ${frames(n, false)} between the marks`;
}

/** What the scales and the video showed. */
export function say(c: EnergyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (c.step === 'weigh') return uk ? `Кулька важить ${formatMeasured('mass', recs[0]?.value ?? 0, 0.00001, locale)}.` : `The ball weighs ${formatMeasured('mass', recs[0]?.value ?? 0, 0.00001, locale)}.`;
  const t = pick(recs, 2);
  const n = t?.inputs?.['frames'] ?? 0;
  const fps = t?.inputs?.['fps'] ?? 240;
  return uk ? `Від риски до риски — ${frames(n, true)} по 1/${fps} с: ${sig(t?.value ?? 0, 3, locale)} с.` : `Mark to mark — ${frames(n, false)} of 1/${fps} s: ${sig(t?.value ?? 0, 3, locale)} s.`;
}

const massOf = (before: readonly ExperimentLogEntry<{ readonly type: string }>[]): number | null =>
  before.flatMap((x) => (x.ok && x.command.type === 'lab.energy' && (x.command as { step?: string }).step === 'weigh' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop()?.value ?? null;

/** The board: the mass; for each height the speed, the kinetic energy, the potential one, and their ratio. */
export function board(c: EnergyCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale);
  if (c.step === 'weigh') {
    const m = trace[0]?.value;
    return m === null || m === undefined ? [] : [{ id: `em:${i}`, title: uk ? 'маса кульки' : 'the ball’s mass', formula: `m = ${formatMeasured('mass', m, 0.00001, locale)}` }];
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
  const mJ = (x: number) => `${n(x * 1000)} ${uk ? 'мДж' : 'mJ'}`;
  const cmH = `${Math.round(h * 100)} ${uk ? 'см' : 'cm'}`;
  return [
    { id: `ev:${i}`, title: uk ? `з ${cmH}: швидкість між рисками` : `from ${cmH}: the speed between the marks`, formula: 'v = s / t', numbers: `${n(path * 100)} ${uk ? 'см' : 'cm'} / ${n(t.value)} ${uk ? 'с' : 's'} ≈ ${n(v)} ${uk ? 'м/с' : 'm/s'}` },
    { id: `ek:${i}`, title: uk ? `з ${cmH}: кінетична й потенціальна енергія` : `from ${cmH}: the kinetic and the potential energy`, formula: 'Eₖ = m·v²/2,  Eₚ = m·g·h', numbers: `${mJ(Ek)} ; ${mJ(Ep)}` },
    { id: `er:${i}`, title: uk ? `з ${cmH}: яка частка Eₚ стала Eₖ` : `from ${cmH}: what share of Eₚ became Eₖ`, formula: 'Eₖ / Eₚ', numbers: `≈ ${n(Ek / Ep, 2)}` },
  ];
}
