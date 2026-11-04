import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { density } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DIVER_TEXT, type DiverCommand, lightSqueeze } from './bench.js';


export const text = (c: DiverCommand): StepText => DIVER_TEXT['lab.diver'](c);

/** Weighing and the cylinder just change the picture; the bottle squeezed or let go — the diver goes down or up. */
export const busy = (c: DiverCommand): LocalizedText | null =>
  c.step === 'squeeze' ? msg('cartesian-diver-busy') : c.step === 'release' ? msg('cartesian-diver-busy-2') : null;

const mm = (x: number | null, locale: Locale) => `${Math.round((x ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`;

export function shown(c: DiverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh' || c.step === 'volume') return readingText(r, locale);
  const sinks = r.inputs?.['sinks'] === 1;
  if (c.step === 'squeeze') return t(locale, 'cartesian-diver-shown-3', { value: mm(r.value, locale), value2: sinks ? t(locale, 'cartesian-diver-shown') : t(locale, 'cartesian-diver-shown-2') });
  return t(locale, 'cartesian-diver-shown-6', { value: mm(r.value, locale), value2: sinks ? t(locale, 'cartesian-diver-shown-4') : t(locale, 'cartesian-diver-shown-5') });
}

/** What the diver did. */
export function say(c: DiverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh') return t(locale, 'cartesian-diver-say', { r: readingText(r, locale) });
  if (c.step === 'volume') return t(locale, 'cartesian-diver-say-2', { r: readingText(r, locale) });
  const sinks = r.inputs?.['sinks'] === 1;
  if (c.step === 'squeeze')
    return sinks
      ? t(locale, 'cartesian-diver-say-3', { value: mm(r.value, locale) })
      : t(locale, 'cartesian-diver-say-4', { value: mm(r.value, locale) });
  return sinks ? t(locale, 'cartesian-diver-say-5') : t(locale, 'cartesian-diver-say-6');
}

const reading = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], step: string): MeasurementRecord | undefined =>
  before.flatMap((x) => (x.ok && x.command.type === 'lab.diver' && (x.command as { step?: string }).step === step ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop();

/** The board's lines for a done step: the diver's mass, volume, how much water came in, its mean density. */
export function board(c: DiverCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale);
  const r = trace[0];
  if (!r || r.value === null) return [];
  const gcm = t(locale, 'unit-sym-g-per-cm3');
  const mL = t(locale, 'unit-sym-mL');
  const vol = (x: number) => formatMeasured('volume', x, 1e-7, locale);
  const gram = (x: number) => formatMeasured('mass', x, 0.00001, locale);
  if (c.step === 'weigh') return [{ id: `dm:${i}`, title: t(locale, 'cartesian-diver-board-title'), formula: `m = ${formatMeasured('mass', r.value, 0.00001, locale)}` }];
  const m = reading(before, 'weigh')?.value ?? null;
  if (c.step === 'volume') {
    const before0 = r.inputs?.['before'] ?? 0;
    const after = r.inputs?.['after'] ?? 0;
    const out: BoardLine[] = [{ id: `dV:${i}`, title: t(locale, 'cartesian-diver-out-title'), formula: 'V = V₂ − V₁', numbers: `${vol(after)} − ${vol(before0)} = ${vol(r.value)}` }];
    if (m !== null) out.push({ id: `rho:${i}`, title: t(locale, 'cartesian-diver-board-title-2'), formula: 'ρ = m / V', numbers: `${gram(m)} / ${vol(r.value)} ≈ ${n(density(m, r.value) / 1000, 3)} ${gcm}` });
    return out;
  }
  // The water that came in took the place of so much air: a column of the tube, S·Δh.
  const d = r.inputs?.['tube'] ?? 0.004;
  const dV = Math.PI * (d / 2) ** 2 * r.value;
  const V = reading(before, 'volume')?.value ?? null;
  const rho = r.inputs?.['water'] ?? 1000;
  const what = c.step === 'release' ? t(locale, 'cartesian-diver-board-what') : lightSqueeze(c.press) ? t(locale, 'cartesian-diver-board-what-2') : t(locale, 'cartesian-diver-board-what-3');
  const out: BoardLine[] = [{ id: `dh:${i}`, title: t(locale, 'cartesian-diver-out-title-4', { what, d: n(d * 1000, 1), value: c.step === 'release' ? t(locale, 'cartesian-diver-out-title-2') : t(locale, 'cartesian-diver-out-title-3') }), formula: 'ΔV = π·d²/4 · Δh', numbers: `${mm(r.value, locale)} → ${n(dV * 1e6, 2)} ${mL}` }];
  if (m !== null && V !== null) {
    const mean = density(m, V - dV);
    out.push({ id: `rho:${i}`, title: t(locale, 'cartesian-diver-board-title-3', { rho: n(rho / 1000, 3), gcm }), formula: 'ρ = m / (V − ΔV)', numbers: `${gram(m)} / ${n((V - dV) * 1e6, 3)} ${mL} ≈ ${n(mean / 1000, 3)} ${gcm} ${mean > rho ? '>' : '<'} ${n(rho / 1000, 3)}` });
  }
  return out;
}
