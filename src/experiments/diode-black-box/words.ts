import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BOX_TEXT, type BoxCommand } from './bench.js';

export const setup: LocalizedText = msg('diode-black-box-setup');

export const text = (c: BoxCommand): StepText => BOX_TEXT['lab.box'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const mA = (v: number, locale: Locale) => `${(v * 1000).toFixed(1).replace('.', t(locale, 'diode-black-box-volts'))} ${t(locale, 'unit-sym-mA')}`;

export const shown = (_c: BoxCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0]?.value !== null && recs[0] ? mA(recs[0].value!, locale) : recs[0] ? readingText(recs[0], locale) : '');

/** What the milliammeter shows, one way or turned round. */
export function say(c: BoxCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  const zero = r.value < (r.inputs?.['division'] ?? 0.0001);
  const I = mA(r.value, locale);
  return c.reversed
    ? zero ? t(locale, 'diode-black-box-say') : t(locale, 'diode-black-box-say-2', { I })
    : t(locale, 'diode-black-box-say-3', { I });
}

/** The board's lines for a done step. */
export function board(c: BoxCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const U = c.source;
  const back = !!c.reversed;
  const div = r.inputs?.['division'] ?? 0.0001;
  const mAn = `${n(r.value! * 1000, 3)} ${t(locale, 'unit-sym-mA')}`;
  const way = back ? t(locale, 'diode-black-box-plan-uk') : '';
  out.push({ id: `box:${back ? 'b' : 'a'}${U}`, title: t(locale, 'diode-black-box-board-title', { U: n(U), way }), formula: `I = ${mAn}` });
  if (r.value! >= div) out.push({ id: `boxR:${back ? 'b' : 'a'}${U}`, title: t(locale, 'diode-black-box-board-title-2', { way }), formula: 'R = U / I', numbers: `${n(U)} ${t(locale, 'unit-sym-V')} / ${n(r.value! * 1000, 3)} ${t(locale, 'unit-sym-mA')} ≈ ${n(U / r.value!, 2)} ${t(locale, 'unit-sym-ohm')}` });
  else out.push({ id: `boxR:${back ? 'b' : 'a'}${U}`, title: t(locale, 'diode-black-box-board-title-2', { way }), formula: t(locale, 'diode-black-box-board-formula') });
  return out;
}
