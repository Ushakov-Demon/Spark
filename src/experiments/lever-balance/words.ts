import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BALANCE_TEXT, balanceWeights, type BalanceCommand, weightsText } from './bench.js';


export const text = (c: BalanceCommand): StepText => BALANCE_TEXT(c);

export const busy = (): LocalizedText => msg('lever-balance-busy');

export const shown = (_c: BalanceCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The first reading of an earlier step of this kind in the run that passes `pick`. */
const earlier = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], type: string, pick: (c: Record<string, unknown>) => boolean) =>
  before.flatMap((x) => (x.ok && x.command.type === type && pick(x.command as unknown as Record<string, unknown>) ? [x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null)] : [])).filter((x): x is MeasurementRecord => !!x);

/** The balance level: the weights on its pan, and their sum. */
export function say(c: BalanceCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  void c;
  void before;
  const v = recs[0]?.value ?? null;
  if (v === null) return t(locale, 'lever-balance-say');
  const set = balanceWeights(v) ?? [];
  return t(locale, 'lever-balance-say-2', { set: weightsText(set, locale), value: formatMeasured('mass', v, 0.00001, locale) });
}

/** The board's lines for a done step. */
export function board(c: BalanceCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const what = c.what;
  const label = c.label?.[locale] ?? (what === 'vessel-empty' ? t(locale, 'lever-balance-text-name') : what === 'vessel' ? t(locale, 'lever-balance-text-name-2') : t(locale, 'lever-balance-text-name-3'));
  const g = (kg: number) => formatMeasured('mass', kg, 0.00001, locale);
  const set = balanceWeights(r.value!) ?? [];
  out.push({ id: `bal:${i}`, title: t(locale, 'lever-balance-board-title', { label: label.toLowerCase() }), formula: `m = ${g(r.value!)}`, numbers: weightsText(set, locale) });
  const emptyVessel = what === 'vessel' ? (earlier(before, 'lab.balance', (x) => x['what'] === 'vessel-empty').pop()?.value ?? null) : null;
  if (emptyVessel !== null) {
    out.push({ id: `liq:${i}`, title: t(locale, 'lever-balance-board-title-2'), formula: 'm = m₂ − m₁', numbers: `${g(r.value!)} − ${g(emptyVessel)} = ${g((r.value! - emptyVessel))}` });
    // The density, when the volume is known: poured by measure.
    const V = c.volume;
    if (V) {
      const m = r.value! - emptyVessel;
      const n = (x: number) => sig(x, 3, locale);
      out.push({ id: `rhoL:${i}`, title: c.substance ? t(locale, 'lever-balance-board-rho-water') : t(locale, 'lab-board-liquid-density-line-title'), formula: 'ρ = m / V', numbers: `${n(m * 1000)} ${t(locale, 'unit-sym-g')} / ${n(V * 1e6)} ${t(locale, 'unit-sym-cm3')} ≈ ${n(m / V / 1000)} ${t(locale, 'unit-sym-g-per-cm3')} = ${n(m / V)} ${t(locale, 'unit-sym-kg-per-m3')}` });
    }
  }
  return out;
}
