import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { AIR_TEXT, type AirCommand, airPlaceName, type AirWhere } from './bench.js';

export const setup: LocalizedText = msg('air-column-setup');

export const text = (c: AirCommand): StepText => AIR_TEXT['lab.air'](c);

export const busy = (c: AirCommand): LocalizedText =>
  c.where === 'airship' || c.where === 'high' ? msg('air-column-busy') : msg('air-column-busy-2');

export const shown = (_c: AirCommand, recs: readonly MeasurementRecord[], locale: Locale): string => formatMeasured('pressure', recs[0]?.value ?? null, 1, locale);

/** The barometer's reading at the place. */
export function say(c: AirCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const name = tr(airPlaceName(c.where), locale);
  const p = formatMeasured('pressure', recs[0]?.value ?? null, 1, locale);
  return t(locale, 'air-column-say', { name: name.charAt(0).toUpperCase(), name2: name.slice(1), p });
}

/** The board's lines for a done step. */
export function board(c: AirCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const where = c.where;
  // (The barometer's readings before this one, by where they were taken.)
  const baro: Partial<Record<string, { p: number; h: number }>> = {};
  for (const x of before) {
    const p = x.ok && x.command.type === 'lab.air' ? x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null) : undefined;
    if (p) baro[(x.command as unknown as AirCommand).where] = { p: p.value!, h: p.inputs?.['height'] ?? 0 };
  }
  const h = r.inputs?.['height'] ?? 0;
  const g = r.inputs?.['g'] ?? 9.81;
  const hPa = (x: number) => `${n(x / 100, 6)} ${t(locale, 'air-column-answer-h-pa')}`;
    out.push({ id: `ap:${i}`, title: t(locale, 'air-column-board-title', { where: tr(airPlaceName(where as AirWhere), locale), h: String(Math.round(h)) }), formula: `p = ${hPa(r.value!)}` });
  const ground = baro['ground'];
  if (where === 'ground') out.push({ id: `am:${i}`, title: t(locale, 'air-column-board-title-2'), formula: 'm = p·S / g', numbers: `${n(r.value!, 5)} ${t(locale, 'unit-sym-Pa')} · 1 ${t(locale, 'unit-sym-m2')} / ${n(g, 3)} ≈ ${n(r.value! / g, 3)} ${t(locale, 'unit-sym-kg')}` });
  if (where === 'ninth' && ground) {
    const dp = ground.p - r.value!;
    const dh = h - ground.h;
    out.push({ id: `ad:${i}`, title: t(locale, 'air-column-board-title-3', { dh: n(dh, 3), dp: n(dp / 100, 3) }), formula: 'ρ = Δp / (g·Δh)', numbers: `${n(dp, 3)} ${t(locale, 'unit-sym-Pa')} / (${n(g, 3)} · ${n(dh, 3)} ${t(locale, 'unit-sym-m')}) ≈ ${n(dp / (g * dh), 3)} ${t(locale, 'unit-sym-kg-per-m3')}` });
  }
  if (where === 'high' && ground) out.push({ id: `ah:${i}`, title: t(locale, 'air-column-board-title-4'), formula: '(p₁ − p) / p₁', numbers: `(${hPa(ground.p)} − ${hPa(r.value!)}) / ${hPa(ground.p)} ≈ ${n(((ground.p - r.value!) / ground.p) * 100, 2)} %` });
  return out;
}
