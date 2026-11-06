import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import type { SourcedValue } from '../knowledge/types.js';
import { SCALES } from '../equipment/scales.js';
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
/** The longest it is let stretch, m: to the end of the 40 cm ruler measuring it (the listing gives no limit of its own). */
export const BENCH_SPRING_LONGEST: SourcedValue = sv(0.4, 'm', 'a spring of the set, stretched', 'estimate', 0.2, [cite('spark', 'estimate', 'the ruler beside it reads to 40 cm; the springs are about 8 cm unloaded', 0.4)], 'Estimate: beyond its elastic limit a spring would stay stretched, and the listing does not give that limit.');
/** One slotted weight, kg: as in the lab work (four of 100 g). */
export const BENCH_WEIGHT: SourcedValue = sv(0.1, 'kg', 'one slotted weight', 'single-source', 0.01, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 6, обладнання: 4 тягарці масою 100 г кожен', '—', 0.1)]);
/** Wood sliding on wood. */
export const WOOD_ON_WOOD: SourcedValue = sv(0.25, '', 'dry wood on dry wood, sliding', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', '§ 26, таблиця «Значення коефіцієнтів тертя ковзання»: дерево по дереву 0,25', '—', 0.25)], 'Tables give mean values: Wikipedia lists 0.25–0.62 for wood on wood (static) — it depends on the wood and how smooth it is.');
/** Paper on wood: the block slid on a sheet of paper laid on the board (the same pair of materials). */
export const PAPER_ON_WOOD: SourcedValue = sv(0.4, '', 'paper on wood, sliding', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', '§ 26, таблиця «Значення коефіцієнтів тертя ковзання»: папір по дереву 0,40', '—', 0.4)], 'A table’s mean value for the pair of materials.');
/** The pine block of the lab works: its edges, m (a block of the lab; its mass follows from the wood's density). */
/**
 * The division a force is read to, by the instrument that suits it: the lab dynamometer (0.1 N) from 0.5 to its 5 N;
 * beyond either, a force gauge read to three figures.
 */
export const forceDivision = (F: number): number => (F >= 5 * SCALES.dynamometer.spec.resolution.value && F <= SCALES.dynamometer.spec.capacity.value ? SCALES.dynamometer.spec.resolution.value : 10 ** (Math.floor(Math.log10(F)) - 2));
export const BENCH_BLOCK = { substance: 'wood', edges: [0.12, 0.06, 0.04] as const };
export const blockMass = (): number => BENCH_BLOCK.edges[0] * BENCH_BLOCK.edges[1] * BENCH_BLOCK.edges[2] * SUBSTANCES.wood.liquid.density.value;

/** The syringes of the hydraulic and the pneumatic machine, their inner diameters: a 5 mL one and a 50 mL one. */
export const SYRINGE_SMALL: SourcedValue = sv(0.012, 'm', '5 mL syringe, inside', 'estimate', 0.15, [cite('spark', 'estimate', 'a 5 mL syringe is about 12 mm wide inside', 0.012)], 'Estimate: the ruler measures it all the same.');
export const SYRINGE_LARGE: SourcedValue = sv(0.026, 'm', '50 mL syringe, inside', 'estimate', 0.15, [cite('spark', 'estimate', 'a 50 mL syringe is about 26–29 mm wide inside', 0.026)], 'Estimate: the ruler measures it all the same.');

/** The ferrite bar magnet: Y30-like remanence; 10 cm long, its 2 × 1 cm section taken as a circle of the same area. */
export const BAR_MAGNET: { readonly remanence: SourcedValue; readonly radius: SourcedValue; readonly length: SourcedValue } = {
  remanence: sv(0.38, 'T', 'sintered ferrite, grade Y30', 'cross-checked', 0.05, [cite('stanford-magnets-ferrite', 'Y30: Br 370–400 mT', 'room temperature', 0.38), cite('magnetexpert-ferrite-grades', 'Y30: Br 370–400 mT', 'room temperature', 0.38)], 'Which grade a school magnet is, is not known: ferrites go from about 0.2 to 0.44 T.'),
  radius: sv(0.008, 'm', '2 × 1 cm section, as a circle of the same area', 'estimate', 0.2, [cite('spark', 'estimate', 'school bar magnets are about 2 × 1 × 10 cm', 0.008)], 'Estimate.'),
  length: sv(0.1, 'm', 'a school bar magnet', 'estimate', 0.1, [cite('spark', 'estimate', 'school bar magnets are about 10 cm long', 0.1)], 'Estimate.'),
};
/** A neodymium magnet of grade N35, the weakest of the grades: its remanence (a bar of the same size as the ferrite one). */
export const NEODYMIUM_REMANENCE: SourcedValue = sv(1.2, 'T', 'sintered NdFeB, grade N35', 'cross-checked', 0.05, [cite('magnetexpert-neodymium-grades', 'N35: Br 1170–1220 mT', 'room temperature', 1.2), cite('magnetika-neodymium-grades', 'N35: Br 11.8–12.2 kG', 'room temperature', 1.2)], 'Within a grade Br varies by a few per cent.');
/** Office paper: mass of a square metre, from an A4 sheet of 80 g/m². */
export const PAPER_AREAL: SourcedValue = sv(0.08, 'kg/m²', 'office paper, 80 gsm', 'single-source', 0.03, [cite('papersizes-weights', 'A4, 80 gsm: 5 g (A0 = 1 m² by ISO 216)', '—', 0.08)], 'Paper of 80 g/m² varies by a few per cent.');

/** A pupil's ruler: millimetre divisions. */
export const RULER_DIVISION = 0.001;
export const ruler = (x: number) => Math.round(x / RULER_DIVISION) * RULER_DIVISION;
/** A bench instrument's reading: what it shows, and the exact value behind it. */
export const measured = (instrument: string, quantity: MeasurementRecord['quantity'], value: number | null, exact: number, inputs: Record<string, number>): MeasurementRecord => ({ kind: 'measurement', instrument, quantity, value, exact, entities: [], inputs });
