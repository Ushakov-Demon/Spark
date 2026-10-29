import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Measuring the atmospheric pressure (grade 7, «вимірювання й визначення атмосферного тиску»): a 1 mL syringe, its
 * plunger pushed all the way in, its nozzle shut with a rubber cap. The plunger is pulled out with the dynamometer:
 * inside there is (almost) nothing, outside the air presses on the plunger with F = p·S. The plunger's area comes from
 * the scale: S = V / l (1 mL over the length of its marks). The little air left in the nozzle (the dead space V₀)
 * spreads over the room the plunger opens and presses from inside, p₀·V₀ / (V₀ + V) (slowly — at the room's
 * temperature), so the dynamometer shows F = p₀·S·V / (V₀ + V): the farther the plunger, the nearer to p₀·S.
 * The plunger's friction is left out. The aneroid barometer shows the day's pressure to a hectopascal.
 */

/** The length of the 1 mL scale of a tuberculin syringe. */
export const ATM_SCALE: SourcedValue = sv(0.057, 'm', '1 mL syringe, the length of its 0–1 mL marks', 'estimate', 0.1, [cite('spark', 'estimate', 'a 1 mL syringe’s marks run about 5.5–6 cm', 0.057)], 'Estimate: the ruler measures it all the same.');
/** The air left in a 1 mL syringe with its plunger all the way in (its nozzle and cone). */
export const ATM_DEAD: SourcedValue = sv(0.07e-6, 'm³', '1 mL Luer syringe, central cone', 'single-source', 0.3, [cite('msf-syringe-dead-space', 'Extra tables: 1 ml — max. dead space 0.07 ml, central cone', 'ISO 7886-1:2017', 0.07e-6)], 'The largest the standard allows; many syringes have less.');
/** The aneroid barometer's division: a hectopascal. */
export const BAROMETER_DIVISION = 100;
const RULER = 0.001;
const MAX_PULL = 1;

/**
 * Measure the scale's length; read the barometer; pull the plunger of the open syringe; or of the shut one to so
 * many millilitres. `air` — the day's pressure, Pa.
 */
export type AtmCommand =
  | { readonly type: 'lab.atm'; readonly step: 'scale'; readonly air: number }
  | { readonly type: 'lab.atm'; readonly step: 'barometer'; readonly air: number }
  | { readonly type: 'lab.atm'; readonly step: 'open'; readonly air: number }
  | { readonly type: 'lab.atm'; readonly step: 'sealed'; readonly air: number; readonly pulled: number };

export const atmCommand: CommandHandler<AtmCommand> = {
  type: 'lab.atm',
  apply(state, c) {
    if (!(c.air >= 87_000 && c.air <= 108_500)) return err({ uk: 'Такого тиску повітря біля землі не буває.', en: 'There is no such air pressure at the ground.' });
    const l = ATM_SCALE.value;
    const done = (r: MeasurementRecord) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: [r] });
    if (c.step === 'scale') return done({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(l / RULER) * RULER, exact: l, entities: [], inputs: { volume: 1e-6, division: RULER } });
    if (c.step === 'barometer') return done({ kind: 'measurement', instrument: 'barometer', quantity: 'pressure', value: Math.round(c.air / BAROMETER_DIVISION) * BAROMETER_DIVISION, exact: c.air, entities: [], inputs: { division: BAROMETER_DIVISION } });
    const dyn = SCALES.dynamometer;
    const S = 1e-6 / l;
    // The open syringe: air comes in after the plunger, the pressures alike on both sides (friction left out).
    if (c.step === 'open') return done({ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: 0, exact: 0, entities: [], inputs: { pulled: MAX_PULL, sealed: 0, area: S } });
    if (!(c.pulled > 0 && c.pulled <= MAX_PULL)) return err({ uk: 'Поршень витягують у межах шкали — до 1 мл.', en: 'The plunger goes out within the scale — up to 1 mL.' });
    const V0 = ATM_DEAD.value;
    const V = c.pulled * 1e-6;
    const inside = (c.air * V0) / (V0 + V);
    const F = (c.air - inside) * S;
    return done({ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F), exact: F, entities: [], inputs: { pulled: c.pulled, sealed: 1, area: S, inside, air: c.air } });
  },
};

export const ATM_COMMANDS = [atmCommand] as const;

const ml = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'мл' : 'mL'}`;
export const ATM_TEXT: Record<AtmCommand['type'], (c: AtmCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.atm': (x) => {
    const c = x as AtmCommand;
    if (c.step === 'scale')
      return {
        say: { uk: 'Виміряй лінійкою, яку довжину на шприці займає шкала від 0 до 1 мл.', en: 'Measure with the ruler how long the syringe’s scale from 0 to 1 mL is.' },
        button: { uk: '📏 Виміряти шкалу шприца', en: '📏 Measure the syringe’s scale' },
        plan: { uk: 'виміряти довжину шкали 1 мл', en: 'measure the length of the 1 mL scale' },
      };
    if (c.step === 'barometer')
      return {
        say: { uk: 'Подивись, що сьогодні показує барометр-анероїд.', en: 'Look what the aneroid barometer shows today.' },
        button: { uk: '🧭 Подивитися на барометр', en: '🧭 Read the barometer' },
        plan: { uk: 'зняти покази барометра', en: 'read the barometer' },
      };
    if (c.step === 'open')
      return {
        say: { uk: 'Носик шприца відкритий. Витягни динамометром поршень до позначки 1 мл. Яку силу показує динамометр?', en: 'The syringe’s nozzle is open. Pull the plunger out to the 1 mL mark with the dynamometer. What force does it show?' },
        button: { uk: '↑ Носик відкритий: витягти поршень', en: '↑ Nozzle open: pull the plunger' },
        plan: { uk: 'витягти поршень відкритого шприца', en: 'pull the plunger of the open syringe' },
      };
    return {
      say: { uk: `Встав поршень до кінця, закрий носик ковпачком і повільно витягни поршень динамометром до позначки ${ml(c.pulled, true)}. Яку силу показує динамометр?`, en: `Push the plunger all the way in, shut the nozzle with the cap and slowly pull the plunger out to the ${ml(c.pulled, false)} mark. What force does the dynamometer show?` },
      button: { uk: `🔒 Носик закритий: витягти до ${ml(c.pulled, true)}`, en: `🔒 Nozzle shut: pull to ${ml(c.pulled, false)}` },
      plan: { uk: `витягти поршень закритого шприца до ${ml(c.pulled, true)}`, en: `pull the shut syringe’s plunger to ${ml(c.pulled, false)}` },
    };
  },
};
