import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DEPTH_TEXT, type DepthCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Хімічний стакан на 1 л із рідиною, воронка з гумовою плівкою на трубці, рідинний (U-подібний) манометр із водою, лінійка', en: 'A 1 L beaker of liquid, a funnel with a rubber film on a tube, a liquid (U-tube) manometer with water, a ruler' };

export const text = (c: DepthCommand): StepText => DEPTH_TEXT['lab.depth'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export const shown = (_c: DepthCommand, recs: readonly MeasurementRecord[], locale: Locale): string => cm(recs[0]?.value ?? 0, locale);

/** How far apart the manometer's water levels are at this depth; sideways — the same as with the film down. */
export function say(c: DepthCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const v = recs[0]?.value;
  if (v === null || v === undefined) return '';
  const d = cm(c.depth, locale);
  if (c.sideways) return uk ? `Плівка вбік на ${d} — а рівні в манометрі різняться так само: на ${cm(v, locale)}!` : `The film sideways at ${d} — and the manometer’s levels differ just the same: by ${cm(v, locale)}!`;
  return uk ? `Плівка на глибині ${d}: рівні води в манометрі різняться на ${cm(v, locale)}.` : `The film ${d} deep: the water levels in the manometer differ by ${cm(v, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: DepthCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const h = c.depth;
  const side = !!c.sideways;
  const rhoM = r.inputs?.['rhoManometer'] ?? 1000;
  const g = r.inputs?.['g'] ?? 9.81;
  const p = rhoM * g * r.value!;
  const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
  const where = side ? (uk ? `, плівкою вбік` : ', film sideways') : '';
  out.push({ id: `dp:${side ? 's' : ''}${Math.round(h * 1000)}`, title: uk ? `тиск на глибині ${cmT(h)}${where}` : `the pressure at ${cmT(h)}${where}`, formula: 'p = ρ_води·g·Δh', numbers: `${n(rhoM, 4)} · ${n(g)} · ${n(r.value!, 3)} ≈ ${n(p, 3)} ${uk ? 'Па' : 'Pa'}` });
  if (!side) out.push({ id: `rhoD:${Math.round(h * 1000)}`, title: uk ? `густина рідини (з глибини ${cmT(h)})` : `the liquid’s density (from ${cmT(h)})`, formula: 'ρ = p / (g·h)', numbers: `${n(p, 3)} / (${n(g)} · ${n(h)}) ≈ ${n(p / (g * h), 3)} ${uk ? 'кг/м³' : 'kg/m³'}` });
  return out;
}
