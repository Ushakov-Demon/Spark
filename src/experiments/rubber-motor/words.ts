import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { RUBBER_TEXT, turnsText, type RubberCommand } from './bench.js';

export const setup: LocalizedText = msg('rubber-motor-setup');

export const text = (c: RubberCommand): StepText => RUBBER_TEXT['lab.rubber'](c);

export const busy = (c: RubberCommand): LocalizedText =>
  c.step === 'band' ? msg('rubber-motor-busy') : msg('rubber-motor-busy-2');


export function shown(c: RubberCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (c.step === 'band') return t(locale, 'rubber-motor-shown', { value: formatMeasured('force', r?.value ?? null, 0.1, locale) });
  const m = `${new Intl.NumberFormat(NUMBER_LOCALE[locale], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r?.value ?? 0)} ${t(locale, 'unit-sym-m')}`;
  return t(locale, 'rubber-motor-shown-2', { turns: turnsText(c.turns ?? 0, locale), m });
}

/** The board's lines for a done step. */
export function board(c: RubberCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  if (c.step === 'band') {
    out.push({ id: `rk:${i}`, title: t(locale, 'rubber-motor-board-title'), formula: 'k = F / x', numbers: `${n(r.value!, 2)} ${t(locale, 'unit-sym-N')} / ${n(r.inputs?.['stretch'] ?? 0, 2)} ${t(locale, 'unit-sym-m')} = ${n(r.value! / (r.inputs?.['stretch'] ?? 1), 2)} ${t(locale, 'unit-sym-N-per-m')}` });
    return out;
  }
  const N = c.turns ?? 0;
  out.push({ id: `rn:${i}`, title: t(locale, 'rubber-motor-board-title-2', { N: String(N) }), formula: `x = N·π·d ≈ ${n((r.inputs?.['wound'] ?? 0) * 100, 2)} ${t(locale, 'unit-sym-cm')}`, numbers: `s = ${n(r.value!, 3)} ${t(locale, 'unit-sym-m')}` });
  const first = before.find((x) => x.ok && x.command.type === 'lab.rubber' && (x.command as unknown as { step: string }).step === 'run');
  const s1 = first?.ok ? first.trace.find((x): x is MeasurementRecord => x.kind === 'measurement')?.value : undefined;
  if (first && s1 && N === 6) out.push({ id: `rr:${i}`, title: t(locale, 'rubber-motor-board-title-3'), formula: 's₆ / s₃', numbers: `${n(r.value!, 3)} / ${n(s1, 3)} ≈ ${n(r.value! / s1, 2)}` });
  return out;
}
