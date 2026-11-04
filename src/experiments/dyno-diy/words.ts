import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DYNO_TEXT, type DynoCommand } from './bench.js';

export const setup: LocalizedText = msg('dyno-diy-setup');

export const text = (c: DynoCommand): StepText => DYNO_TEXT['lab.dyno'](c);

export const busy = (c: DynoCommand): LocalizedText =>
  c.step === 'scale' ? msg('dyno-diy-busy') : msg('dyno-diy-busy-2');


export function shown(c: DynoCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const step = c.step;
  const mm = (x: number | null) => `${Math.round((x ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`;
  if (step === 'marks') return t(locale, 'dyno-diy-shown', { value: recs.map((r) => mm(r.value)).join(', ') });
  if (step === 'scale') return t(locale, 'dyno-diy-shown-scale', { newton: mm(recs[0]?.value ?? 0), division: Math.round((recs[0]?.value ?? 0) * 1000) / 10 });
  const F = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  return step === 'apple' ? t(locale, 'dyno-diy-shown-2', { F }) : t(locale, 'dyno-diy-shown-3', { F });
}

/** The board's lines for a done step. */
export function board(c: DynoCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  void before;
  const recs = trace;
  const step = c.step;
  const mm = (x: number) => `${Math.round(x * 1000)} ${t(locale, 'unit-sym-mm')}`;
  if (step === 'marks') out.push({ id: `dm:${i}`, title: t(locale, 'dyno-diy-board-title'), formula: recs.map((r) => `${n(r.inputs?.['force'] ?? 0, 3)} ${t(locale, 'unit-sym-N')}`).join(' · '), numbers: recs.map((r) => mm(r.value!)).join(' · ') });
  else if (step === 'scale') out.push({ id: `ds:${i}`, title: t(locale, 'dyno-diy-board-title-2'), formula: 'l₁ = x / F', numbers: `${mm(recs[0]!.value!)} / 1 ${t(locale, 'unit-sym-N')}` });
  else out.push({ id: `${step === 'apple' ? 'da' : 'de'}:${i}`, title: (step === 'apple' ? tl(locale, 'dyno-diy-board-title-3') : tl(locale, 'dyno-diy-board-title-4')), formula: 'F = m·g', numbers: `${n(recs[0]!.inputs?.['mass'] ?? 0, 3)} · ${n(recs[0]!.inputs?.['g'] ?? 0, 3)} ≈ ${n(recs[0]!.exact, 2)} ${t(locale, 'unit-sym-N')}` });
  return out;
}
