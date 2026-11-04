import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { clockText, equalShadowsNoon, GNOMON_HEIGHT, GNOMON_TEXT, type GnomonCommand, latitudeFrom, sunOf } from './bench.js';

export const setup: LocalizedText = msg('solar-noon-setup');

export const text = (c: GnomonCommand): StepText => GNOMON_TEXT['lab.gnomon'](c);

export const busy = (): LocalizedText => msg('solar-noon-busy');

export const shown = (_c: GnomonCommand, recs: readonly MeasurementRecord[], locale: Locale): string => recs.map((x) => formatMeasured('length', x.value, 0.01, locale)).join(' · ');

/** The series' shadows, each with its time. */
export function say(_c: GnomonCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const list = recs.map((x) => `${clockText(x.inputs?.['time'] ?? 0)} — ${formatMeasured('length', x.value, 0.01, locale)}`).join(', ');
  return t(locale, 'solar-noon-say', { list });
}

/** The board's lines for a done step. */
export function board(c: GnomonCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  const m = t(locale, 'unit-sym-m');
  // (The shadows so far, all series: the noon is found once the afternoon ones are in.)
  const shadows = [...before.filter((x) => x.ok && x.command.type === 'lab.gnomon').flatMap((x) => (x.ok ? x.trace : [])), ...recs]
    .filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null)
    .map((x) => ({ time: x.inputs?.['time'] ?? 0, length: x.value! }));
  const series = c.series;
  const times = recs.map((x) => clockText(x.inputs?.['time'] ?? 0)).join(', ');
  out.push({ id: `gs:${i}`, title: t(locale, 'solar-noon-board-title', { times }), formula: `L: ${recs.map((x) => Math.round(x.value! * 100)).join(', ')} ${t(locale, 'unit-sym-cm')}` });
  if (series !== 'afternoon') return out;
  const found = equalShadowsNoon(shadows);
  if (found) {
    const p0 = found.pairs[0]!;
    out.push({ id: `gn:${i}`, title: t(locale, 'solar-noon-board-title-2', { length: n(p0.length, 3), m }), formula: 't₀ = (t₁ + t₂) / 2', numbers: `(${clockText(p0.t1)} + ${clockText(p0.t2)}) / 2 ≈ ${clockText((p0.t1 + p0.t2) / 2)}${found.pairs.length > 1 ? (t(locale, 'solar-noon-board-numbers', { pairs: String(found.pairs.length), noon: clockText(found.noon) })) : ''}` });
  }
  const L = Math.min(...shadows.map((x) => x.length));
  const h = Math.atan(GNOMON_HEIGHT / L) / (Math.PI / 180);
  const zone = recs[0]?.inputs?.['zone'] ?? 2;
  const south = recs[0]?.inputs?.['south'] === 1;
  const d = sunOf(found?.noon ?? 720, zone).decl;
  const phi = latitudeFrom(h, d, south);
  const sd = (x: number) => `${x < 0 ? '−' : '+'} ${n(Math.abs(x), 1)}°`;
  out.push({ id: `gh:${i}`, title: t(locale, 'solar-noon-board-title-3', { value: south ? t(locale, 'solar-noon-answer-text') : t(locale, 'solar-noon-answer-text-2') }), formula: 'h = arctg(H / L)', numbers: `arctg(1 ${m} / ${n(L, 3)} ${m}) ≈ ${n(h, 3)}°` });
  out.push({ id: `gl:${i}`, title: t(locale, 'solar-noon-board-title-5', { d: n(d, 1), value: south ? t(locale, 'solar-noon-board-title-4') : '' }), formula: south ? 'φ = δ − (90° − h)' : 'φ = 90° − h + δ', numbers: south ? `${n(d, 1)}° − (90° − ${n(h, 3)}°) ≈ ${n(phi, 3)}°` : `90° − ${n(h, 3)}° ${sd(d)} ≈ ${n(phi, 3)}°` });
  return out;
}
