import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PRESS_TEXT, type PressCommand } from './bench.js';
import { PNEUMATIC_TEXT, type PneumaticCommand } from './pneumatic.js';

/** The machine's steps: with water (`lab.press`), and its «what if…» with air (`lab.pneumatic`). */
export type MachineCommand = PressCommand | PneumaticCommand;

export const setup: LocalizedText = { uk: 'Два шприци (на 5 і 50 мл), з’єднані трубкою, вода, тягарці по 100 г, динамометр, лінійка', en: 'Two syringes (5 and 50 mL) joined by a tube, water, 100 g weights, a dynamometer, a ruler' };

export const text = (c: MachineCommand): StepText => (c.type === 'lab.pneumatic' ? PNEUMATIC_TEXT['lab.pneumatic'](c) : PRESS_TEXT['lab.press'](c));

/** The pistons pushed in move (the narrow down, the wide up); measuring and the dynamometer just change the picture. */
export const busy = (c: MachineCommand): LocalizedText | null =>
  (c.type === 'lab.press' && c.step === 'travel') || (c.type === 'lab.pneumatic' && c.step === 'push') ? { uk: 'Втискаю вузький поршень…', en: 'Pushing the narrow piston in…' } : null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);
const mm = (x: number | null, locale: Locale) => `${Math.round((x ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;
const pick = (recs: readonly MeasurementRecord[], which: number) => recs.find((r) => r.inputs?.['which'] === which);

export function shown(c: MachineCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (recs.length === 2 && c.step === 'diameters') return `${cm(recs[0]!.value ?? 0, locale)} · ${cm(recs[1]!.value ?? 0, locale)}`;
  if (c.type === 'lab.pneumatic') {
    const dead = pick(recs, 4)?.value ?? 0;
    const rise = pick(recs, 3)?.value ?? 0;
    if (dead < 0.0005) return uk ? `вантаж рушив одразу; піднявся на ${mm(rise, locale)}` : `the load moved at once; it rose ${mm(rise, locale)}`;
    return uk ? `вантаж рушив, коли поршень пройшов ${mm(dead, locale)}; піднявся на ${mm(rise, locale)}` : `the load moved when the piston had gone ${mm(dead, locale)}; it rose ${mm(rise, locale)}`;
  }
  return recs[0] ? readingText(recs[0], locale) : '';
}

/** The pistons, the force the load needed, how far the wide piston rose; with air — when the load moved at all. */
export function say(c: MachineCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (c.step === 'diameters') return uk ? `Вузький поршень — ${cm(recs[0]?.value ?? 0, locale)} у діаметрі, широкий — ${cm(recs[1]?.value ?? 0, locale)}.` : `The narrow piston is ${cm(recs[0]?.value ?? 0, locale)} across, the wide one ${cm(recs[1]?.value ?? 0, locale)}.`;
  if (c.type === 'lab.pneumatic') {
    const dead = pick(recs, 4)?.value ?? 0;
    const rise = pick(recs, 3)?.value ?? 0;
    if (dead < 0.0005) return uk ? `Вантаж рушив одразу — і піднявся на ${mm(rise, locale)}.` : `The load moved at once — and rose ${mm(rise, locale)}.`;
    return uk ? `Поршень пройшов ${mm(dead, locale)}, а вантаж стояв, — і лише тоді піднявся на ${mm(rise, locale)}.` : `The piston went ${mm(dead, locale)} while the load stood still — and only then did it rise ${mm(rise, locale)}.`;
  }
  if (c.step === 'lift') {
    const F2 = r?.inputs?.['load'] ?? 0;
    return uk ? `Вантаж ${formatMeasured('force', F2, 0.1, locale)} пішов угору, коли динамометр показав лише ${formatMeasured('force', r?.value ?? null, 0.1, locale)}!` : `The ${formatMeasured('force', F2, 0.1, locale)} load went up when the dynamometer showed only ${formatMeasured('force', r?.value ?? null, 0.1, locale)}!`;
  }
  return uk ? `Вузький поршень пройшов 6 см, а широкий піднявся лише на ${cm(r?.value ?? 0, locale)}.` : `The narrow piston went 6 cm, and the wide one rose only ${cm(r?.value ?? 0, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: MachineCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const recs = trace;
  const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
  const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
  if (c.type === 'lab.pneumatic') {
    if (c.step === 'diameters') return out;
    const dead = pick(trace, 4);
    const rise = pick(trace, 3);
    if (!dead || !rise) return out;
    const inp = dead.inputs ?? {};
    const what = inp['medium'] === 1 ? (uk ? 'вода' : 'water') : uk ? 'повітря' : 'air';
    return [
      { id: `np:${i}`, title: uk ? `${what}, ${c.weights} ${c.weights < 5 ? 'тягарці' : 'тягарців'}: тиск, щоб рушив вантаж` : `${what}, ${c.weights} weights: the pressure to move the load`, formula: 'Δp = F₂ / S₂', numbers: `≈ ${n((inp['extra'] ?? 0) / 1000, 2)} ${uk ? 'кПа' : 'kPa'}` },
      { id: `nx:${i}`, title: uk ? `${what}: вузький поршень пройшов, поки вантаж стояв` : `${what}: the narrow piston’s travel while the load stood`, formula: `x₀ = ${mm(dead.value, locale)}`, numbers: uk ? `стиснулося ${n((inp['squeezed'] ?? 0) * 1e6, 2)} мл` : `${n((inp['squeezed'] ?? 0) * 1e6, 2)} mL squeezed` },
      { id: `nl:${i}`, title: uk ? `${what}: широкий поршень піднявся на` : `${what}: the wide piston rose by`, formula: `l₂ = ${mm(rise.value, locale)}` },
    ];
  }
  if (c.step === 'diameters') {
    const d1 = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
    const d2 = recs.find((x) => x.inputs?.['which'] === 2)?.value ?? 0;
    const pressAreas = d1 > 0 ? (d2 / d1) ** 2 : null;
    out.push({ id: 'pd', title: uk ? 'діаметри поршнів' : 'the pistons’ diameters', formula: `d₁ = ${cmT(d1)}, d₂ = ${cmT(d2)}` });
    if (pressAreas) out.push({ id: 'pS', title: uk ? 'у скільки разів більша площа широкого' : 'how many times larger the wide one’s area', formula: 'S₂ / S₁ = (d₂ / d₁)²', numbers: `(${n(d2 * 100)} / ${n(d1 * 100)})² ≈ ${n(pressAreas, 2)}` });
    return out;
  }
  if (c.step === 'lift') {
    const F2 = r.inputs?.['load'] ?? 0;
    out.push({ id: `pF:${c.weights}`, title: uk ? `${c.weights} ${c.weights === 1 ? 'тягарець' : c.weights < 5 ? 'тягарці' : 'тягарців'} на широкому поршні` : `${c.weights} weights on the wide piston`, formula: `F₂ = ${N1(F2)}, F₁ = ${N1(r.value!)}` });
    if (r.value! > 0) out.push({ id: `gain:${c.weights}`, title: uk ? 'виграш у силі' : 'the gain in force', formula: 'F₂ / F₁', numbers: `${n(F2, 2)} / ${n(r.value!, 2)} ≈ ${n(F2 / r.value!, 2)}` });
    return out;
  }
  out.push({ id: 'pl', title: uk ? 'вода, 6 тягарців: вузький поршень на 6 см униз — широкий угору на' : 'water, 6 weights: the narrow piston 6 cm down — the wide one up by', formula: `l₂ = ${cmT(r.value!)}` });
  return out;
}
