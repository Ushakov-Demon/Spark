import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { G } from '../../domains/mechanics/constants.js';
import { gravityForce } from '../../domains/mechanics/formulas.js';
import { SCALES } from '../../equipment/scales.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { forceDivision, measured } from '../../scenarios/bench-kit.js';
import { SUBSTANCES } from '../../substances/catalog.js';
import { blockOf, massText, MG_BLOCKS, type MgBody } from './shared.js';

/**
 * The force of gravity and mass (grade 7, Holovko, topic 2: «Дослідження … між масою і силою тяжіння»): bodies of any
 * mass hang in turn from a dynamometer on a stand, and it shows the force of gravity on each (a body at rest pulls
 * the spring with just that force): F/m comes out the same — g. «What if…» — a block of another substance of the
 * same mass: larger, the same force. The physics is the domain's (F = m·g, mechanics.gravity-force); the instrument
 * suits the force (bench-kit's `forceDivision`): the lab dynamometer from 0.5 to 5 N, a force gauge beyond.
 */

/** A body of this mass, kg, hung on the hook. */
export type MgCommand = { readonly type: 'lab.mg'; readonly mass: number; readonly body: MgBody };

const read = (x: number, d: number) => Math.round(x / d) * d;
/** The instrument that reads the force: the lab dynamometer within its range and division, a force gauge else. */
export const mgInstrument = (F: number): 'dynamometer' | 'force-gauge' => (forceDivision(F) === SCALES.dynamometer.spec.resolution.value ? 'dynamometer' : 'force-gauge');

export const mgCommand: CommandHandler<MgCommand> = {
  type: 'lab.mg',
  apply(state, c) {
    if (!(c.mass > 0 && Number.isFinite(c.mass))) return err(msg('mass-gravity-bad-mass'));
    if (c.body !== 'weights' && !MG_BLOCKS.includes(c.body)) return err(msg('mass-gravity-bad-body'));
    const F = gravityForce(c.mass, G);
    const division = forceDivision(F);
    // A block: its substance's density and so its volume (the drawing's size).
    const density = c.body === 'weights' ? 0 : SUBSTANCES[c.body].liquid.density.value;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured(mgInstrument(F), 'force', read(F, division), F, { mass: c.mass, g: G, division, density, volume: density ? c.mass / density : 0 })] });
  },
};

export const MG_COMMANDS = [mgCommand] as const;

export const MG_TEXT: Record<MgCommand['type'], (c: MgCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.mg': (x) => {
    const c = x as MgCommand;
    const args = { body: c.body === 'weights' ? 'weights' : 'block', block: c.body, of: (l: Locale) => (c.body === 'weights' ? '' : blockOf(c.body)[l].toLowerCase()), mass: (l: Locale) => massText(c.mass, l) };
    return { say: msg('mass-gravity-step-say', args), button: msg('mass-gravity-step-button', args), plan: msg('mass-gravity-step-plan', args) };
  },
};
