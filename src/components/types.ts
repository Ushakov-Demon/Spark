import type { MediaAsset } from '../equipment/types.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { LeveledText } from '../knowledge/levels.js';
import type { SourcedValue } from '../knowledge/types.js';
import type { ElementSymbol } from './elements.js';

/**
 * A component — one substance with its own model: what it is made of, how it
 * behaves in each state of matter, when it melts and boils, how it dissolves,
 * conducts, burns. Every number carries its sources.
 *
 * One component = one file (src/components/<id>.ts). The engine never asks
 * "is this water?" — it asks the model ("do you boil? at what temperature?
 * how much of you dissolves in water at 40 °C?"), so a new substance needs a
 * new file, not changes in the physics. Domains read only the sections they
 * need: thermal — phases and transitions, electricity — `electrical`,
 * chemistry — composition and `inWater`.
 *
 * Temperatures in data are in °C, as in the sources.
 */
export type ComponentKind =
  /** A chemical element (iron, copper, O₂ as the element's usual form). */
  | 'element'
  /** A compound with a fixed formula (water, NaCl, sucrose). */
  | 'compound'
  /** A material with a variable composition (steel, glass, wood, sunflower oil, air). */
  | 'material';

export type Phase = 'solid' | 'liquid' | 'gas';

/** Family for grouping on shelves and in the reference ("acids", "metals"). */
export type ComponentGroup = 'water' | 'salt' | 'sugar' | 'alcohol' | 'acid' | 'oil' | 'gas' | 'metal' | 'alloy' | 'mineral' | 'material';

/** Properties of one state of matter. */
export interface PhaseProps {
  /** Special name of this state ("лід", "сухий лід"), if any. */
  readonly name?: LocalizedText;
  readonly density?: SourcedValue; // kg/m³
  readonly specificHeat?: SourcedValue; // J/(kg·K), at constant pressure
  readonly conductivity?: SourcedValue; // W/(m·K)
}

/** Vapour pressure model for evaporation below the boiling point (data, so states stay JSON). */
export type VapourPressureModel = { readonly kind: 'buck' } | { readonly kind: 'antoine'; readonly A: number; readonly B: number; readonly C: number };

/**
 * How a substance behaves dissolved in water — the "solute model". Data plus the
 * substance's own functions where a table is needed (solubility curve, freezing curve).
 */
export interface SoluteModel {
  /** Saturated mass fraction (solute / solution) at t, °C. */
  saturationFraction(t: number): number;
  /** Temperature at which ice starts to form in a solution with mass fraction w, °C. */
  freezingPointOf(w: number): number;
  /** Inverse: mass fraction of the liquid in equilibrium with ice at t, °C. */
  fractionFreezingAt(t: number): number;
  /** Lowest point where solution, ice and solid solute coexist; below it everything is solid. */
  readonly eutectic: { readonly w: number; readonly t: number };
  /** Density of the solution with mass fraction w, kg/m³. */
  solutionDensity(w: number): number;
  /** Particles per formula unit in solution (NaCl → Na⁺ + Cl⁻ = 2), for Raoult's law. */
  readonly vantHoff: SourcedValue;
  /** The tables behind the functions, for explanations. */
  readonly data: readonly SourcedValue[];
  /** Electrical conductivity of the solution at 20 °C, S/m, by mass fraction w. */
  conductivityAt20?(w: number): number;
  /** Relative growth of the conductivity per kelvin (≈ 0.02). */
  readonly conductivityTempCoeff?: SourcedValue;
  /** What a direct current does to the solution. */
  readonly electrolysis?: Electrolysis;
}

/** Electrolysis: the minimum voltage and the gases at the electrodes (Faraday: n = Q / (z·F)). */
export interface Electrolysis {
  /** Below this voltage (on top of the ohmic drop) no current flows, V. */
  readonly voltage: SourcedValue;
  /** Product at each electrode, electrons per molecule, and the standard potential of that half-reaction, V (vs SHE). */
  readonly cathode: { readonly component: string; readonly electrons: number; readonly potential?: SourcedValue };
  /** (With an inert anode — graphite. A metal anode may dissolve instead: see `ElectrodeBehaviour`.) */
  readonly anode: { readonly component: string; readonly electrons: number; readonly potential?: SourcedValue };
  readonly note?: LocalizedText;
}

/**
 * How a material behaves as an electrode. Graphite (like platinum) does not react: the liquid
 * itself is split. A metal can be oxidised: M → Mⁿ⁺ + n e⁻ — if that comes easier (a lower
 * standard potential) than what the liquid would give at an inert anode, the anode dissolves.
 */
export type ElectrodeBehaviour =
  | { readonly inert: true; readonly source: SourcedValue }
  | {
      /** The metal that goes into solution, if the material is an alloy (steel → iron). */
      readonly metal?: string;
      /** The ion it goes into solution as ("Fe²⁺"). */
      readonly ion: string;
      readonly electrons: number;
      /** E° of Mⁿ⁺/M, V (vs SHE). */
      readonly potential: SourcedValue;
      /** With the hydroxide ions a cathode makes from water, the ions fall out as this (a component id). */
      readonly hydroxide?: string;
    };

export interface InWater {
  /** 'miscible' — mixes in any proportion; otherwise grams per 100 g of water at `solubility.conditions`. */
  readonly solubility: 'miscible' | 'immiscible' | SourcedValue;
  /** Full model of the solution, when the engine can compute it (freezing, boiling, crystals). */
  readonly model?: SoluteModel;
  /** Splits into ions in water (conducts current then). */
  readonly ions?: readonly string[];
}

export interface Hazards {
  /** Catches fire easily (flash point near or below room temperature, or a flammable gas). */
  readonly flammable?: boolean;
  readonly corrosive?: boolean;
  readonly irritant?: boolean;
  /** Feeds a fire (oxygen). */
  readonly oxidizer?: boolean;
  /** Displaces oxygen in closed rooms. */
  readonly asphyxiant?: boolean;
  /** Flash point, °C. */
  readonly flashPoint?: SourcedValue;
}

export interface Component {
  readonly id: string;
  readonly kind: ComponentKind;
  readonly group: ComponentGroup;
  readonly name: LocalizedText;
  /** "Скільки чого": the name after an amount ("200 мл водню"); defaults to the name. */
  readonly genitive?: LocalizedText;
  /** Grammatical gender of the name in Ukrainian — verbs agree with it. */
  readonly gender: 'f' | 'm' | 'n';
  /** Chemical formula for display (H₂O). */
  readonly formula?: string;
  /** Atoms per formula unit; molar mass is computed from it with standard atomic weights. */
  readonly composition?: Readonly<Partial<Record<ElementSymbol, number>>>;
  /** For materials with a variable composition: main parts, mass fractions (approximate, for explanations). */
  readonly madeOf?: readonly { readonly part: LocalizedText; readonly fraction?: number }[];
  /** Wikidata item, e.g. 'Q283'. */
  readonly wikidata?: string;
  /** State at room conditions (20 °C, 1 atm). */
  readonly stateAtRoom: Phase;
  readonly phases: Readonly<Partial<Record<Phase, PhaseProps>>>;
  readonly melting?: { readonly point: SourcedValue; readonly latentHeat?: SourcedValue };
  readonly boiling?: { readonly point: SourcedValue; readonly latentHeat?: SourcedValue };
  /** Turns straight from solid into gas at 1 atm (dry ice). */
  readonly sublimation?: { readonly point: SourcedValue };
  /** Breaks down chemically on heating instead of (or before) melting / boiling. */
  readonly decomposes?: { readonly point: SourcedValue; readonly into?: LocalizedText };
  /** Evaporation below the boiling point. */
  readonly vapour?: {
    readonly pressure: VapourPressureModel;
    readonly data: SourcedValue;
    /** Latent heat at a lower temperature (it grows as temperature falls), °C and J/kg. */
    readonly latentLow?: { readonly temperature: number; readonly value: SourcedValue };
  };
  readonly inWater?: InWater;
  readonly electrical?: {
    /** Metals conduct; ionic substances only melted or dissolved; the rest are insulators. */
    readonly conducts: 'metal' | 'ions-in-solution' | 'insulator';
    readonly resistivity?: SourcedValue; // Ω·m, solid at 20 °C
    /** A liquid's own conductivity, S/m at 20 °C (distilled water conducts a little). */
    readonly conductivity?: SourcedValue;
    /** What a current does to the pure liquid (water splits into hydrogen and oxygen). */
    readonly electrolysis?: Electrolysis;
    /** As an electrode in a solution (graphite stays, iron dissolves). */
    readonly electrode?: ElectrodeBehaviour;
  };
  readonly magnetic?: 'ferromagnetic' | 'paramagnetic' | 'diamagnetic';
  readonly hazards?: Hazards;
  readonly description: LeveledText;
  readonly safety?: LeveledText;
  readonly media: readonly MediaAsset[];
  /** Simplifications of the model for this substance, shown in explanations. */
  readonly modelNotes?: readonly LocalizedText[];
}
