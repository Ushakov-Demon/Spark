import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { slidingFriction, weight } from '../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { SUBSTANCES } from '../substances/catalog.js';

/**
 * The mechanics bench of grade 7, beside the vessel: a spring on a stand with slotted weights and a ruler
 * (Hooke's law), a wooden block pulled along a wooden board by a dynamometer (sliding friction), and the
 * same block measured with a ruler (its faces — the pressure it puts on its support). Everything the
 * instruments show is rounded to their divisions, as on the real ones.
 */

/** The spring of the 3B set (Hooke's law) that suits 100 g weights: 25 N/m, ≈ 4 cm per weight. */
export const BENCH_SPRING_K: SourcedValue = sv(25, 'N/m', 'the stiffest spring of the set', 'single-source', 0.01, [cite('3b-helical-springs', 'Set of Helical Springs for Hooke’s Law 1003376: 2.5, 5, 10, 15, 25 N/m', 'new spring', 25)], 'The listing gives nominal constants; a real spring may differ by a few per cent.');
/** Its length unloaded, m: the spring of this lab (the listing gives no lengths). */
export const BENCH_SPRING_L0 = 0.08;
/** One slotted weight, kg: as in the lab work (four of 100 g). */
export const BENCH_WEIGHT: SourcedValue = sv(0.1, 'kg', 'one slotted weight', 'single-source', 0.01, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 6, обладнання: 4 тягарці масою 100 г кожен', '—', 0.1)]);
/** Wood sliding on wood. */
export const WOOD_ON_WOOD: SourcedValue = sv(0.25, '', 'dry wood on dry wood, sliding', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', '§ 26, таблиця «Значення коефіцієнтів тертя ковзання»: дерево по дереву 0,25', '—', 0.25)], 'Tables give mean values: Wikipedia lists 0.25–0.62 for wood on wood (static) — it depends on the wood and how smooth it is.');
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
}
/** Pull the block along the board at a steady speed with so many weights on it; read the dynamometer. */
export interface PullCommand {
  readonly type: 'lab.pull';
  readonly weights: number;
}
/** Measure one edge of the block with the ruler (0 — length, 1 — width, 2 — height). */
export interface EdgeCommand {
  readonly type: 'lab.edge';
  readonly edge: 0 | 1 | 2;
}
export type BenchCommand = StretchCommand | PullCommand | EdgeCommand;

const measured = (instrument: string, quantity: MeasurementRecord['quantity'], value: number | null, exact: number, inputs: Record<string, number>): MeasurementRecord => ({ kind: 'measurement', instrument, quantity, value, exact, entities: [], inputs });

export const stretchCommand: CommandHandler<StretchCommand> = {
  type: 'lab.stretch',
  apply(state, c) {
    if (!(c.weights >= 0 && c.weights <= 4 && Number.isInteger(c.weights))) return err({ uk: 'На пружину вішають від 0 до 4 тягарців.', en: 'Hang 0 to 4 weights on the spring.' });
    const k = BENCH_SPRING_K.value;
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
    const F = slidingFriction(WOOD_ON_WOOD.value, N);
    const dyn = SCALES.dynamometer;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('dynamometer', 'force', scaleReading(dyn, F), F, { weights: c.weights, N, mu: WOOD_ON_WOOD.value, block: blockMass() })] });
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

export const BENCH_COMMANDS = [stretchCommand, pullCommand, edgeCommand] as const;

/** What a bench step asks to do and what its button says. */
export const BENCH_TEXT: Record<BenchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.stretch': (c) => {
    const n = (c as StretchCommand).weights;
    return n === 0
      ? { say: { uk: 'Підвісь пружину на лапку штатива й виміряй лінійкою її довжину без вантажу — l₀.', en: 'Hang the spring on the stand’s clamp and measure its length with no load — l₀.' }, button: { uk: '📏 Виміряти l₀', en: '📏 Measure l₀' }, plan: { uk: 'виміряти довжину пружини', en: 'measure the spring' } }
      : {
          say: { uk: `Підвісь до пружини ${n === 1 ? 'тягарець 100 г' : `${n} тягарці по 100 г`} і виміряй її довжину l.`, en: `Hang ${n === 1 ? 'a 100 g weight' : `${n} weights of 100 g`} on the spring and measure its length l.` },
          button: { uk: `📏 ${n} × 100 г: виміряти l`, en: `📏 ${n} × 100 g: measure l` },
          plan: { uk: `${n} тягарці — виміряти довжину`, en: `${n} weights — measure the length` },
        };
  },
  'lab.pull': (c) => {
    const n = (c as PullCommand).weights;
    return {
      say: n === 0 ? { uk: 'Поклади брусок широкою гранню на дошку й рівномірно тягни його динамометром. Що він показує?', en: 'Lay the block on its widest face on the board and pull it at a steady speed with the dynamometer. What does it show?' } : { uk: `Поклади на брусок ${n === 1 ? 'тягарець' : `${n} тягарці`} і знову рівномірно тягни.`, en: `Put ${n === 1 ? 'a weight' : `${n} weights`} on the block and pull it steadily again.` },
      button: { uk: `➡ Тягти брусок${n ? ` (+${n} × 100 г)` : ''}`, en: `➡ Pull the block${n ? ` (+${n} × 100 g)` : ''}` },
      plan: { uk: `тягти брусок${n ? ` із ${n} тягарцями` : ''}`, en: `pull the block${n ? ` with ${n} weights` : ''}` },
    };
  },
  'lab.edge': (c) => {
    const e = (c as EdgeCommand).edge;
    const what = [{ uk: 'довжину', en: 'the length' }, { uk: 'ширину', en: 'the width' }, { uk: 'висоту', en: 'the height' }][e]!;
    return { say: { uk: `Приклади лінійку й виміряй ${what.uk} бруска.`, en: `Put the ruler to the block and measure ${what.en}.` }, button: { uk: `📏 Виміряти ${what.uk}`, en: `📏 Measure ${what.en}` }, plan: { uk: `виміряти ${what.uk}`, en: `measure ${what.en}` } };
  },
};
