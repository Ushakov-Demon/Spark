import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { SINK_TEXT, type SinkCommand } from './bench.js';

export const setup: LocalizedText = msg('bodies-in-liquids-setup');

export const text = (c: SinkCommand): StepText => SINK_TEXT['lab.sink'](c);

export const busy = (): LocalizedText => msg('bodies-in-liquids-busy');

const laps = (recs: readonly MeasurementRecord[]) => recs.filter((x) => x.quantity === 'time');

export const shown = (_c: SinkCommand, recs: readonly MeasurementRecord[], locale: Locale): string => laps(recs).map((x) => formatMeasured('time', x.value, 0.01, locale)).join(' · ');

/** The last mark's time — and the speed it gives. */
export function say(c: SinkCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const lp = laps(recs).at(-1);
  if (!lp) return '';
  const s = Math.round((lp.inputs?.['mark'] ?? 0) * 100);
  const T = formatMeasured('time', lp.value, 0.01, locale);
  return c.body === 'bubble' ? (t(locale, 'bodies-in-liquids-say', { s: String(s), T })) : t(locale, 'bodies-in-liquids-say-2', { s: String(s), T });
}

/** The board's lines for a done step. */
export function board(c: SinkCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const times = laps(trace);
  const last = times[times.length - 1];
  if (!last) return out;
  const bubble = c.body === 'bubble';
  const d = c.diameter * 1000;
  const liquid = { 'washing-up': t(locale, 'bodies-in-liquids-liquid-washing-up-2'), glycerol: t(locale, 'bodies-in-liquids-liquid-glycerol'), 'sunflower-oil': t(locale, 'bodies-in-liquids-liquid-sunflower-oil'), water: t(locale, 'bodies-in-liquids-liquid-water') }[c.liquid] ?? '';
  const what = bubble ? (t(locale, 'bodies-in-liquids-board-what', { d: n(d, 2) })) : t(locale, 'bodies-in-liquids-board-what-2', { liquid });
  const cmT = (m: number) => `${Math.round(m * 100)} ${t(locale, 'unit-sym-cm')}`;
  out.push({ id: `st:${i}`, title: t(locale, 'bodies-in-liquids-board-title', { what }), formula: times.map((x) => `${cmT(x.inputs?.['mark'] ?? 0)} — ${formatMeasured('time', x.value, 0.01, locale)}`).join('; ') });
  const s = last.inputs?.['mark'] ?? 0;
  const v = s / last.value!;
  out.push({ id: `${bubble ? 'bv' : 'kv'}:${i}`, title: t(locale, 'bodies-in-liquids-board-title-2', { what }), formula: 'v = l / t', numbers: `${n(s * 100)} ${t(locale, 'unit-sym-cm')} / ${formatMeasured('time', last.value, 0.01, locale)} ≈ ${v < 0.1 ? `${n(v * 100, 2)} ${t(locale, 'unit-sym-cm-per-s')}` : `${n(v, 2)} ${t(locale, 'unit-sym-m-per-s')}`}` });
  return out;
}
