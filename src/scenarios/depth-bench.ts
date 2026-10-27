import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { G } from '../domains/mechanics/constants.js';
import { hydrostaticPressure } from '../domains/mechanics/formulas.js';
import { SUBSTANCES } from '../substances/catalog.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import { sampleOf } from './thermal-lab.js';

/**
 * The pressure in a liquid and its depth (grade 7, «Тиск рідин і газів»): a funnel with a rubber film on a tube
 * is lowered into the liquid; the tube leads to a U-shaped manometer with water. The liquid presses on the film
 * with p = ρ·g·h (h — the depth of the film); the water in the manometer moves until its levels differ by
 * Δh = p / (ρ_water·g). The film turned sideways at the same depth: the same pressure (Pascal's law).
 */

/** The manometer's scale: millimetre marks. */
export const MANOMETER_DIVISION = 0.001;

/** Lower the funnel so deep (m) into the liquid, its film down, or turned sideways; read the manometer. */
export interface DepthCommand {
  readonly type: 'lab.depth';
  readonly depth: number;
  readonly sideways?: boolean;
}

export const depthCommand: CommandHandler<DepthCommand> = {
  type: 'lab.depth',
  apply(state, c) {
    let sample;
    try {
      sample = sampleOf(state);
    } catch {
      return err({ uk: 'Посудини з рідиною немає.', en: 'There is no vessel of liquid.' });
    }
    const sub = SUBSTANCES[(sample.params.substance ?? 'water') as keyof typeof SUBSTANCES];
    const rho = sub?.liquid.density.value ?? 1000;
    // (The experiment chooses depths within its liquid; here only that the funnel is in it at all.)
    if (!(c.depth > 0 && c.depth <= 0.3)) return err({ uk: 'Воронку опускають у рідину, не глибше за дно.', en: 'The funnel goes into the liquid, no deeper than the bottom.' });
    const p = hydrostaticPressure(rho, G, c.depth);
    const rhoM = SUBSTANCES.water.liquid.density.value;
    const dh = p / (rhoM * G);
    const shown = Math.round(dh / MANOMETER_DIVISION) * MANOMETER_DIVISION;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'manometer', quantity: 'length', value: shown, exact: dh, entities: [], inputs: { depth: c.depth, rhoLiquid: rho, rhoManometer: rhoM, g: G, pressure: p, sideways: c.sideways ? 1 : 0, division: MANOMETER_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const DEPTH_COMMANDS = [depthCommand] as const;

const cm = (m: number) => Math.round(m * 100);
export const DEPTH_TEXT: Record<DepthCommand['type'], (c: DepthCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.depth': (x) => {
    const c = x as DepthCommand;
    return c.sideways
      ? {
          say: { uk: `Не змінюючи глибини (${cm(c.depth)} см), поверни воронку плівкою вбік. Що покаже манометр?`, en: `Keeping the depth (${cm(c.depth)} cm), turn the funnel with its film sideways. What will the manometer show?` },
          button: { uk: `↪ ${cm(c.depth)} см, плівкою вбік`, en: `↪ ${cm(c.depth)} cm, film sideways` },
          plan: { uk: `повернути воронку вбік на ${cm(c.depth)} см`, en: `turn the funnel sideways at ${cm(c.depth)} cm` },
        }
      : {
          say: { uk: `Опусти воронку плівкою донизу на глибину ${cm(c.depth)} см. На скільки різняться рівні води в манометрі?`, en: `Lower the funnel, film down, to a depth of ${cm(c.depth)} cm. How far apart are the water levels in the manometer?` },
          button: { uk: `⬇ На глибину ${cm(c.depth)} см`, en: `⬇ To a depth of ${cm(c.depth)} cm` },
          plan: { uk: `опустити воронку на ${cm(c.depth)} см`, en: `lower the funnel to ${cm(c.depth)} cm` },
        };
  },
};
