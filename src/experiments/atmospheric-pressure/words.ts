import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { ATM_TEXT, type AtmCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Шприц на 1 мл із ковпачком на носик, динамометр, лінійка, барометр-анероїд', en: 'A 1 mL syringe with a cap for its nozzle, a dynamometer, a ruler, an aneroid barometer' };

export const text = (c: AtmCommand): StepText => ATM_TEXT['lab.atm'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export const shown = (_c: AtmCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** Its scale, the barometer, the force on the plunger — and the pressure it gives. */
export function say(c: AtmCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const v0 = recs[0]?.value ?? null;
  if (c.step === 'scale') return uk ? `Шкала від 0 до 1 мл займає ${cm(v0 ?? 0, locale)}.` : `The scale from 0 to 1 mL is ${cm(v0 ?? 0, locale)} long.`;
  if (c.step === 'barometer') return uk ? `Барометр показує ${formatMeasured('pressure', v0, 100, locale)}.` : `The barometer shows ${formatMeasured('pressure', v0, 100, locale)}.`;
  const F = formatMeasured('force', v0, 0.1, locale);
  if (c.step === 'open') return uk ? `З відкритим носиком поршень іде легко: ${F}.` : `With the nozzle open the plunger goes easily: ${F}.`;
  const v = String(c.pulled).replace('.', uk ? ',' : '.');
  return uk ? `Закритий носик, поршень до ${v} мл — динамометр показує ${F}!` : `The nozzle shut, the plunger to ${v} mL — the dynamometer shows ${F}!`;
}

/** The board's lines for a done step. */
export function board(c: AtmCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const earlier = (step: string) => before.flatMap((x) => (x.ok && x.command.type === c.type && (x.command as unknown as { step: string }).step === step ? x.trace : [])).find((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
  if (c.step === 'scale') {
    out.push({ id: 'atS', title: uk ? 'площа поршня зі шкали (1 мл)' : 'the plunger’s area from the scale (1 mL)', formula: 'S = V / l', numbers: `1 ${uk ? 'мл' : 'mL'} / ${n(r.value! * 100)} ${uk ? 'см' : 'cm'} ≈ ${n(1 / (r.value! * 100), 3)} ${uk ? 'см²' : 'cm²'}` });
    return out;
  }
  if (c.step === 'barometer') {
    out.push({ id: 'atB', title: uk ? 'барометр' : 'the barometer', formula: `p₀ = ${formatMeasured('pressure', r.value, 100, locale)} = ${n(r.value!, 4)} ${uk ? 'Па' : 'Pa'}` });
    return out;
  }
  if (c.step === 'open') {
    out.push({ id: 'atO', title: uk ? 'носик відкритий' : 'the nozzle open', formula: `F = ${formatMeasured('force', r.value, 0.1, locale)}` });
    return out;
  }
  // (The scale measured first: the plunger's way for 1 mL.)
  const atmScale = earlier('scale')?.value;
  if (atmScale && c.step === 'sealed') {
    const v = c.pulled;
    out.push({ id: `pa:${v}`, title: uk ? `носик закритий, поршень до ${n(v)} мл` : `the nozzle shut, the plunger to ${n(v)} mL`, formula: 'p = F·l / V', numbers: `${n(r.value!, 2)} ${uk ? 'Н' : 'N'} · ${n(atmScale, 3)} ${uk ? 'м' : 'm'} / 10⁻⁶ ${uk ? 'м³' : 'm³'} ≈ ${n((r.value! * atmScale) / 1e-6, 3)} ${uk ? 'Па' : 'Pa'}` });
  }
  return out;
}
