import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { TOWER_BODIES, TOWER_LIQUIDS, TOWER_TEXT, type TowerBody, type TowerCommand, towerLiquidDensity, towerLiquidIn, towerLiquidName } from './bench.js';


export const text = (c: TowerCommand): StepText => TOWER_TEXT['lab.tower'](c);

export const busy = (c: TowerCommand): LocalizedText =>
  c.step === 'drop' ? msg('liquid-tower-busy') : msg('liquid-tower-busy-2');

/** Where a body let into the tower stopped, in words (its reading: the mark, the lower layer, the share in it). */
function towerPlace(body: TowerBody, r: MeasurementRecord | undefined, locale: Locale): string {
  const lower = r?.inputs?.['lower'] ?? -1;
  const name = tr(TOWER_BODIES[body].name, locale);
  const N = name.charAt(0).toUpperCase() + name.slice(1);
  const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), locale);
  if (lower < 0) return t(locale, 'liquid-tower-place-bottom', { N, what: body });
  if (r?.inputs?.['top'] === 1) return t(locale, 'liquid-tower-place', { N, TOWER_LIQUIDS: tr(towerLiquidIn(TOWER_LIQUIDS[lower]!), locale) });
  const mark = `${Math.round((r?.value ?? 0) * 1e6)} ${t(locale, 'unit-sym-mL')}`;
  return t(locale, 'liquid-tower-place-boundary', { N, what: body, below: nm(lower), above: nm(lower + 1), mark });
}

export const shown = (c: TowerCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  c.step === 'pour' ? `50 · 100 · 150 · 200 ${t(locale, 'unit-sym-mL')}` : towerPlace(c.body ?? 'nut', recs[0], locale).replace(/\.$/, '');

/** The layers; where a body stopped. */
export function say(c: TowerCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'pour') return t(locale, 'liquid-tower-say');
  return towerPlace(c.body ?? 'nut', recs[0], locale);
}

/** The board's lines for a done step. */
export function board(c: TowerCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const d = TOWER_LIQUIDS.map(towerLiquidDensity);
  const kg = t(locale, 'unit-sym-kg-per-m3');
  const ml = t(locale, 'unit-sym-mL');
  const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), locale);
  if (c.step === 'pour') {
    out.push({ id: `tl:${i}`, title: t(locale, 'liquid-tower-board-title'), formula: t(locale, 'liquid-tower-board-order'), numbers: `${d.map((x) => Math.round(x)).join(' > ')} ${kg}` });
    return out;
  }
  const body = c.body ?? 'nut';
  const rho = r.inputs?.['density'] ?? 0;
  const lower = r.inputs?.['lower'] ?? -1;
  const share = r.inputs?.['share'] ?? 0;
  const made = tr(TOWER_BODIES[body].made, locale);
  const R = (x: number) => String(Math.round(x));
  if (lower < 0) out.push({ id: `tw:${i}`, title: t(locale, 'liquid-tower-board-title-2', { made }), formula: t(locale, 'liquid-tower-board-formula'), numbers: `${R(rho)} > ${R(d[0]!)} ${kg}` });
  else if (r.inputs?.['top'] === 1) out.push({ id: `tw:${i}`, title: t(locale, 'liquid-tower-board-title-3', { made, value: n(r.value! * 1e6, 3), ml }), formula: t(locale, 'liquid-tower-board-formula-2'), numbers: `${R(rho)} / ${R(d[lower]!)} ≈ ${n(share, 2)}` });
  else out.push({ id: `tw:${i}`, title: t(locale, 'liquid-tower-board-title-4', { made, lower: nm(lower), lower2: nm(lower + 1), value: n(r.value! * 1e6, 3), ml }), formula: t(locale, 'liquid-tower-board-formula-3'), numbers: `(${R(rho)} − ${R(d[lower + 1]!)}) / (${R(d[lower]!)} − ${R(d[lower + 1]!)}) ≈ ${n(share, 2)}` });
  return out;
}
