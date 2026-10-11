import type { SystemState } from '../../core/state.js';
import type { ThermalBody } from '../../domains/thermal/entities.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { SubstanceItem } from '../../substances/types.js';
import type { LabParams } from '../thermal-lab.js';

export type Gender = 'f' | 'm' | 'n';

/**
 * What is missing for the goal, in terms the lab can act on: colder surroundings,
 * some heat, or a different target.
 */
export interface Needs {
  /** Surroundings colder than this, °C. */
  readonly colderThan?: number;
  /** A heater (or surroundings warmer than this, °C). */
  readonly heatAbove?: number;
  /** A target in this range, °C. */
  readonly target?: { readonly min?: number; readonly max?: number };
}

/** What an operation may look at when it judges the setup. */
export interface OperationContext {
  readonly p: LabParams;
  readonly sub: SubstanceItem;
  /** Temperature around the vessel: the cooler's setpoint or the room, °C. */
  readonly surroundingTemp: number;
  /** "у морозильній камері" / "in the room" — where the vessel stands. */
  where(locale: Locale): string;
}

/**
 * An operation the experimenter can choose: heat to…, boil, boil dry, cool to…,
 * freeze, melt. Each lives in its own file and knows everything about itself —
 * what it needs, when its goal is reached, why it may be impossible, how to talk
 * about it. The lab and the page only ask the operation; adding one = a new file
 * and a line in the registry.
 */
export interface Operation {
  readonly id: string;
  /** Button text: "Закип’ятити". */
  readonly label: LocalizedText;
  /** A heater, a cooler, either (melting also works in a warm room), or a power supply. */
  readonly uses: 'heater' | 'cooler' | 'either' | 'supply';
  /** Which way the temperature goes — for "the highest/lowest it can reach" and progress banners. */
  readonly direction: 'heating' | 'cooling';
  /** The experimenter sets a target temperature, °C (heat to…, cool to…). */
  readonly target?: { readonly default: number; readonly min: number; readonly max: number };
  /** The experimenter sets how long it runs, minutes (pass a current for 10 min). */
  readonly duration?: { readonly default: number; readonly min: number; readonly max: number };
  /** A thermostat holds the target (switches the heater off at the target). */
  readonly thermostat?: boolean;
  /** Model seconds per real second to start with: hours-long cooling runs faster. */
  readonly speed: number;
  /** Start temperature that makes sense for this operation and substance, °C. */
  startTemp(sub: SubstanceItem): number;
  /** Has the goal been reached? (The stop condition.) */
  reached(sample: ThermalBody, p: LabParams, sub: SubstanceItem, state: SystemState): boolean;
  /** The run stops not at the goal but at something else for this substance (oil smokes instead of boiling). */
  endsInstead?(sub: SubstanceItem): 'decomposes' | undefined;
  /** Why the goal can never be reached — known before running anything. */
  impossible?(ctx: OperationContext): LocalizedText | undefined;
  /** What would make it possible — the lab turns it into concrete fixes from the catalog. */
  needs?(ctx: OperationContext): Needs | undefined;
  /** "On paper" (no losses): the temperature to reach, °C, and extra energy on top, J. */
  paper?(p: LabParams, sub: SubstanceItem, mass: number): { readonly end: number; readonly extra?: number } | undefined;
  /** Losing mass is progress towards the goal (boiling dry); for other operations slow evaporation is not. */
  readonly massIsProgress?: boolean;
  /** Phase lines worth drawing on the chart. */
  readonly markers: readonly ('freezing' | 'boiling' | 'smoke' | 'target')[];
  /** The headline names the solid form ("Лід розтанув"). */
  readonly subjectIsSolid?: boolean;
  /** Verbs for the headline, agreeing with the subject's gender in Ukrainian. */
  readonly verbs: {
    readonly past: { readonly uk: Readonly<Record<Gender, string>>; readonly en: string };
    readonly future: LocalizedText;
    /** In a negative sentence "completely" sounds wrong: "не замерзне", "will not freeze". */
    readonly negative?: LocalizedText;
  };
  /** Extra lines when the goal is reached ("на дні залишилося 36 г солі"). */
  reachedNotes?(ctx: { readonly sample: ThermalBody; readonly state: SystemState; readonly initial: SystemState; readonly locale: Locale }): string[];
  /** Word before the time in the headline: "закипіла за 6 хв" (default), "пробула під струмом 10 хв" (none). */
  readonly durationWord?: LocalizedText;
  /** Replaces "X will not …" when the goal is impossible but something did happen (partly frozen). */
  impossibleHeadline?(sample: ThermalBody, subject: string, locale: Locale): string | undefined;
  /** Added to "it gave N J to its surroundings" (", most of it latent heat"). */
  readonly heatGivenNote?: LocalizedText;
}
