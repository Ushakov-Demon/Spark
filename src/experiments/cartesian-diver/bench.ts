import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { COMPONENTS } from '../../components/index.js';
import { cite, sv } from '../../components/sourced.js';
import { G, STANDARD_ATMOSPHERE } from '../../domains/mechanics/constants.js';
import { density, hydrostaticPressure, isothermalVolume } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * The Cartesian diver — a model of a submarine and of a fish (grade 7, «моделювання занурення і спливання підводного
 * човна, риб»): a glass dropper with its rubber cap, part air, part water, floats in a full plastic bottle, its cap
 * screwed on. Squeezed, the bottle passes the pressure to all the water (Pascal's law) and into the dropper: the air
 * there shrinks (p·V = const, slowly — at the water's temperature), water comes in, and the diver's mean density —
 * its glass, rubber and air over the room they take — grows. Above the water's, it sinks; let go, it comes up.
 * The diver is weighed, its volume with the air taken in a measuring cylinder (pushed under on a thin wire), and the
 * water coming in is read by the meniscus climbing the dropper's glass tube against a ruler.
 */

/** The dropper's glass tube and its rubber cap. */
export const DIVER_GLASS: SourcedValue = sv(0.0018, 'kg', 'glass dropper tube, about 7 cm', 'estimate', 0.2, [cite('spark', 'estimate', 'a medical dropper’s glass tube weighs about 1.5–2 g', 0.0018)], 'Estimate: the balance weighs it all the same.');
export const DIVER_CAP: SourcedValue = sv(0.0014, 'kg', 'rubber cap of a medical dropper', 'estimate', 0.3, [cite('spark', 'estimate', 'a dropper’s rubber cap weighs about 1–1.5 g', 0.0014)], 'Estimate: the balance weighs it all the same.');
/** The inner diameter of the dropper's glass tube: the water coming in climbs it. */
export const DIVER_TUBE: SourcedValue = sv(0.004, 'm', 'dropper tube, inside', 'estimate', 0.2, [cite('spark', 'estimate', 'a medical dropper’s tube is about 4 mm wide inside', 0.004)], 'Estimate.');
/** How deep the water in the 1.5 L bottle is, to the bottom. */
export const BOTTLE_DEPTH: SourcedValue = sv(0.25, 'm', '1.5 L PET bottle, water to the shoulder', 'estimate', 0.15, [cite('spark', 'estimate', 'a 1.5 L bottle is about 30 cm tall', 0.25)], 'Estimate.');
/** The air is let in until the diver just floats, its top out: 8 % more air than would hold it inside the water. */
export const DIVER_SPARE = 1.08;
/** A 10 mL measuring cylinder: its division, and the water in it before the diver goes in. */
export const DIVER_CYLINDER = 0.1e-6;
const CYLINDER_WATER = 5e-6;
const RULER = 0.001;
/** A hand squeezing a full bottle: up to a few tens of kilopascals (≈ 100 N over ≈ 50 cm²). */
const MAX_PRESS = 30_000;

// The materials' properties come from the catalogue, the laws from the mechanics domain: here — only the diver itself.
const water = () => COMPONENTS.water.phases.liquid!.density!.value;
const P0 = () => STANDARD_ATMOSPHERE.value;
export const diverMass = (): number => DIVER_GLASS.value + DIVER_CAP.value;
/** The glass and the rubber: what is left of the diver without its air (each part's mass over its material's density). */
export const diverSolid = (): number => DIVER_GLASS.value / COMPONENTS.glass.phases.solid!.density!.value + DIVER_CAP.value / COMPONENTS.rubber.phases.solid!.density!.value;
/** The air in the dropper as tuned, at the surface. */
export const diverAir = (): number => DIVER_SPARE * (diverMass() / water() - diverSolid());
/** The air under so much more pressure than at the surface (squeezed, or at a depth): Boyle–Mariotte. */
export const airUnder = (extra: number): number => isothermalVolume(diverAir(), P0(), P0() + extra);
/** The diver's mean density: its mass over its glass, rubber and air. */
export const diverDensity = (extra: number): number => density(diverMass(), diverSolid() + airUnder(extra));
const tubeArea = () => Math.PI * (DIVER_TUBE.value / 2) ** 2;

/**
 * What the step does: weigh the diver; take its volume in the cylinder; squeeze the bottle with so many pascals
 * more; or let it go (`press` — the squeeze let go: if it sank the diver, it is let go at the bottom).
 */
export type DiverCommand =
  | { readonly type: 'lab.diver'; readonly step: 'weigh' }
  | { readonly type: 'lab.diver'; readonly step: 'volume' }
  | { readonly type: 'lab.diver'; readonly step: 'squeeze'; readonly press: number }
  | { readonly type: 'lab.diver'; readonly step: 'release'; readonly press: number };

export const diverCommand: CommandHandler<DiverCommand> = {
  type: 'lab.diver',
  apply(state, c) {
    const done = (r: MeasurementRecord) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: [r] });
    if (c.step === 'weigh') {
      const m = diverMass();
      return done({ kind: 'measurement', instrument: 'lab-balance', quantity: 'mass', value: scaleReading(SCALES['lab-balance'], m), exact: m, entities: [] });
    }
    if (c.step === 'volume') {
      // The cylinder is read before and after, each to its division; the diver's volume is the difference.
      const V = diverSolid() + diverAir();
      const read = (x: number) => Math.round(x / DIVER_CYLINDER) * DIVER_CYLINDER;
      const after = read(CYLINDER_WATER + V);
      return done({ kind: 'measurement', instrument: 'cylinder', quantity: 'volume', value: after - CYLINDER_WATER, exact: V, entities: [], inputs: { before: CYLINDER_WATER, after, division: DIVER_CYLINDER } });
    }
    if (!(c.press > 0 && c.press <= MAX_PRESS)) return err({ uk: 'Рукою пляшку стискають до кількох десятків кілопаскалів.', en: 'A hand squeezes a bottle up to a few tens of kilopascals.' });
    // Squeezed at the surface; let go — where the squeeze left it: at the bottom, the water above it still presses.
    const sankFirst = diverDensity(c.press) > water();
    const depth = c.step === 'release' && sankFirst ? BOTTLE_DEPTH.value : 0;
    const extra = c.step === 'squeeze' ? c.press : hydrostaticPressure(water(), G, depth);
    const rise = (diverAir() - airUnder(extra)) / tubeArea();
    const sinks = diverDensity(extra) > water() ? 1 : 0;
    return done({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(rise / RULER) * RULER, exact: rise, entities: [], inputs: { press: c.step === 'squeeze' ? c.press : 0, extra, depth, sinks, tube: DIVER_TUBE.value, water: water(), division: RULER } });
  },
};

export const DIVER_COMMANDS = [diverCommand] as const;

/** A squeeze up to 8 kPa is a light one. */
export const lightSqueeze = (press: number): boolean => press < 8000;

export const DIVER_TEXT: Record<DiverCommand['type'], (c: DiverCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.diver': (x) => {
    const c = x as DiverCommand;
    if (c.step === 'weigh')
      return {
        say: { uk: 'Зваж водолаза — піпетку з гумовим ковпачком — на лабораторних терезах.', en: 'Weigh the diver — the dropper with its rubber cap — on the laboratory balance.' },
        button: { uk: '⚖ Зважити водолаза', en: '⚖ Weigh the diver' },
        plan: { uk: 'зважити водолаза', en: 'weigh the diver' },
      };
    if (c.step === 'volume')
      return {
        say: { uk: 'Набери в піпетку трохи води, щоб водолаз ледь плавав, і втопи його тонким дротиком у мензурці: на скільки піднялася вода?', en: 'Let a little water into the dropper so that the diver just floats, and push it under on a thin wire in the measuring cylinder: how far did the water rise?' },
        button: { uk: '🧪 Об’єм водолаза в мензурці', en: '🧪 The diver’s volume in the cylinder' },
        plan: { uk: 'виміряти об’єм водолаза мензуркою', en: 'take the diver’s volume with the cylinder' },
      };
    if (c.step === 'squeeze') {
      const light = lightSqueeze(c.press);
      return {
        say: light ? { uk: 'Водолаз плаває в повній пляшці, кришку закручено. Злегка стисни пляшку — і стеж за водою в трубці піпетки.', en: 'The diver floats in the full bottle, its cap screwed on. Squeeze the bottle lightly — and watch the water in the dropper’s tube.' } : { uk: 'А тепер стисни пляшку сильно — і стеж за водолазом і за водою в трубці.', en: 'Now squeeze the bottle hard — and watch the diver and the water in the tube.' },
        button: light ? { uk: '✊ Злегка стиснути пляшку', en: '✊ Squeeze the bottle lightly' } : { uk: '✊ Сильно стиснути пляшку', en: '✊ Squeeze the bottle hard' },
        plan: light ? { uk: 'злегка стиснути пляшку', en: 'squeeze the bottle lightly' } : { uk: 'сильно стиснути пляшку', en: 'squeeze the bottle hard' },
      };
    }
    return {
      say: { uk: 'Відпусти пляшку. Що буде з водолазом?', en: 'Let the bottle go. What happens to the diver?' },
      button: { uk: '🖐 Відпустити пляшку', en: '🖐 Let the bottle go' },
      plan: { uk: 'відпустити пляшку', en: 'let the bottle go' },
    };
  },
};
