import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BALANCE_TEXT, balanceWeights, type BalanceCommand, weightsText } from './bench.js';

export const setup: LocalizedText = { uk: 'Важільні терези, набір важків, пінцет', en: 'A lever balance, a set of weights, tweezers' };

export const text = (c: BalanceCommand): StepText => BALANCE_TEXT(c);

export const busy = (): LocalizedText => ({ uk: 'Підбираю важки — від більших до менших…', en: 'Picking the weights — from larger to smaller…' });

export const shown = (_c: BalanceCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The first reading of an earlier step of this kind in the run that passes `pick`. */
const earlier = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], type: string, pick: (c: Record<string, unknown>) => boolean) =>
  before.flatMap((x) => (x.ok && x.command.type === type && pick(x.command as unknown as Record<string, unknown>) ? [x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null)] : [])).filter((x): x is MeasurementRecord => !!x);

/** The balance level: the weights on its pan, and their sum. */
export function say(c: BalanceCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  void c;
  void before;
  const uk = locale === 'uk';
  const v = recs[0]?.value ?? null;
  if (v === null) return uk ? 'Важків із набору не вистачає — тіло завелике для цих терезів (до 211 г).' : 'The set of weights is not enough — the load is too heavy for this balance (up to 211 g).';
  const set = balanceWeights(v) ?? [];
  return uk ? `Терези в рівновазі: ${weightsText(set, true)} = ${formatMeasured('mass', v, 0.00001, locale)}.` : `The balance is level: ${weightsText(set, false)} = ${formatMeasured('mass', v, 0.00001, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: BalanceCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const what = c.what;
  const label = c.label?.[uk ? 'uk' : 'en'] ?? (what === 'vessel-empty' ? (uk ? 'порожня посудина' : 'the empty vessel') : what === 'vessel' ? (uk ? 'посудина з рідиною' : 'the vessel with the liquid') : uk ? 'тіло' : 'the body');
  const g = (kg: number) => formatMeasured('mass', kg, 0.00001, locale);
  const set = balanceWeights(r.value!) ?? [];
  out.push({ id: `bal:${i}`, title: uk ? `важільні терези: ${label.toLowerCase()}` : `lever balance: ${label.toLowerCase()}`, formula: `m = ${g(r.value!)}`, numbers: weightsText(set, uk) });
  // (The density itself, with the volume by the marks, is the general board's: two instruments.)
  const emptyVessel = what === 'vessel' ? (earlier(before, 'lab.balance', (x) => x['what'] === 'vessel-empty').pop()?.value ?? null) : null;
  if (emptyVessel !== null) {
    out.push({ id: `liq:${i}`, title: uk ? 'маса рідини — різниця двох зважувань' : 'the mass of the liquid — the difference of two weighings', formula: 'm = m₂ − m₁', numbers: `${g(r.value!)} − ${g(emptyVessel)} = ${g((r.value! - emptyVessel))}` });
  }
  return out;
}
