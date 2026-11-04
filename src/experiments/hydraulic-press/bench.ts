import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { msg, t } from '../../knowledge/messages.js';
import { SYRINGE_LARGE, SYRINGE_SMALL } from '../../scenarios/bench-kit.js';
import { G } from '../../domains/mechanics/constants.js';
import { hydraulicForce } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';

/**
 * A model of a hydraulic machine (grade 7, «Закон Паскаля. Гідравлічна машина»): two syringes, a narrow and a wide
 * one, joined by a tube, all full of water. 100 g weights stand on the wide piston; the narrow one is pushed down
 * with the dynamometer until the load starts to rise: by Pascal's law the pressure under both is the same, so
 * F₁ = F₂·S₁/S₂. Then the narrow piston is pushed 6 cm down and the ruler shows how far the wide one rose.
 * The pistons are taken as sliding without friction (real syringes need a little more force).
 */

/** How far the narrow piston is pushed in the travel step. */
export const PRESS_PUSH = 0.06;
const WEIGHT = 0.1;
const RULER = 0.001;
const read = (x: number) => Math.round(x / RULER) * RULER;
const area = (d: number) => Math.PI * (d / 2) ** 2;

/**
 * What the step does: measure the pistons' diameters; or put so many weights on the wide piston and push the
 * narrow one with the dynamometer; or push the narrow piston 6 cm down and see the wide one rise.
 */
export type PressCommand =
  | { readonly type: 'lab.press'; readonly step: 'diameters' }
  | { readonly type: 'lab.press'; readonly step: 'lift'; readonly weights: number }
  | { readonly type: 'lab.press'; readonly step: 'travel'; readonly weights: number };

export const pressCommand: CommandHandler<PressCommand> = {
  type: 'lab.press',
  apply(state, c) {
    const d1 = SYRINGE_SMALL.value;
    const d2 = SYRINGE_LARGE.value;
    const ruler = (h: number, which: number, extra: Record<string, number> = {}): MeasurementRecord => ({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: read(h), exact: h, entities: [], inputs: { which, division: RULER, ...extra } });
    if (c.step === 'diameters') return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [ruler(d1, 1), ruler(d2, 2)] });
    if (!(Number.isInteger(c.weights) && c.weights >= 1 && c.weights <= 8)) return err(msg('hydraulic-press-command-apply'));
    const F2 = c.weights * WEIGHT * G;
    const F1 = hydraulicForce(F2, area(d2), area(d1));
    if (c.step === 'lift') {
      const dyn = SCALES.dynamometer;
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F1), exact: F1, entities: [], inputs: { weights: c.weights, load: F2, g: G } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    // The water pushed out of the narrow syringe goes into the wide one: S₁·l₁ = S₂·l₂.
    const rise = (PRESS_PUSH * area(d1)) / area(d2);
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [ruler(rise, 3, { push: PRESS_PUSH, weights: c.weights })] });
  },
};

export { SYRINGE_LARGE, SYRINGE_SMALL };
export const PRESS_COMMANDS = [pressCommand] as const;

const w = (n: number, l: Locale) => t(l, 'count-weights', { n });
export const PRESS_TEXT: Record<PressCommand['type'], (c: PressCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.press': (x) => {
    const c = x as PressCommand;
    if (c.step === 'diameters')
      return {
        say: msg('hydraulic-press-labpress-say'),
        button: msg('hydraulic-press-labpress-button'),
        plan: msg('hydraulic-press-labpress-plan'),
      };
    if (c.step === 'lift')
      return {
        say: msg('hydraulic-press-labpress-say-2', { weights: (l: Locale) => w(c.weights, l) }),
        button: msg('hydraulic-press-labpress-button-2', { weights: (l: Locale) => w(c.weights, l) }),
        plan: msg('hydraulic-press-labpress-plan-2', { weights: (l: Locale) => w(c.weights, l) }),
      };
    return {
      say: msg('hydraulic-press-labpress-say-3'),
      button: msg('hydraulic-press-labpress-button-3'),
      plan: msg('hydraulic-press-labpress-plan-3'),
    };
  },
};
