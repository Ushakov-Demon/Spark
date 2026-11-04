import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { COMPONENTS } from '../../components/index.js';
import { G } from '../../domains/mechanics/constants.js';
import { terminalVelocity } from '../../domains/mechanics/settling.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { STOPWATCH_DIVISION } from '../motion-lab-works/bench.js';

/**
 * A body moving steadily through a liquid (grade 7): an air bubble rising in a bottle of thick washing-up liquid
 * turned upside down (the textbook's investigation in «Рівномірний рух»), a steel ball sinking in a tall cylinder of
 * glycerol, oil or water («швидкість руху кульки у рідинах різної густини»). The stopwatch is started as the body
 * passes the zero mark (it has its steady speed by then) and read at each mark after: t = s / v, v from the balance of
 * weight, buoyancy and drag (domains/mechanics/settling.ts).
 */

/** Thick washing-up liquid: its makes differ; both values are estimates. */
export const WASHING_UP: { readonly density: SourcedValue; readonly viscosity: SourcedValue } = {
  density: sv(1030, 'kg/m³', 'washing-up liquid', 'estimate', 0.02, [cite('spark', 'estimate', 'water with some 10–30 % of surfactants', 1030)], 'Estimate.'),
  viscosity: sv(1, 'Pa·s', 'a thick washing-up liquid, room temperature', 'estimate', 1, [cite('spark', 'estimate', 'thick ones pour like syrup: of the order of a pascal-second', 1)], 'Estimate: makes differ several times; the bubbles still rise steadily, only faster or slower.'),
};
/** The vessels: a 0.5 L bottle (6 cm across inside); a 250 mL measuring cylinder (3.8 cm). */
export const SINK_VESSELS = {
  bottle: sv(0.06, 'm', 'a 0.5 L bottle, inside', 'estimate', 0.15, [cite('spark', 'estimate', 'half-litre bottles are 6–7 cm across', 0.06)], 'Estimate.'),
  cylinder: sv(0.038, 'm', 'a 250 mL measuring cylinder, inside', 'estimate', 0.1, [cite('spark', 'estimate', '250 mL cylinders are 3.5–4 cm across inside', 0.038)], 'Estimate.'),
} as const;
/** A steel ball from a bearing. */
export const SINK_BALL: SourcedValue = sv(0.0015, 'm', 'a bearing ball', 'estimate', 0, [cite('spark', 'estimate', 'small bearing balls are 1–3 mm', 0.0015)], 'Estimate.');
const AIR = 1.2;

export type SinkLiquid = 'washing-up' | 'glycerol' | 'sunflower-oil' | 'water';

/** Let the body go (a bubble of so many metres across; the ball) in the liquid; time it at each mark below (above) the zero one. */
export interface SinkCommand {
  readonly type: 'lab.sink';
  readonly body: 'bubble' | 'ball';
  readonly diameter: number;
  readonly liquid: SinkLiquid;
  /** The marks, m from the zero one. */
  readonly marks: readonly number[];
}

export function liquidOf(l: SinkLiquid): { density: number; viscosity: number } {
  if (l === 'washing-up') return { density: WASHING_UP.density.value, viscosity: WASHING_UP.viscosity.value };
  const liquid = COMPONENTS[l].phases.liquid!;
  return { density: liquid.density!.value, viscosity: liquid.viscosity!.value };
}

/** The body's steady speed in the liquid (the bubble in the bottle, the ball in the cylinder), m/s, and its Reynolds number. */
export function sinkSpeed(body: 'bubble' | 'ball', diameter: number, l: SinkLiquid): { speed: number; reynolds: number } {
  const liquid = liquidOf(l);
  const steel = COMPONENTS.steel.phases.solid!.density!.value;
  const vessel = body === 'bubble' ? SINK_VESSELS.bottle.value : SINK_VESSELS.cylinder.value;
  return terminalVelocity({ diameter, bodyDensity: body === 'bubble' ? AIR : steel, density: liquid.density, viscosity: liquid.viscosity, g: G, vessel });
}

export const sinkCommand: CommandHandler<SinkCommand> = {
  type: 'lab.sink',
  apply(state, c) {
    if (!(c.diameter > 0 && c.diameter <= 0.01)) return err(msg('bodies-in-liquids-sink-command-apply'));
    if (!c.marks.length || c.marks.some((m) => !(m > 0 && m <= 0.3))) return err(msg('bodies-in-liquids-sink-command-apply-2'));
    const liquid = liquidOf(c.liquid);
    const { speed, reynolds } = sinkSpeed(c.body, c.diameter, c.liquid);
    const div = STOPWATCH_DIVISION.value;
    const ruler: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(c.diameter * 1000) / 1000, exact: c.diameter, entities: [], inputs: { which: 0, division: 0.001 } };
    const laps: MeasurementRecord[] = c.marks.map((m) => {
      const t = m / speed;
      return { kind: 'measurement', instrument: 'stopwatch', quantity: 'time', value: Math.round(t / div) * div, exact: t, entities: [], inputs: { mark: m, speed, reynolds, division: div, density: liquid.density, viscosity: liquid.viscosity } };
    });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: c.body === 'bubble' ? [ruler, ...laps] : laps });
  },
};

export const SINK_COMMANDS = [sinkCommand] as const;

/** A liquid's name, and with «у» (in it). */
const LIQUID: Record<SinkLiquid, LocalizedText & { readonly in: LocalizedText }> = Object.fromEntries(
  (['washing-up', 'glycerol', 'sunflower-oil', 'water'] as const).map((id) => [id, Object.assign(msg(`bodies-in-liquids-name-${id}`), { in: msg(`bodies-in-liquids-liquid-${id}`) })]),
) as Record<SinkLiquid, LocalizedText & { readonly in: LocalizedText }>;
export const sinkLiquidName = (l: SinkLiquid) => LIQUID[l];
const mm = (d: number) => Math.round(d * 1000 * 10) / 10;
const cmList = (marks: readonly number[], l: Locale) => marks.map((m) => Math.round(m * 100)).join(', ') + tl(l, 'bodies-in-liquids-cm-list');

export const SINK_TEXT: Record<SinkCommand['type'], (c: SinkCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.sink': (x) => {
    const c = x as SinkCommand;
    const L = LIQUID[c.liquid];
    if (c.body === 'bubble')
      return {
        say: msg('bodies-in-liquids-labsink-say', { diameter: String(mm(c.diameter)), marks: (l: Locale) => cmList(c.marks, l) }),
        button: msg('bodies-in-liquids-labsink-button', { diameter: String(mm(c.diameter)) }),
        plan: msg('bodies-in-liquids-labsink-plan', { diameter: String(mm(c.diameter)) }),
      };
    return {
      say: msg('bodies-in-liquids-labsink-say-2', { in: (l: Locale) => L.in[l], marks: (l: Locale) => cmList(c.marks, l) }),
      button: msg('bodies-in-liquids-labsink-button-2', { in: (l: Locale) => L.in[l] }),
      plan: msg('bodies-in-liquids-labsink-plan-2', { in: (l: Locale) => L.in[l] }),
    };
  },
};
