import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PULL_TEXT, type PullCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Дерев’яний брусок, дерев’яна дошка, тягарці по 100 г, динамометр', en: 'A wooden block, a wooden board, 100 g weights, a dynamometer' };

export const text = (c: PullCommand): StepText => PULL_TEXT(c);

export const busy = (): LocalizedText => ({ uk: 'Тягну брусок рівномірно…', en: 'Pulling the block steadily…' });

export const shown = (_c: PullCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The dynamometer pulling the block steadily: that is the sliding friction. */
export function say(c: PullCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  void before;
  const uk = locale === 'uk';
  const n = c.weights;
  const F = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  if (c.face === 'narrow') return uk ? `На вужчій грані брусок ковзає рівномірно — динамометр показує ${F}.` : `On its narrower face the block slides steadily — the dynamometer shows ${F}.`;
  if (c.surface === 'paper') return uk ? `По папері брусок ковзає рівномірно — динамометр показує ${F}.` : `Over the paper the block slides steadily — the dynamometer shows ${F}.`;
  return uk ? `Брусок${n === 1 ? ' із тягарцем' : n ? ` із ${n} тягарцями` : ''} ковзає рівномірно — динамометр показує ${F}. Це і є сила тертя ковзання.` : `The block${n ? ` with ${n} weight${n === 1 ? '' : 's'}` : ''} slides steadily — the dynamometer shows ${F}. That is the force of sliding friction.`;
}

/** The board's lines for a done step. */
export function board(c: PullCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const F2 = (x: number) => formatMeasured('force', x, 0.01, locale);
  void before;
  const N = r.inputs?.['N'] ?? 0;
  const how = c.face === 'narrow' ? (uk ? ', вужча грань' : ', narrower face') : c.surface === 'paper' ? (uk ? ', по папері' : ', over paper') : '';
  out.push({ id: `mu:${i}`, title: uk ? `тертя ковзання: брусок ${c.weights === 0 ? 'без тягарців' : `і ${c.weights} × 100 г`}${how}` : `sliding friction: the block ${c.weights === 0 ? 'alone' : `and ${c.weights} × 100 g`}${how}`, formula: 'μ = F / N', numbers: `${formatMeasured('force', r.value!, 0.1, locale)} / ${F2(N)} ≈ ${n(r.value! / N, 2)}` });
  return out;
  return out;
}
