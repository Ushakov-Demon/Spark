import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { efficiency, work } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { forceDivision, lengthDivision, PULLEY_TEXT, type PulleyCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Штатив із лапкою, нерухомий і рухомий блоки, мотузка, три тягарці по 100 г, динамометр, лінійка', en: 'A stand with an arm, a fixed and a movable pulley, a rope, three 100 g weights, a dynamometer, a ruler' };

export const text = (c: PulleyCommand): StepText => PULLEY_TEXT['lab.pulley'](c);

/** Every way the load goes up. */
export const busy = (): LocalizedText => ({ uk: 'Піднімаю вантаж…', en: 'Lifting the load…' });

const pick = (recs: readonly MeasurementRecord[], which: number) => recs.find((r) => r.inputs?.['which'] === which);
/** A force as its instrument reads it (the lab dynamometer, or a gauge of a bigger range). */
const N = (x: number | null, l: Locale) => formatMeasured('force', x, forceDivision(x ?? 0), l);
/** A length as read: a ruler's millimetres (in cm) up to a metre, a tape's centimetres (in m) beyond. */
export const lengthText = (x: number | null, l: Locale): string => ((x ?? 0) <= 1 ? formatMeasured('length', x ?? 0, lengthDivision(x ?? 0), l) : `${new Intl.NumberFormat(l === 'uk' ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x ?? 0)} ${l === 'uk' ? 'м' : 'm'}`);
const cm = lengthText;

export function shown(_c: PulleyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  return uk ? `F = ${N(pick(recs, 1)?.value ?? null, locale)}, мотузка — ${cm(pick(recs, 2)?.value ?? null, locale)}` : `F = ${N(pick(recs, 1)?.value ?? null, locale)}, the rope — ${cm(pick(recs, 2)?.value ?? null, locale)}`;
}

/** What the dynamometer and the ruler said. */
export function say(c: PulleyCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const F = N(pick(recs, 1)?.value ?? null, locale);
  const s = cm(pick(recs, 2)?.value ?? null, locale);
  if (c.how === 'straight') return uk ? `Просто вгору — ${F}, рука пройшла ${s}.` : `Straight up — ${F}, the hand went ${s}.`;
  if (c.how === 'fixed') return uk ? `Через нерухомий блок — ті самі ${F}, і мотузку протягли на ${s}. Зате тягнемо вниз!` : `Over the fixed pulley — the same ${F}, and the rope went ${s}. But we pull down!`;
  // A load lighter than the pulley itself: the movable pulley only gets in the way.
  const f = pick(recs, 1)?.value ?? 0;
  if (f >= (pick(recs, 1)?.inputs?.['load'] ?? Infinity)) return uk ? `На рухомому блоці — аж ${F}: більше, ніж просто вгору! Сам блок важчий за такий вантаж, і тягнути доводиться й його. А мотузку — ще й на ${s}.` : `On the movable pulley — as much as ${F}: more than straight up! The pulley itself is heavier than such a load, and it has to be pulled too. And the rope — ${s} at that.`;
  return uk ? `На рухомому блоці — лише ${F}! Але мотузку довелося протягти на ${s}.` : `On the movable pulley — only ${F}! But the rope had to go ${s}.`;
}

/** The load's weight as the dynamometer read it lifting straight (this step, or one before). */
const weighed = (c: PulleyCommand, trace: readonly MeasurementRecord[], before: readonly ExperimentLogEntry<{ readonly type: string }>[]): number | null => {
  if (c.how === 'straight') return pick(trace, 1)?.value ?? null;
  const recs = before.flatMap((x) => (x.ok && x.command.type === 'lab.pulley' && (x.command as { how?: string }).how === 'straight' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement');
  return pick(recs, 1)?.value ?? null;
};

/** The board: the force and the rope's travel; the useful and the spent work, the efficiency. */
export function board(c: PulleyCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const Fr = pick(trace, 1);
  const sr = pick(trace, 2);
  if (!Fr || !sr || Fr.value === null || sr.value === null) return [];
  const inp = Fr.inputs ?? {};
  const P = weighed(c, trace, before) ?? inp['load'] ?? 0;
  const h = inp['lift'] ?? 0.1;
  const name = c.how === 'straight' ? (uk ? 'просто вгору' : 'straight up') : c.how === 'fixed' ? (uk ? 'нерухомий блок' : 'fixed pulley') : uk ? 'рухомий блок' : 'movable pulley';
  const J = (x: number) => `${sig(x, 2, locale)} ${uk ? 'Дж' : 'J'}`;
  const useful = work(P, h);
  const spent = work(Fr.value, sr.value);
  return [
    { id: `pf:${i}`, title: uk ? `${name}: сила й мотузка` : `${name}: the force and the rope`, formula: `F = ${N(Fr.value, locale)}, s = ${cm(sr.value, locale)}` },
    { id: `pw:${i}`, title: uk ? `${name}: корисна й витрачена робота, ККД` : `${name}: the useful and the spent work, efficiency`, formula: 'A_к = P·h,  A_в = F·s,  η = A_к / A_в', numbers: `${J(useful)} ; ${J(spent)} ; η ≈ ${Math.round(efficiency(useful, spent) * 100)} %` },
  ];
}
