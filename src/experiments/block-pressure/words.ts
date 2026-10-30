import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { EDGE_TEXT, type EdgeCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Дерев’яний брусок, динамометр, учнівська лінійка', en: 'A wooden block, a dynamometer, a ruler' };

export const text = (c: EdgeCommand): StepText => EDGE_TEXT(c);

/** No motion: the ruler is put to the edge. */
export const busy = (): LocalizedText | null => null;

export const shown = (_c: EdgeCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The edge just measured. */
export function say(c: EdgeCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  void before;
  const uk = locale === 'uk';
  const what = uk ? ['Довжина', 'Ширина', 'Висота'][c.edge] : ['Length', 'Width', 'Height'][c.edge];
  return `${what} ${uk ? 'бруска' : 'of the block'}: ${formatMeasured('length', recs[0]?.value ?? 0, 0.001, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: EdgeCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
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
  out.push({ id: `edge:${i}`, title: uk ? ['довжина бруска', 'ширина бруска', 'висота бруска'][c.edge]! : ['the block’s length', 'its width', 'its height'][c.edge]!, formula: `${['a', 'b', 'c'][c.edge]} = ${cm(r.value!)}` });
  const P = weighed?.value;
  const [a, b, h] = edges;
  if (a !== undefined && b !== undefined && h !== undefined && P !== undefined && P !== null) {
    const faces: [string, number][] = [[uk ? 'найбільша грань' : 'the largest face', a * b], [uk ? 'бічна грань' : 'the side face', a * h], [uk ? 'найменша грань' : 'the smallest face', b * h]];
    for (const [name, S] of faces) out.push({ id: `pressure:${i}:${name}`, title: uk ? `тиск бруска: ${name}` : `the block’s pressure: ${name}`, formula: 'p = P / S', numbers: `${formatMeasured('force', P, 0.1, locale)} / ${n(S * 1e4)} ${uk ? 'см²' : 'cm²'} ≈ ${n(P / S)} ${uk ? 'Па' : 'Pa'}` });
  }
  return out;
  return out;
}
