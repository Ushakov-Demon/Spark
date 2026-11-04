import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { EDGE_TEXT, type EdgeCommand } from './bench.js';


export const text = (c: EdgeCommand): StepText => EDGE_TEXT(c);

/** No motion: the ruler is put to the edge. */
export const busy = (): LocalizedText | null => null;

export const shown = (_c: EdgeCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The edge just measured. */
export function say(c: EdgeCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  void before;
  const what = [t(locale, 'block-pressure-say-what'), t(locale, 'block-pressure-say-what-2'), t(locale, 'block-pressure-say-what-3')][c.edge];
  return `${what} ${t(locale, 'block-pressure-say')}: ${formatMeasured('length', recs[0]?.value ?? 0, 0.001, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: EdgeCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  // (The edges measured so far, this one too; the block's weight — its last weighing in the air.)
  const edges: (number | undefined)[] = [];
  for (const x of before) if (x.ok && x.command.type === 'lab.edge') edges[(x.command as unknown as EdgeCommand).edge] = x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null)?.value ?? undefined;
  const weighed = before.flatMap((x) => (x.ok && x.command.type === 'lab.hang' && (x.command as unknown as { into: string }).into === 'air' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'force' && x.value !== null).pop();
  edges[c.edge] = r.value!;
  out.push({ id: `edge:${i}`, title: [t(locale, 'block-pressure-board-title'), t(locale, 'block-pressure-board-title-2'), t(locale, 'block-pressure-board-title-3')][c.edge]!, formula: `${['a', 'b', 'c'][c.edge]} = ${cm(r.value!)}` });
  const P = weighed?.value;
  const [a, b, h] = edges;
  if (a !== undefined && b !== undefined && h !== undefined && P !== undefined && P !== null) {
    const faces: [string, number][] = [[t(locale, 'block-pressure-board-faces'), a * b], [t(locale, 'block-pressure-board-faces-2'), a * h], [t(locale, 'block-pressure-board-faces-3'), b * h]];
    for (const [name, S] of faces) out.push({ id: `pressure:${i}:${name}`, title: t(locale, 'block-pressure-board-title-4', { name }), formula: 'p = P / S', numbers: `${formatMeasured('force', P, 0.1, locale)} / ${n(S * 1e4)} ${t(locale, 'unit-sym-cm2')} ≈ ${n(P / S)} ${t(locale, 'unit-sym-Pa')}` });
  }
  return out;
  return out;
}
