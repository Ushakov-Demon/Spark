import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { COMPONENTS } from '../../components/index.js';
import { cite, sv } from '../../components/sourced.js';
import { G, LAMINAR_REYNOLDS } from '../../domains/mechanics/constants.js';
import { laminarHeadLoss, outflowSpeed, pipeOutflowSpeed, reynolds, riseHeight } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * A model of a fountain (grade 7, «конструювання: моделі фонтана»): a plastic bottle with its bottom cut off hangs
 * neck down on a stand; from the neck a tube goes down, along the table and up to a glass nozzle pointing up over a
 * basin. Water is poured into the bottle and kept at one level; the bottle is set so that the level stands so high
 * above (or below) the nozzle, and the jet's top is read on a ruler. The physics is the domain's: the water's speed out
 * of the nozzle from the head less the tube's friction (Torricelli, Hagen–Poiseuille), the jet's height from its
 * speed (energy); the water's density and viscosity are the catalogue's. Here — only the fountain itself.
 */

/** The tube: a silicone tube 1 m long; its inner diameter. */
export const FOUNTAIN_TUBE_LENGTH = 1;
export const FOUNTAIN_TUBE: SourcedValue = sv(0.006, 'm', 'silicone tube, inside', 'estimate', 0.15, [cite('spark', 'estimate', 'a common silicone or aquarium tube is 6 mm wide inside', 0.006)], 'Estimate: a common size.');
/** The nozzle: a glass tube drawn out to a 2 mm tip. */
export const FOUNTAIN_NOZZLE = 0.002;
/** The ruler by the jet: a centimetre is what can be told of its trembling top. */
export const FOUNTAIN_RULER = 0.01;
/** How far the bottle goes on its stand: 10 cm under the nozzle to 50 cm over it. */
const LOW = -0.1;
const HIGH = 0.5;

export type FountainCommand = { readonly type: 'lab.fountain'; readonly head: number };

export const fountainCommand: CommandHandler<FountainCommand> = {
  type: 'lab.fountain',
  apply(state, c) {
    if (!(c.head >= LOW && c.head <= HIGH)) return err({ uk: 'Штатив дає поставити пляшку від 10 см нижче сопла до 50 см вище.', en: 'The stand holds the bottle from 10 cm below the nozzle to 50 cm above it.' });
    const water = COMPONENTS.water.phases.liquid!;
    const liquid = { density: water.density!.value, viscosity: water.viscosity!.value };
    const D = FOUNTAIN_TUBE.value;
    const v = pipeOutflowSpeed(c.head, G, { length: FOUNTAIN_TUBE_LENGTH, diameter: D }, FOUNTAIN_NOZZLE, liquid);
    // The same water through the wider tube, slower.
    const vTube = v * (FOUNTAIN_NOZZLE / D) ** 2;
    const re = reynolds(liquid.density, vTube, D, liquid.viscosity);
    if (re > LAMINAR_REYNOLDS.value) return err({ uk: 'Так швидко вода в трубці вже вирує — модель тут не працює.', en: 'So fast the water in the tube churns — the model does not hold here.' });
    const jet = v > 0 ? riseHeight(v, G) : 0;
    const record: MeasurementRecord = {
      kind: 'measurement',
      instrument: 'ruler',
      quantity: 'length',
      value: Math.round(jet / FOUNTAIN_RULER) * FOUNTAIN_RULER,
      exact: jet,
      entities: [],
      inputs: { head: c.head, speed: v, ideal: c.head > 0 ? outflowSpeed(G, c.head) : 0, loss: laminarHeadLoss(liquid.viscosity, FOUNTAIN_TUBE_LENGTH, vTube, liquid.density, G, D), reynolds: re, tube: vTube, g: G, division: FOUNTAIN_RULER },
    };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

const cm = (x: number) => Math.round(Math.abs(x) * 100);
export const FOUNTAIN_TEXT: Record<FountainCommand['type'], (c: FountainCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.fountain': (x) => {
    const c = x as FountainCommand;
    const below = c.head <= 0;
    const where = below ? { uk: `на ${cm(c.head)} см нижче сопла`, en: `${cm(c.head)} cm below the nozzle` } : { uk: `на ${cm(c.head)} см вище сопла`, en: `${cm(c.head)} cm above the nozzle` };
    return {
      say: { uk: `Постав пляшку так, щоб вода в ній стояла ${where.uk}, — і подивися на сопло.${below ? '' : ' На яку висоту б’є струмінь?'}`, en: `Set the bottle so that the water in it stands ${where.en} — and look at the nozzle.${below ? '' : ' How high does the jet go?'}` },
      button: { uk: `${below ? '⬇' : '⬆'} Вода в пляшці ${where.uk}`, en: `${below ? '⬇' : '⬆'} The water in the bottle ${where.en}` },
      plan: { uk: `вода в пляшці ${where.uk}`, en: `the water in the bottle ${where.en}` },
    };
  },
};
