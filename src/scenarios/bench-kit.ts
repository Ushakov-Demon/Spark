import { cite, sv } from '../components/sourced.js';
import type { SourcedValue } from '../knowledge/types.js';
import { SUBSTANCES } from '../substances/catalog.js';

/**
 * The bench's own kit — the spring, the weights, the block, the woods' friction — apart from bench.ts, so that the
 * experiment modules can take them without importing the bench (which imports the modules).
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
