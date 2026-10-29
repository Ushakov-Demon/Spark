import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CARRY_TEXT, type CarryCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Перевернута пляшка густої рідини для миття посуду з позначками, лінійка на столі, аркуш паперу за пляшкою, маркер, секундомір', en: 'An upside-down bottle of thick washing-up liquid with marks, a ruler on the table, a sheet of paper behind the bottle, a marker, a stopwatch' };

export const text = (c: CarryCommand): StepText => CARRY_TEXT['lab.carry'](c);

export const busy = (): LocalizedText => ({ uk: 'Бульбашка спливає — веду пляшку рівномірно…', en: 'The bubble rises — carrying the bottle steadily…' });

const cm = (x: number | null, locale: Locale) => `${String(Math.round((x ?? 0) * 1000) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'см' : 'cm'}`;

export const shown = (_c: CarryCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  recs.length === 3 ? recs.map((x, k) => (k === 0 ? formatMeasured('time', x.value, 0.01, locale) : cm(x.value, locale))).join(' · ') : formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);

/** The time, how far the bottle went, the line on the paper. */
export function say(c: CarryCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const of = (w: number) => recs.find((x) => x.inputs?.['which'] === w)?.value ?? 0;
  const T = formatMeasured('time', of(0), 0.01, locale);
  if (c.speed === 0) return uk ? `9 см угору за ${T}; на аркуші — той самий відрізок, ${cm(of(2), locale)}.` : `9 cm up in ${T}; on the paper the same line, ${cm(of(2), locale)}.`;
  return uk ? `За ${T} пляшка проїхала ${cm(of(1), locale)}, а на аркуші — похилий відрізок ${cm(of(2), locale)}.` : `In ${T} the bottle went ${cm(of(1), locale)}, and on the paper — a slanted line of ${cm(of(2), locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: CarryCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  const of = (w: number) => recs.find((x) => x.inputs?.['which'] === w)?.value ?? 0;
  const t = of(0);
  const u = c.speed;
  const cmn = (x: number) => `${n(x * 100, 3)} ${uk ? 'см' : 'cm'}`;
  const T = formatMeasured('time', t, 0.01, locale);
  const v = (l: number) => `${n((l / t) * 100, 2)} ${uk ? 'см/с' : 'cm/s'}`;
  const how = u === 0 ? (uk ? 'пляшка стоїть' : 'the bottle stands') : uk ? `u = ${n(u * 100, 2)} см/с, зсув ${cmn(of(1))}` : `u = ${n(u * 100, 2)} cm/s, moved ${cmn(of(1))}`;
  out.push({ id: `cb:${i}`, title: uk ? `${how}: відносно пляшки` : `${how}: relative to the bottle`, formula: 'v = l / t', numbers: `${cmn(0.09)} / ${T} ≈ ${v(0.09)}` });
  out.push({ id: `ct:${i}`, title: uk ? 'відносно стола' : 'relative to the table', formula: 'v = s / t', numbers: `${cmn(of(2))} / ${T} ≈ ${v(of(2))}` });
  return out;
}
