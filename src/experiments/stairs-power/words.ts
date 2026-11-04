import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { METRIC_HORSEPOWER } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { STAIRS_TEXT, type StairsCommand } from './bench.js';

export const setup: LocalizedText = msg('stairs-power-setup');

export const text = (c: StairsCommand): StepText => STAIRS_TEXT['lab.stairs'](c);

/** Weighing and measuring just change the picture; on the stairs the pupil goes up. */
export const busy = (c: StairsCommand): LocalizedText | null => (c.step === 'climb' ? (c.pace === 'run' ? msg('stairs-power-busy') : msg('stairs-power-busy-2')) : null);

/** A person on floor scales: kilograms to a tenth. */
const kg = (x: number | null, l: Locale) => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x ?? 0)} ${t(l, 'unit-sym-kg')}`;
const cmOf = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
const mOf = (x: number, l: Locale) => `${sig(x, 3, l)} ${t(l, 'unit-sym-m')}`;
const W = (x: number, l: Locale) => `${Math.round(x)} ${t(l, 'unit-sym-W')}`;
const J = (x: number, l: Locale) => `${Math.round(x)} ${t(l, 'unit-sym-J')}`;
const s = (x: number | null, l: Locale) => formatMeasured('time', x, 0.01, l);

export function shown(c: StairsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh') return kg(r.value, locale);
  if (c.step === 'measure') return t(locale, 'stairs-power-shown', { value: cmOf(r.value ?? 0, locale), steps: String(c.steps), height: mOf(r.inputs?.['height'] ?? 0, locale) });
  return t(locale, 'stairs-power-shown-4', { value: s(r.value, locale), value2: c.pace === 'run' ? t(locale, 'stairs-power-shown-2') : t(locale, 'stairs-power-shown-3') });
}

/** What the scales, the ruler and the stopwatch said. */
export function say(c: StairsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.step === 'weigh') return t(locale, 'stairs-power-say', { value: kg(r.value, locale) });
  if (c.step === 'measure') return t(locale, 'stairs-power-say-2', { value: cmOf(r.value ?? 0, locale), steps: String(c.steps), height: mOf(r.inputs?.['height'] ?? 0, locale) });
  return c.pace === 'run' ? (t(locale, 'stairs-power-say-3', { value: s(r.value, locale) })) : t(locale, 'stairs-power-say-4', { value: s(r.value, locale) });
}

const reading = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], step: string): MeasurementRecord | undefined =>
  before.flatMap((x) => (x.ok && x.command.type === 'lab.stairs' && (x.command as { step?: string }).step === step ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop();

/** The board: the mass and the height; for each climb the work (the same) and the power (not the same). */
export function board(c: StairsCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  if (c.step === 'weigh') return [{ id: `sm:${i}`, title: t(locale, 'stairs-power-board-title'), formula: `m = ${kg(r.value, locale)}` }];
  if (c.step === 'measure') return [{ id: `sh:${i}`, title: t(locale, 'stairs-power-board-title-2'), formula: 'h = n · h₁', numbers: `${c.steps} · ${cmOf(r.value, locale)} = ${mOf(r.inputs?.['height'] ?? 0, locale)}` }];
  const inp = r.inputs ?? {};
  const m = reading(before, 'weigh')?.value ?? inp['mass'] ?? 0;
  const pace = c.pace === 'run' ? t(locale, 'stairs-power-shown-2') : t(locale, 'stairs-power-shown-3');
  const N = inp['power'] ?? 0;
  return [
    { id: `sA:${i}`, title: t(locale, 'stairs-power-board-title-3', { pace }), formula: 'A = m·g·h', numbers: `${sig(m, 3, locale)} · ${sig(inp['force'] && m ? inp['force'] / m : 9.81, 3, locale)} · ${sig(inp['height'] ?? 0, 3, locale)} ≈ ${J(inp['work'] ?? 0, locale)}` },
    { id: `sN:${i}`, title: t(locale, 'stairs-power-board-title-4', { pace, value: W(METRIC_HORSEPOWER.value, locale) }), formula: 'N = A / t', numbers: `${J(inp['work'] ?? 0, locale)} / ${s(r.value, locale)} ≈ ${W(N, locale)} ≈ ${sig(N / METRIC_HORSEPOWER.value, 2, locale)} ${t(locale, 'stairs-power-answer-hp-of')}` },
  ];
}
