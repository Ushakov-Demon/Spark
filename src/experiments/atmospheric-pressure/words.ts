import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { ATM_TEXT, type AtmCommand } from './bench.js';

export const setup: LocalizedText = msg('atmospheric-pressure-setup');

export const text = (c: AtmCommand): StepText => ATM_TEXT['lab.atm'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export const shown = (_c: AtmCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** Its scale, the barometer, the force on the plunger — and the pressure it gives. */
export function say(c: AtmCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const v0 = recs[0]?.value ?? null;
  if (c.step === 'scale') return t(locale, 'atmospheric-pressure-say', { v0: cm(v0 ?? 0, locale) });
  if (c.step === 'barometer') return t(locale, 'atmospheric-pressure-say-2', { value: formatMeasured('pressure', v0, 100, locale) });
  const F = formatMeasured('force', v0, 0.1, locale);
  if (c.step === 'open') return t(locale, 'atmospheric-pressure-say-3', { F });
  const v = String(c.pulled).replace('.', t(locale, 'atmospheric-pressure-ml'));
  return t(locale, 'atmospheric-pressure-say-4', { v, F });
}

/** The board's lines for a done step. */
export function board(c: AtmCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const earlier = (step: string) => before.flatMap((x) => (x.ok && x.command.type === c.type && (x.command as unknown as { step: string }).step === step ? x.trace : [])).find((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
  if (c.step === 'scale') {
    out.push({ id: 'atS', title: t(locale, 'atmospheric-pressure-at-s-title'), formula: 'S = V / l', numbers: `1 ${t(locale, 'unit-sym-mL')} / ${n(r.value! * 100)} ${t(locale, 'unit-sym-cm')} ≈ ${n(1 / (r.value! * 100), 3)} ${t(locale, 'unit-sym-cm2')}` });
    return out;
  }
  if (c.step === 'barometer') {
    out.push({ id: 'atB', title: t(locale, 'atmospheric-pressure-at-b-title'), formula: `p₀ = ${formatMeasured('pressure', r.value, 100, locale)} = ${n(r.value!, 4)} ${t(locale, 'unit-sym-Pa')}` });
    return out;
  }
  if (c.step === 'open') {
    out.push({ id: 'atO', title: t(locale, 'atmospheric-pressure-at-o-title'), formula: `F = ${formatMeasured('force', r.value, 0.1, locale)}` });
    return out;
  }
  // (The scale measured first: the plunger's way for 1 mL.)
  const atmScale = earlier('scale')?.value;
  if (atmScale && c.step === 'sealed') {
    const v = c.pulled;
    out.push({ id: `pa:${v}`, title: t(locale, 'atmospheric-pressure-board-title', { v: n(v) }), formula: 'p = F·l / V', numbers: `${n(r.value!, 2)} ${t(locale, 'unit-sym-N')} · ${n(atmScale, 3)} ${t(locale, 'unit-sym-m')} / 10⁻⁶ ${t(locale, 'unit-sym-m3')} ≈ ${n((r.value! * atmScale) / 1e-6, 3)} ${t(locale, 'unit-sym-Pa')}` });
  }
  return out;
}
