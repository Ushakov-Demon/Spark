import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DYNO_TEXT, type DynoCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Дощечка зі смужкою паперу, цвях, пружина з набору (25 Н/м), дротяна стрілка, гачок зі скріпки, три тягарці по 100 г, лінійка й олівець; невелике яблуко, яйце в пакетику', en: 'A board with a strip of paper, a nail, a spring of the set (25 N/m), a wire pointer, a paper-clip hook, three 100 g weights, a ruler and a pencil; a small apple, an egg in a little bag' };

export const text = (c: DynoCommand): StepText => DYNO_TEXT['lab.dyno'](c);

export const busy = (c: DynoCommand): LocalizedText =>
  c.step === 'scale' ? { uk: 'Наношу поділки — через 0,1 Н…', en: 'Drawing the divisions — every 0.1 N…' } : { uk: 'Пружина ще коливається — чекаємо, поки заспокоїться…', en: 'The spring is still bouncing — wait until it settles…' };


export function shown(c: DynoCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const step = c.step;
  const mm = (x: number | null) => `${Math.round((x ?? 0) * 1000)} ${uk ? 'мм' : 'mm'}`;
  if (step === 'marks') return uk ? `риски — ${recs.map((r) => mm(r.value)).join(', ')} від нуля` : `the marks — ${recs.map((r) => mm(r.value)).join(', ')} from zero`;
  if (step === 'scale') return uk ? `1 Н — ${mm(recs[0]?.value ?? 0)}, поділка 0,1 Н — ${Math.round((recs[0]?.value ?? 0) * 1000) / 10} мм`.replace('.', ',') : `1 N — ${mm(recs[0]?.value ?? 0)}, a 0.1 N division — ${Math.round((recs[0]?.value ?? 0) * 1000) / 10} mm`;
  const F = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  return step === 'apple' ? (uk ? `яблуко — ${F}` : `the apple — ${F}`) : uk ? `яйце — ${F}` : `the egg — ${F}`;
}

/** The board's lines for a done step. */
export function board(c: DynoCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  void before;
  const recs = trace;
  const step = c.step;
  const mm = (x: number) => `${Math.round(x * 1000)} ${uk ? 'мм' : 'mm'}`;
  if (step === 'marks') out.push({ id: `dm:${i}`, title: uk ? 'тягарці по 100 г: F = n·m·g' : '100 g weights: F = n·m·g', formula: recs.map((r) => `${n(r.inputs?.['force'] ?? 0, 3)} ${uk ? 'Н' : 'N'}`).join(' · '), numbers: recs.map((r) => mm(r.value!)).join(' · ') });
  else if (step === 'scale') out.push({ id: `ds:${i}`, title: uk ? 'шкала: міліметрів на ньютон' : 'the scale: millimetres to the newton', formula: 'l₁ = x / F', numbers: `${mm(recs[0]!.value!)} / 1 ${uk ? 'Н' : 'N'}` });
  else out.push({ id: `${step === 'apple' ? 'da' : 'de'}:${i}`, title: uk ? (step === 'apple' ? 'яблуко, 100 г' : 'яйце, 58 г') : step === 'apple' ? 'the apple, 100 g' : 'the egg, 58 g', formula: 'F = m·g', numbers: `${n(recs[0]!.inputs?.['mass'] ?? 0, 3)} · ${n(recs[0]!.inputs?.['g'] ?? 0, 3)} ≈ ${n(recs[0]!.exact, 2)} ${uk ? 'Н' : 'N'}` });
  return out;
}
