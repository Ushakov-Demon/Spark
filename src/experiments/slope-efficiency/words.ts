import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { LEVER_TEXT, type SlopeCommand } from '../lever-moments/bench.js';

export const setup: LocalizedText = { uk: 'Дерев’яна дошка на штативі, дерев’яний брусок, тягарці по 100 г, динамометр, лінійка', en: 'A wooden board on a stand, a wooden block, 100 g weights, a dynamometer, a ruler' };

export const text = (c: SlopeCommand): StepText => LEVER_TEXT['lab.slope'](c);

export const busy = (): LocalizedText => ({ uk: 'Тягну брусок угору рівномірно…', en: 'Pulling the block up steadily…' });

export const shown = (_c: SlopeCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The dynamometer pulling the block up the board. */
export function say(_c: SlopeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const F = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  return locale === 'uk' ? `Брусок іде вгору рівномірно — динамометр показує ${F}.` : `The block goes up steadily — the dynamometer shows ${F}.`;
}

/** The board's lines for a done step. */
export function board(c: SlopeCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  // (The block weighed in the air before: the last such weighing.)
  const weighed = before.flatMap((x) => (x.ok && x.command.type === 'lab.hang' && (x.command as unknown as { into: string }).into === 'air' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'force' && x.value !== null).pop();
  const h = r.inputs?.['h'] ?? 0;
  const l = r.inputs?.['l'] ?? 1;
  // The weight as the dynamometer showed it in the air (the last weighing), else the model's.
  const P = weighed?.value ?? r.inputs?.['P'] ?? 0;
  const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
  const J = uk ? 'Дж' : 'J';
  const Au = P * h;
  const At = r.value! * l;
  out.push({ id: `Au:${i}`, title: uk ? `корисна робота — підняти брусок на h = ${cm(h)}` : `the useful work — lifting the block by h = ${cm(h)}`, formula: 'A_к = P·h', numbers: `${N1(P)} · ${n(h)} ${uk ? 'м' : 'm'} ≈ ${n(Au, 3)} ${J}` });
  out.push({ id: `At:${i}`, title: uk ? `повна робота — тягти вздовж дошки l = ${cm(l)}` : `the work done — pulling along the board l = ${cm(l)}`, formula: 'A_п = F·l', numbers: `${N1(r.value!)} · ${n(l)} ${uk ? 'м' : 'm'} ≈ ${n(At, 3)} ${J}` });
  out.push({ id: `eta:${i}`, title: uk ? `ККД похилої площини (h = ${cm(h)})` : `the efficiency of the slope (h = ${cm(h)})`, formula: 'η = A_к / A_п', numbers: `${n(Au, 3)} ${J} / ${n(At, 3)} ${J} ≈ ${n((Au / At) * 100, 2)} %` });
  return out;
}
