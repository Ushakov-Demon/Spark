import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { barMagnetPullOnBall, CARBON_STEEL_MU } from '../../domains/electrical/magnet.js';
import { G } from '../../domains/mechanics/constants.js';
import { slidingFriction, weight } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { BAR_MAGNET, blockMass, forceDivision, measured, NEODYMIUM_REMANENCE, PAPER_AREAL, WOOD_ON_WOOD } from '../../scenarios/bench-kit.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { mgInstrument } from '../mass-gravity/bench.js';
import { gapText, type TouchMagnet } from './shared.js';

/**
 * Contact and non-contact forces (grade 7; «контактних і безконтактних сил»), each one measured. A bar magnet stands
 * on zeroed electronic scales, a steel ball hangs over it on a thread: what pulls the ball down pulls the magnet up,
 * and the scales show how much lighter it became (a thread holds the ball steady, where a ball swinging free would
 * jump to the magnet). A card between them changes nothing. Bits of paper weighed a hundred at a time: a rubbed comb
 * lifts one, so its force is more than the bit's weight. A block dragged along the table, then hung just clear of it:
 * the dynamometer shows the friction and its absence. A weight on the dynamometer, let go: what the Earth pulls with.
 * The fields' law is in the electrical domain (src/domains/electrical/magnet.ts), weight and friction in mechanics.
 */

/** The steel ball on the thread: a bearing ball of 8 mm. */
export const TOUCH_BALL: SourcedValue = sv(0.004, 'm', 'radius of an 8 mm bearing ball', 'estimate', 0.1, [cite('spark', 'estimate', 'a common 8 mm steel ball', 0.004)], 'Estimate: its size does not matter to the shape of the result, the pull and the ball’s weight both grow with its volume.');
/** The ball's model holds while it is small beside the distance; nearer, it also pulls the magnet's field to itself. */
export const TOUCH_GAP_MIN = 0.01;
/** A bit of paper: a square of this side, torn by hand. */
export const PAPER_BIT: SourcedValue = sv(0.005, 'm', 'side of a torn bit of paper', 'estimate', 0.4, [cite('spark', 'estimate', 'bits of about 5 × 5 mm jump up to a comb', 0.005)], 'Estimate: the bits are torn by hand.');
/** Bits are weighed together: one is far below the division of the scales. */
export const BITS_WEIGHED = 100;
/** The block hangs on a thread this long and the dynamometer takes it this far aside: the thread's own pull stays below half a division. */
export const HANG_LENGTH = 0.2;
export const HANG_ASIDE = 0.005;

const balance = SCALES['lab-balance'];
const division = balance.spec.resolution.value;
const toDivision = (x: number) => Math.round(x / division) * division;

const remanence = (m: TouchMagnet) => (m === 'neodymium' ? NEODYMIUM_REMANENCE : BAR_MAGNET.remanence).value;
/** The pull between the magnet and the ball at a gap, N. */
export const magnetPull = (gap: number, m: TouchMagnet): number => barMagnetPullOnBall(remanence(m), BAR_MAGNET.length.value, BAR_MAGNET.radius.value, gap, TOUCH_BALL.value, CARBON_STEEL_MU.value);
/** How much lighter the magnet is on the scales, to their division, kg. */
export const magnetLoss = (gap: number, m: TouchMagnet): number => toDivision(magnetPull(gap, m) / G);

export type TouchCase = 'magnet' | 'card' | 'comb' | 'table' | 'lifted' | 'fall';

/** Show one case and read its instrument. */
export interface TouchCommand {
  readonly type: 'lab.touch';
  readonly case: TouchCase;
  /** The magnet's cases: from its end to the ball's surface, m, and which magnet. */
  readonly gap?: number;
  readonly magnet?: TouchMagnet;
  /** The weight let go, kg. */
  readonly mass?: number;
}

export const TOUCH_GAP = 0.02;
export const TOUCH_MASS = 0.3;

export const touchCommand: CommandHandler<TouchCommand> = {
  type: 'lab.touch',
  apply(state, c) {
    const flags = (acts: boolean, touch: boolean) => ({ acts: acts ? 1 : 0, touch: touch ? 1 : 0 });
    const done = (r: MeasurementRecord) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: [r] });
    if (c.case === 'magnet' || c.case === 'card') {
      const gap = c.gap ?? TOUCH_GAP;
      if (!(gap >= TOUCH_GAP_MIN)) return err(msg('contact-forces-bad-gap'));
      const F = magnetPull(gap, c.magnet ?? 'ferrite');
      return done(measured('lab-balance', 'mass', toDivision(F / G), F / G, { ...flags(true, false), gap, division, g: G }));
    }
    if (c.case === 'comb') {
      const bit = PAPER_AREAL.value * PAPER_BIT.value ** 2;
      const pile = toDivision(bit * BITS_WEIGHED);
      return done(measured('lab-balance', 'mass', pile, bit * BITS_WEIGHED, { ...flags(true, false), count: BITS_WEIGHED, bit: pile / BITS_WEIGHED, bitWeight: weight(pile / BITS_WEIGHED, G), division, g: G }));
    }
    const dyn = SCALES.dynamometer;
    if (c.case === 'table') {
      const F = slidingFriction(WOOD_ON_WOOD.value, weight(blockMass(), G));
      return done(measured('dynamometer', 'force', scaleReading(dyn, F), F, { ...flags(true, true), division: dyn.spec.resolution.value }));
    }
    // Hung, the block feels no friction: only the thread's slight pull back, below what the dynamometer shows.
    if (c.case === 'lifted') {
      const back = (weight(blockMass(), G) * HANG_ASIDE) / HANG_LENGTH;
      return done(measured('dynamometer', 'force', scaleReading(dyn, back), 0, { ...flags(false, false), division: dyn.spec.resolution.value }));
    }
    const mass = c.mass ?? TOUCH_MASS;
    if (!(mass > 0 && Number.isFinite(mass))) return err(msg('contact-forces-bad-mass'));
    const F = weight(mass, G);
    const d = forceDivision(F);
    return done(measured(mgInstrument(F), 'force', Math.round(F / d) * d, F, { ...flags(true, false), mass, g: G, division: d }));
  },
};

export const TOUCH_COMMANDS = [touchCommand] as const;

/** A small force in the unit that suits it. */
export function forceText(F: number, l: Locale): string {
  if (F >= 1) return `${sig(F, 2, l)} ${t(l, 'unit-sym-N')}`;
  return F >= 1e-3 ? `${sig(F * 1e3, 2, l)} ${t(l, 'unit-sym-mN')}` : `${sig(F * 1e6, 2, l)} ${t(l, 'unit-sym-uN')}`;
}
/** What the zeroed scales show under the magnet: a loss, below zero. */
export const balanceText = (loss: number, l: Locale): string => `${loss > 0 ? '−' : ''}${formatMeasured('mass', loss, division, l)}`;

/** The force a case's reading gives, as it is said: to the instrument, or a bound on it. */
export function touchForce(c: TouchCase, r: MeasurementRecord, l: Locale): string {
  const value = r.value ?? 0;
  if (c === 'magnet' || c === 'card') return value > 0 ? `F = ${forceText(value * G, l)}` : t(l, 'contact-forces-below-division');
  if (c === 'comb') return `F > ${forceText(r.inputs?.['bitWeight'] ?? 0, l)}`;
  return `F = ${formatMeasured('force', value, r.inputs?.['division'] ?? 0.1, l)}`;
}

export const TOUCH_TEXT: Record<TouchCommand['type'], (c: TouchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.touch': (x) => {
    const c = x as TouchCommand;
    const args = { gap: (l: Locale) => gapText(c.gap ?? TOUCH_GAP, l) };
    return { say: msg(`contact-forces-${c.case}-say`, args), button: msg(`contact-forces-${c.case}-button`), plan: msg(`contact-forces-${c.case}-plan`) };
  },
};

