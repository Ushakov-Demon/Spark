import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { VESSEL_TEXT, type VesselCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Прилад Паскаля: підставка з гумовим дном і три посудини різної форми з однаковим дном, рідинний (U-подібний) манометр, мензурка на 500 мл, вода, лінійка', en: 'Pascal’s device: a stand with a rubber bottom and three vessels of different shapes with the same bottom, a liquid (U-tube) manometer, a 500 mL measuring cylinder, water, a ruler' };

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
  const uk = locale === 'uk';
  if (c.step === 'bottom') return uk ? `Дно — ${cm(recs[0]?.value ?? 0, locale)} у діаметрі, однакове в усіх посудин.` : `The bottom is ${cm(recs[0]?.value ?? 0, locale)} across, the same for all the vessels.`;
  const V = formatMeasured('volume', recs.find((x) => x.quantity === 'volume')?.value ?? 0, 5e-6, locale);
  const dh = cm(recs.find((x) => x.quantity === 'length')?.value ?? 0, locale);
  return uk ? `Пішло ${V} води, а манометр показує ${dh}.` : `${V} of water went in, and the manometer shows ${dh}.`;
}

/** The board's lines for a done step. */
export function board(c: VesselCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const recs = trace;
  if (c.step === 'bottom') {
    const vesselArea = Math.PI * (r.value! / 2) ** 2;
    out.push({ id: 'vS', title: uk ? 'площа дна' : 'the bottom’s area', formula: 'S = π·d² / 4', numbers: `${n(Math.PI)} · (${n(r.value! * 100)} ${uk ? 'см' : 'cm'})² / 4 ≈ ${n(vesselArea * 1e4)} ${uk ? 'см²' : 'cm²'}` });
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
  const what = { straight: uk ? 'пряма посудина' : 'the straight vessel', wide: uk ? 'посудина, що розширюється' : 'the widening vessel', narrow: uk ? 'посудина, що звужується' : 'the narrowing vessel' }[shape] ?? shape;
  out.push({ id: `vP:${shape}`, title: uk ? `${what}: вага води` : `${what}: the water’s weight`, formula: 'P = ρ·g·V', numbers: `${n(rho, 4)} · ${n(g)} · ${n(V.value * 1e6)}·10⁻⁶ ≈ ${n(rho * g * V.value, 2)} ${uk ? 'Н' : 'N'}` });
  if (vesselArea) out.push({ id: `vF:${shape}`, title: uk ? `${what}: сила тиску на дно` : `${what}: the force on the bottom`, formula: 'F = ρ·g·Δh·S', numbers: `${n(rho, 4)} · ${n(g)} · ${n(M.value, 3)} · ${n(vesselArea * 1e4)}·10⁻⁴ ≈ ${n(rho * g * M.value * vesselArea, 2)} ${uk ? 'Н' : 'N'}` });
  return out;
}
