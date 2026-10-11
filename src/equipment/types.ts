import type { LocalizedText } from '../knowledge/i18n.js';
import type { LeveledText } from '../knowledge/levels.js';
import type { License, SourceId, SourcedValue } from '../knowledge/types.js';
import type { VesselShape } from './geometry.js';

/**
 * Equipment catalog: everything an experimenter can put on the table.
 *
 * Every item has a common card (name, place in the taxonomy, description,
 * safety notes, media) plus a kind-specific specification. Items are data:
 * physics domains read the specification to build the scene (see
 * domains/thermal/assembly.ts), the UI reads the card.
 */

/** Leaf or inner node of the taxonomy, e.g. 'device.heater.household'. */
export type CategoryId = string;

export interface Category {
  readonly id: CategoryId;
  readonly parent: CategoryId | null;
  readonly name: LocalizedText;
}

/** Picture or 3D model of an item. Optional; added as they are made or found. */
export interface MediaAsset {
  readonly kind: 'image' | 'model3d';
  /** Path under web/public/equipment/ (served as /equipment/...) or an absolute URL. */
  readonly src: string;
  readonly format: 'svg' | 'png' | 'webp' | 'jpg' | 'glb' | 'gltf';
  /** Text alternative — required for accessibility. */
  readonly alt: LocalizedText;
  readonly license: License;
  readonly author: string;
  /** Where it came from, if not made for Spark. */
  readonly sourceUrl?: string;
}

export interface EquipmentCard {
  /** Stable id, used in saved experiments: 'gas-hob', 'beaker'. */
  readonly id: string;
  /** Leaf category. Household vs laboratory is part of the path. */
  readonly category: CategoryId;
  readonly name: LocalizedText;
  /** What it is and how it works — by experimenter level. */
  readonly description: LeveledText;
  /** Safety notes worth knowing before using the real thing. */
  readonly safety?: LeveledText;
  readonly media: readonly MediaAsset[];
}

// ---------------------------------------------------------------- heaters

/** How heat gets from the device into the experiment. */
export type HeatingMethod =
  | 'contact' //   hot plate touching the vessel bottom
  | 'flame' //     open flame under the vessel; part of the heat goes past it
  | 'induction' // currents induced in the vessel's own base
  | 'immersion'; // element placed in the liquid itself

export interface HeaterSpec {
  readonly method: HeatingMethod;
  /** knob — continuous power like a real stove; switch — on/off (choose a model by power). */
  readonly control: 'knob' | 'switch';
  /** Selectable nominal powers, W (small / medium / large burner, models…). */
  readonly ratings: readonly number[];
  readonly defaultRating: number;
  readonly ratingData: SourcedValue;
  /** Lowest working power as a fraction of the rating (a flame cannot burn at 0). */
  readonly minFraction: number;
  readonly minFractionData?: SourcedValue;
  /** flame / induction: share of the power that ends up in the vessel. */
  readonly vesselShare?: SourcedValue;
  /** Vessel materials it can heat at all (induction: ferromagnetic only). */
  readonly requiresMaterial?: { readonly materials: readonly string[]; readonly source: SourceId; readonly claim: string };
  /** contact / immersion: the device's own heated body. */
  readonly body?: {
    readonly mass: SourcedValue; // kg
    readonly material: string; // key in MATERIALS
    /** Area exchanging heat: plate → room (contact) or element → liquid (immersion), m². */
    readonly area: SourcedValue;
  };
  /** contact: plate → vessel bottom conductance when the bottom covers the whole plate, W/K. */
  readonly contactConductance?: SourcedValue;
  /** contact: plate diameter, m — a smaller vessel bottom touches only part of it. */
  readonly plateDiameter?: SourcedValue;
  /** immersion: element diameter, m — it must fit through the vessel opening. */
  readonly elementDiameter?: SourcedValue;
}

export interface HeaterItem extends EquipmentCard {
  readonly kind: 'heater';
  readonly spec: HeaterSpec;
  /** How the heater is named inside a sentence: "на газовій кухонній плиті" / "on a kitchen gas hob". */
  readonly phrase: LocalizedText;
}

// ---------------------------------------------------------------- vessels

export interface VesselSpec {
  /** Available capacities, litres. */
  readonly sizes: readonly number[];
  readonly defaultSize: number;
  /** Materials it is made of (keys in MATERIALS). */
  readonly materials: readonly string[];
  readonly defaultMaterial: string;
  /** Shape and proportions (see geometry.ts). */
  readonly shape: VesselShape;
  /** Wall thickness, m — glass walls slow heat down noticeably, thin metal hardly. */
  readonly wallThickness: SourcedValue;
  /** Typical empty mass: base + perLiter × capacity, kg (the experimenter can override). */
  readonly massModel: { readonly base: number; readonly perLiter: number; readonly data: SourcedValue };
  /** 'optional' — the experimenter may put a lid on. */
  readonly lid: 'none' | 'optional';
  /** Lid mass as a fraction of the vessel mass. */
  readonly lidMassFraction?: SourcedValue;
}

export interface VesselItem extends EquipmentCard {
  readonly kind: 'vessel';
  readonly spec: VesselSpec;
  /** "у сталевій каструлі" / "in a steel pot" — per material (grammar differs per language). */
  readonly phraseIn: Readonly<Record<string, LocalizedText>>;
}

export type EquipmentItem = HeaterItem | VesselItem;
export type EquipmentKind = EquipmentItem['kind'];
