import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { WINCH_TEXT, type WinchCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Ворот на штативі: вісь із ручкою, котушка від ниток (d = 2 см) або олівець (d = 8 мм), нитка з вантажем, лінійка', en: 'A windlass on a stand: an axis with a handle, a cotton reel (d = 2 cm) or a pencil (d = 8 mm), a thread with a load, a ruler' };

export const text = (c: WinchCommand): StepText => WINCH_TEXT['lab.winch'](c);

export const busy = (): LocalizedText => ({ uk: 'Котушка крутиться — рахую оберти…', en: 'The spool is turning — counting the turns…' });

export function shown(_c: WinchCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (r?.quantity === 'turns') return formatMeasured('turns', r.value, 0.25, locale);
  return `${String(Math.round((r?.value ?? 0) * 1000) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'см' : 'cm'}`;
}

/** The turns counted, or how far the load rose. */
export function say(c: WinchCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const n = recs[0]?.value ?? 0;
  const count = formatMeasured('turns', n, 0.25, locale).replace(/ (об\.|turns)$/, '');
  // (A fraction of a turn: «4,75 оберту»; whole ones: «12 обертів».)
  const word = !Number.isInteger(n) ? 'оберту' : n % 10 === 1 && n % 100 !== 11 ? 'оберт' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'оберти' : 'обертів';
  if (c.mode === 'lower') return uk ? `${c.spool === 'pencil' ? 'Олівець зробив' : 'Котушка зробила'} ${count} ${word}.` : `${c.spool === 'pencil' ? 'The pencil' : 'The reel'} made ${count} turns.`;
  return uk ? `Вантаж піднявся на ${String(Math.round(n * 1000) / 10).replace('.', ',')} см.` : `The load rose ${Math.round(n * 1000) / 10} cm.`;
}

/** The board's lines for a done step. */
export function board(c: WinchCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const d = r.inputs?.['diameter'] ?? 0;
  const amount = c.amount;
  const what = c.spool === 'pencil' ? (uk ? 'олівець, d = 8 мм' : 'pencil, d = 8 mm') : uk ? 'котушка, d = 2 см' : 'reel, d = 2 cm';
  const cm = (x: number) => `${n(x * 100, 3)} ${uk ? 'см' : 'cm'}`;
  if (c.mode === 'lower') {
    out.push({ id: `wm:${i}`, title: uk ? `${what}: вантаж униз на ${cm(amount)}` : `${what}: the load down ${cm(amount)}`, formula: `n = ${formatMeasured('turns', r.value, 0.25, locale)}` });
    out.push({ id: `wc:${i}`, title: uk ? 'за оберт — довжина кола' : 'a turn — the circumference', formula: 'n = l / (π·d)', numbers: `${cm(amount)} / (3,14 · ${cm(d)}) ≈ ${n(amount / (Math.PI * d), 3)}`.replace('3,14', uk ? '3,14' : '3.14') });
  } else {
    out.push({ id: `wm:${i}`, title: uk ? `${what}: ${amount} обертів ручки` : `${what}: ${amount} turns of the handle`, formula: `h = ${cm(r.value!)}` });
    out.push({ id: `wc:${i}`, title: uk ? 'за оберт — довжина кола' : 'a turn — the circumference', formula: 'l = π·d·n', numbers: `3,14 · ${cm(d)} · ${amount} ≈ ${cm(Math.PI * d * amount)}`.replace('3,14', uk ? '3,14' : '3.14') });
  }
  return out;
}
