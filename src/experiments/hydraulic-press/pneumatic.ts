import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { COMPONENTS } from '../../components/index.js';
import { cite, sv } from '../../components/sourced.js';
import { G, STANDARD_ATMOSPHERE } from '../../domains/mechanics/constants.js';
import { compressedVolume, isothermalVolume, pressure, weight } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { BENCH_WEIGHT, measured, ruler, RULER_DIVISION, SYRINGE_LARGE, SYRINGE_SMALL } from '../../scenarios/bench-kit.js';
import { PRESS_PUSH } from './bench.js';

/**
 * The hydraulic machine's «what if…»: the same two syringes and tube, with air in them instead of water (grade 7,
 * «конструювання: … пневматичного механізму»). Weights stand on the wide piston; the narrow one is pushed in as far as
 * with water, and the ruler reads how far it went before the load stirred, and how far the load rose. The physics is
 * the domain's: the pressure the load needs (p = F/S), the air squeezed to it (Boyle–Mariotte), water hardly at all
 * (its compressibility, from the catalogue) — so the same command with water gives the hydraulic machine's own travel.
 */

/** The air (or water) under the wide piston before the push; the narrow syringe holds as much as its push sends out. */
export const PNEUMATIC_WIDE = 10e-6;
/** The tube between them: 30 cm long, its inner diameter. */
export const PNEUMATIC_TUBE_LENGTH = 0.3;
export const PNEUMATIC_TUBE: SourcedValue = sv(0.003, 'm', 'PVC tube for syringes, inside', 'estimate', 0.2, [cite('spark', 'estimate', 'a tube that fits a syringe’s nozzle is about 3 mm wide inside', 0.003)], 'Estimate: it holds a little of the air, not more.');
/** How far the narrow piston is pushed in: as far as in the hydraulic machine's travel step. */
export const PNEUMATIC_PUSH = PRESS_PUSH;

export type PneumaticMedium = 'air' | 'water';
export type PneumaticCommand =
  | { readonly type: 'lab.pneumatic'; readonly step: 'diameters' }
  | { readonly type: 'lab.pneumatic'; readonly step: 'push'; readonly medium: PneumaticMedium; readonly weights: number };

const area = (d: number) => Math.PI * (d / 2) ** 2;
/** All the air (or water) shut in the machine. */
export const pneumaticVolume = (): number => area(SYRINGE_SMALL.value) * PNEUMATIC_PUSH + PNEUMATIC_WIDE + area(PNEUMATIC_TUBE.value) * PNEUMATIC_TUBE_LENGTH;

export const pneumaticCommand: CommandHandler<PneumaticCommand> = {
  type: 'lab.pneumatic',
  apply(state, c) {
    const d1 = SYRINGE_SMALL.value;
    const d2 = SYRINGE_LARGE.value;
    if (c.step === 'diameters') return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(d1), d1, { which: 1, division: RULER_DIVISION }), measured('ruler', 'length', ruler(d2), d2, { which: 2, division: RULER_DIVISION })] });
    if (!(Number.isInteger(c.weights) && c.weights >= 1 && c.weights <= 8)) return err({ uk: 'На поршень ставлять від 1 до 8 тягарців.', en: 'The piston takes 1 to 8 weights.' });
    const S1 = area(d1);
    const S2 = area(d2);
    // The load holds the wide piston down until the pressure inside grows by its weight over the piston's area.
    const F = weight(c.weights * BENCH_WEIGHT.value, G);
    const extra = pressure(F, S2);
    const V = pneumaticVolume();
    const p0 = STANDARD_ATMOSPHERE.value;
    const squeezed = c.medium === 'air' ? isothermalVolume(V, p0, p0 + extra) : compressedVolume(V, COMPONENTS.water.phases.liquid!.compressibility!.value, extra);
    const lost = V - squeezed;
    // The narrow piston first only squeezes what is inside; the rest of its push goes under the wide piston.
    const dead = Math.min(PNEUMATIC_PUSH, lost / S1);
    const rise = Math.max(0, S1 * PNEUMATIC_PUSH - lost) / S2;
    const inputs = { medium: c.medium === 'air' ? 0 : 1, weights: c.weights, load: F, extra, volume: V, squeezed: lost, push: PNEUMATIC_PUSH, division: RULER_DIVISION };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(dead), dead, { ...inputs, which: 4 }), measured('ruler', 'length', ruler(rise), rise, { ...inputs, which: 3 })] });
  },
};

const w = (n: number, uk: boolean) => (uk ? `${n} ${n === 1 ? 'тягарець' : n < 5 ? 'тягарці' : 'тягарців'}` : `${n} weight${n === 1 ? '' : 's'}`);
export const PNEUMATIC_TEXT: Record<PneumaticCommand['type'], (c: PneumaticCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.pneumatic': (x) => {
    const c = x as PneumaticCommand;
    if (c.step === 'diameters')
      return {
        say: { uk: 'Виміряй лінійкою діаметри обох поршнів — вузького й широкого шприца.', en: 'Measure the diameters of both pistons — of the narrow and the wide syringe — with the ruler.' },
        button: { uk: '📏 Виміряти діаметри поршнів', en: '📏 Measure the pistons' },
        plan: { uk: 'виміряти діаметри поршнів', en: 'measure the pistons’ diameters' },
      };
    const water = c.medium === 'water';
    return {
      say: water
        ? { uk: `Спершу заповнимо шприци й трубку водою. Постав на широкий поршень ${w(c.weights, true)} і втисни вузький на 6 см. Коли рушив вантаж і на скільки піднявся?`, en: `First fill the syringes and the tube with water. Put ${w(c.weights, false)} on the wide piston and push the narrow one 6 cm in. When did the load move, and how far did it rise?` }
        : { uk: `У шприцах і трубці — повітря. ${w(c.weights, true)} на широкому поршні; втисни вузький на ті самі 6 см. Коли рушив вантаж і на скільки піднявся?`, en: `Air in the syringes and the tube. ${w(c.weights, false)} on the wide piston; push the narrow one the same 6 cm in. When did the load move, and how far did it rise?` },
      button: water ? { uk: `💧 Вода, ${w(c.weights, true)}: втиснути на 6 см`, en: `💧 Water, ${w(c.weights, false)}: push 6 cm in` } : { uk: `💨 Повітря, ${w(c.weights, true)}: втиснути на 6 см`, en: `💨 Air, ${w(c.weights, false)}: push 6 cm in` },
      plan: water ? { uk: `вода, ${w(c.weights, true)} — втиснути вузький поршень на 6 см`, en: `water, ${w(c.weights, false)} — push the narrow piston 6 cm in` } : { uk: `повітря, ${w(c.weights, true)} — втиснути вузький поршень на 6 см`, en: `air, ${w(c.weights, false)} — push the narrow piston 6 cm in` },
    };
  },
};
