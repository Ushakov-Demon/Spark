import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { COMPONENTS } from '../components/index.js';
import { G } from '../domains/mechanics/constants.js';
import { terminalVelocity } from '../domains/mechanics/settling.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { STOPWATCH_DIVISION } from './motion-bench.js';

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

export const sinkCommand: CommandHandler<SinkCommand> = {
  type: 'lab.sink',
  apply(state, c) {
    if (!(c.diameter > 0 && c.diameter <= 0.01)) return err({ uk: 'Тіло має бути до 1 см завбільшки.', en: 'The body has to be under 1 cm across.' });
    if (!c.marks.length || c.marks.some((m) => !(m > 0 && m <= 0.3))) return err({ uk: 'Позначки — до 30 см від нульової.', en: 'The marks are up to 30 cm from the zero one.' });
    const liquid = liquidOf(c.liquid);
    const steel = COMPONENTS.steel.phases.solid!.density!.value;
    const vessel = c.body === 'bubble' ? SINK_VESSELS.bottle.value : SINK_VESSELS.cylinder.value;
    const { speed, reynolds } = terminalVelocity({ diameter: c.diameter, bodyDensity: c.body === 'bubble' ? AIR : steel, density: liquid.density, viscosity: liquid.viscosity, g: G, vessel });
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

const LIQUID: Record<SinkLiquid, { uk: string; en: string; in: { uk: string; en: string } }> = {
  'washing-up': { uk: 'рідина для миття посуду', en: 'washing-up liquid', in: { uk: 'у рідині для миття посуду', en: 'in washing-up liquid' } },
  glycerol: { uk: 'гліцерин', en: 'glycerol', in: { uk: 'у гліцерині', en: 'in glycerol' } },
  'sunflower-oil': { uk: 'соняшникова олія', en: 'sunflower oil', in: { uk: 'в олії', en: 'in oil' } },
  water: { uk: 'вода', en: 'water', in: { uk: 'у воді', en: 'in water' } },
};
export const sinkLiquidName = (l: SinkLiquid) => LIQUID[l];
const mm = (d: number) => Math.round(d * 1000 * 10) / 10;
const cmList = (marks: readonly number[], uk: boolean) => marks.map((m) => Math.round(m * 100)).join(uk ? ', ' : ', ') + (uk ? ' см' : ' cm');

export const SINK_TEXT: Record<SinkCommand['type'], (c: SinkCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.sink': (x) => {
    const c = x as SinkCommand;
    const L = LIQUID[c.liquid];
    if (c.body === 'bubble')
      return {
        say: { uk: `Переверни пляшку й стеж за бульбашкою завбільшки ≈ ${mm(c.diameter)} мм. Запусти секундомір, коли вона мине нульову позначку, і засікай час на позначках ${cmList(c.marks, true)}.`, en: `Turn the bottle over and watch a bubble ≈ ${mm(c.diameter)} mm across. Start the stopwatch as it passes the zero mark and note the time at the marks ${cmList(c.marks, false)}.` },
        button: { uk: `🫧 Бульбашка ≈ ${mm(c.diameter)} мм: засікти час`, en: `🫧 A ≈ ${mm(c.diameter)} mm bubble: time it` },
        plan: { uk: `засікти бульбашку ≈ ${mm(c.diameter)} мм на позначках`, en: `time a ≈ ${mm(c.diameter)} mm bubble at the marks` },
      };
    return {
      say: { uk: `Опусти сталеву кульку ${L.in.uk}. Запусти секундомір, коли вона мине нульову позначку, і засікай час на позначках ${cmList(c.marks, true)}.`, en: `Drop the steel ball ${L.in.en}. Start the stopwatch as it passes the zero mark and note the time at the marks ${cmList(c.marks, false)}.` },
      button: { uk: `⚪ Кулька ${L.in.uk}: засікти час`, en: `⚪ The ball ${L.in.en}: time it` },
      plan: { uk: `засікти кульку ${L.in.uk}`, en: `time the ball ${L.in.en}` },
    };
  },
};
