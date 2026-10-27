import type { LocalizedText } from '../knowledge/i18n.js';
import type { CommandHandler } from '../core/commands.js';
import type { ExperimentLogEntry } from '../core/experiment.js';
import { entityId } from '../core/ids.js';
import { err, ok } from '../core/result.js';
import type { SystemState } from '../core/state.js';
import type { MeasurementRecord } from '../core/trace.js';
import { COMPONENTS, NACL_SOLUTE } from '../components/index.js';
import { G } from '../domains/mechanics/constants.js';
import { buoyantForce, submergedShare, weight } from '../domains/mechanics/formulas.js';
import { bodyMass, isThermalBody, type ThermalBody } from '../domains/thermal/entities.js';
import { solutionDensity, soluteBehaviour } from '../domains/thermal/mixture.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import { VESSELS, type VesselId } from '../equipment/vessels.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import type { SubstanceItem } from '../substances/types.js';
import { LAB_VESSEL_ID, SAMPLE_ID } from './thermal-lab.js';

/**
 * Measuring what is in the vessel and what a body weighs in air and in a
 * liquid: the level by the vessel's marks (a measuring cylinder), and a
 * dynamometer. Bodies float or sink by their density (Archimedes), and the
 * level shows the water they push aside.
 */

const ICE_DENSITY = COMPONENTS.water.phases.solid!.density!.value;
const WATER_DENSITY = COMPONENTS.water.phases.liquid!.density!.value;

const substanceOf = (b: ThermalBody): SubstanceItem | undefined => {
  const id = b.params.substance as SubstanceId | undefined;
  return id && id in SUBSTANCES ? SUBSTANCES[id] : undefined;
};

/** Density of the liquid in the vessel (what bodies float in), kg/m³; null — nothing liquid (all frozen). */
export function liquidDensity(state: SystemState): number | null {
  const b = state.entities[entityId(SAMPLE_ID)];
  if (!b || !isThermalBody(b)) return null;
  const mix = b.state.mixture;
  if (mix) return mix.water - mix.ice > 1e-9 ? solutionDensity(mix) : null;
  if ((b.state.solidFraction ?? 0) >= 1) return null;
  return substanceOf(b)?.liquid.density.value ?? WATER_DENSITY;
}

/** Density of a body put into the liquid, kg/m³ (ice when frozen, the solid itself for blocks). */
export function pieceDensity(piece: ThermalBody): number {
  // A closed hollow body (a stoppered test tube with sand): its mean density.
  if (piece.params.volume) return bodyMass(piece) / piece.params.volume;
  const sub = substanceOf(piece);
  if (!sub) return WATER_DENSITY;
  // A metal, salt: its own solid density, its melt's once molten.
  if (sub.melt) return (piece.state.solidFraction ?? 1) > 0 ? sub.liquid.density.value : (sub.melt.liquidDensity ?? sub.liquid.density).value;
  // While any of it is still solid (a melting cube), the solid part is what floats.
  const frozen = (piece.state.solidFraction ?? 0) > 0;
  return frozen ? (sub.freezing?.solidDensity?.value ?? ICE_DENSITY) : sub.liquid.density.value;
}

/** The share of a piece under the surface: < 1 — it floats; 1 — it sinks or rests on the bottom. */
export function pieceShare(state: SystemState, piece: ThermalBody): number {
  const rl = liquidDensity(state);
  const sub = substanceOf(piece);
  // A liquid layer (oil) is liquid, not a floating body; with nothing liquid around, everything rests.
  if (rl === null || (sub && !sub.category.startsWith('solid.') && (piece.state.solidFraction ?? 0) <= 0)) return 1;
  return submergedShare(pieceDensity(piece), rl);
}

/**
 * How close to the liquid's density a body floats inside the liquid — neither sinking nor coming up: within
 * this share. An estimate: a few grains of sand more or less in a test tube (≈ 0.05 g of ≈ 8 g); a body a bit
 * denser sinks slowly, a bit lighter comes up slowly, and in a lesson's minutes neither shows.
 */
export const FLOATS_INSIDE = { value: 0.005, unit: '', verification: 'estimate', note: 'Estimate: a few grains of sand in a test tube; slower drift is not seen in a lesson.' } as const;

/** Does the body float inside the liquid — under the surface, off the bottom (its density that of the liquid)? */
export function floatsInside(state: SystemState, piece: ThermalBody): boolean {
  const rl = liquidDensity(state);
  return rl !== null && Math.abs(pieceDensity(piece) - rl) / rl <= FLOATS_INSIDE.value;
}

/**
 * The volume up to the liquid level, m³: the liquid, the ice floating in it, the bodies under it.
 * A floating body (and ice) pushes aside its own mass of liquid — so melting ice does not raise the level.
 */
export function levelVolume(state: SystemState): number {
  const b = state.entities[entityId(SAMPLE_ID)];
  if (!b || !isThermalBody(b)) return 0;
  const rl = liquidDensity(state);
  let v = 0;
  const mix = b.state.mixture;
  if (mix) {
    const solution = mix.water - mix.ice + mix.salt - mix.crystals;
    const rs = rl ?? WATER_DENSITY;
    // Crystals on the bottom by their own density; ice floats (pushes aside its mass of liquid).
    const crystals = mix.solutes.reduce((a, s) => a + s.crystals / (soluteBehaviour(s.component)?.density ?? WATER_DENSITY), 0);
    v += solution / rs + crystals + (rl ? mix.ice / rl : mix.ice / ICE_DENSITY);
  } else {
    const sub = substanceOf(b);
    const m = bodyMass(b);
    const s = b.state.solidFraction ?? 0;
    // A metal or salt in a crucible: the solid part by its own density, the melt by the melt's (the solid sinks in it).
    if (sub?.melt) v += (m * s) / sub.liquid.density.value + (m * (1 - s)) / (sub.melt.liquidDensity ?? sub.liquid.density).value;
    else {
      const liquid = sub?.liquid.density.value ?? WATER_DENSITY;
      const solid = sub?.freezing?.solidDensity?.value ?? ICE_DENSITY;
      v += (m * (1 - s)) / liquid + (rl ? (m * s) / rl : (m * s) / solid);
    }
  }
  for (const e of Object.values(state.entities)) {
    if (!isThermalBody(e) || !e.id.startsWith(`${SAMPLE_ID}+`)) continue;
    const share = pieceShare(state, e);
    const sub = substanceOf(e);
    const isLayer = sub && !sub.category.startsWith('solid.') && (e.state.solidFraction ?? 0) <= 0.5;
    if (isLayer) v += bodyMass(e) / (sub?.liquid.density.value ?? WATER_DENSITY);
    else v += share < 1 && rl ? bodyMass(e) / rl : bodyMass(e) / pieceDensity(e);
  }
  return v;
}

// ---------------------------------------------------------------- commands

/** Look at the marks: the level of the liquid in the vessel (a measuring cylinder). */
export interface LevelCommand {
  readonly type: 'lab.read-level';
  /** The vessel and its capacity, L: whose marks are read, and where they end. */
  readonly vessel: string;
  readonly size: number;
}

/** Hang a body on the dynamometer — in the air, or lowered into the liquid in the vessel (it is not left there). */
export interface HangCommand {
  readonly type: 'lab.hang';
  readonly substance: string;
  readonly mass: number; // kg
  readonly into: 'air' | 'liquid';
  /** What the body is called ("невідомий брусок"), instead of its substance's name. */
  readonly label?: LocalizedText;
}


export const levelCommand: CommandHandler<LevelCommand> = {
  type: 'lab.read-level',
  apply(state, c) {
    const item = VESSELS[c.vessel as VesselId];
    if (!item) return err({ uk: `Невідомий посуд «${c.vessel}»`, en: `Unknown vessel "${c.vessel}"` });
    const division = item.spec.graduation?.value;
    if (!division) return err({ uk: `На посуді «${item.name.uk}» немає поділок — об’єм не виміряти. Візьми мірний циліндр.`, en: `The ${item.name.en.toLowerCase()} has no volume marks. Take a measuring cylinder.` });
    const exact = levelVolume(state);
    // Above the top mark there is nothing to read (and soon it overflows).
    const value = exact > (c.size / 1000) * 1.0001 ? null : Math.round(exact / division) * division;
    const record: MeasurementRecord = { kind: 'measurement', instrument: c.vessel, quantity: 'volume', value, exact, entities: [entityId(SAMPLE_ID)], inputs: { division } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const hangCommand: CommandHandler<HangCommand> = {
  type: 'lab.hang',
  apply(state, c) {
    const sub = SUBSTANCES[c.substance as SubstanceId];
    if (!sub || !sub.category.startsWith('solid.')) return err({ uk: 'На динамометр підвішують тверде тіло: брусок, кульку.', en: 'Hang a solid body on the dynamometer: a block, a marble.' });
    if (!(c.mass > 0)) return err({ uk: 'Маса має бути > 0', en: 'Mass must be > 0' });
    const rb = sub.liquid.density.value;
    const volume = c.mass / rb;
    const P = weight(c.mass, G);
    let exact = P;
    const inputs: Record<string, number> = { mass: c.mass, volume, g: G, P };
    if (c.into === 'liquid') {
      const rl = liquidDensity(state);
      if (rl === null) return err({ uk: 'У посуді немає рідини, у яку можна занурити тіло.', en: 'There is no liquid in the vessel to lower the body into.' });
      // A body less dense than the liquid floats: the spring goes slack.
      const share = submergedShare(rb, rl);
      const F = buoyantForce(rl, G, share * volume);
      exact = Math.max(0, P - F);
      Object.assign(inputs, { rhoLiquid: rl, F, share });
    }
    const dyn = SCALES.dynamometer;
    const value = scaleReading(dyn, exact);
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value, exact, entities: [], inputs };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

/** The readings in a log, in order. */
export function readingsOf<C extends { type: string }>(log: readonly ExperimentLogEntry<C>[]): { readonly time: number; readonly command: C; readonly record: MeasurementRecord }[] {
  const out: { time: number; command: C; record: MeasurementRecord }[] = [];
  for (const e of log) {
    if (!e.ok) continue;
    for (const r of e.trace) if (r.kind === 'measurement') out.push({ time: e.time, command: e.command, record: r });
  }
  return out;
}

/** A reading as an instrument shows it: "1 657 г", "62 мл", "0,6 Н"; null — out of range. */
export function formatMeasured(quantity: MeasurementRecord['quantity'], value: number | null, division: number, locale: 'uk' | 'en'): string {
  const uk = locale === 'uk';
  if (value === null) return quantity === 'volume' ? (uk ? 'вище за поділки' : 'above the marks') : uk ? 'перевантаження' : 'overload';
  const [k, unit] = quantity === 'mass' ? [1000, uk ? 'г' : 'g'] : quantity === 'volume' ? [1e6, uk ? 'мл' : 'mL'] : quantity === 'length' ? [100, uk ? 'см' : 'cm'] : quantity === 'time' ? [1, uk ? 'с' : 's'] : quantity === 'current' ? [1, uk ? 'А' : 'A'] : quantity === 'voltage' ? [1, uk ? 'В' : 'V'] : quantity === 'resistance' ? [1, uk ? 'Ом' : 'Ω'] : quantity === 'pressure' ? [0.01, uk ? 'гПа' : 'hPa'] : [1, uk ? 'Н' : 'N'];
  const digits = Math.max(0, Math.round(-Math.log10(division * k)));
  return `${new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value * k)} ${unit}`;
}

export const MEASURING_COMMANDS = [levelCommand, hangCommand] as const;
