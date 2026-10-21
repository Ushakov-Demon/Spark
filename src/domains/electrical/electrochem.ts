import { COMPONENTS, molarMass, type Component, type ComponentId, type Electrolysis } from '../../components/index.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { FARADAY } from './gases.js';

/**
 * What a current does in an electrolytic cell, decided from the components' own data — the
 * same components that hold the physics. At the cathode the liquid gives what its electrolysis
 * says (hydrogen from water). At the anode the easier oxidation wins: if the anode is a metal
 * whose ions form at a lower standard potential than the liquid's own anode product (iron:
 * −0.44 V against chlorine 1.36 V), the anode itself dissolves; graphite never does. Ions of the
 * dissolved metal meet the hydroxide the cathode makes from water and fall out as a sludge.
 */
export interface CellReaction {
  /** The least voltage it needs (on top of the ohmic drop), V. */
  readonly voltage: number;
  readonly cathode: { readonly component: ComponentId; readonly electrons: number };
  /** A gas from the liquid (inert anode) — or the anode metal going into solution. */
  readonly anode: { readonly component: ComponentId; readonly electrons: number; readonly dissolves?: false } | { readonly component: ComponentId; readonly electrons: number; readonly dissolves: true; readonly ion: string };
  /** What falls out (the dissolved metal with hydroxide ions), per mole of metal: one formula unit. */
  readonly precipitate?: ComponentId;
  readonly note?: LocalizedText;
}

/** The cell with this liquid and this anode material (a component id; graphite if none). */
export function cellReaction(liquid: Electrolysis, anodeMaterial: string | undefined): CellReaction {
  const inert: CellReaction = {
    voltage: liquid.voltage.value,
    cathode: { component: liquid.cathode.component as ComponentId, electrons: liquid.cathode.electrons },
    anode: { component: liquid.anode.component as ComponentId, electrons: liquid.anode.electrons },
    ...(liquid.note ? { note: liquid.note } : {}),
  };
  const metal = anodeMaterial ? COMPONENTS[anodeMaterial as ComponentId] : undefined;
  const e = metal?.electrical?.electrode;
  if (!metal || !e || 'inert' in e) return inert;
  const ePotential = e.potential.value;
  const liquidAnode = liquid.anode.potential?.value;
  const cathodePotential = liquid.cathode.potential?.value;
  // The metal is oxidised more easily than the liquid would be: the anode dissolves.
  if (liquidAnode === undefined || cathodePotential === undefined || !(ePotential < liquidAnode)) return inert;
  // Hydroxide ions come with hydrogen from water at the cathode; then the metal ions fall out.
  const precipitate = e.hydroxide && liquid.cathode.component === 'hydrogen' ? (e.hydroxide as ComponentId) : undefined;
  return {
    voltage: Math.max(0, ePotential - cathodePotential),
    cathode: inert.cathode,
    // An alloy dissolves as its main metal (steel → iron).
    anode: { component: (e.metal ?? metal.id) as ComponentId, electrons: e.electrons, dissolves: true, ion: e.ion },
    ...(precipitate ? { precipitate } : {}),
  };
}

/** Moles of each product for a charge passed: Faraday's law n = Q / (z·F) at each electrode. */
export function reactionMoles(r: CellReaction, charge: number): { readonly cathode: number; readonly anode: number; readonly precipitate: number } {
  const anode = charge / (r.anode.electrons * FARADAY);
  return { cathode: charge / (r.cathode.electrons * FARADAY), anode, precipitate: r.precipitate ? anode : 0 };
}

/** Mass of so many moles of a component, kg. */
export const molesToMass = (c: ComponentId, moles: number): number => moles * (molarMass(COMPONENTS[c] as Component) ?? 0);

/**
 * A metal body lying in the liquid between the electrodes, wired to nothing (a bipolar electrode):
 * the field drops a voltage along it; where that drop is larger than its own cell voltage, part of
 * the current goes through the metal — its end facing the cathode dissolves, the end facing the
 * anode gives hydrogen. `drop` = the voltage the liquid would drop over the body's length, V;
 * `share` = the part of the current's path the body blocks (its face over the electrode area).
 * Returns the current through the body, A (an estimate: real ones depend on shape and position).
 */
export function bipolarCurrent(total: number, drop: number, cellVoltage: number, share: number): number {
  if (!(total > 0) || !(drop > cellVoltage)) return 0;
  return total * Math.min(1, share) * (1 - cellVoltage / drop);
}
