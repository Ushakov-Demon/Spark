import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { UTUBE_TEXT, type UtubeCommand } from './bench.js';


export const text = (c: UtubeCommand): StepText => UTUBE_TEXT['lab.utube'](c);

/** The water poured in, or the oil — each with its motion on the scene. */
export const busy = (c: { readonly poured: number }): LocalizedText | null => (c.poured === 0 ? msg('communicating-vessels-busy') : msg('communicating-vessels-busy-oil'));

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export function shown(_c: UtubeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (recs.length !== 2) return cm(recs[0]?.value ?? 0, locale);
  return t(locale, 'communicating-vessels-shown', { recs: cm(recs[0]!.value ?? 0, locale), recs2: cm(recs[1]!.value ?? 0, locale) });
}

/** The levels alike with water alone; with oil — both columns above the boundary. */
export function say(c: UtubeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const ml = c.poured;
  if (ml === 0) return t(locale, 'communicating-vessels-say');
  const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
  const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
  return t(locale, 'communicating-vessels-say-2', { ml: String(ml), hO: cm(hO, locale), hW: cm(hW, locale) });
}

/** The board's lines for a done step. */
export function board(c: UtubeCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const ml = c.poured;
  const recs = trace;
  const cmT = (m: number) => `${n(m * 100)} ${t(locale, 'unit-sym-cm')}`;
  if (ml === 0) {
    out.push({ id: 'u0', title: t(locale, 'communicating-vessels-u0-title'), formula: `Δh = ${cmT(r.value!)}` });
    return out;
  }
  const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
  const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
  const rhoW = r.inputs?.['rhoWater'] ?? 997;
  out.push({ id: `uh:${ml}`, title: t(locale, 'communicating-vessels-board-title', { ml: String(ml) }), formula: `h_${t(locale, 'communicating-vessels-board-formula')} = ${cmT(hO)}, h_${t(locale, 'communicating-vessels-board-formula-2')} = ${cmT(hW)}` });
  if (hO > 0) out.push({ id: `rhoU:${ml}`, title: t(locale, 'communicating-vessels-board-title-2', { ml: String(ml) }), formula: t(locale, 'communicating-vessels-board-formula-3'), numbers: `${n(rhoW, 4)} · ${n(hW * 100)} / ${n(hO * 100)} ≈ ${n((rhoW * hW) / hO, 3)} ${t(locale, 'unit-sym-kg-per-m3')}` });
  return out;
}
