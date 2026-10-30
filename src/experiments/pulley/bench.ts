import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { pulleyForce, ropeTravel, weight } from '../../domains/mechanics/formulas.js';
import { SCALES } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { measured, RULER_DIVISION } from '../../scenarios/bench-kit.js';

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
/**
 * The instruments suit the load: the lab dynamometer (0.1 N) from 0.5 to its 5 N, beyond either — a force gauge read to
 * three figures;
 * the rope's travel — a ruler (1 mm) up to a metre, a tape (1 cm) beyond.
 */
export const forceDivision = (F: number): number => (F >= 5 * SCALES.dynamometer.spec.resolution.value && F <= SCALES.dynamometer.spec.capacity.value ? SCALES.dynamometer.spec.resolution.value : 10 ** (Math.floor(Math.log10(F)) - 2));
export const lengthDivision = (s: number): number => (s <= 1 ? RULER_DIVISION : 0.01);
const read = (x: number, d: number) => Math.round(x / d) * d;

export type PulleyHow = 'straight' | 'fixed' | 'movable';
/** How the load is lifted; its mass, kg; how high, m. */
export type PulleyCommand = { readonly type: 'lab.pulley'; readonly how: PulleyHow; readonly mass: number; readonly lift: number };

export const pulleyCommand: CommandHandler<PulleyCommand> = {
  type: 'lab.pulley',
  apply(state, c) {
    if (!['straight', 'fixed', 'movable'].includes(c.how)) return err({ uk: 'Вантаж піднімають просто вгору, через нерухомий чи на рухомому блоці.', en: 'The load is lifted straight up, over a fixed or on a movable pulley.' });
    if (!(c.mass > 0 && Number.isFinite(c.mass))) return err({ uk: 'Маса вантажу має бути більшою за нуль.', en: 'The load’s mass must be more than zero.' });
    if (!(c.lift > 0 && Number.isFinite(c.lift))) return err({ uk: 'Висота підйому має бути більшою за нуль.', en: 'The height must be more than zero.' });
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

/** A number as the pupil put it in: up to a tenth, without trailing zeros. */
const num = (x: number, uk: boolean) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 1 }).format(x);
/** A mass in the unit that suits it: grams, kilograms, tonnes. */
export const massText = (kg: number, uk: boolean): string => (kg < 1 ? `${num(kg * 1000, uk)} ${uk ? 'г' : 'g'}` : kg < 1000 ? `${num(kg, uk)} ${uk ? 'кг' : 'kg'}` : `${num(kg / 1000, uk)} ${uk ? 'т' : 't'}`);
/** A height in centimetres or metres. */
export const heightText = (m: number, uk: boolean): string => (m < 1 ? `${num(m * 100, uk)} ${uk ? 'см' : 'cm'}` : `${num(m, uk)} ${uk ? 'м' : 'm'}`);
const g = massText;
const cm = heightText;
export const PULLEY_TEXT: Record<PulleyCommand['type'], (c: PulleyCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.pulley': (x) => {
    const c = x as PulleyCommand;
    if (c.how === 'straight')
      return {
        say: { uk: `Підніми вантаж ${g(c.mass, true)} динамометром просто вгору на ${cm(c.lift, true)}. Яку силу він показує й на скільки пройшла рука?`, en: `Lift a ${g(c.mass, false)} load straight up ${cm(c.lift, false)} with the dynamometer. What force does it show, and how far did your hand go?` },
        button: { uk: '↑ Підняти просто вгору', en: '↑ Lift straight up' },
        plan: { uk: 'підняти вантаж динамометром просто вгору', en: 'lift the load straight up with the dynamometer' },
      };
    if (c.how === 'fixed')
      return {
        say: { uk: `Перекинь мотузку через нерухомий блок угорі й тягни динамометром униз, поки вантаж не підніметься на ${cm(c.lift, true)}.`, en: `Throw the rope over the fixed pulley above and pull down with the dynamometer until the load rises ${cm(c.lift, false)}.` },
        button: { uk: '⤵ Через нерухомий блок', en: '⤵ Over the fixed pulley' },
        plan: { uk: 'підняти вантаж через нерухомий блок', en: 'lift the load over the fixed pulley' },
      };
    return {
      say: { uk: `Тепер повісь вантаж на рухомий блок: один кінець мотузки закріпи вгорі, другий — тягни динамометром угору, поки вантаж не підніметься на ${cm(c.lift, true)}.`, en: `Now hang the load on a movable pulley: fix one end of the rope above and pull the other up with the dynamometer until the load rises ${cm(c.lift, false)}.` },
      button: { uk: '⤴ На рухомому блоці', en: '⤴ On a movable pulley' },
      plan: { uk: 'підняти вантаж на рухомому блоці', en: 'lift the load on a movable pulley' },
    };
  },
};
