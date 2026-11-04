import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { efficiency, work } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { forceDivision, lengthDivision, PULLEY_TEXT, type PulleyCommand } from './bench.js';

export const setup: LocalizedText = msg('pulley-setup');

export const text = (c: PulleyCommand): StepText => PULLEY_TEXT['lab.pulley'](c);

/** Every way the load goes up. */
export const busy = (): LocalizedText => msg('pulley-busy');

const pick = (recs: readonly MeasurementRecord[], which: number) => recs.find((r) => r.inputs?.['which'] === which);
/** A force as its instrument reads it (the lab dynamometer, or a gauge of a bigger range). */
const N = (x: number | null, l: Locale) => formatMeasured('force', x, forceDivision(x ?? 0), l);
/** A length as read: a ruler's millimetres (in cm) up to a metre, a tape's centimetres (in m) beyond. */
export const lengthText = (x: number | null, l: Locale): string => ((x ?? 0) <= 1 ? formatMeasured('length', x ?? 0, lengthDivision(x ?? 0), l) : `${new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x ?? 0)} ${t(l, 'unit-sym-m')}`);
const cm = lengthText;

export function shown(_c: PulleyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  return t(locale, 'pulley-shown', { recs: N(pick(recs, 1)?.value ?? null, locale), recs2: cm(pick(recs, 2)?.value ?? null, locale) });
}

/** What the dynamometer and the ruler said. */
export function say(c: PulleyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const F = N(pick(recs, 1)?.value ?? null, locale);
  const s = cm(pick(recs, 2)?.value ?? null, locale);
  if (c.how === 'straight') return t(locale, 'pulley-say', { F, s });
  if (c.how === 'fixed') return t(locale, 'pulley-say-2', { F, s });
  // A load lighter than the pulley itself: the movable pulley only gets in the way.
  const f = pick(recs, 1)?.value ?? 0;
  if (f >= (pick(recs, 1)?.inputs?.['load'] ?? Infinity)) return t(locale, 'pulley-say-3', { F, s });
  return t(locale, 'pulley-say-4', { F, s });
}

/** The load's weight as the dynamometer read it lifting straight (this step, or one before). */
const weighed = (c: PulleyCommand, trace: readonly MeasurementRecord[], before: readonly ExperimentLogEntry<{ readonly type: string }>[]): number | null => {
  if (c.how === 'straight') return pick(trace, 1)?.value ?? null;
  const recs = before.flatMap((x) => (x.ok && x.command.type === 'lab.pulley' && (x.command as { how?: string }).how === 'straight' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement');
  return pick(recs, 1)?.value ?? null;
};

/** The board: the force and the rope's travel; the useful and the spent work, the efficiency. */
export function board(c: PulleyCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const Fr = pick(trace, 1);
  const sr = pick(trace, 2);
  if (!Fr || !sr || Fr.value === null || sr.value === null) return [];
  const inp = Fr.inputs ?? {};
  const P = weighed(c, trace, before) ?? inp['load'] ?? 0;
  const h = inp['lift'] ?? 0.1;
  const name = c.how === 'straight' ? t(locale, 'pulley-name-straight') : c.how === 'fixed' ? t(locale, 'pulley-name-fixed') : t(locale, 'pulley-name-movable');
  const J = (x: number) => `${sig(x, 2, locale)} ${t(locale, 'unit-sym-J')}`;
  const useful = work(P, h);
  const spent = work(Fr.value, sr.value);
  return [
    { id: `pf:${i}`, title: t(locale, 'pulley-board-title', { name }), formula: `F = ${N(Fr.value, locale)}, s = ${cm(sr.value, locale)}` },
    { id: `pw:${i}`, title: t(locale, 'pulley-board-title-2', { name }), formula: 'A_к = P·h,  A_в = F·s,  η = A_к / A_в', numbers: `${J(useful)} ; ${J(spent)} ; η ≈ ${Math.round(efficiency(useful, spent) * 100)} %` },
  ];
}
