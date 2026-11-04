import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { SCALES_TEXT, type ScalesCommand } from './bench.js';

export const setup: LocalizedText = msg('scales-diy-setup');

export const text = (c: ScalesCommand): StepText => SCALES_TEXT['lab.scales'](c);

export const busy = (): LocalizedText => msg('scales-diy-busy');


export function shown(c: ScalesCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  const V = r?.inputs?.['water'] ?? 0;
  const N = r?.inputs?.['sheets'] ?? 0;
  const m = formatMeasured('mass', r?.value ?? null, 0.001, locale);
  if (c.step === 'zero') return t(locale, 'scales-diy-shown');
  if (c.step === 'check') return t(locale, 'scales-diy-shown-2', { V: String(V), m });
  return t(locale, 'scales-diy-shown-3', { N: String(N), V: String(V), m });
}

/** The board's lines for a done step. */
export function board(c: ScalesCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const e = { trace };
  void before;
  const r = e.trace.find((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
  const step = c.step;
  if (!r || step === 'zero') return out;
  const N = r.inputs?.['sheets'] ?? 0;
  const V = r.inputs?.['water'] ?? 0;
  const g = (x: number) => `${n(x, 3)} ${t(locale, 'unit-sym-g')}`;
  if (step === 'check') out.push({ id: `sc:${i}`, title: t(locale, 'scales-diy-board-title'), formula: t(locale, 'scales-diy-board-formula'), numbers: `${V} ${t(locale, 'unit-sym-mL')} → ${g(V)}` });
  else out.push({ id: `sg:${i}`, title: t(locale, 'scales-diy-board-title-2'), formula: 'm = N·5 + V', numbers: `${N}·5 + ${V} = ${g(N * 5 + V)}` });
  return out;
}
