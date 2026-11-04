import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PRESS_TEXT, type PressCommand } from './bench.js';
import { PNEUMATIC_TEXT, type PneumaticCommand } from './pneumatic.js';

/** The machine's steps: with water (`lab.press`), and its «what if…» with air (`lab.pneumatic`). */
export type MachineCommand = PressCommand | PneumaticCommand;

export const setup: LocalizedText = msg('hydraulic-press-setup');

export const text = (c: MachineCommand): StepText => (c.type === 'lab.pneumatic' ? PNEUMATIC_TEXT['lab.pneumatic'](c) : PRESS_TEXT['lab.press'](c));

/** The pistons pushed in move (the narrow down, the wide up); measuring and the dynamometer just change the picture. */
export const busy = (c: MachineCommand): LocalizedText | null =>
  (c.type === 'lab.press' && c.step === 'travel') || (c.type === 'lab.pneumatic' && c.step === 'push') ? msg('hydraulic-press-busy') : null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);
const mm = (x: number | null, locale: Locale) => `${Math.round((x ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`;
const pick = (recs: readonly MeasurementRecord[], which: number) => recs.find((r) => r.inputs?.['which'] === which);

export function shown(c: MachineCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (recs.length === 2 && c.step === 'diameters') return `${cm(recs[0]!.value ?? 0, locale)} · ${cm(recs[1]!.value ?? 0, locale)}`;
  if (c.type === 'lab.pneumatic') {
    const dead = pick(recs, 4)?.value ?? 0;
    const rise = pick(recs, 3)?.value ?? 0;
    if (dead < 0.0005) return t(locale, 'hydraulic-press-shown', { rise: mm(rise, locale) });
    return t(locale, 'hydraulic-press-shown-2', { dead: mm(dead, locale), rise: mm(rise, locale) });
  }
  return recs[0] ? readingText(recs[0], locale) : '';
}

/** The pistons, the force the load needed, how far the wide piston rose; with air — when the load moved at all. */
export function say(c: MachineCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (c.step === 'diameters') return t(locale, 'hydraulic-press-say', { recs: cm(recs[0]?.value ?? 0, locale), recs2: cm(recs[1]?.value ?? 0, locale) });
  if (c.type === 'lab.pneumatic') {
    const dead = pick(recs, 4)?.value ?? 0;
    const rise = pick(recs, 3)?.value ?? 0;
    if (dead < 0.0005) return t(locale, 'hydraulic-press-say-2', { rise: mm(rise, locale) });
    return t(locale, 'hydraulic-press-say-3', { dead: mm(dead, locale), rise: mm(rise, locale) });
  }
  if (c.step === 'lift') {
    const F2 = r?.inputs?.['load'] ?? 0;
    return t(locale, 'hydraulic-press-say-4', { value: formatMeasured('force', F2, 0.1, locale), value2: formatMeasured('force', r?.value ?? null, 0.1, locale) });
  }
  return t(locale, 'hydraulic-press-say-5', { value: cm(r?.value ?? 0, locale) });
}

/** The board's lines for a done step. */
export function board(c: MachineCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const recs = trace;
  const cmT = (m: number) => `${n(m * 100)} ${t(locale, 'unit-sym-cm')}`;
  const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
  if (c.type === 'lab.pneumatic') {
    if (c.step === 'diameters') return out;
    const dead = pick(trace, 4);
    const rise = pick(trace, 3);
    if (!dead || !rise) return out;
    const inp = dead.inputs ?? {};
    const what = inp['medium'] === 1 ? t(locale, 'hydraulic-press-board-what') : t(locale, 'hydraulic-press-board-what-2');
    return [
      { id: `np:${i}`, title: t(locale, 'hydraulic-press-board-pressure', { what, n: c.weights }), formula: 'Δp = F₂ / S₂', numbers: `≈ ${n((inp['extra'] ?? 0) / 1000, 2)} ${t(locale, 'unit-sym-kPa')}` },
      { id: `nx:${i}`, title: t(locale, 'hydraulic-press-board-title', { what }), formula: `x₀ = ${mm(dead.value, locale)}`, numbers: t(locale, 'hydraulic-press-board-numbers', { squeezed: n((inp['squeezed'] ?? 0) * 1e6, 2) }) },
      { id: `nl:${i}`, title: t(locale, 'hydraulic-press-board-title-2', { what }), formula: `l₂ = ${mm(rise.value, locale)}` },
    ];
  }
  if (c.step === 'diameters') {
    const d1 = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
    const d2 = recs.find((x) => x.inputs?.['which'] === 2)?.value ?? 0;
    const pressAreas = d1 > 0 ? (d2 / d1) ** 2 : null;
    out.push({ id: 'pd', title: t(locale, 'hydraulic-press-pd-title'), formula: `d₁ = ${cmT(d1)}, d₂ = ${cmT(d2)}` });
    if (pressAreas) out.push({ id: 'pS', title: t(locale, 'hydraulic-press-p-s-title'), formula: 'S₂ / S₁ = (d₂ / d₁)²', numbers: `(${n(d2 * 100)} / ${n(d1 * 100)})² ≈ ${n(pressAreas, 2)}` });
    return out;
  }
  if (c.step === 'lift') {
    const F2 = r.inputs?.['load'] ?? 0;
    out.push({ id: `pF:${c.weights}`, title: t(locale, 'hydraulic-press-board-load', { n: c.weights }), formula: `F₂ = ${N1(F2)}, F₁ = ${N1(r.value!)}` });
    if (r.value! > 0) out.push({ id: `gain:${c.weights}`, title: t(locale, 'hydraulic-press-board-title-3'), formula: 'F₂ / F₁', numbers: `${n(F2, 2)} / ${n(r.value!, 2)} ≈ ${n(F2 / r.value!, 2)}` });
    return out;
  }
  out.push({ id: 'pl', title: t(locale, 'hydraulic-press-pl-title'), formula: `l₂ = ${cmT(r.value!)}` });
  return out;
}
