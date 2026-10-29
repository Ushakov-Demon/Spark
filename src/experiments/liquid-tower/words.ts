import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { TOWER_BODIES, TOWER_LIQUIDS, TOWER_TEXT, type TowerBody, type TowerCommand, towerLiquidDensity, towerLiquidIn, towerLiquidName } from './bench.js';

export const setup: LocalizedText = { uk: 'Мірний циліндр на 250 мл, гліцерин, вода, соняшникова олія, спирт (по 50 мл), харчовий барвник, сталева гайка, шматочки оргскла й поліетилену, сосновий кубик', en: 'A 250 mL measuring cylinder, glycerol, water, sunflower oil, ethanol (50 mL each), food colouring, a steel nut, pieces of acrylic glass and polyethylene, a pine cube' };

export const text = (c: TowerCommand): StepText => TOWER_TEXT['lab.tower'](c);

export const busy = (c: TowerCommand): LocalizedText =>
  c.step === 'drop' ? { uk: 'Опускається… дивимося, де зупиниться…', en: 'Going down… where will it stop…' } : { uk: 'Наливаю повільно, по стінці…', en: 'Pouring slowly, down the wall…' };

/** Where a body let into the tower stopped, in words (its reading: the mark, the lower layer, the share in it). */
function towerPlace(body: TowerBody, r: MeasurementRecord | undefined, locale: Locale): string {
  const uk = locale === 'uk';
  const lower = r?.inputs?.['lower'] ?? -1;
  const fem = TOWER_BODIES[body].fem === true;
  const name = tr(TOWER_BODIES[body].name, locale);
  const N = name.charAt(0).toUpperCase() + name.slice(1);
  const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), locale);
  if (lower < 0) return uk ? `${N} ${fem ? 'лягла' : 'ліг'} на дно.` : `${N} went to the bottom.`;
  if (r?.inputs?.['top'] === 1) return uk ? `${N} плаває ${tr(towerLiquidIn(TOWER_LIQUIDS[lower]!), locale)}, на поверхні.` : `${N} floats ${tr(towerLiquidIn(TOWER_LIQUIDS[lower]!), locale)}, at the top.`;
  const mark = `${Math.round((r?.value ?? 0) * 1e6)} ${uk ? 'мл' : 'mL'}`;
  return uk ? `${N} ${fem ? 'зупинилася' : 'зупинився'} на межі «${nm(lower)} — ${nm(lower + 1)}», біля позначки ${mark}.` : `${N} stopped at the ${nm(lower)} — ${nm(lower + 1)} boundary, by the ${mark} mark.`;
}

export const shown = (c: TowerCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  c.step === 'pour' ? `50 · 100 · 150 · 200 ${locale === 'uk' ? 'мл' : 'mL'}` : towerPlace(c.body ?? 'nut', recs[0], locale).replace(/\.$/, '');

/** The layers; where a body stopped. */
export function say(c: TowerCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'pour') return locale === 'uk' ? 'Рідини лягли шарами: гліцерин унизу, над ним вода, олія, а вгорі — спирт. Межі шарів — на позначках 50, 100 і 150 мл.' : 'The liquids lay in layers: glycerol at the bottom, above it water, oil, and ethanol on top. The boundaries are at the 50, 100 and 150 mL marks.';
  return towerPlace(c.body ?? 'nut', recs[0], locale);
}

/** The board's lines for a done step. */
export function board(c: TowerCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const d = TOWER_LIQUIDS.map(towerLiquidDensity);
  const kg = uk ? 'кг/м³' : 'kg/m³';
  const ml = uk ? 'мл' : 'mL';
  const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), locale);
  if (c.step === 'pour') {
    out.push({ id: `tl:${i}`, title: uk ? 'шари знизу вгору: гліцерин, вода, олія, спирт (по 50 мл)' : 'layers from the bottom: glycerol, water, oil, ethanol (50 mL each)', formula: 'ρ_гл > ρ_в > ρ_ол > ρ_сп'.replace(/_гл|_в|_ол|_сп/g, (m) => (uk ? m : { _гл: '_g', _в: '_w', _ол: '_o', _сп: '_e' }[m]!)), numbers: `${d.map((x) => Math.round(x)).join(' > ')} ${kg}` });
    return out;
  }
  const body = c.body ?? 'nut';
  const rho = r.inputs?.['density'] ?? 0;
  const lower = r.inputs?.['lower'] ?? -1;
  const share = r.inputs?.['share'] ?? 0;
  const made = tr(TOWER_BODIES[body].made, locale);
  const R = (x: number) => String(Math.round(x));
  if (lower < 0) out.push({ id: `tw:${i}`, title: uk ? `${made}: на дні` : `${made}: on the bottom`, formula: uk ? 'ρ_т > ρ_гл' : 'ρ_b > ρ_g', numbers: `${R(rho)} > ${R(d[0]!)} ${kg}` });
  else if (r.inputs?.['top'] === 1) out.push({ id: `tw:${i}`, title: uk ? `${made}: плаває в спирті, позначка ${n(r.value! * 1e6, 3)} ${ml}` : `${made}: floats in the ethanol, the ${n(r.value! * 1e6, 3)} ${ml} mark`, formula: uk ? 'V_зан / V = ρ_т / ρ_сп' : 'V_sub / V = ρ_b / ρ_e', numbers: `${R(rho)} / ${R(d[lower]!)} ≈ ${n(share, 2)}` });
  else out.push({ id: `tw:${i}`, title: uk ? `${made}: межа «${nm(lower)} — ${nm(lower + 1)}», ${n(r.value! * 1e6, 3)} ${ml}; частка в нижній` : `${made}: the ${nm(lower)} — ${nm(lower + 1)} boundary, ${n(r.value! * 1e6, 3)} ${ml}; share in the lower`, formula: uk ? 'V₁ / V = (ρ_т − ρ₂) / (ρ₁ − ρ₂)' : 'V₁ / V = (ρ_b − ρ₂) / (ρ₁ − ρ₂)', numbers: `(${R(rho)} − ${R(d[lower + 1]!)}) / (${R(d[lower]!)} − ${R(d[lower + 1]!)}) ≈ ${n(share, 2)}` });
  return out;
}
