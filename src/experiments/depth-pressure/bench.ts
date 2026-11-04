import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { G } from '../../domains/mechanics/constants.js';
import { hydrostaticPressure } from '../../domains/mechanics/formulas.js';
import { msg } from '../../knowledge/messages.js';
import { SUBSTANCES } from '../../substances/catalog.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { sampleOf } from '../../scenarios/thermal-lab.js';

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
      return err(msg('depth-pressure-command-apply'));
    }
    const sub = SUBSTANCES[(sample.params.substance ?? 'water') as keyof typeof SUBSTANCES];
    const rho = sub?.liquid.density.value ?? 1000;
    // (The experiment chooses depths within its liquid; here only that the funnel is in it at all.)
    if (!(c.depth > 0 && c.depth <= 0.3)) return err(msg('depth-pressure-command-apply-2'));
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
          say: msg('depth-pressure-labdepth-say', { depth: String(cm(c.depth)) }),
          button: msg('depth-pressure-labdepth-button', { depth: String(cm(c.depth)) }),
          plan: msg('depth-pressure-labdepth-plan', { depth: String(cm(c.depth)) }),
        }
      : {
          say: msg('depth-pressure-labdepth-say-2', { depth: String(cm(c.depth)) }),
          button: msg('depth-pressure-labdepth-button-2', { depth: String(cm(c.depth)) }),
          plan: msg('depth-pressure-labdepth-plan-2', { depth: String(cm(c.depth)) }),
        };
  },
};
