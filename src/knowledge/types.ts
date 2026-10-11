/**
 * Knowledge layer: where every number and every text in the platform comes from.
 *
 * Rule: no physical constant enters the engine without at least one Citation,
 * and the test suite checks that the value we use agrees with what the
 * cited sources actually say (see tests/knowledge).
 */

export type License =
  | 'CC0-1.0'
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'CC-BY-NC-SA-4.0'
  /** Text written by the Spark team, licensed with the project. */
  | 'project';

export type SourceId = string & { readonly __source?: never };

export interface Source {
  readonly id: SourceId;
  readonly title: string;
  readonly url: string;
  readonly license: License;
  /** ISO date when values were taken from the source. */
  readonly retrieved: string;
  /** Known caveats of the source itself (disputed, secondary, no conditions…). */
  readonly caveats?: string;
}

/** What one source says about one quantity. */
export type Citation = {
  readonly source: SourceId;
  /** Where exactly: Wikidata Q-id, table number, row name. */
  readonly locator: string;
  /** Measurement conditions as stated by the source ("25 °C", "near 0 °C", "not stated"). */
  readonly conditions: string;
} & ({ readonly value: number } | { readonly range: readonly [min: number, max: number] });

/**
 * - cross-checked: ≥ 2 different sources agree with `value` within `tolerance`;
 * - single-source: only one source, or the others disagree / describe a different material;
 * - estimate: order-of-magnitude engineering guess, no reliable source found.
 */
export type Verification = 'cross-checked' | 'single-source' | 'estimate';

export interface SourcedValue<Q extends number = number> {
  readonly value: Q;
  readonly unit: string;
  /** Conditions the chosen `value` refers to. */
  readonly conditions: string;
  readonly verification: Verification;
  /** Relative tolerance used when checking citations against `value` (0.05 = 5 %). */
  readonly tolerance: number;
  readonly citations: readonly Citation[];
  readonly note?: string;
}

export interface LocalizedText {
  readonly ru: string;
  readonly en?: string;
}

export interface VariableSpec {
  readonly name: LocalizedText;
  readonly unit: string;
}

/**
 * Human-facing description of a formula, linked to the real function the
 * engine runs, so the UI explanation and the simulation can never diverge.
 */
export interface FormulaSpec<F extends (...args: any[]) => number = (...args: any[]) => number> {
  readonly id: string;
  readonly title: LocalizedText;
  /** LaTeX for the UI. */
  readonly latex: string;
  readonly variables: Readonly<Record<string, VariableSpec>>;
  /** School grade where the formula is introduced (RU curriculum), null = beyond the basic school course. */
  readonly grade: number | null;
  /** Where in the curriculum it appears, or why it is beyond it. */
  readonly curriculum: string;
  readonly explanation: LocalizedText;
  readonly compute: F;
  /** Worked examples, recomputed in tests against hand-calculated answers. */
  readonly examples: readonly { readonly args: Parameters<F>; readonly expected: number; readonly note: string }[];
  /** Where the explanation text comes from and whether a physics teacher has reviewed it. */
  readonly textSource: SourceId;
  readonly reviewed: boolean;
}

/** Helper that keeps `F` inferred per formula while erasing it for the catalog array. */
export const defineFormula = <F extends (...args: any[]) => number>(spec: FormulaSpec<F>): FormulaSpec => spec as FormulaSpec;
