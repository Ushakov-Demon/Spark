import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
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
    if (!(c.air >= 87_000 && c.air <= 108_500)) return err(msg('atmospheric-pressure-atm-command-apply'));
    const l = ATM_SCALE.value;
    const done = (r: MeasurementRecord) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: [r] });
    if (c.step === 'scale') return done({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(l / RULER) * RULER, exact: l, entities: [], inputs: { volume: 1e-6, division: RULER } });
    if (c.step === 'barometer') return done({ kind: 'measurement', instrument: 'barometer', quantity: 'pressure', value: Math.round(c.air / BAROMETER_DIVISION) * BAROMETER_DIVISION, exact: c.air, entities: [], inputs: { division: BAROMETER_DIVISION } });
    const dyn = SCALES.dynamometer;
    const S = 1e-6 / l;
    // The open syringe: air comes in after the plunger, the pressures alike on both sides (friction left out).
    if (c.step === 'open') return done({ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: 0, exact: 0, entities: [], inputs: { pulled: MAX_PULL, sealed: 0, area: S } });
    if (!(c.pulled > 0 && c.pulled <= MAX_PULL)) return err(msg('atmospheric-pressure-atm-command-apply-2'));
    const V0 = ATM_DEAD.value;
    const V = c.pulled * 1e-6;
    const inside = (c.air * V0) / (V0 + V);
    const F = (c.air - inside) * S;
    return done({ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F), exact: F, entities: [], inputs: { pulled: c.pulled, sealed: 1, area: S, inside, air: c.air } });
  },
};

export const ATM_COMMANDS = [atmCommand] as const;

const ml = (x: number, l: Locale) => `${String(x).replace('.', t(l, 'atmospheric-pressure-ml'))} ${t(l, 'unit-sym-mL')}`;
export const ATM_TEXT: Record<AtmCommand['type'], (c: AtmCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.atm': (x) => {
    const c = x as AtmCommand;
    if (c.step === 'scale')
      return {
        say: msg('atmospheric-pressure-labatm-say'),
        button: msg('atmospheric-pressure-labatm-button'),
        plan: msg('atmospheric-pressure-labatm-plan'),
      };
    if (c.step === 'barometer')
      return {
        say: msg('atmospheric-pressure-labatm-say-2'),
        button: msg('atmospheric-pressure-labatm-button-2'),
        plan: msg('atmospheric-pressure-labatm-plan-2'),
      };
    if (c.step === 'open')
      return {
        say: msg('atmospheric-pressure-labatm-say-3'),
        button: msg('atmospheric-pressure-labatm-button-3'),
        plan: msg('atmospheric-pressure-labatm-plan-3'),
      };
    return {
      say: msg('atmospheric-pressure-labatm-say-4', { pulled: (l: Locale) => ml(c.pulled, l) }),
      button: msg('atmospheric-pressure-labatm-button-4', { pulled: (l: Locale) => ml(c.pulled, l) }),
      plan: msg('atmospheric-pressure-labatm-plan-4', { pulled: (l: Locale) => ml(c.pulled, l) }),
    };
  },
};
