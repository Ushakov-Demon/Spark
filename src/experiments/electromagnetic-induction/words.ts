import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { INDUCT_TEXT, type InductCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Котушка-моток, штабовий магніт, міліамперметр з нулем посередині, з’єднувальні дроти', en: 'A coil, a bar magnet, a milliammeter with its zero in the middle, connecting wires' };

export const text = (c: InductCommand): StepText => INDUCT_TEXT['lab.induct'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

/** The milliammeter's reading: signed, in mA; past its end — off the scale. */
export const inductShown = (v: number | null, locale: Locale) => (v === null ? (locale === 'uk' ? 'зашкалює' : 'off the scale') : `${v > 0 ? '+' : ''}${formatMeasured('current', v * 1000, 1, locale).replace(/ (А|A)$/, '').replace('-', '−')} ${locale === 'uk' ? 'мА' : 'mA'}`);

export const shown = (_c: InductCommand, recs: readonly MeasurementRecord[], locale: Locale): string => inductShown(recs[0]?.value ?? null, locale);

/** The needle's swing — which way and how far. */
export function say(c: InductCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const v = recs[0]?.value ?? 0;
  if (Math.abs(v) < 1e-9) return c.move === 'still' ? (uk ? 'Магніт не рухається — стрілка стоїть на нулі.' : 'The magnet does not move — the needle stays at zero.') : uk ? 'Стрілка ледь здригнулася.' : 'The needle hardly twitched.';
  return uk ? `Стрілка відхилилася ${v > 0 ? 'вправо' : 'вліво'}: ${inductShown(v, locale)}.` : `The needle swung to the ${v > 0 ? 'right' : 'left'}: ${inductShown(v, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: InductCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const R = r.inputs?.['resistance'] ?? 0;
  const move = c.move;
  const fast = c.time <= 0.5;
  const pace = fast ? (uk ? 'швидко' : 'fast') : uk ? 'повільно' : 'slowly';
  const what = move === 'still' ? (uk ? 'магніт нерухомо' : 'the magnet still') : move === 'out' ? (uk ? `витягли ${pace}` : `pulled out ${pace}`) : move === 'coil' ? (uk ? `котушку на магніт ${pace}` : `the coil onto the magnet ${pace}`) : uk ? `${c.pole === 'S' ? 'південним' : 'північним'} у котушку ${pace}` : `${c.pole === 'S' ? 'south' : 'north'} pole in ${pace}`;
  const mA = `${r.value! > 0 ? '+' : ''}${n(r.value! * 1000, 2)} ${uk ? 'мА' : 'mA'}`;
  if (move === 'still' || r.value! === 0) out.push({ id: `iI:${i}`, title: what, formula: `I = ${mA}` });
  else out.push({ id: `iE:${i}`, title: what, formula: `I = ${mA}, ε = I·R`, numbers: `${n(Math.abs(r.value!), 3)} ${uk ? 'А' : 'A'} · ${n(R, 2)} ${uk ? 'Ом' : 'Ω'} ≈ ${n(Math.abs(r.value!) * R, 2)} ${uk ? 'В' : 'V'}` });
  return out;
}
