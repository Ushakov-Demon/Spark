import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * How mechanical energy changes form (grade 7): a ball let go from a metre above a hard plate. At the top it has
 * potential energy m·g·h; falling, it turns into kinetic; at the impact the ball is squashed and straightens again —
 * and rises, kinetic turning back into potential. But not all of it comes back: part warms the ball and the plate,
 * part goes as sound. The height it rises to is the share of energy left: Eп₁ / Eп₀ = h₁ / h₀. Each bounce keeps
 * about the same share, so the heights fall as h₀·rⁿ. A plasticine ball does not bounce at all.
 *
 * The shares are the ball standards' own bounce tests (a table tennis ball from 305 mm on a steel block, a tennis
 * ball from 254 cm on concrete), taken to hold from a metre as well; the air's drag is left out.
 */

export type BounceBall = 'pingpong' | 'tennis' | 'clay';

export interface BounceBallSpec {
  readonly mass: SourcedValue;
  /** The share of the drop height it bounces back to. */
  readonly ratio: SourcedValue;
  /** Its diameter, m. */
  readonly size: number;
}

export const BOUNCE_BALLS: Readonly<Record<BounceBall, BounceBallSpec>> = {
  pingpong: {
    mass: sv(0.0027, 'kg', 'a table tennis ball', 'single-source', 0.02, [cite('ittf-t3-ball', 'Law 2.03.02: the ball shall weigh 2.7g', '—', 0.0027)], 'The law’s value; 2.67–2.77 g is accepted.'),
    ratio: sv(250 / 305, '', 'a table tennis ball on a steel block', 'single-source', 0.04, [cite('ittf-t3-ball', 'rebound 240–260 mm when dropped from 305 mm', '—', 250 / 305)], 'The middle of the accepted range; taken to hold from 1 m too (the air’s drag left out).'),
    size: 0.04,
  },
  tennis: {
    mass: sv(0.0577, 'kg', 'a tennis ball, type 2', 'single-source', 0.03, [cite('itf-rules-2026-ball', 'mass 56.0–59.4 grams', '—', 0.0577)], 'The middle of the range.'),
    ratio: sv(141 / 254, '', 'a tennis ball on concrete', 'single-source', 0.05, [cite('itf-rules-2026-ball', 'rebound 135–147 cm', '—', 1.41), cite('wikipedia-tennis-ball', 'dropped from 254 cm onto concrete', '—', 2.54)], 'The middle of the accepted range; taken to hold from 1 m too.'),
    size: 0.067,
  },
  clay: {
    mass: sv(0.02, 'kg', 'a plasticine ball some 3 cm across', 'estimate', 0.3, [cite('spark', 'estimate', '14 cm³ of plasticine, about 1.4 g/cm³', 0.02)], 'Estimate.'),
    ratio: sv(0, '', 'a plasticine ball on a hard plate', 'estimate', 0, [cite('spark', 'estimate', 'plasticine flattens and stays so — it does not bounce', 0)], 'Estimate: it flattens and stays on the plate.'),
    size: 0.03,
  },
};

/** The ball is let go from this height (its bottom above the plate). */
export const BOUNCE_FROM = 1;
/** The metre stick: centimetre divisions — a bouncing ball's top is caught by eye to a centimetre. */
export const BOUNCE_DIVISION = 0.01;

/** Let the ball go from a metre and read how high it rises after the `bounce`-th impact. */
export interface BounceCommand {
  readonly type: 'lab.bounce';
  readonly ball: BounceBall;
  readonly bounce: number;
}

/** The heights of the tops one by one: the drop height, then after each impact. */
export function bounceTops(ball: BounceBall, bounces: number): number[] {
  const r = BOUNCE_BALLS[ball].ratio.value;
  return Array.from({ length: bounces + 1 }, (_, n) => BOUNCE_FROM * r ** n);
}

export const bounceCommand: CommandHandler<BounceCommand> = {
  type: 'lab.bounce',
  apply(state, c) {
    if (!(Number.isInteger(c.bounce) && c.bounce >= 1 && c.bounce <= 5)) return err(msg('ball-bounce-command-apply'));
    const b = BOUNCE_BALLS[c.ball];
    const h = bounceTops(c.ball, c.bounce).at(-1)!;
    const value = Math.round(h / BOUNCE_DIVISION) * BOUNCE_DIVISION;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value, exact: h, entities: [], inputs: { mass: b.mass.value, from: BOUNCE_FROM, bounce: c.bounce, division: BOUNCE_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const BOUNCE_COMMANDS = [bounceCommand] as const;

const NAME: Record<BounceBall, LocalizedText> = {
  pingpong: msg('ball-bounce-name-pingpong'),
  tennis: msg('ball-bounce-name-tennis'),
  clay: msg('ball-bounce-name-clay'),
};
export const bounceBallName = (b: BounceBall): LocalizedText => NAME[b];
/** The name with a capital letter, in the language. */
const cap = (t: LocalizedText, l: Locale) => t[l].charAt(0).toUpperCase() + t[l].slice(1);
const ICON: Record<BounceBall, string> = { pingpong: '🏓', tennis: '🎾', clay: '🟤' };

export const BOUNCE_TEXT: Record<BounceCommand['type'], (c: BounceCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.bounce': (x) => {
    const c = x as BounceCommand;
    const name = NAME[c.ball];
    if (c.bounce > 1)
      return {
        say: msg('ball-bounce-again-say', { n: c.bounce }),
        button: msg('ball-bounce-again-button', { icon: ICON[c.ball], n: c.bounce }),
        plan: msg('ball-bounce-again-plan', { name: (l: Locale) => name[l], n: c.bounce }),
      };
    return {
      say: msg('ball-bounce-first-say', { name: (l: Locale) => cap(name, l), ball: c.ball }),
      button: msg('ball-bounce-first-button', { icon: ICON[c.ball], name: (l: Locale) => cap(name, l) }),
      plan: msg('ball-bounce-labbounce-plan', { name: (l: Locale) => name[l] }),
    };
  },
};
