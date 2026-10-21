import type { LocalizedText } from './i18n.js';
import type { LeveledText } from './levels.js';

export type { LocalizedText } from './i18n.js';

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
  | 'project'
  /** Copyrighted or unclear: only facts and short quotes are used, with attribution. */
  | 'facts-only';

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

export interface VariableSpec {
  readonly name: LocalizedText;
  readonly unit: string;
  /** What the quantity means physically, by level. */
  readonly meaning?: LeveledText;
}

/**
 * Human-facing description of a formula, linked to the real function the
 * engine runs, so the UI explanation and the simulation can never diverge.
 */
export interface FormulaSpec<F extends (...args: any[]) => number = (...args: any[]) => number> {
  readonly id: string;
  /** The law (or definition) this formula expresses. */
  readonly law: string;
  readonly title: LocalizedText;
  /** LaTeX for the UI. */
  readonly latex: string;
  /** Plain-text form for consoles and screen readers. */
  readonly plain: string;
  /** Symbol of each positional argument of `compute` (keys of `variables`), and of the result. */
  readonly argSymbols: readonly string[];
  readonly resultSymbol: string;
  readonly variables: Readonly<Record<string, VariableSpec>>;
  /** Where school curricula cover it. Empty = beyond the basic school course (see `beyondCurriculum`). */
  readonly curriculum: readonly CurriculumRef[];
  readonly beyondCurriculum?: LocalizedText;
  readonly explanation: LeveledText;
  readonly compute: F;
  /** Worked examples, recomputed in tests against hand-calculated answers. */
  readonly examples: readonly { readonly args: Parameters<F>; readonly expected: number; readonly note: string }[];
  /** Where the explanation text comes from and whether a physics teacher has reviewed it. */
  readonly textSource: SourceId;
  readonly reviewed: boolean;
}

/** Helper that keeps `F` inferred per formula while erasing it for the catalog array. */
export const defineFormula = <F extends (...args: any[]) => number>(spec: FormulaSpec<F>): FormulaSpec => spec as FormulaSpec;

/** Source for a non-numeric fact (a date, an attribution, a publication). */
export interface FactCitation {
  readonly source: SourceId;
  readonly locator: string;
  /** The exact claim the source supports. */
  readonly claim: string;
}

export interface Person {
  readonly name: LocalizedText;
  readonly born: number;
  readonly died: number;
  /** Wikidata id — the source of the dates. */
  readonly wikidata: string;
}

/**
 * A law of nature, or a definition / model, that one or more formulas express.
 * Historical facts are sourced just like numbers: attributions in popular texts
 * are often wrong.
 */
export interface LawSpec {
  readonly id: string;
  readonly kind: 'law' | 'definition' | 'model';
  readonly name: LocalizedText;
  readonly statement: LeveledText;
  readonly history: {
    readonly people: readonly Person[];
    /** 'discovered' — these people discovered it; 'associated' — no single discoverer, names are context. */
    readonly role: 'discovered' | 'associated';
    /** e.g. "1701", "1807–1822" */
    readonly when: string;
    readonly work?: string;
    readonly story: LeveledText;
    readonly citations: readonly FactCitation[];
  };
  /** Where the law stops working — shown from `advanced` level. */
  readonly limits?: LeveledText;
}

/**
 * Link to a school curriculum, backed by an exact quote from the programme
 * document (a Source), so the grade can be re-checked.
 */
export interface CurriculumRef {
  /** Id in CURRICULA (country + programme). */
  readonly program: string;
  readonly grade: number;
  /** quantitative — students calculate with it; qualitative — the idea only, no formula. */
  readonly depth: 'quantitative' | 'qualitative';
  /** Exact wording from the programme, in its original language. */
  readonly quote: string;
}

/**
 * A national (or regional) school programme. Countries are added over time;
 * nothing in the engine or texts assumes a particular country.
 */
export interface Curriculum {
  readonly id: string;
  /** ISO 3166-1 alpha-2 country code. */
  readonly country: string;
  readonly name: LocalizedText;
  /** Source documenting this programme (for quotes and grade checks). */
  readonly source: SourceId;
  /** Age at which grade 1 usually starts — lets the UI relate grades to levels. */
  readonly firstGradeAge: number;
  /** A short label for chips and filters: «НУШ · Фізика». */
  readonly short?: LocalizedText;
}
