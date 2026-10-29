import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { clockText, equalShadowsNoon, GNOMON_HEIGHT, GNOMON_TEXT, type GnomonCommand, latitudeFrom, sunOf } from './bench.js';

export const setup: LocalizedText = { uk: 'Метрова палиця (гномон), виска, щоб поставити її прямовисно, рулетка, годинник (місцевий час)', en: 'A metre stick (a gnomon), a plumb line to stand it upright, a tape measure, a clock (the local time)' };

export const text = (c: GnomonCommand): StepText => GNOMON_TEXT['lab.gnomon'](c);

export const busy = (): LocalizedText => ({ uk: 'Сонце йде небом — міряємо тінь…', en: 'The Sun moves across the sky — measuring the shadow…' });

export const shown = (_c: GnomonCommand, recs: readonly MeasurementRecord[], locale: Locale): string => recs.map((x) => formatMeasured('length', x.value, 0.01, locale)).join(' · ');

/** The series' shadows, each with its time. */
export function say(_c: GnomonCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const list = recs.map((x) => `${clockText(x.inputs?.['time'] ?? 0)} — ${formatMeasured('length', x.value, 0.01, locale)}`).join(', ');
  return locale === 'uk' ? `Тінь: ${list}.` : `The shadow: ${list}.`;
}

/** The board's lines for a done step. */
export function board(c: GnomonCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  const m = uk ? 'м' : 'm';
  // (The shadows so far, all series: the noon is found once the afternoon ones are in.)
  const shadows = [...before.filter((x) => x.ok && x.command.type === 'lab.gnomon').flatMap((x) => (x.ok ? x.trace : [])), ...recs]
    .filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null)
    .map((x) => ({ time: x.inputs?.['time'] ?? 0, length: x.value! }));
  const series = c.series;
  const times = recs.map((x) => clockText(x.inputs?.['time'] ?? 0)).join(', ');
  out.push({ id: `gs:${i}`, title: uk ? `тінь метрової палиці о ${times}` : `the metre stick’s shadow at ${times}`, formula: `L: ${recs.map((x) => Math.round(x.value! * 100)).join(', ')} ${uk ? 'см' : 'cm'}` });
  if (series !== 'afternoon') return out;
  const found = equalShadowsNoon(shadows);
  if (found) {
    const p0 = found.pairs[0]!;
    out.push({ id: `gn:${i}`, title: uk ? `полудень — посередині між рівними тінями (${n(p0.length, 3)} ${m})` : `noon — midway between equal shadows (${n(p0.length, 3)} ${m})`, formula: 't₀ = (t₁ + t₂) / 2', numbers: `(${clockText(p0.t1)} + ${clockText(p0.t2)}) / 2 ≈ ${clockText((p0.t1 + p0.t2) / 2)}${found.pairs.length > 1 ? (uk ? `; у середньому з ${found.pairs.length} пар — ${clockText(found.noon)}` : `; the mean of ${found.pairs.length} pairs — ${clockText(found.noon)}`) : ''}` });
  }
  const L = Math.min(...shadows.map((x) => x.length));
  const h = Math.atan(GNOMON_HEIGHT / L) / (Math.PI / 180);
  const zone = recs[0]?.inputs?.['zone'] ?? 2;
  const south = recs[0]?.inputs?.['south'] === 1;
  const d = sunOf(found?.noon ?? 720, zone).decl;
  const phi = latitudeFrom(h, d, south);
  const sd = (x: number) => `${x < 0 ? '−' : '+'} ${n(Math.abs(x), 1)}°`;
  out.push({ id: `gh:${i}`, title: uk ? `висота Сонця опівдні — з найкоротшої тіні (тінь — на ${south ? 'південь' : 'північ'})` : `the Sun’s height at noon — from the shortest shadow (pointing ${south ? 'south' : 'north'})`, formula: 'h = arctg(H / L)', numbers: `arctg(1 ${m} / ${n(L, 3)} ${m}) ≈ ${n(h, 3)}°` });
  out.push({ id: `gl:${i}`, title: uk ? `широта місця (схилення Сонця δ ≈ ${n(d, 1)}° — за формулою NOAA${south ? '; південна широта — зі знаком «−»' : ''})` : `the latitude (the Sun’s declination δ ≈ ${n(d, 1)}° — by NOAA’s formula${south ? '; south latitude — negative' : ''})`, formula: south ? 'φ = δ − (90° − h)' : 'φ = 90° − h + δ', numbers: south ? `${n(d, 1)}° − (90° − ${n(h, 3)}°) ≈ ${n(phi, 3)}°` : `90° − ${n(h, 3)}° ${sd(d)} ≈ ${n(phi, 3)}°` });
  return out;
}
