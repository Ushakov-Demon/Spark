import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { earthR, mu, OUTCOME, type CannonCommand } from './bench.js';
import { circularSpeed, escapeSpeed, gravityAt } from '../../domains/mechanics/formulas.js';

export const setup: LocalizedText = msg('newton-cannon-setup');

/** A speed: metres a second below a kilometre a second, kilometres a second from it. */
export const speedText = (v: number, l: Locale): string => (v < 1000 ? `${sig(v, 3, l)} ${t(l, 'unit-sym-m-per-s')}` : `${sig(v / 1000, 3, l)} ${t(l, 'unit-sym-km-per-s')}`);
/** A distance: metres below a kilometre, kilometres from it. */
export const kmText = (m: number, l: Locale): string => (m < 1000 ? `${sig(m, 3, l)} ${t(l, 'unit-sym-m')}` : `${sig(m / 1000, 3, l)} ${t(l, 'unit-sym-km')}`);
/** A time: seconds, minutes or hours. */
export const timeText = (s: number, l: Locale): string => (s < 60 ? `${sig(s, 3, l)} ${t(l, 'unit-sym-s')}` : s < 3600 * 2 ? `${sig(s / 60, 3, l)} ${t(l, 'unit-sym-min')}` : `${sig(s / 3600, 3, l)} ${t(l, 'unit-sym-h')}`);

/** A large number as mantissa · 10ⁿ, four figures («6,571·10⁶»). */
const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sci = (x: number, l: Locale): string => {
  const n = Math.floor(Math.log10(Math.abs(x)));
  return `${sig(x / 10 ** n, 4, l)}·10${String(n).split('').map((d) => (d === '-' ? '⁻' : SUPER[Number(d)])).join('')}`;
};

const outcomeOf = (r: MeasurementRecord) => (r.inputs?.['outcome'] === OUTCOME.lands ? 'lands' : r.inputs?.['outcome'] === OUTCOME.orbits ? 'orbits' : 'escapes');

/** An angle to the horizon («30°»). */
export const degText = (d: number, l: Locale): string => `${sig(d, 3, l)}${t(l, 'unit-sym-deg')}`;

export const text = (c: CannonCommand): StepText => {
  const a = { v: (l: Locale) => speedText(c.v, l), angle: (l: Locale) => degText(c.angle ?? 0, l), level: (c.angle ?? 0) === 0 ? 'yes' : 'no' };
  return { say: msg('newton-cannon-shot-say', a), button: msg('newton-cannon-shot-button', a), plan: msg('newton-cannon-shot-plan', a) };
};

/** The ball flies along its path. */
export const busy = (_c: CannonCommand): LocalizedText => msg('newton-cannon-shot-busy');

const resultArgs = (c: CannonCommand, r: MeasurementRecord, l: Locale) => ({
  v: speedText(c.v, l),
  outcome: outcomeOf(r),
  range: r.value !== null && outcomeOf(r) === 'lands' ? kmText(r.value, l) : '',
  time: timeText(r.inputs?.['time'] ?? 0, l),
  period: r.value !== null && outcomeOf(r) === 'orbits' ? timeText(r.value, l) : '',
  near: kmText(r.inputs?.['near'] ?? 0, l),
  far: kmText(r.inputs?.['far'] ?? 0, l),
  round: Math.abs(r.inputs?.['e'] ?? 1) < 0.01 ? 'yes' : 'no',
  angle: degText(c.angle ?? 0, l),
  level: (c.angle ?? 0) === 0 ? 'yes' : 'no',
});

export function shown(c: CannonCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  return r ? t(locale, 'newton-cannon-shot-shown', resultArgs(c, r, locale)) : '';
}

export function say(c: CannonCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  return r ? t(locale, 'newton-cannon-shot-said', resultArgs(c, r, locale)) : '';
}

/**
 * The board: on the first shot, gravity up there, g = μ/r², and the speed to go round, v₁ = √(μ/r); each shot — the
 * range along the ground l = R·θ (and the time), the period T = 2π√(a³/μ), or away: v ≥ v₂ = √(2μ/r).
 */
export function board(c: CannonCommand, recs: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const r = recs[0];
  if (!r) return [];
  const r0 = earthR() + c.h;
  const lines: BoardLine[] = [];
  const first = !before.some((e) => e.command.type === 'lab.cannon');
  const n = (x: number) => sig(x, 3, locale);
  const muText = sci(mu(), locale);
  if (first) {
    lines.push({ id: `cn-g:${i}`, title: t(locale, 'newton-cannon-board-g', { h: kmText(c.h, locale) }), formula: 'g = μ / r²', numbers: `${muText} / (${sci(r0, locale)})² ≈ ${n(gravityAt(mu(), r0))} ${t(locale, 'unit-sym-N-per-kg')}` });
    lines.push({ id: `cn-v1:${i}`, title: t(locale, 'newton-cannon-board-v1', { h: kmText(c.h, locale) }), formula: 'v₁ = √(μ / r)', numbers: `√(${muText} / ${sci(r0, locale)}) ≈ ${speedText(circularSpeed(mu(), r0), locale)}` });
  }
  // At an angle: the orbit's lowest point against the Earth's radius — what decides whether it comes down.
  if ((c.angle ?? 0) !== 0 && outcomeOf(r) !== 'escapes') {
    const p = r.inputs?.['p'] ?? 0;
    const e = r.inputs?.['e'] ?? 0;
    lines.push({ id: `cn-low:${i}`, title: t(locale, 'newton-cannon-board-low', { v: speedText(c.v, locale) }), formula: 'r_min = p / (1 + e)', numbers: `${sci(p, locale)} / (1 + ${sig(e, 3, locale)}) ≈ ${kmText(p / (1 + e), locale)} ${p / (1 + e) < earthR() ? '<' : '>'} R = ${kmText(earthR(), locale)}` });
  }
  const title = t(locale, 'newton-cannon-board-shot', { v: speedText(c.v, locale), outcome: outcomeOf(r), angle: degText(c.angle ?? 0, locale), level: (c.angle ?? 0) === 0 ? 'yes' : 'no' });
  if (outcomeOf(r) === 'lands' && r.value !== null) {
    lines.push({ id: `cn-shot:${i}`, title, formula: 'l = R · θ', numbers: `${sig(earthR() / 1000, 4, locale)} ${t(locale, 'unit-sym-km')} · ${sig(r.inputs?.['angle'] ?? 0, 3, locale)} ≈ ${kmText(r.value, locale)}; t ≈ ${timeText(r.inputs?.['time'] ?? 0, locale)}` });
  } else if (outcomeOf(r) === 'orbits' && r.value !== null) {
    lines.push({ id: `cn-shot:${i}`, title, formula: 'T = 2π √(a³ / μ)', numbers: `2π √((${sci(r.inputs?.['a'] ?? 0, locale)})³ / ${muText}) ≈ ${timeText(r.value, locale)}` });
  } else {
    lines.push({ id: `cn-shot:${i}`, title, formula: 'v ≥ v₂ = √(2μ / r)', numbers: `${speedText(c.v, locale)} ≥ ${speedText(escapeSpeed(mu(), r0), locale)}` });
  }
  return lines;
}
