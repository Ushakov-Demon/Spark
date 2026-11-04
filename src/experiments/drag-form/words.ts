import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DRAG_MASS, DRAG_TEXT, dragBody, type DragCommand, dragShapeName, framesText } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';


export const text = (c: DragCommand): StepText => DRAG_TEXT['lab.drag'](c);

export const busy = (): LocalizedText => msg('drag-form-busy');

export const shown = (_c: DragCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  `${framesText(recs[0]?.inputs?.['frames'] ?? 0, locale)} ≈ ${formatMeasured('time', recs[0]?.value ?? null, 0.01, locale)}`;

/** The frames between the marks, the time. */
export function say(c: DragCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const name = tr(dragShapeName(c.shape), locale);
  const f = framesText(recs[0]?.inputs?.['frames'] ?? 0, locale);
  const t = formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);
  return tl(locale, 'drag-form-say-passed', { name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`, medium: c.medium, shape: c.shape, frames: f, time: t });
}

/** The board's lines for a done step. */
export function board(c: DragCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const frames = r.inputs?.['frames'] ?? 0;
  const fps = r.inputs?.['fps'] ?? 30;
  const track = r.inputs?.['track'] ?? 0.2;
  const shape = dragShapeName(c.shape)[locale];
  const air = c.medium === 'air';
  const t = formatMeasured('time', r.value, 0.01, locale);
  out.push({ id: `dt:${i}`, title: tl(locale, 'drag-form-board-title-3', { shape, frames: framesText(frames, locale), value: air ? tl(locale, 'drag-form-board-title') : tl(locale, 'drag-form-board-title-2') }), formula: `t = ${frames} / ${fps} ${tl(locale, 'unit-sym-s')} ≈ ${t}` });
  out.push({ id: `dv:${i}`, title: tl(locale, 'drag-form-board-title-4'), formula: 'v = s / t', numbers: `${n(track, 2)} ${tl(locale, 'unit-sym-m')} / ${t} ≈ ${n(track / r.value!, 2)} ${tl(locale, 'unit-sym-m-per-s')}` });
  if (c.shape === 'ball' && !air) {
    const { volume } = dragBody('ball');
    const rho = r.inputs?.['rho'] ?? 1000;
    const P = DRAG_MASS * G;
    const Fa = rho * G * volume;
    out.push({ id: `df:${i}`, title: tl(locale, 'drag-form-board-title-5'), formula: tl(locale, 'drag-form-board-formula'), numbers: `${n(P, 2)} − ${n(Fa, 2)} ≈ ${n(P - Fa, 2)} ${tl(locale, 'unit-sym-N')}` });
  }
  return out;
}
