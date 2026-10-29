import type { MeasurementRecord } from '../../core/trace.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { rowName, ROWS_TEXT, type RowsCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Лінійка з міліметровими поділками, горох, пшоно, дві зубочистки, стрижень для ручки, нитка № 10 (≈ 50 см)', en: 'A ruler with millimetre divisions, peas, millet, two toothpicks, a pen refill, a № 10 thread (≈ 50 cm)' };

export const text = (c: RowsCommand): StepText => ROWS_TEXT['lab.rows'](c);

export const busy = (): LocalizedText => ({ uk: 'Викладаю ряд — по одному…', en: 'Laying the row — one by one…' });

export const shown = (_c: RowsCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;

/** The row's length (a single pea — to the ruler's division). */
export function say(c: RowsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const L = `${Math.round((recs[0]?.value ?? 0) * 1000)} ${uk ? 'мм' : 'mm'}`;
  if (c.count === 1) return uk ? `Одна горошина — ${L}. Але й поділка лінійки — 1 мм: точніше не скажеш.` : `One pea — ${L}. But the ruler’s division is 1 mm too: no better than that.`;
  const what = tr(rowName(c.body, c.count), locale);
  return c.body === 'thread' ? (uk ? `${what} — намотка завширшки ${L}.` : `${what} — a winding ${L} wide.`) : uk ? `Ряд: ${what} — ${L}.` : `The row: ${what} — ${L}.`;
}

/** The board's lines for a done step. */
export function board(c: RowsCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const N = c.count;
  const body = c.body;
  const L = `${Math.round(r.value! * 1000)} ${uk ? 'мм' : 'mm'}`;
  const what = { pea: uk ? 'горошин' : 'peas', millet: uk ? 'зерняток пшона' : 'millet grains', thread: uk ? 'витків нитки' : 'turns of thread' }[body] ?? '';
  if (N === 1) {
    out.push({ id: `r1:${i}`, title: uk ? 'одна горошина: лінійкою до поділки' : 'one pea: by the ruler to a division', formula: `d = ${L} ± 0,5 ${uk ? 'мм' : 'mm'}`.replace('0,5', uk ? '0,5' : '0.5') });
    return out;
  }
  out.push({ id: `rw:${i}`, title: uk ? `${N} ${what}: ${body === 'thread' ? 'ширина намотки' : 'довжина ряду'} ${L}` : `${N} ${what}: ${body === 'thread' ? 'the winding’s width' : 'the row’s length'} ${L}`, formula: 'd = L / N', numbers: `${L} / ${N} ≈ ${(r.value! / N * 1000).toFixed(2).replace('.', uk ? ',' : '.')} ${uk ? 'мм' : 'mm'}` });
  return out;
}
