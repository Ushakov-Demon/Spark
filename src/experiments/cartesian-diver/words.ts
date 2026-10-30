import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { density } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DIVER_TEXT, type DiverCommand, lightSqueeze } from './bench.js';

export const setup: LocalizedText = { uk: 'Скляна піпетка з гумовим ковпачком (водолаз), пластикова пляшка 1,5 л, повна води, з кришкою, лабораторні терези, мензурка на 10 мл, тонкий дротик, лінійка', en: 'A glass dropper with a rubber cap (the diver), a full 1.5 L plastic bottle with its cap, a laboratory balance, a 10 mL measuring cylinder, a thin wire, a ruler' };

export const text = (c: DiverCommand): StepText => DIVER_TEXT['lab.diver'](c);

/** Weighing and the cylinder just change the picture; the bottle squeezed or let go — the diver goes down or up. */
export const busy = (c: DiverCommand): LocalizedText | null =>
  c.step === 'squeeze' ? { uk: 'Стискаю пляшку…', en: 'Squeezing the bottle…' } : c.step === 'release' ? { uk: 'Відпускаю пляшку…', en: 'Letting the bottle go…' } : null;

const mm = (x: number | null, locale: Locale) => `${Math.round((x ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;

export function shown(c: DiverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh' || c.step === 'volume') return readingText(r, locale);
  const sinks = r.inputs?.['sinks'] === 1;
  if (c.step === 'squeeze') return uk ? `вода в трубці вгору на ${mm(r.value, locale)}; водолаз ${sinks ? 'тоне' : 'плаває'}` : `the water in the tube up by ${mm(r.value, locale)}; the diver ${sinks ? 'sinks' : 'floats'}`;
  return uk ? `вода в трубці опустилася — вище, ніж спочатку, лише на ${mm(r.value, locale)}; водолаз ${sinks ? 'лишається на дні' : 'спливає'}` : `the water in the tube went down — only ${mm(r.value, locale)} above where it began; the diver ${sinks ? 'stays at the bottom' : 'comes up'}`;
}

/** What the diver did. */
export function say(c: DiverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh') return uk ? `Водолаз важить ${readingText(r, locale)}.` : `The diver weighs ${readingText(r, locale)}.`;
  if (c.step === 'volume') return uk ? `Вода в мензурці піднялася на ${readingText(r, locale)} — такий об’єм водолаза разом із повітрям у ньому.` : `The water in the cylinder rose by ${readingText(r, locale)} — the diver’s volume with its air.`;
  const sinks = r.inputs?.['sinks'] === 1;
  if (c.step === 'squeeze')
    return sinks
      ? uk ? `Вода в трубці піднялася на ${mm(r.value, locale)} — і водолаз пірнув на дно!` : `The water in the tube rose ${mm(r.value, locale)} — and the diver dived to the bottom!`
      : uk ? `Вода в трубці піднялася на ${mm(r.value, locale)}, а водолаз плаває, як плавав.` : `The water in the tube rose ${mm(r.value, locale)}, and the diver floats as before.`;
  return sinks ? (uk ? 'Водолаз лишився на дні!' : 'The diver stayed at the bottom!') : uk ? 'Вода з піпетки вийшла — і водолаз спливає!' : 'The water left the dropper — and the diver comes up!';
}

const reading = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], step: string): MeasurementRecord | undefined =>
  before.flatMap((x) => (x.ok && x.command.type === 'lab.diver' && (x.command as { step?: string }).step === step ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop();

/** The board's lines for a done step: the diver's mass, volume, how much water came in, its mean density. */
export function board(c: DiverCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale);
  const r = trace[0];
  if (!r || r.value === null) return [];
  const gcm = uk ? 'г/см³' : 'g/cm³';
  const mL = uk ? 'мл' : 'mL';
  const vol = (x: number) => formatMeasured('volume', x, 1e-7, locale);
  const gram = (x: number) => formatMeasured('mass', x, 0.00001, locale);
  if (c.step === 'weigh') return [{ id: `dm:${i}`, title: uk ? 'маса водолаза' : 'the diver’s mass', formula: `m = ${formatMeasured('mass', r.value, 0.00001, locale)}` }];
  const m = reading(before, 'weigh')?.value ?? null;
  if (c.step === 'volume') {
    const before0 = r.inputs?.['before'] ?? 0;
    const after = r.inputs?.['after'] ?? 0;
    const out: BoardLine[] = [{ id: `dV:${i}`, title: uk ? 'об’єм водолаза з повітрям' : 'the diver’s volume with its air', formula: 'V = V₂ − V₁', numbers: `${vol(after)} − ${vol(before0)} = ${vol(r.value)}` }];
    if (m !== null) out.push({ id: `rho:${i}`, title: uk ? 'середня густина водолаза' : 'the diver’s mean density', formula: 'ρ = m / V', numbers: `${gram(m)} / ${vol(r.value)} ≈ ${n(density(m, r.value) / 1000, 3)} ${gcm}` });
    return out;
  }
  // The water that came in took the place of so much air: a column of the tube, S·Δh.
  const d = r.inputs?.['tube'] ?? 0.004;
  const dV = Math.PI * (d / 2) ** 2 * r.value;
  const V = reading(before, 'volume')?.value ?? null;
  const rho = r.inputs?.['water'] ?? 1000;
  const what = c.step === 'release' ? (uk ? 'відпустили на дні' : 'let go at the bottom') : lightSqueeze(c.press) ? (uk ? 'стиснули злегка' : 'squeezed lightly') : uk ? 'стиснули сильно' : 'squeezed hard';
  const out: BoardLine[] = [{ id: `dh:${i}`, title: uk ? `${what}: вода в трубці (d = ${n(d * 1000, 1)} мм) ${c.step === 'release' ? 'вища, ніж спочатку, на' : 'вгору на'}` : `${what}: the water in the tube (d = ${n(d * 1000, 1)} mm) ${c.step === 'release' ? 'above where it began by' : 'up by'}`, formula: 'ΔV = π·d²/4 · Δh', numbers: `${mm(r.value, locale)} → ${n(dV * 1e6, 2)} ${mL}` }];
  if (m !== null && V !== null) {
    const mean = density(m, V - dV);
    out.push({ id: `rho:${i}`, title: uk ? `густина водолаза (води — ${n(rho / 1000, 3)} ${gcm})` : `the diver’s density (water ${n(rho / 1000, 3)} ${gcm})`, formula: 'ρ = m / (V − ΔV)', numbers: `${gram(m)} / ${n((V - dV) * 1e6, 3)} ${mL} ≈ ${n(mean / 1000, 3)} ${gcm} ${mean > rho ? '>' : '<'} ${n(rho / 1000, 3)}` });
  }
  return out;
}
