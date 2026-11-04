import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { VESSEL_TEXT, type VesselCommand } from './bench.js';


export const text = (c: VesselCommand): StepText => VESSEL_TEXT['lab.vessel'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export function shown(_c: VesselCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (recs.length !== 2) return recs[0] ? readingText(recs[0], locale) : '';
  return `${formatMeasured('volume', recs[0]!.value, 5e-6, locale)} · Δh ${formatMeasured('length', recs[1]!.value, 0.001, locale)}`;
}

/** The bottom; the water each vessel took and the manometer's reading. */
export function say(c: VesselCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'bottom') return t(locale, 'hydrostatic-paradox-say', { recs: cm(recs[0]?.value ?? 0, locale) });
  const V = formatMeasured('volume', recs.find((x) => x.quantity === 'volume')?.value ?? 0, 5e-6, locale);
  const dh = cm(recs.find((x) => x.quantity === 'length')?.value ?? 0, locale);
  return t(locale, 'hydrostatic-paradox-say-2', { V, dh });
}

/** The board's lines for a done step. */
export function board(c: VesselCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const recs = trace;
  if (c.step === 'bottom') {
    const vesselArea = Math.PI * (r.value! / 2) ** 2;
    out.push({ id: 'vS', title: t(locale, 'hydrostatic-paradox-v-s-title'), formula: 'S = π·d² / 4', numbers: `${n(Math.PI)} · (${n(r.value! * 100)} ${t(locale, 'unit-sym-cm')})² / 4 ≈ ${n(vesselArea * 1e4)} ${t(locale, 'unit-sym-cm2')}` });
    return out;
  }
  const V = recs.find((x) => x.quantity === 'volume');
  const M = recs.find((x) => x.quantity === 'length');
  if (!V || !M || V.value === null || M.value === null) return out;
  const rho = M.inputs?.['rho'] ?? 1000;
  const g = M.inputs?.['g'] ?? 9.81;
  const shape = c.shape;
  const earlier = (step: string) => before.flatMap((x) => (x.ok && x.command.type === c.type && (x.command as unknown as { step: string }).step === step ? x.trace : [])).find((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
  // (The bottom measured first: its area.)
  const d = earlier('bottom')?.value;
  const vesselArea = d ? Math.PI * (d / 2) ** 2 : null;
  const what = { straight: t(locale, 'hydrostatic-paradox-what-straight'), wide: t(locale, 'hydrostatic-paradox-what-wide'), narrow: t(locale, 'hydrostatic-paradox-what-narrow') }[shape] ?? shape;
  out.push({ id: `vP:${shape}`, title: t(locale, 'hydrostatic-paradox-board-title', { what }), formula: 'P = ρ·g·V', numbers: `${n(rho, 4)} · ${n(g)} · ${n(V.value * 1e6)}·10⁻⁶ ≈ ${n(rho * g * V.value, 2)} ${t(locale, 'unit-sym-N')}` });
  if (vesselArea) out.push({ id: `vF:${shape}`, title: t(locale, 'hydrostatic-paradox-board-title-2', { what }), formula: 'F = ρ·g·Δh·S', numbers: `${n(rho, 4)} · ${n(g)} · ${n(M.value, 3)} · ${n(vesselArea * 1e4)}·10⁻⁴ ≈ ${n(rho * g * M.value * vesselArea, 2)} ${t(locale, 'unit-sym-N')}` });
  return out;
}
