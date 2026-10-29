import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { hydraulicForce } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * A model of a hydraulic machine (grade 7, «Закон Паскаля. Гідравлічна машина»): two syringes, a narrow and a wide
 * one, joined by a tube, all full of water. 100 g weights stand on the wide piston; the narrow one is pushed down
 * with the dynamometer until the load starts to rise: by Pascal's law the pressure under both is the same, so
 * F₁ = F₂·S₁/S₂. Then the narrow piston is pushed 6 cm down and the ruler shows how far the wide one rose.
 * The pistons are taken as sliding without friction (real syringes need a little more force).
 */

/** The syringes' inner diameters: a 5 mL one and a 50 mL one. */
export const SYRINGE_SMALL: SourcedValue = sv(0.012, 'm', '5 mL syringe, inside', 'estimate', 0.15, [cite('spark', 'estimate', 'a 5 mL syringe is about 12 mm wide inside', 0.012)], 'Estimate: the ruler measures it all the same.');
export const SYRINGE_LARGE: SourcedValue = sv(0.026, 'm', '50 mL syringe, inside', 'estimate', 0.15, [cite('spark', 'estimate', 'a 50 mL syringe is about 26–29 mm wide inside', 0.026)], 'Estimate: the ruler measures it all the same.');
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
    if (!(Number.isInteger(c.weights) && c.weights >= 1 && c.weights <= 8)) return err({ uk: 'На поршень ставлять від 1 до 8 тягарців.', en: 'The piston takes 1 to 8 weights.' });
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

export const PRESS_COMMANDS = [pressCommand] as const;

const w = (n: number, uk: boolean) => (uk ? `${n} ${n === 1 ? 'тягарець' : n < 5 ? 'тягарці' : 'тягарців'}` : `${n} weight${n === 1 ? '' : 's'}`);
export const PRESS_TEXT: Record<PressCommand['type'], (c: PressCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.press': (x) => {
    const c = x as PressCommand;
    if (c.step === 'diameters')
      return {
        say: { uk: 'Виміряй лінійкою діаметри обох поршнів — вузького й широкого шприца.', en: 'Measure the diameters of both pistons — of the narrow and the wide syringe — with the ruler.' },
        button: { uk: '📏 Виміряти діаметри поршнів', en: '📏 Measure the pistons' },
        plan: { uk: 'виміряти діаметри поршнів', en: 'measure the pistons’ diameters' },
      };
    if (c.step === 'lift')
      return {
        say: { uk: `Постав на широкий поршень ${w(c.weights, true)} по 100 г і тисни динамометром на вузький, поки вантаж не почне підніматися. Яку силу показує динамометр?`, en: `Put ${w(c.weights, false)} of 100 g on the wide piston and push the narrow one with the dynamometer until the load starts to rise. What force does it show?` },
        button: { uk: `🏋 ${w(c.weights, true)} на широкому: тиснути`, en: `🏋 ${w(c.weights, false)} on the wide one: push` },
        plan: { uk: `${w(c.weights, true)} на широкому поршні — тиснути на вузький`, en: `${w(c.weights, false)} on the wide piston — push the narrow one` },
      };
    return {
      say: { uk: 'Опусти вузький поршень на 6 см і виміряй лінійкою, на скільки піднявся широкий.', en: 'Push the narrow piston 6 cm down and measure how far the wide one rose.' },
      button: { uk: '↕ Вузький на 6 см униз: на скільки вгору широкий?', en: '↕ The narrow one 6 cm down: how far up the wide one?' },
      plan: { uk: 'опустити вузький поршень на 6 см', en: 'push the narrow piston 6 cm down' },
    };
  },
};
