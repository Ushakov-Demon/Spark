import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { METRIC_HORSEPOWER } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { STAIRS_TEXT, type StairsCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Сходи на наступний поверх, підлогові ваги, лінійка, секундомір — і товариш, що засікає час', en: 'Stairs to the next floor, floor scales, a ruler, a stopwatch — and a friend to time you' };

export const text = (c: StairsCommand): StepText => STAIRS_TEXT['lab.stairs'](c);

/** Weighing and measuring just change the picture; on the stairs the pupil goes up. */
export const busy = (c: StairsCommand): LocalizedText | null => (c.step === 'climb' ? (c.pace === 'run' ? { uk: 'Біжу сходами…', en: 'Running up the stairs…' } : { uk: 'Іду сходами…', en: 'Walking up the stairs…' }) : null);

/** A person on floor scales: kilograms to a tenth. */
const kg = (x: number | null, l: Locale) => `${new Intl.NumberFormat(l === 'uk' ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x ?? 0)} ${l === 'uk' ? 'кг' : 'kg'}`;
const cmOf = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
const mOf = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'м' : 'm'}`;
const W = (x: number, l: Locale) => `${Math.round(x)} ${l === 'uk' ? 'Вт' : 'W'}`;
const J = (x: number, l: Locale) => `${Math.round(x)} ${l === 'uk' ? 'Дж' : 'J'}`;
const s = (x: number | null, l: Locale) => formatMeasured('time', x, 0.01, l);

export function shown(c: StairsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh') return kg(r.value, locale);
  if (c.step === 'measure') return uk ? `сходинка ${cmOf(r.value ?? 0, locale)}, сходинок ${c.steps} — висота ${mOf(r.inputs?.['height'] ?? 0, locale)}` : `a step ${cmOf(r.value ?? 0, locale)}, ${c.steps} steps — a height of ${mOf(r.inputs?.['height'] ?? 0, locale)}`;
  return uk ? `${c.pace === 'run' ? 'бігом' : 'кроком'} — ${s(r.value, locale)}` : `${c.pace === 'run' ? 'running' : 'walking'} — ${s(r.value, locale)}`;
}

/** What the scales, the ruler and the stopwatch said. */
export function say(c: StairsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh') return uk ? `Ваги показали ${kg(r.value, locale)}.` : `The scales show ${kg(r.value, locale)}.`;
  if (c.step === 'measure') return uk ? `Сходинка — ${cmOf(r.value ?? 0, locale)}, їх ${c.steps}: до поверху ${mOf(r.inputs?.['height'] ?? 0, locale)} угору.` : `A step is ${cmOf(r.value ?? 0, locale)}, there are ${c.steps}: ${mOf(r.inputs?.['height'] ?? 0, locale)} up to the floor.`;
  return c.pace === 'run' ? (uk ? `Бігом — лише ${s(r.value, locale)}! А сходи ті самі.` : `Running — only ${s(r.value, locale)}! And the stairs are the same.`) : uk ? `Кроком — ${s(r.value, locale)}.` : `Walking — ${s(r.value, locale)}.`;
}

const reading = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], step: string): MeasurementRecord | undefined =>
  before.flatMap((x) => (x.ok && x.command.type === 'lab.stairs' && (x.command as { step?: string }).step === step ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop();

/** The board: the mass and the height; for each climb the work (the same) and the power (not the same). */
export function board(c: StairsCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const r = trace[0];
  if (!r || r.value === null) return [];
  if (c.step === 'weigh') return [{ id: `sm:${i}`, title: uk ? 'маса' : 'the mass', formula: `m = ${kg(r.value, locale)}` }];
  if (c.step === 'measure') return [{ id: `sh:${i}`, title: uk ? 'висота поверху' : 'the floor’s height', formula: 'h = n · h₁', numbers: `${c.steps} · ${cmOf(r.value, locale)} = ${mOf(r.inputs?.['height'] ?? 0, locale)}` }];
  const inp = r.inputs ?? {};
  const m = reading(before, 'weigh')?.value ?? inp['mass'] ?? 0;
  const pace = c.pace === 'run' ? (uk ? 'бігом' : 'running') : uk ? 'кроком' : 'walking';
  const N = inp['power'] ?? 0;
  return [
    { id: `sA:${i}`, title: uk ? `${pace}: робота — підняти свою вагу на висоту` : `${pace}: the work — one’s weight lifted by the height`, formula: 'A = m·g·h', numbers: `${sig(m, 3, locale)} · ${sig(inp['force'] && m ? inp['force'] / m : 9.81, 3, locale)} · ${sig(inp['height'] ?? 0, 3, locale)} ≈ ${J(inp['work'] ?? 0, locale)}` },
    { id: `sN:${i}`, title: uk ? `${pace}: потужність (кінська сила — ${W(METRIC_HORSEPOWER.value, locale)})` : `${pace}: the power (a horsepower — ${W(METRIC_HORSEPOWER.value, locale)})`, formula: 'N = A / t', numbers: `${J(inp['work'] ?? 0, locale)} / ${s(r.value, locale)} ≈ ${W(N, locale)} ≈ ${sig(N / METRIC_HORSEPOWER.value, 2, locale)} ${uk ? 'к. с.' : 'hp'}` },
  ];
}
