import type { CommandRegistry } from '../core/commands.js';
import type { SystemState } from '../core/state.js';
import { celsius, kilograms } from '../core/units.js';
import { canHeat, canHoldElectrodes, type Compatibility } from '../equipment/compatibility.js';
import { HEATERS } from '../equipment/heaters.js';
import { ELECTRODES } from '../equipment/supplies.js';
import type { VesselItem } from '../equipment/types.js';
import { VESSELS, type VesselId } from '../equipment/vessels.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import type { SubstanceItem } from '../substances/types.js';
import type { LabCommand } from './lab-knowledge.js';
import { OPERATIONS } from './operations/index.js';
import { SAMPLE_ID, type LabAction, type LabParams } from './thermal-lab.js';

/**
 * What can be chosen together. The shelf shows only what makes sense: the
 * operation decides which substances it accepts, the device which vessels it
 * can work with, the contents what can be added to them. All of it asks the
 * models; nothing here knows names.
 */

/** Substances an operation can be done with. */
export const substancesFor = (action: LabAction): SubstanceItem[] =>
  Object.values(SUBSTANCES).filter((s) => (s.category.startsWith('liquid.') || (isDrySample(s) && OPERATIONS[action].solids)) && (OPERATIONS[action].accepts?.(s) ?? true));

/** A solid that can be the sample itself (heated or melted dry): not one that burns (wood chars — no data for that). */
export const isDrySample = (s: SubstanceItem): boolean => s.category.startsWith('solid.') && !s.flammable;

/** Can this vessel (this material and size) be used with the chosen device? */
export function vesselWorks(p: LabParams, vessel: VesselItem, material: string, size: number): Compatibility {
  if (p.heater) return canHeat(HEATERS[p.heater.id], vessel, material, size);
  if (p.supply) return canHoldElectrodes(ELECTRODES, vessel, size);
  return { ok: true };
}

/** Vessels usable with the chosen device, with the materials and sizes that work. */
export function vesselsFor(p: LabParams): { readonly vessel: VesselItem; readonly materials: readonly string[]; readonly sizes: readonly number[] }[] {
  return Object.values(VESSELS)
    .map((vessel) => {
      const combos = vessel.spec.materials.flatMap((m) => vessel.spec.sizes.map((z) => ({ m, z, ok: vesselWorks(p, vessel, m, z).ok }))).filter((c) => c.ok);
      return { vessel, materials: [...new Set(combos.map((c) => c.m))], sizes: [...new Set(combos.map((c) => c.z))] };
    })
    .filter((x) => x.materials.length > 0);
}

/** Make the setup consistent after a choice: a substance the operation accepts, a vessel the device can work with. */
export function fitChoices(p: LabParams): LabParams {
  let q = p;
  const subs = substancesFor(q.action);
  if (!subs.some((s) => s.id === q.substance) && subs[0]) q = { ...q, substance: subs[0].id as SubstanceId };
  const vessels = vesselsFor(q);
  const current = vessels.find((v) => v.vessel.id === q.vessel);
  if (!current) {
    const next = vessels[0];
    if (next) {
      const size = next.sizes.includes(next.vessel.spec.defaultSize) ? next.vessel.spec.defaultSize : next.sizes[0]!;
      q = { ...q, vessel: next.vessel.id as VesselId, size, material: next.materials.includes(next.vessel.spec.defaultMaterial) ? next.vessel.spec.defaultMaterial : next.materials[0]!, lid: false, liters: Math.round(size * 0.7 * 1000) / 1000 };
    }
  } else if (!current.materials.includes(q.material) || !current.sizes.includes(q.size)) {
    const material = current.materials.includes(q.material) ? q.material : current.materials[0]!;
    const size = current.sizes.includes(q.size) ? q.size : current.sizes[0]!;
    q = { ...q, material, size, liters: Math.min(q.liters, size) };
  }
  return q;
}

/** What can be added to the vessel's contents right now (asked from the add command itself, a dry run). */
export function addableTo(state: SystemState, commands: CommandRegistry<LabCommand>): SubstanceItem[] {
  return Object.values(SUBSTANCES).filter((s) => commands.apply(state, { type: 'thermal.add', into: SAMPLE_ID, substance: s.id, mass: kilograms(0.001), temperature: celsius(20) }).ok);
}
