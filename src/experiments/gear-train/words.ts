import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { GEAR_TEXT, type GearCommand } from './bench.js';


export const text = (c: GearCommand): StepText => GEAR_TEXT['lab.gears'](c);

/** Counting just changes the picture; turned, the gears turn. */
export const busy = (c: GearCommand): LocalizedText | null => (c.step === 'turn' ? msg('gear-train-busy') : null);

const turns = (n: number, l: Locale) => `${sig(n, 3, l)} ${(n === 1 ? tl(l, 'gear-train-turns') : tl(l, 'gear-train-turns-2'))}`;
const way = (same: boolean, l: Locale) => ((same ? tl(l, 'gear-train-way') : tl(l, 'gear-train-way-2')));

export function shown(c: GearCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'count') return recs.map((r) => r.value).join(', ') + t(locale, 'gear-train-shown');
  const r = recs[0];
  if (!r) return '';
  return t(locale, 'gear-train-shown-2', { value: turns(r.value ?? 0, locale), same: way(r.inputs?.['same'] === 1, locale) });
}

/** How the last gear went. */
export function say(c: GearCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'count') return t(locale, 'gear-train-say', { value: recs.map((r) => r.value).join(', ') });
  const r = recs[0];
  if (!r) return '';
  const n = r.value ?? 0;
  const driver = r.inputs?.['driver'] ?? 1;
  const same = r.inputs?.['same'] === 1;
  return t(locale, 'gear-train-say-4', { driver: turns(driver, locale), n: turns(n, locale), same: way(same, locale), value: n > driver ? t(locale, 'gear-train-say-2') : n < driver ? t(locale, 'gear-train-say-3') : '.' });
}

/** The board: the teeth; for each train the turns and the ratio of the teeth, and which way. */
export function board(c: GearCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  if (c.step === 'count') return [{ id: `gz:${i}`, title: t(locale, 'gear-train-board-title'), formula: trace.map((r) => `z = ${r.value}`).join(', ') }];
  const r = trace[0];
  if (!r || r.value === null) return [];
  const inp = r.inputs ?? {};
  const n1 = inp['driver'] ?? 1;
  const z1 = inp['first'] ?? 0;
  const z2 = inp['last'] ?? 0;
  const chain = c.step === 'turn' ? c.train.join(' → ') : '';
  return [
    { id: `gn:${i}`, title: t(locale, 'gear-train-board-title-2', { chain }), formula: `n₁ = ${sig(n1, 3, locale)}, n₂ = ${sig(r.value, 3, locale)}` },
    { id: `gr:${i}`, title: t(locale, 'gear-train-board-title-3', { chain }), formula: 'n₂ / n₁ = z₁ / z₂', numbers: `${sig(r.value / n1, 3, locale)} = ${z1} / ${z2} — ${way(inp['same'] === 1, locale)}` },
  ];
}
