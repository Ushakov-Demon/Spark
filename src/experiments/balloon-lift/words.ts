import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { LIFT_TEXT, massText, sizeText, type LiftCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Оболонка кулі з ниткою, балон із газом (або пальник), терези з тягарцем, рулетка; для великої кулі — силомір на прив’язі', en: 'A balloon’s shell with its string, a gas cylinder (or a burner), a balance with a weight, a tape; for a big balloon — a force gauge on its tether' };

export const text = (c: LiftCommand): StepText => LIFT_TEXT['lab.balloon'](c);

/** Weighing and measuring just change the picture; a balloon tied on rises (or lies). */
export const busy = (c: LiftCommand): LocalizedText | null => (c.step === 'lift' ? { uk: 'Прив’язую кулю…', en: 'Tying the balloon on…' } : null);

/** A lifting force as the instrument shows it: on the balance — grams less (or more); on a gauge — newtons. */
export const liftText = (r: MeasurementRecord, l: Locale): string => {
  const uk = l === 'uk';
  const F = r.value ?? 0;
  const g = r.inputs?.['g'] ?? 9.81;
  if (r.inputs?.['balance'] === 1) {
    const dm = (F / g) * 1000;
    return uk ? `терези — на ${sig(Math.abs(dm), 3, l)} г ${dm >= 0 ? 'менше' : 'більше'}` : `the balance — ${sig(Math.abs(dm), 3, l)} g ${dm >= 0 ? 'less' : 'more'}`;
  }
  return uk ? `силомір — ${sig(F, 3, l)} Н` : `the force gauge — ${sig(F, 3, l)} N`;
};
const N = (F: number, l: Locale) => `${sig(F, 3, l)} ${l === 'uk' ? 'Н' : 'N'}`;

export function shown(c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'shell') return massText(r.value, uk);
  if (c.step === 'size') return `D = ${sizeText(r.value, uk)}`;
  return `${liftText(r, locale)}${r.value > 0 ? (uk ? ' — злітає' : ' — it rises') : uk ? ' — лежить' : ' — it lies'}`;
}

/** What the balloon did. */
export function say(c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'shell') return uk ? `Порожня оболонка — ${massText(r.value, uk)}.` : `The empty shell — ${massText(r.value, uk)}.`;
  if (c.step === 'size') return uk ? `Діаметр — ${sizeText(r.value, uk)}.` : `The diameter — ${sizeText(r.value, uk)}.`;
  const up = r.value > 0;
  return uk ? `${liftText(r, locale).replace(/^./, (s) => s.toUpperCase())}: ${up ? 'куля тягне вгору — злетіла б!' : 'куля сама не злетить — лежить.'}` : `${liftText(r, locale).replace(/^./, (s) => s.toUpperCase())}: ${up ? 'the balloon pulls up — it would fly!' : 'the balloon will not fly by itself — it lies.'}`;
}

/** The board: the shell, the volume; for each balloon its gas's density, the air's buoyancy, the lifting force. */
export function board(c: LiftCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const r = trace[0];
  if (!r || r.value === null) return [];
  if (c.step === 'shell') return [{ id: `bm:${i}`, title: uk ? 'маса оболонки' : 'the shell’s mass', formula: `m_об = ${massText(r.value, uk)}` }];
  if (c.step === 'size') return [{ id: `bv:${i}`, title: uk ? 'об’єм кулі' : 'the balloon’s volume', formula: 'V = π·D³/6', numbers: `≈ ${sig(r.inputs?.['volume'] ?? 0, 3, locale)} ${uk ? 'м³' : 'm³'}` }];
  const inp = r.inputs ?? {};
  const kgm3 = uk ? 'кг/м³' : 'kg/m³';
  const name = c.step === 'lift' ? (uk ? { helium: 'гелій', hydrogen: 'водень', 'hot-air': 'гаряче повітря', air: 'повітря' } : { helium: 'helium', hydrogen: 'hydrogen', 'hot-air': 'hot air', air: 'air' })[c.gas] : '';
  const size = c.step === 'lift' ? sizeText(c.diameter, uk) : '';
  return [
    { id: `bd:${i}`, title: uk ? `${name}, ${size}: густини` : `${name}, ${size}: the densities`, formula: 'ρ_пов, ρ_г', numbers: `${sig(inp['airDensity'] ?? 0, 3, locale)} ; ${sig(inp['gasDensity'] ?? 0, 3, locale)} ${kgm3}` },
    { id: `bf:${i}`, title: uk ? `${name}, ${size}: піднімальна сила` : `${name}, ${size}: the lifting force`, formula: 'F = (ρ_пов − ρ_г)·g·V − m_об·g', numbers: `≈ ${N(r.value, locale)}` },
  ];
}
