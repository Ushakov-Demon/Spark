import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingsOf } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { RUBBER_TEXT, turnsText, type RubberCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Машинка з картону: дві осі (задня — олівець), колеса з кришечок, офісна гумка; саморобний динамометр, рулетка, довгий коридор', en: 'A cardboard car: two axles (the back one a pencil), bottle-cap wheels, an office rubber band; the home-made dynamometer, a tape measure, a long corridor' };

export const text = (c: RubberCommand): StepText => RUBBER_TEXT['lab.rubber'](c);

export const busy = (c: RubberCommand): LocalizedText =>
  c.step === 'band' ? { uk: 'Розтягую гумку на динамометрі…', en: 'Stretching the band on the dynamometer…' } : { uk: 'Закручую гумку — і відпускаю…', en: 'Winding the band — and letting go…' };


export function shown(c: RubberCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (c.step === 'band') return uk ? `розтягнута на 10 см, гумка тягне з силою ${formatMeasured('force', r?.value ?? null, 0.1, locale)}` : `stretched 10 cm, the band pulls with ${formatMeasured('force', r?.value ?? null, 0.1, locale)}`;
  const m = `${new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r?.value ?? 0)} ${uk ? 'м' : 'm'}`;
  return uk ? `${turnsText(c.turns ?? 0, true)} — машинка проїхала ${m}` : `${turnsText(c.turns ?? 0, false)} — the car went ${m}`;
}

/** The board's lines for a done step. */
export function board(c: RubberCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  if (c.step === 'band') {
    out.push({ id: `rk:${i}`, title: uk ? 'гумка на динамометрі' : 'the band on the dynamometer', formula: 'k = F / x', numbers: `${n(r.value!, 2)} ${uk ? 'Н' : 'N'} / ${n(r.inputs?.['stretch'] ?? 0, 2)} ${uk ? 'м' : 'm'} = ${n(r.value! / (r.inputs?.['stretch'] ?? 1), 2)} ${uk ? 'Н/м' : 'N/m'}` });
    return out;
  }
  const N = c.turns ?? 0;
  out.push({ id: `rn:${i}`, title: uk ? `${N} об.` : `${N} turns`, formula: `x = N·π·d ≈ ${n((r.inputs?.['wound'] ?? 0) * 100, 2)} ${uk ? 'см' : 'cm'}`, numbers: `s = ${n(r.value!, 3)} ${uk ? 'м' : 'm'}` });
  const first = before.find((x) => x.ok && x.command.type === 'lab.rubber' && (x.command as unknown as { step: string }).step === 'run');
  const s1 = first?.ok ? first.trace.find((x): x is MeasurementRecord => x.kind === 'measurement')?.value : undefined;
  if (first && s1 && N === 6) out.push({ id: `rr:${i}`, title: uk ? 'удвічі більше обертів' : 'twice the turns', formula: 's₆ / s₃', numbers: `${n(r.value!, 3)} / ${n(s1, 3)} ≈ ${n(r.value! / s1, 2)}` });
  return out;
}
