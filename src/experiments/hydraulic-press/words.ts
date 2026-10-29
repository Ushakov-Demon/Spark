import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { PRESS_TEXT, type PressCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Два шприци (на 5 і 50 мл), з’єднані трубкою з водою, тягарці по 100 г, динамометр, лінійка', en: 'Two syringes (5 and 50 mL) joined by a tube of water, 100 g weights, a dynamometer, a ruler' };

export const text = (c: PressCommand): StepText => PRESS_TEXT['lab.press'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export function shown(_c: PressCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (recs.length === 2) return `${formatMeasured('length', recs[0]!.value, 0.001, locale)} · ${formatMeasured('length', recs[1]!.value, 0.001, locale)}`;
  return recs[0] ? readingText(recs[0], locale) : '';
}

/** The pistons, the force the load needed, how far the wide piston rose. */
export function say(c: PressCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (c.step === 'diameters') return uk ? `Вузький поршень — ${cm(recs[0]?.value ?? 0, locale)} у діаметрі, широкий — ${cm(recs[1]?.value ?? 0, locale)}.` : `The narrow piston is ${cm(recs[0]?.value ?? 0, locale)} across, the wide one ${cm(recs[1]?.value ?? 0, locale)}.`;
  if (c.step === 'lift') {
    const F2 = r?.inputs?.['load'] ?? 0;
    return uk ? `Вантаж ${formatMeasured('force', F2, 0.1, locale)} пішов угору, коли динамометр показав лише ${formatMeasured('force', r?.value ?? null, 0.1, locale)}!` : `The ${formatMeasured('force', F2, 0.1, locale)} load went up when the dynamometer showed only ${formatMeasured('force', r?.value ?? null, 0.1, locale)}!`;
  }
  return uk ? `Вузький поршень пройшов 6 см, а широкий піднявся лише на ${cm(r?.value ?? 0, locale)}.` : `The narrow piston went 6 cm, and the wide one rose only ${cm(r?.value ?? 0, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: PressCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const recs = trace;
  const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
  const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
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
  out.push({ id: 'pl', title: uk ? 'вузький поршень на 6 см униз — широкий угору на' : 'the narrow piston 6 cm down — the wide one up by', formula: `l₂ = ${cmT(r.value!)}` });
  return out;
}
