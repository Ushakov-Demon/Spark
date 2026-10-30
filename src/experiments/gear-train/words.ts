import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { GEAR_TEXT, type GearCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Дошка зі штифтами, три шестірні конструктора (8, 24 і 40 зубців), ручка на ведучій шестірні, крейда', en: 'A board with pins, three gears of a construction set (8, 24 and 40 teeth), a handle on the driving gear, chalk' };

export const text = (c: GearCommand): StepText => GEAR_TEXT['lab.gears'](c);

/** Counting just changes the picture; turned, the gears turn. */
export const busy = (c: GearCommand): LocalizedText | null => (c.step === 'turn' ? { uk: 'Кручу ручку…', en: 'Turning the handle…' } : null);

const turns = (n: number, l: Locale) => `${sig(n, 3, l)} ${l === 'uk' ? (n === 1 ? 'оберт' : 'об.') : n === 1 ? 'turn' : 'turns'}`;
const way = (same: boolean, l: Locale) => (l === 'uk' ? (same ? 'у той самий бік' : 'у протилежний бік') : same ? 'the same way' : 'the other way');

export function shown(c: GearCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (c.step === 'count') return recs.map((r) => r.value).join(uk ? ', ' : ', ') + (uk ? ' зубців' : ' teeth');
  const r = recs[0];
  if (!r) return '';
  return uk ? `ведена — ${turns(r.value ?? 0, locale)}, ${way(r.inputs?.['same'] === 1, locale)}` : `the driven one — ${turns(r.value ?? 0, locale)}, ${way(r.inputs?.['same'] === 1, locale)}`;
}

/** How the last gear went. */
export function say(c: GearCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (c.step === 'count') return uk ? `Зубців: ${recs.map((r) => r.value).join(', ')}.` : `Teeth: ${recs.map((r) => r.value).join(', ')}.`;
  const r = recs[0];
  if (!r) return '';
  const n = r.value ?? 0;
  const driver = r.inputs?.['driver'] ?? 1;
  const same = r.inputs?.['same'] === 1;
  return uk
    ? `Ведуча — ${turns(driver, locale)}, а остання — ${turns(n, locale)}, ${way(same, locale)}${n > driver ? ' — швидше!' : n < driver ? ' — повільніше.' : '.'}`
    : `The driver — ${turns(driver, locale)}, and the last one — ${turns(n, locale)}, ${way(same, locale)}${n > driver ? ' — faster!' : n < driver ? ' — slower.' : '.'}`;
}

/** The board: the teeth; for each train the turns and the ratio of the teeth, and which way. */
export function board(c: GearCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  if (c.step === 'count') return [{ id: `gz:${i}`, title: uk ? 'зубці шестірень' : 'the gears’ teeth', formula: trace.map((r) => `z = ${r.value}`).join(', ') }];
  const r = trace[0];
  if (!r || r.value === null) return [];
  const inp = r.inputs ?? {};
  const n1 = inp['driver'] ?? 1;
  const z1 = inp['first'] ?? 0;
  const z2 = inp['last'] ?? 0;
  const chain = c.step === 'turn' ? c.train.join(' → ') : '';
  return [
    { id: `gn:${i}`, title: uk ? `${chain}: оберти` : `${chain}: the turns`, formula: `n₁ = ${sig(n1, 3, locale)}, n₂ = ${sig(r.value, 3, locale)}` },
    { id: `gr:${i}`, title: uk ? `${chain}: у скільки разів, у який бік` : `${chain}: how many times, which way`, formula: 'n₂ / n₁ = z₁ / z₂', numbers: `${sig(r.value / n1, 3, locale)} = ${z1} / ${z2} — ${way(inp['same'] === 1, locale)}` },
  ];
}
