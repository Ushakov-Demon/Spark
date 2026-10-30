import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { COMPONENTS, molarMassOfComponent } from '../../components/index.js';
import { G, STANDARD_ATMOSPHERE } from '../../domains/mechanics/constants.js';
import { liftingForce } from '../../domains/mechanics/formulas.js';
import { GAS_CONSTANT } from '../../domains/thermal/evaporation.js';
import { idealGasDensity } from '../../domains/thermal/formulas.js';
import { SCALES } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { measured } from '../../scenarios/bench-kit.js';

/**
 * The lifting force of a balloon (grade 7, «дії виштовхувальної й піднімальної сили»): an empty balloon is weighed,
 * filled with a gas (helium, hydrogen, or air heated so hot) and its diameter measured; then it is tied to a weight on
 * a balance, which shows that much less — the lifting force. A balloon half as wide, and one blown up with plain air,
 * to compare. The pupil chooses the gas, the size and the shell (any values); the physics is the domain's: the gases'
 * densities by the ideal gas law from their molar masses (the catalogue), the lifting force by Archimedes'. The air
 * about is at 20 °C and the standard atmosphere.
 */

export type LiftGas = 'helium' | 'hydrogen' | 'hot-air' | 'air';
export type LiftCommand =
  | { readonly type: 'lab.balloon'; readonly step: 'shell'; readonly shell: number }
  | { readonly type: 'lab.balloon'; readonly step: 'size'; readonly diameter: number }
  | { readonly type: 'lab.balloon'; readonly step: 'lift'; readonly gas: LiftGas; readonly diameter: number; readonly shell: number; readonly hot: number };

/** The air about: 20 °C. */
const AIR_T = 293.15;
/** A tape measure round the balloon: its diameter to a millimetre (a centimetre beyond a metre). */
const tape = (d: number) => (d <= 1 ? 0.001 : 0.01);
/** The balance (0.01 g, 620 g) while it holds the weight's change; a tether's force gauge, read to three figures, beyond. */
const gaugeDivision = (F: number) => 10 ** (Math.floor(Math.log10(Math.max(1e-9, Math.abs(F)))) - 2);
const read = (x: number, d: number) => Math.round(x / d) * d;

/** The gas's density at its temperature: the ideal gas law, from the catalogue's molar mass. */
export const gasDensity = (gas: LiftGas, hotC: number): number => {
  const c = gas === 'helium' ? COMPONENTS.helium : gas === 'hydrogen' ? COMPONENTS.hydrogen : COMPONENTS.air;
  const T = gas === 'hot-air' ? hotC + 273.15 : AIR_T;
  return idealGasDensity(STANDARD_ATMOSPHERE.value, molarMassOfComponent(c)!, T, GAS_CONSTANT.value);
};
export const airDensity = (): number => gasDensity('air', 20);
export const ballVolume = (d: number): number => (Math.PI / 6) * d ** 3;

export const liftCommand: CommandHandler<LiftCommand> = {
  type: 'lab.balloon',
  apply(state, c) {
    const done = (...r: ReturnType<typeof measured>[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: r });
    if (c.step === 'shell') {
      if (!(c.shell > 0)) return err({ uk: 'Маса оболонки має бути більшою за нуль.', en: 'The shell’s mass must be more than zero.' });
      const bal = SCALES['lab-balance'].spec;
      // (A shell beyond the lab balance is weighed on scales read to three figures.)
      const d = c.shell <= bal.capacity.value ? bal.resolution.value : gaugeDivision(c.shell);
      return done(measured(c.shell <= bal.capacity.value ? 'lab-balance' : 'scales', 'mass', read(c.shell, d), c.shell, { division: d }));
    }
    if (!(c.diameter > 0)) return err({ uk: 'Діаметр кулі має бути більшим за нуль.', en: 'The balloon’s diameter must be more than zero.' });
    if (c.step === 'size') return done(measured('tape', 'length', read(c.diameter, tape(c.diameter)), c.diameter, { volume: ballVolume(c.diameter), division: tape(c.diameter) }));
    if (c.gas === 'hot-air' && !(c.hot > 20 && c.hot < 400)) return err({ uk: 'Гаряче повітря — тепліше за 20 °C і холодніше за 400 °C (оболонка не витримає).', en: 'Hot air: warmer than 20 °C, colder than 400 °C (the shell would not stand it).' });
    const V = ballVolume(c.diameter);
    const rhoAir = airDensity();
    const rhoGas = gasDensity(c.gas, c.hot);
    const F = liftingForce(rhoAir, rhoGas, G, V, c.shell);
    // A small force — the balance under the weight, read as a change of mass; a big one — the force gauge on the tether.
    const onBalance = Math.abs(F / G) <= SCALES['lab-balance'].spec.capacity.value;
    const division = onBalance ? SCALES['lab-balance'].spec.resolution.value * G : gaugeDivision(F);
    return done(measured(onBalance ? 'lab-balance' : 'force-gauge', 'force', read(F, division), F, { airDensity: rhoAir, gasDensity: rhoGas, volume: V, shell: c.shell, diameter: c.diameter, balance: onBalance ? 1 : 0, g: G, division }));
  },
};

const GAS_NAME: Record<LiftGas, LocalizedText> = {
  helium: { uk: 'гелієм', en: 'helium' },
  hydrogen: { uk: 'воднем', en: 'hydrogen' },
  'hot-air': { uk: 'гарячим повітрям', en: 'hot air' },
  air: { uk: 'повітрям із легенів', en: 'air from the lungs' },
};
const num = (x: number, uk: boolean) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 2 }).format(x);
export const sizeText = (m: number, uk: boolean): string => (m < 1 ? `${num(m * 100, uk)} ${uk ? 'см' : 'cm'}` : `${num(m, uk)} ${uk ? 'м' : 'm'}`);
export const massText = (kg: number, uk: boolean): string => (kg < 1 ? `${num(kg * 1000, uk)} ${uk ? 'г' : 'g'}` : kg < 1000 ? `${num(kg, uk)} ${uk ? 'кг' : 'kg'}` : `${num(kg / 1000, uk)} ${uk ? 'т' : 't'}`);

export const LIFT_TEXT: Record<LiftCommand['type'], (c: LiftCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.balloon': (x) => {
    const c = x as LiftCommand;
    if (c.step === 'shell')
      return {
        say: { uk: 'Зваж порожню кулю — оболонку з ниткою.', en: 'Weigh the empty balloon — the shell with its string.' },
        button: { uk: '⚖ Зважити оболонку', en: '⚖ Weigh the shell' },
        plan: { uk: 'зважити порожню оболонку', en: 'weigh the empty shell' },
      };
    if (c.step === 'size')
      return {
        say: { uk: 'Наповни кулю й виміряй її діаметр.', en: 'Fill the balloon and measure its diameter.' },
        button: { uk: '📏 Наповнити й виміряти', en: '📏 Fill and measure' },
        plan: { uk: 'наповнити кулю й виміряти діаметр', en: 'fill the balloon and measure its diameter' },
      };
    const gas = GAS_NAME[c.gas];
    const d = { uk: sizeText(c.diameter, true), en: sizeText(c.diameter, false) };
    return {
      say: { uk: `Куля з ${gas.uk}, ${d.uk} завширшки: прив’яжи її до тягарця на терезах. На скільки менше вони покажуть — і чи злетить вона сама?`, en: `A balloon of ${gas.en}, ${d.en} across: tie it to a weight on the balance. How much less will it show — and will it fly by itself?` },
      button: { uk: `🎈 ${gas.uk.replace(/^./, (s) => s.toUpperCase())}, ${d.uk}`, en: `🎈 ${gas.en.replace(/^./, (s) => s.toUpperCase())}, ${d.en}` },
      plan: { uk: `куля з ${gas.uk}, ${d.uk} — на терези`, en: `a balloon of ${gas.en}, ${d.en} — on the balance` },
    };
  },
};
