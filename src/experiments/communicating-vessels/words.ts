import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { UTUBE_TEXT, type UtubeCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Скляна U-подібна трубка на штативі, вода, соняшникова олія, мензурка, лінійка', en: 'A glass U-tube on a stand, water, sunflower oil, a measuring cylinder, a ruler' };

export const text = (c: UtubeCommand): StepText => UTUBE_TEXT['lab.utube'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export function shown(_c: UtubeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (recs.length !== 2) return cm(recs[0]?.value ?? 0, locale);
  return locale === 'uk' ? `олія ${cm(recs[0]!.value ?? 0, locale)}, вода ${cm(recs[1]!.value ?? 0, locale)}` : `oil ${cm(recs[0]!.value ?? 0, locale)}, water ${cm(recs[1]!.value ?? 0, locale)}`;
}

/** The levels alike with water alone; with oil — both columns above the boundary. */
export function say(c: UtubeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const ml = c.poured;
  if (ml === 0) return uk ? 'Вода в обох колінах стоїть на одному рівні!' : 'The water stands at one level in both arms!';
  const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
  const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
  return uk ? `Олії ${ml} мл: її стовп — ${cm(hO, locale)}, а вода справа стоїть над межею лише на ${cm(hW, locale)}.` : `${ml} mL of oil: its column is ${cm(hO, locale)}, and the water on the right stands only ${cm(hW, locale)} above the boundary.`;
}

/** The board's lines for a done step. */
export function board(c: UtubeCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const ml = c.poured;
  const recs = trace;
  const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
  if (ml === 0) {
    out.push({ id: 'u0', title: uk ? 'сама вода: різниця рівнів у колінах' : 'water alone: the levels’ difference', formula: `Δh = ${cmT(r.value!)}` });
    return out;
  }
  const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
  const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
  const rhoW = r.inputs?.['rhoWater'] ?? 997;
  out.push({ id: `uh:${ml}`, title: uk ? `олії ${ml} мл: висоти над межею` : `${ml} mL of oil: the heights above the boundary`, formula: `h_${uk ? 'олії' : 'oil'} = ${cmT(hO)}, h_${uk ? 'води' : 'water'} = ${cmT(hW)}` });
  if (hO > 0) out.push({ id: `rhoU:${ml}`, title: uk ? `густина олії (${ml} мл)` : `the oil’s density (${ml} mL)`, formula: uk ? 'ρ_олії = ρ_води·h_води / h_олії' : 'ρ_oil = ρ_water·h_water / h_oil', numbers: `${n(rhoW, 4)} · ${n(hW * 100)} / ${n(hO * 100)} ≈ ${n((rhoW * hW) / hO, 3)} ${uk ? 'кг/м³' : 'kg/m³'}` });
  return out;
}
