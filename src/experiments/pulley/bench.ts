import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { pulleyForce, ropeTravel, weight } from '../../domains/mechanics/formulas.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { forceDivision, measured, RULER_DIVISION } from '../../scenarios/bench-kit.js';
export { forceDivision } from '../../scenarios/bench-kit.js';
import { massText, heightText } from './shared.js';
export { massText, heightText } from './shared.js';

/**
 * Fixed and movable pulleys (grade 7, «моделювання й конструювання: простих механізмів»): a load of any mass is
 * lifted to any height (both the pupil's, under the scene) with a dynamometer — the lab one up to its 5 N, a force
 * gauge of a range to suit beyond — straight, over a fixed pulley on the stand, and on a movable pulley (the rope
 * tied to the stand's arm, round the pulley, up to the dynamometer). The dynamometer reads the force, a ruler how far
 * the rope went. The physics is the domain's: the weight, the rope's pull over the sections holding the load, the
 * rope's travel; friction in the axles is left out.
 */

/** The movable pulley of the lab set, with its hook. */
export const MOVABLE_PULLEY: SourcedValue = sv(0.04, 'kg', 'a school pulley with its hook', 'estimate', 0.3, [cite('spark', 'estimate', 'a lab pulley in its frame weighs some 30–50 g', 0.04)], 'Estimate: the dynamometer shows its share all the same. The same lab pulley whatever the load.');
/** The instruments suit the load: the force — bench-kit's `forceDivision`; the rope's travel — a ruler (1 mm) up to a metre, a tape (1 cm) beyond. */
export const lengthDivision = (s: number): number => (s <= 1 ? RULER_DIVISION : 0.01);
const read = (x: number, d: number) => Math.round(x / d) * d;

export type PulleyHow = 'straight' | 'fixed' | 'movable';
/** How the load is lifted; its mass, kg; how high, m. */
export type PulleyCommand = { readonly type: 'lab.pulley'; readonly how: PulleyHow; readonly mass: number; readonly lift: number };

export const pulleyCommand: CommandHandler<PulleyCommand> = {
  type: 'lab.pulley',
  apply(state, c) {
    if (!['straight', 'fixed', 'movable'].includes(c.how)) return err(msg('pulley-command-apply'));
    if (!(c.mass > 0 && Number.isFinite(c.mass))) return err(msg('pulley-command-apply-2'));
    if (!(c.lift > 0 && Number.isFinite(c.lift))) return err(msg('pulley-command-apply-3'));
    const P = weight(c.mass, G);
    const movable = c.how === 'movable';
    const n = movable ? 2 : 1;
    const Pb = movable ? weight(MOVABLE_PULLEY.value, G) : 0;
    const F = pulleyForce(P, n, Pb);
    const s = ropeTravel(c.lift, n);
    const inputs = { load: P, block: Pb, ropes: n, lift: c.lift, mass: c.mass, fixed: c.how === 'fixed' ? 1 : 0 };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('dynamometer', 'force', read(F, forceDivision(F)), F, { ...inputs, which: 1, division: forceDivision(F) }), measured('ruler', 'length', read(s, lengthDivision(s)), s, { ...inputs, which: 2, division: lengthDivision(s) })] });
  },
};
const g = massText;
const cm = heightText;
export const PULLEY_TEXT: Record<PulleyCommand['type'], (c: PulleyCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.pulley': (x) => {
    const c = x as PulleyCommand;
    if (c.how === 'straight')
      return {
        say: msg('pulley-labpulley-say', { mass: (l: Locale) => g(c.mass, l), lift: (l: Locale) => cm(c.lift, l) }),
        button: msg('pulley-labpulley-button'),
        plan: msg('pulley-labpulley-plan'),
      };
    if (c.how === 'fixed')
      return {
        say: msg('pulley-labpulley-say-2', { lift: (l: Locale) => cm(c.lift, l) }),
        button: msg('pulley-labpulley-button-2'),
        plan: msg('pulley-labpulley-plan-2'),
      };
    return {
      say: msg('pulley-labpulley-say-3', { lift: (l: Locale) => cm(c.lift, l) }),
      button: msg('pulley-labpulley-button-3'),
      plan: msg('pulley-labpulley-plan-3'),
    };
  },
};
