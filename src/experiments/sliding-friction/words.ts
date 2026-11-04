import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PULL_TEXT, type PullCommand } from './bench.js';

export const setup: LocalizedText = msg('sliding-friction-setup');

export const text = (c: PullCommand): StepText => PULL_TEXT(c);

export const busy = (): LocalizedText => msg('sliding-friction-busy');

export const shown = (_c: PullCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The dynamometer pulling the block steadily: that is the sliding friction. */
export function say(c: PullCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  void before;
  const n = c.weights;
  const F = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  if (c.face === 'narrow') return t(locale, 'sliding-friction-say', { F });
  if (c.surface === 'paper') return t(locale, 'sliding-friction-say-2', { F });
  return t(locale, 'sliding-friction-say-weights', { n: n ?? 0, F });
}

/** The board's lines for a done step. */
export function board(c: PullCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const F2 = (x: number) => formatMeasured('force', x, 0.01, locale);
  void before;
  const N = r.inputs?.['N'] ?? 0;
  const how = c.face === 'narrow' ? t(locale, 'sliding-friction-board-how') : c.surface === 'paper' ? t(locale, 'sliding-friction-board-how-2') : '';
  out.push({ id: `mu:${i}`, title: t(locale, 'sliding-friction-board-title-3', { how, value: c.weights === 0 ? t(locale, 'sliding-friction-board-title') : t(locale, 'sliding-friction-board-title-2', { weights: String(c.weights) }) }), formula: 'μ = F / N', numbers: `${formatMeasured('force', r.value!, 0.1, locale)} / ${F2(N)} ≈ ${n(r.value! / N, 2)}` });
  return out;
  return out;
}
