import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { slidingFriction, weight } from '../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { weigh } from './weighing.js';
import { MOTION_COMMANDS, MOTION_SETUP, MOTION_TEXT, type MotionCommand } from './motion-bench.js';
import { ELECTRODE_COMMANDS, ELECTRODE_TEXT, type CathodeCommand } from './electrode-bench.js';
import { LEVER_COMMANDS, LEVER_TEXT, type LeverCommand, type SlopeCommand } from './lever-bench.js';
import { CIRCUIT_COMMANDS, CIRCUIT_TEXT, type CircuitCommand, type PairCommand } from './circuit-bench.js';
import { COIL_COMMANDS, COIL_TEXT, type OhmCommand } from './coil-bench.js';
import { BOX_COMMANDS, BOX_TEXT, type BoxCommand } from './box-bench.js';
import { DEPTH_COMMANDS, DEPTH_TEXT, type DepthCommand } from './depth-bench.js';
import { UTUBE_COMMANDS, UTUBE_TEXT, type UtubeCommand } from './utube-bench.js';
import { PRESS_COMMANDS, PRESS_TEXT, type PressCommand } from './press-bench.js';
import { ATM_COMMANDS, ATM_TEXT, type AtmCommand } from './atm-bench.js';
import { VESSEL_COMMANDS, VESSEL_TEXT, type VesselCommand } from './vessels-bench.js';
import { MAGNET_COMMANDS, MAGNET_TEXT, type MagnetCommand } from './magnet-bench.js';
import { INDUCT_COMMANDS, INDUCT_TEXT, type InductCommand } from './induct-bench.js';
import { SINK_COMMANDS, SINK_TEXT, type SinkCommand } from './sink-bench.js';
import { FORCES_COMMANDS, FORCES_TEXT, type ForcesCommand } from './forces-bench.js';
import { ROWS_COMMANDS, ROWS_TEXT, type RowsCommand } from './rows-bench.js';
import { LIFT_COMMANDS, LIFT_TEXT, type LiftCommand } from './lift-bench.js';
import { BOUNCE_COMMANDS, BOUNCE_TEXT, type BounceCommand } from './bounce-bench.js';
import { CARRY_COMMANDS, CARRY_TEXT, type CarryCommand } from './carry-bench.js';
import { WINCH_COMMANDS, WINCH_TEXT, type WinchCommand } from './winch-bench.js';
import { WIND_COMMANDS, WIND_TEXT, type WindCommand } from './wind-bench.js';
import { STROBE_COMMANDS, STROBE_TEXT, type StrobeCommand } from './strobe-bench.js';
import { SNAIL_COMMANDS, SNAIL_TEXT, type SnailCommand } from './snail-bench.js';
import { COIN_COMMANDS, COIN_TEXT, type CoinCommand } from './coin-bench.js';
import { TOUCH_COMMANDS, TOUCH_TEXT, type TouchCommand } from './touch-bench.js';
import { CARTS_COMMANDS, CARTS_TEXT, type CartsCommand } from './carts-bench.js';
import { DRAG_COMMANDS, DRAG_TEXT, type DragCommand } from './drag-bench.js';
import { TOWER_COMMANDS, TOWER_TEXT, type TowerCommand } from './tower-bench.js';
import { GNOMON_COMMANDS, GNOMON_TEXT, type GnomonCommand } from './gnomon-bench.js';
import { AIR_COMMANDS, AIR_TEXT, type AirCommand } from './air-bench.js';
import { PLANETS_COMMANDS, PLANETS_TEXT, type PlanetsCommand } from './planets-bench.js';
import { EXPERIMENTS, type ExperimentCommand, type ExperimentKind } from '../experiments/index.js';
import { SCALES_COMMANDS, SCALES_TEXT, type ScalesCommand } from './scales-bench.js';
import { DYNO_COMMANDS, DYNO_TEXT, type DynoCommand } from './dyno-bench.js';
import { RUBBER_COMMANDS, RUBBER_TEXT, type RubberCommand } from './rubber-bench.js';
import { GRAVI_COMMANDS, GRAVI_TEXT, type GraviCommand } from './gravi-bench.js';

/**
 * The mechanics bench of grade 7, beside the vessel: a spring on a stand with slotted weights and a ruler
 * (Hooke's law), a wooden block pulled along a wooden board by a dynamometer (sliding friction), and the
 * same block measured with a ruler (its faces — the pressure it puts on its support). Everything the
 * instruments show is rounded to their divisions, as on the real ones.
 */

/** The spring of the 3B set (Hooke's law) that suits 100 g weights: 25 N/m, ≈ 4 cm per weight. */
export const BENCH_SPRING_K: SourcedValue = sv(25, 'N/m', 'the stiffest spring of the set', 'single-source', 0.01, [cite('3b-helical-springs', 'Set of Helical Springs for Hooke’s Law 1003376: 2.5, 5, 10, 15, 25 N/m', 'new spring', 25)], 'The listing gives nominal constants; a real spring may differ by a few per cent.');
/** The springs of the set, N/m (nominal): one is chosen for the lab work. */
export const SPRING_SET: readonly number[] = [2.5, 5, 10, 15, 25];
/** Its length unloaded, m: the spring of this lab (the listing gives no lengths). */
export const BENCH_SPRING_L0 = 0.08;
/** One slotted weight, kg: as in the lab work (four of 100 g). */
export const BENCH_WEIGHT: SourcedValue = sv(0.1, 'kg', 'one slotted weight', 'single-source', 0.01, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 6, обладнання: 4 тягарці масою 100 г кожен', '—', 0.1)]);
/** Wood sliding on wood. */
export const WOOD_ON_WOOD: SourcedValue = sv(0.25, '', 'dry wood on dry wood, sliding', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', '§ 26, таблиця «Значення коефіцієнтів тертя ковзання»: дерево по дереву 0,25', '—', 0.25)], 'Tables give mean values: Wikipedia lists 0.25–0.62 for wood on wood (static) — it depends on the wood and how smooth it is.');
/** Paper on wood: the block slid on a sheet of paper laid on the board (the same pair of materials). */
export const PAPER_ON_WOOD: SourcedValue = sv(0.4, '', 'paper on wood, sliding', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', '§ 26, таблиця «Значення коефіцієнтів тертя ковзання»: папір по дереву 0,40', '—', 0.4)], 'A table’s mean value for the pair of materials.');
/** The pine block of the lab works: its edges, m (a block of the lab; its mass follows from the wood's density). */
export const BENCH_BLOCK = { substance: 'wood', edges: [0.12, 0.06, 0.04] as const };
export const blockMass = (): number => BENCH_BLOCK.edges[0] * BENCH_BLOCK.edges[1] * BENCH_BLOCK.edges[2] * SUBSTANCES.wood.liquid.density.value;
/** A pupil's ruler: millimetre divisions. */
export const RULER_DIVISION = 0.001;
const ruler = (x: number) => Math.round(x / RULER_DIVISION) * RULER_DIVISION;

/** Hang so many 100 g weights on the spring and read its length by the ruler. */
export interface StretchCommand {
  readonly type: 'lab.stretch';
  readonly weights: number;
  /** Which spring of the set, N/m (default: the stiffest). */
  readonly stiffness?: number;
}
/** Pull the block along the board at a steady speed with so many weights on it; read the dynamometer. */
export interface PullCommand {
  readonly type: 'lab.pull';
  readonly weights: number;
  /** The face the block lies on: the widest (default) or the narrower side face. */
  readonly face?: 'wide' | 'narrow';
  /** What it slides on: the bare board (default) or a sheet of paper laid on it. */
  readonly surface?: 'wood' | 'paper';
}
/** Measure one edge of the block with the ruler (0 — length, 1 — width, 2 — height). */
export interface EdgeCommand {
  readonly type: 'lab.edge';
  readonly edge: 0 | 1 | 2;
}
/** Weigh on the lever balance: a body, the vessel with what is in it, or the empty vessel (before it was filled). */
export interface BalanceCommand {
  readonly type: 'lab.balance';
  readonly what: 'body' | 'vessel' | 'vessel-empty';
  readonly substance?: SubstanceId;
  readonly mass?: number;
  readonly label?: LocalizedText;
}
export type BenchCommand = StretchCommand | PullCommand | EdgeCommand | BalanceCommand | MotionCommand | CathodeCommand | LeverCommand | SlopeCommand | CircuitCommand | PairCommand | OhmCommand | BoxCommand | DepthCommand | UtubeCommand | PressCommand | AtmCommand | VesselCommand | MagnetCommand | InductCommand | SinkCommand | ForcesCommand | RowsCommand | LiftCommand | BounceCommand | CarryCommand | WinchCommand | WindCommand | StrobeCommand | SnailCommand | CoinCommand | TouchCommand | CartsCommand | DragCommand | TowerCommand | GnomonCommand | AirCommand | PlanetsCommand | ExperimentCommand | ScalesCommand | DynoCommand | RubberCommand | GraviCommand;

/**
 * The set of weights for a school lever balance, kg: nominal values in the sequence (1; 2; 2; 5) × 10ⁿ that
 * OIML R 111 allows for a set, from 100 g down to 10 mg (211.1 g in all).
 */
export const WEIGHT_SET: readonly number[] = [100, 50, 20, 20, 10, 5, 2, 2, 1, 0.5, 0.2, 0.2, 0.1, 0.05, 0.02, 0.02, 0.01].map((g) => g / 1000);
export const WEIGHT_SET_SOURCE: SourcedValue = sv(0.00001, 'kg', 'the smallest weight of the set', 'single-source', 0.01, [cite('oiml-r111', 'R 111-1 (2004), 4.3.1: weight sequences (1; 2; 2; 5) × 10ⁿ kg', '—', 0.00001)], 'The set itself (100 g … 10 mg) is the usual school one; the standard fixes only the sequence of nominal values.');
/** "100 г + 20 г + 5 г + 200 мг": the weights on the pan. */
export function weightsText(weights: readonly number[], uk: boolean): string {
  return weights.map((w) => (w >= 0.001 ? `${Math.round(w * 1000)} ${uk ? 'г' : 'g'}` : `${Math.round(w * 1e6)} ${uk ? 'мг' : 'mg'}`)).join(' + ');
}
/** The weights that balance a load, largest first (as one puts them on with tweezers); null — the set is not enough. */
export function balanceWeights(mass: number): number[] | null {
  let left = mass;
  const out: number[] = [];
  for (const w of WEIGHT_SET) {
    if (w <= left + 0.000005) {
      out.push(w);
      left -= w;
    }
  }
  return left > 0.00001 ? null : out;
}

const measured = (instrument: string, quantity: MeasurementRecord['quantity'], value: number | null, exact: number, inputs: Record<string, number>): MeasurementRecord => ({ kind: 'measurement', instrument, quantity, value, exact, entities: [], inputs });

export const stretchCommand: CommandHandler<StretchCommand> = {
  type: 'lab.stretch',
  apply(state, c) {
    if (!(c.weights >= 0 && c.weights <= 4 && Number.isInteger(c.weights))) return err({ uk: 'На пружину вішають від 0 до 4 тягарців.', en: 'Hang 0 to 4 weights on the spring.' });
    const k = c.stiffness ?? BENCH_SPRING_K.value;
    if (!SPRING_SET.includes(k)) return err({ uk: 'Такої пружини в наборі немає.', en: 'There is no such spring in the set.' });
    const F = weight(c.weights * BENCH_WEIGHT.value, G);
    const x = F / k;
    const l = BENCH_SPRING_L0 + x;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(l), l, { weights: c.weights, F, k, l0: BENCH_SPRING_L0, division: RULER_DIVISION })] });
  },
};

export const pullCommand: CommandHandler<PullCommand> = {
  type: 'lab.pull',
  apply(state, c) {
    if (!(c.weights >= 0 && c.weights <= 3 && Number.isInteger(c.weights))) return err({ uk: 'На брусок кладуть від 0 до 3 тягарців.', en: 'Put 0 to 3 weights on the block.' });
    const N = weight(blockMass() + c.weights * BENCH_WEIGHT.value, G);
    // (Amontons' law: the face it lies on does not matter, only the pair of materials and the load.)
    const mu = (c.surface === 'paper' ? PAPER_ON_WOOD : WOOD_ON_WOOD).value;
    const F = slidingFriction(mu, N);
    const dyn = SCALES.dynamometer;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('dynamometer', 'force', scaleReading(dyn, F), F, { weights: c.weights, N, mu, block: blockMass(), narrow: c.face === 'narrow' ? 1 : 0, paper: c.surface === 'paper' ? 1 : 0 })] });
  },
};

export const edgeCommand: CommandHandler<EdgeCommand> = {
  type: 'lab.edge',
  apply(state, c) {
    const e = BENCH_BLOCK.edges[c.edge];
    if (e === undefined) return err({ uk: 'У бруска три ребра: довжина, ширина, висота.', en: 'A block has three edges: length, width, height.' });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(e), e, { edge: c.edge, division: RULER_DIVISION })] });
  },
};

export const balanceCommand: CommandHandler<BalanceCommand> = {
  type: 'lab.balance',
  apply(state, c) {
    let m: number;
    if (c.what === 'body') {
      if (!c.substance || !(c.mass && c.mass > 0)) return err({ uk: 'Що зважувати?', en: 'What to weigh?' });
      m = c.mass;
    } else {
      const w = weigh(state, 'lab-balance');
      m = c.what === 'vessel' ? w.exact.total : w.exact.vessel;
    }
    const set = balanceWeights(m);
    const value = set ? set.reduce((a, b) => a + b, 0) : null;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('lever-balance', 'mass', value, m, { division: 0.00001 })] });
  },
};

export const BENCH_COMMANDS = [stretchCommand, pullCommand, edgeCommand, balanceCommand, ...MOTION_COMMANDS, ...ELECTRODE_COMMANDS, ...LEVER_COMMANDS, ...CIRCUIT_COMMANDS, ...COIL_COMMANDS, ...BOX_COMMANDS, ...DEPTH_COMMANDS, ...UTUBE_COMMANDS, ...PRESS_COMMANDS, ...ATM_COMMANDS, ...VESSEL_COMMANDS, ...MAGNET_COMMANDS, ...INDUCT_COMMANDS, ...SINK_COMMANDS, ...FORCES_COMMANDS, ...ROWS_COMMANDS, ...LIFT_COMMANDS, ...BOUNCE_COMMANDS, ...CARRY_COMMANDS, ...WINCH_COMMANDS, ...WIND_COMMANDS, ...STROBE_COMMANDS, ...SNAIL_COMMANDS, ...COIN_COMMANDS, ...TOUCH_COMMANDS, ...CARTS_COMMANDS, ...DRAG_COMMANDS, ...TOWER_COMMANDS, ...GNOMON_COMMANDS, ...AIR_COMMANDS, ...PLANETS_COMMANDS, ...EXPERIMENTS.flatMap((m) => m.commands as readonly CommandHandler<never>[]), ...SCALES_COMMANDS, ...DYNO_COMMANDS, ...RUBBER_COMMANDS, ...GRAVI_COMMANDS] as const;

/** What a bench step asks to do and what its button says. */
export const BENCH_TEXT: Record<BenchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  ...(MOTION_TEXT as Record<MotionCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...ELECTRODE_TEXT,
  ...COIL_TEXT,
  ...(PRESS_TEXT as Record<PressCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(SINK_TEXT as Record<SinkCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(FORCES_TEXT as Record<ForcesCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(ROWS_TEXT as Record<RowsCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(LIFT_TEXT as Record<LiftCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(BOUNCE_TEXT as Record<BounceCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(CARRY_TEXT as Record<CarryCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(WINCH_TEXT as Record<WinchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(WIND_TEXT as Record<WindCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(STROBE_TEXT as Record<StrobeCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(SNAIL_TEXT as Record<SnailCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(COIN_TEXT as Record<CoinCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(TOUCH_TEXT as Record<TouchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(CARTS_TEXT as Record<CartsCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(DRAG_TEXT as Record<DragCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(TOWER_TEXT as Record<TowerCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(GNOMON_TEXT as Record<GnomonCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(AIR_TEXT as Record<AirCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(PLANETS_TEXT as Record<PlanetsCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  // The experiment modules: their steps' words, by command type.
  ...(SCALES_TEXT as Record<ScalesCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(DYNO_TEXT as Record<DynoCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(RUBBER_TEXT as Record<RubberCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(GRAVI_TEXT as Record<GraviCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(INDUCT_TEXT as Record<InductCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(MAGNET_TEXT as Record<MagnetCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(VESSEL_TEXT as Record<VesselCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(ATM_TEXT as Record<AtmCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(UTUBE_TEXT as Record<UtubeCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(DEPTH_TEXT as Record<DepthCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(BOX_TEXT as Record<BoxCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(CIRCUIT_TEXT as Record<CircuitCommand['type'] | PairCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...(LEVER_TEXT as Record<LeverCommand['type'] | SlopeCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  'lab.stretch': (c) => {
    const n = (c as StretchCommand).weights;
    return n === 0
      ? { say: { uk: 'Підвісь пружину на лапку штатива й виміряй лінійкою її довжину без вантажу — l₀.', en: 'Hang the spring on the stand’s clamp and measure its length with no load — l₀.' }, button: { uk: '📏 Виміряти l₀', en: '📏 Measure l₀' }, plan: { uk: 'виміряти довжину пружини', en: 'measure the spring' } }
      : {
          say: { uk: `Підвісь до пружини ${n === 1 ? 'тягарець 100 г' : `${n} тягарці по 100 г`} і виміряй її довжину l.`, en: `Hang ${n === 1 ? 'a 100 g weight' : `${n} weights of 100 g`} on the spring and measure its length l.` },
          button: { uk: `📏 ${n} × 100 г: виміряти l`, en: `📏 ${n} × 100 g: measure l` },
          plan: { uk: `${n} × 100 г — виміряти довжину`, en: `${n} × 100 g — measure the length` },
        };
  },
  'lab.pull': (c) => {
    const p = c as PullCommand;
    const n = p.weights;
    if (p.face === 'narrow')
      return {
        say: { uk: 'Тепер постав брусок на вужчу бічну грань — площа дотику з дошкою менша — і знову рівномірно тягни.', en: 'Now stand the block on its narrower side face — less area touching the board — and pull it steadily again.' },
        button: { uk: '➡ Брусок на вужчій грані', en: '➡ The block on its narrower face' },
        plan: { uk: 'брусок на вужчій грані', en: 'the block on its narrower face' },
      };
    if (p.surface === 'paper')
      return {
        say: { uk: 'Покладемо на дошку аркуш паперу й потягнемо брусок по ньому — тією самою широкою гранню.', en: 'Lay a sheet of paper on the board and pull the block over it — on the same wide face.' },
        button: { uk: '➡ Брусок по папері', en: '➡ The block over paper' },
        plan: { uk: 'брусок по аркушу паперу', en: 'the block over a sheet of paper' },
      };
    return {
      say: n === 0 ? { uk: 'Поклади брусок широкою гранню на дошку й рівномірно тягни його динамометром. Що він показує?', en: 'Lay the block on its widest face on the board and pull it at a steady speed with the dynamometer. What does it show?' } : { uk: `Поклади на брусок ${n === 1 ? 'тягарець' : `${n} тягарці`} і ${p.face ? 'рівномірно тягни його широкою гранню по дошці' : 'знову рівномірно тягни'}.`, en: `Put ${n === 1 ? 'a weight' : `${n} weights`} on the block and ${p.face ? 'pull it on its wide face along the board steadily' : 'pull it steadily again'}.` },
      button: { uk: `➡ Тягти брусок${n ? ` (+${n} × 100 г)` : ''}`, en: `➡ Pull the block${n ? ` (+${n} × 100 g)` : ''}` },
      plan: { uk: `тягти брусок${n === 1 ? ' із тягарцем' : n ? ` із ${n} тягарцями` : ''}`, en: `pull the block${n === 1 ? ' with a weight' : n ? ` with ${n} weights` : ''}` },
    };
  },
  'lab.balance': (c) => {
    const b = c as BalanceCommand;
    const name = b.label ?? (b.what === 'vessel-empty' ? { uk: 'порожня посудина', en: 'the empty vessel' } : b.what === 'vessel' ? { uk: 'посудина з рідиною', en: 'the vessel with the liquid' } : { uk: 'тіло', en: 'the body' });
    return {
      say: { uk: `Поклади на ліву шальку ${name.uk.toLowerCase()} і зрівноваж терези, додаючи пінцетом важки на праву — від більших до менших.`, en: `Put ${name.en.toLowerCase()} on the left pan and balance it, adding weights with tweezers on the right — from larger to smaller.` },
      button: { uk: `⚖ Зважити: ${name.uk.toLowerCase()}`, en: `⚖ Weigh: ${name.en.toLowerCase()}` },
      plan: { uk: `зважити: ${name.uk.toLowerCase()}`, en: `weigh ${name.en.toLowerCase()}` },
    };
  },
  'lab.edge': (c) => {
    const e = (c as EdgeCommand).edge;
    const what = [{ uk: 'довжину', en: 'the length' }, { uk: 'ширину', en: 'the width' }, { uk: 'висоту', en: 'the height' }][e]!;
    return { say: { uk: `Приклади лінійку й виміряй ${what.uk} бруска.`, en: `Put the ruler to the block and measure ${what.en}.` }, button: { uk: `📏 Виміряти ${what.uk}`, en: `📏 Measure ${what.en}` }, plan: { uk: `виміряти ${what.uk}`, en: `measure ${what.en}` } };
  },
  // The experiment modules: their steps' words, by command type.
  ...(Object.fromEntries(EXPERIMENTS.flatMap((m) => m.commands.map((h) => [h.type, m.text]))) as Record<ExperimentCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
};

/** What stands on the table for each bench (instead of the vessel), for the line under the experiment's title. */
type OldBenchKind = 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum' | 'lever' | 'slope' | 'circuit' | 'series' | 'parallel' | 'box' | 'depth' | 'utube' | 'press' | 'atm' | 'vessels' | 'magnet' | 'induct' | 'bubble' | 'sink' | 'forces' | 'rows' | 'lift' | 'bounce' | 'carry' | 'winch' | 'wind' | 'strobe' | 'snail' | 'coin' | 'touch' | 'carts' | 'drag' | 'tower' | 'gnomon' | 'air' | 'planets' | 'scales' | 'dyno' | 'rubber' | 'gravi';
const OLD_SETUP: Record<OldBenchKind, LocalizedText> = {
  circuit: { uk: 'Джерело струму, ключ, резистор, амперметр, вольтметр, з’єднувальні дроти', en: 'A source, a key, a resistor, an ammeter, a voltmeter, connecting wires' },
  gravi: { uk: 'Скляна банка, паперовий рушник, вода, пророслі зерна кукурудзи; телефон на штативі, транспортир; клиностат — моторчик, що повільно обертає банку (1 оберт за хвилину)', en: 'A glass jar, a paper towel, water, sprouted maize grains; a phone on a stand, a protractor; a clinostat — a small motor turning the jar slowly (1 turn a minute)' },
  rubber: { uk: 'Машинка з картону: дві осі (задня — олівець), колеса з кришечок, офісна гумка; саморобний динамометр, рулетка, довгий коридор', en: 'A cardboard car: two axles (the back one a pencil), bottle-cap wheels, an office rubber band; the home-made dynamometer, a tape measure, a long corridor' },
  dyno: { uk: 'Дощечка зі смужкою паперу, цвях, пружина з набору (25 Н/м), дротяна стрілка, гачок зі скріпки, три тягарці по 100 г, лінійка й олівець; невелике яблуко, яйце в пакетику', en: 'A board with a strip of paper, a nail, a spring of the set (25 N/m), a wire pointer, a paper-clip hook, three 100 g weights, a ruler and a pencil; a small apple, an egg in a little bag' },
  scales: { uk: 'Лінійка 30 см, нитка, два стаканчики від йогурту, пластилін, аркуші офісного паперу A4 (80 г/м²), шприц на 10 мл і склянка води, куряче яйце', en: 'A 30 cm ruler, thread, two yoghurt cups, plasticine, sheets of A4 office paper (80 g/m²), a 10 mL syringe and a glass of water, a hen’s egg' },
  planets: { uk: 'М’яч діаметром 20 см (Сонце), лінійка, рулетка, шкільний стадіон і довга вулиця; таблиця NASA з розмірами, відстанями й періодами планет', en: 'A 20 cm ball (the Sun), a ruler, a tape measure, a school field and a long street; NASA’s table of the planets’ sizes, distances and periods' },
  air: { uk: 'Смартфон із барометром (застосунок показує тиск до сотих гектопаскаля), ліфт багатоповерхівки, політ на дирижаблі', en: 'A smartphone with a barometer (an app shows the pressure to hundredths of a hectopascal), a block of flats with a lift, a flight in an airship' },
  gnomon: { uk: 'Метрова палиця (гномон), виска, щоб поставити її прямовисно, рулетка, годинник (місцевий час)', en: 'A metre stick (a gnomon), a plumb line to stand it upright, a tape measure, a clock (the local time)' },
  tower: { uk: 'Мірний циліндр на 250 мл, гліцерин, вода, соняшникова олія, спирт (по 50 мл), харчовий барвник, сталева гайка, шматочки оргскла й поліетилену, сосновий кубик', en: 'A 250 mL measuring cylinder, glycerol, water, sunflower oil, ethanol (50 mL each), food colouring, a steel nut, pieces of acrylic glass and polyethylene, a pine cube' },
  drag: { uk: 'Акваріум з водою, на склі — дві позначки на відстані 20 см, 5 г пластиліну, лінійка, камера телефона (30 кадрів за секунду)', en: 'An aquarium of water with two marks 20 cm apart on the glass, 5 g of plasticine, a ruler, a phone camera (30 frames a second)' },
  carts: { uk: 'Два легкі візки по 100 г, пружина між ними, нитка й сірники, тягарці по 100 г, лінійка, камера телефона, динамометр (до 5 Н)', en: 'Two light 100 g carts, a spring between them, a thread and matches, 100 g weights, a ruler, a phone camera, a dynamometer (up to 5 N)' },
  touch: { uk: 'Штатив, скріпка на нитці, магніт, картонка, пластиковий гребінець, шматочки паперу, брусок на нитці, тягарець', en: 'A stand, a paper clip on a thread, a magnet, a card, a plastic comb, bits of paper, a block on a thread, a weight' },
  coin: { uk: 'Склянка, листівка 10 × 15 см, монета (2,6 см), лінійка, камера телефона', en: 'A glass, a 10 × 15 cm postcard, a coin (2.6 cm), a ruler, a phone camera' },
  snail: { uk: 'Садовий равлик, пластиковий аркуш (сухий, мокрий, вертикально), наждачний папір P120, лінійка, камера телефона, секундомір', en: 'A garden snail, a plastic sheet (dry, wet, upright), P120 sandpaper, a ruler, a phone camera, a stopwatch' },
  strobe: { uk: 'Два стробоскопічні фото кульки (масштаб 1 : 5, спалахи 4 рази на секунду), лінійка з міліметровими поділками', en: 'Two stroboscopic photos of the ball (scale 1 : 5, four flashes a second), a ruler with millimetre divisions' },
  wind: { uk: 'Подвір’я в три вітряні дні: дві позначки за 6 м уздовж вітру (рулетка), мильні бульбашки, секундомір', en: 'A yard on three windy days: two marks 6 m apart along the wind (a tape measure), soap bubbles, a stopwatch' },
  winch: { uk: 'Ворот на штативі: вісь із ручкою, котушка від ниток (d = 2 см) або олівець (d = 8 мм), нитка з вантажем, лінійка', en: 'A windlass on a stand: an axis with a handle, a cotton reel (d = 2 cm) or a pencil (d = 8 mm), a thread with a load, a ruler' },
  carry: { uk: 'Перевернута пляшка густої рідини для миття посуду з позначками, лінійка на столі, аркуш паперу за пляшкою, маркер, секундомір', en: 'An upside-down bottle of thick washing-up liquid with marks, a ruler on the table, a sheet of paper behind the bottle, a marker, a stopwatch' },
  bounce: { uk: 'Метрова лінійка на штативі, стальна плита, м’ячик для настільного тенісу, тенісний м’яч, пластилінова кулька', en: 'A metre stick on a stand, a steel plate, a table tennis ball, a tennis ball, a plasticine ball' },
  lift: { uk: 'Кабіна ліфта, динамометр (до 5 Н) під її стелею, чотири тягарці по 100 г', en: 'A lift cabin, a dynamometer (up to 5 N) under its ceiling, four 100 g weights' },
  rows: { uk: 'Лінійка з міліметровими поділками, горох, пшоно, дві зубочистки, стрижень для ручки, нитка № 10 (≈ 50 см)', en: 'A ruler with millimetre divisions, peas, millet, two toothpicks, a pen refill, a № 10 thread (≈ 50 cm)' },
  forces: { uk: 'Штатив, два динамометри (до 5 Н), дерев’яна лінійка, два тягарці по 100 г', en: 'A stand, two dynamometers (up to 5 N), a wooden ruler, two 100 g weights' },
  bubble: { uk: 'Прозора пляшка (0,5 л) густої рідини для миття посуду з позначками, лінійка, секундомір', en: 'A clear 0.5 L bottle of thick washing-up liquid with marks, a ruler, a stopwatch' },
  sink: { uk: 'Мірні циліндри (250 мл) з гліцерином, соняшниковою олією й водою, з позначками; сталева кулька від підшипника, секундомір', en: '250 mL measuring cylinders of glycerol, sunflower oil and water, with marks; a steel bearing ball, a stopwatch' },
  induct: { uk: 'Котушка-моток, штабовий магніт, міліамперметр з нулем посередині, з’єднувальні дроти', en: 'A coil, a bar magnet, a milliammeter with its zero in the middle, connecting wires' },
  magnet: { uk: 'Сталевий цвях, ізольований дріт, джерело струму, ключ, реостат, амперметр, компас, пластикова трубочка', en: 'A steel nail, insulated wire, a source, a key, a rheostat, an ammeter, a compass, a plastic straw' },
  vessels: { uk: 'Прилад Паскаля: підставка з гумовим дном і три посудини різної форми з однаковим дном, рідинний (U-подібний) манометр, мензурка на 500 мл, вода, лінійка', en: 'Pascal’s device: a stand with a rubber bottom and three vessels of different shapes with the same bottom, a liquid (U-tube) manometer, a 500 mL measuring cylinder, water, a ruler' },
  atm: { uk: 'Шприц на 1 мл із ковпачком на носик, динамометр, лінійка, барометр-анероїд', en: 'A 1 mL syringe with a cap for its nozzle, a dynamometer, a ruler, an aneroid barometer' },
  press: { uk: 'Два шприци (на 5 і 50 мл), з’єднані трубкою з водою, тягарці по 100 г, динамометр, лінійка', en: 'Two syringes (5 and 50 mL) joined by a tube of water, 100 g weights, a dynamometer, a ruler' },
  utube: { uk: 'Скляна U-подібна трубка на штативі, вода, соняшникова олія, мензурка, лінійка', en: 'A glass U-tube on a stand, water, sunflower oil, a measuring cylinder, a ruler' },
  depth: { uk: 'Хімічний стакан на 1 л із рідиною, воронка з гумовою плівкою на трубці, рідинний (U-подібний) манометр із водою, лінійка', en: 'A 1 L beaker of liquid, a funnel with a rubber film on a tube, a liquid (U-tube) manometer with water, a ruler' },
  box: { uk: '«Чорна скринька» з двома клемами, джерело струму, ключ, захисний резистор 100 Ом, мультиметр (міліамперметр), з’єднувальні дроти', en: 'A “black box” with two terminals, a source, a key, a 100 Ω protective resistor, a multimeter (a milliammeter), connecting wires' },
  series: { uk: 'Джерело струму, ключ, два резистори (2 і 4 Ом), амперметр, вольтметр, з’єднувальні дроти', en: 'A source, a key, two resistors (2 and 4 Ω), an ammeter, a voltmeter, connecting wires' },
  parallel: { uk: 'Джерело струму, ключ, два резистори (2 і 4 Ом), амперметр, вольтметр, з’єднувальні дроти', en: 'A source, a key, two resistors (2 and 4 Ω), an ammeter, a voltmeter, connecting wires' },
  ...MOTION_SETUP,
  lever: { uk: 'Важіль-лінійка на осі в штативі, тягарці по 100 г, динамометр', en: 'A lever ruler on an axis in a stand, 100 g weights, a dynamometer' },
  slope: { uk: 'Дерев’яна дошка на штативі, дерев’яний брусок, тягарці по 100 г, динамометр, лінійка', en: 'A wooden board on a stand, a wooden block, 100 g weights, a dynamometer, a ruler' },
  spring: { uk: 'Штатив із лапкою, пружина з набору, тягарці по 100 г, учнівська лінійка', en: 'A stand with a clamp, a spring of the set, 100 g weights, a ruler' },
  friction: { uk: 'Дерев’яний брусок, дерев’яна дошка, тягарці по 100 г, динамометр', en: 'A wooden block, a wooden board, 100 g weights, a dynamometer' },
  pressure: { uk: 'Дерев’яний брусок, динамометр, учнівська лінійка', en: 'A wooden block, a dynamometer, a ruler' },
  balance: { uk: 'Важільні терези, набір важків, пінцет', en: 'A lever balance, a set of weights, tweezers' },
};
export const BENCH_SETUP = { ...OLD_SETUP, ...Object.fromEntries(EXPERIMENTS.map((m) => [m.kind, m.setup])) } as Record<OldBenchKind | ExperimentKind, LocalizedText>;
