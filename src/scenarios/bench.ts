import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { slidingFriction, weight } from '../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { type SubstanceId } from '../substances/catalog.js';
import { weigh } from './weighing.js';
import { MOTION_COMMANDS, MOTION_SETUP, MOTION_TEXT, type MotionCommand } from './motion-bench.js';
import { ELECTRODE_COMMANDS, ELECTRODE_TEXT, type CathodeCommand } from './electrode-bench.js';
import { COIL_COMMANDS, COIL_TEXT, type OhmCommand } from './coil-bench.js';
import { EXPERIMENTS, type ExperimentCommand, type ExperimentKind } from '../experiments/index.js';

/**
 * The mechanics bench of grade 7, beside the vessel: a spring on a stand with slotted weights and a ruler
 * (Hooke's law), a wooden block pulled along a wooden board by a dynamometer (sliding friction), and the
 * same block measured with a ruler (its faces — the pressure it puts on its support). Everything the
 * instruments show is rounded to their divisions, as on the real ones.
 */

export { BENCH_SPRING_K, SPRING_SET, BENCH_SPRING_L0, BENCH_WEIGHT, WOOD_ON_WOOD, PAPER_ON_WOOD, BENCH_BLOCK, blockMass } from './bench-kit.js';
import { BENCH_SPRING_K, SPRING_SET, BENCH_SPRING_L0, BENCH_WEIGHT, WOOD_ON_WOOD, PAPER_ON_WOOD, BENCH_BLOCK, blockMass } from './bench-kit.js';
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
export type BenchCommand = StretchCommand | PullCommand | EdgeCommand | BalanceCommand | MotionCommand | CathodeCommand | OhmCommand | ExperimentCommand;

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

export const BENCH_COMMANDS = [stretchCommand, pullCommand, edgeCommand, balanceCommand, ...MOTION_COMMANDS, ...ELECTRODE_COMMANDS, ...COIL_COMMANDS, ...EXPERIMENTS.flatMap((m) => m.commands as readonly CommandHandler<never>[])] as const;

/** What a bench step asks to do and what its button says. */
export const BENCH_TEXT: Record<BenchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  ...(MOTION_TEXT as Record<MotionCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...ELECTRODE_TEXT,
  ...COIL_TEXT,
  // The experiment modules: their steps' words, by command type.
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
type OldBenchKind = 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum';
const OLD_SETUP: Record<OldBenchKind, LocalizedText> = {
  ...MOTION_SETUP,
  spring: { uk: 'Штатив із лапкою, пружина з набору, тягарці по 100 г, учнівська лінійка', en: 'A stand with a clamp, a spring of the set, 100 g weights, a ruler' },
  friction: { uk: 'Дерев’яний брусок, дерев’яна дошка, тягарці по 100 г, динамометр', en: 'A wooden block, a wooden board, 100 g weights, a dynamometer' },
  pressure: { uk: 'Дерев’яний брусок, динамометр, учнівська лінійка', en: 'A wooden block, a dynamometer, a ruler' },
  balance: { uk: 'Важільні терези, набір важків, пінцет', en: 'A lever balance, a set of weights, tweezers' },
};
export const BENCH_SETUP = { ...OLD_SETUP, ...Object.fromEntries(EXPERIMENTS.map((m) => [m.kind, m.setup])) } as Record<OldBenchKind | ExperimentKind, LocalizedText>;
