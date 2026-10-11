import type { AnyConnection, AnyEntity } from '../../core/entity.js';
import { celsius, kilograms, meters, specificHeat, squareMeters, thermalConductance, watts } from '../../core/units.js';
import { canHeat, powerAt, typicalVesselMass } from '../../equipment/compatibility.js';
import { vesselGeometry } from '../../equipment/geometry.js';
import type { CoolerItem, HeaterItem, VesselItem } from '../../equipment/types.js';
import type { SubstanceItem } from '../../substances/types.js';
import { substanceThermal } from './substance.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { burner, heater, mixtureBody, reservoir, thermalBody } from './entities.js';
import { solutionDensity } from '../../substances/nacl.js';
import { convectionLink, supplyLink, thermalLink, wallLink } from './links.js';
import { CONVECTION, MATERIALS, type MaterialName } from './materials.js';

/**
 * Building blocks for thermal setups: put a vessel (with water) on the table,
 * put a heater under / into it. Each call returns entities and connections with
 * the ids you give, so a scene can hold several vessels and heaters.
 */
export interface Piece {
  readonly entities: AnyEntity[];
  readonly connections: AnyConnection[];
  /** Things the experimenter should know (incompatible combination…). */
  readonly warnings: LocalizedText[];
}

export interface VesselPlacement {
  readonly item: VesselItem;
  /** Entity ids: the vessel body and the liquid in it. */
  readonly id: string;
  readonly liquidId: string;
  /** Capacity, litres (one of item.spec.sizes, or any value). */
  readonly size: number;
  readonly material: string;
  /** Empty mass, kg; default — typical mass for this size. */
  readonly mass?: number;
  readonly lid: boolean;
  /** What is inside (default: distilled water) and how much, litres of liquid. */
  readonly substance?: SubstanceItem;
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly roomId: string;
  readonly roomTemp: number; // °C
  /**
   * What surrounds the vessel walls (default: room air). In a freezer — cold forced air;
   * in an ice bath — cold water around the walls and the bottom.
   */
  readonly outside?: { readonly id: string; readonly convection: keyof typeof CONVECTION; readonly bottom: boolean };
  /** Where the open liquid surface (or the lid) loses heat (default: the room). */
  readonly surfaceTo?: string;
}

const plain = (name: string): string => name.replace(/\s*\(.*\)\s*/, '').toLowerCase();

export function placeVessel(v: VesselPlacement): Piece {
  const spec = v.item.spec;
  const material = MATERIALS[v.material as MaterialName];
  if (!material) throw new RangeError(`Unknown material "${v.material}"`);
  if (!spec.materials.includes(v.material)) throw new RangeError(`${v.item.id} is not made of ${v.material}`);
  if (!(v.liters > 0) || v.liters > v.size + 1e-9) throw new RangeError(`Water (${v.liters} L) must be > 0 and fit into ${v.size} L`);

  const g = vesselGeometry(spec.shape, v.size, v.liters);
  const lid = v.lid && spec.lid === 'optional';
  const mass = v.mass ?? typicalVesselMass(v.item, v.size);
  const lidId = `${v.id}.lid`;
  const substance = v.substance;
  const contents = substance ? substanceThermal(substance) : { specificHeat: MATERIALS.water.specificHeat.value, density: MATERIALS.water.density.value };
  const outside = v.outside ?? { id: v.roomId, convection: 'stillAir' as const, bottom: false };
  const surfaceTo = v.surfaceTo ?? v.roomId;
  const startsSolid = 'phase' in contents && contents.phase?.meltingPoint !== undefined && celsius(v.startTemp) < contents.phase.meltingPoint;
  const liquidLabel = substance ? (startsSolid && substance.solidName ? substance.solidName : substance.name) : { uk: 'Вода', en: 'Water' };
  const label = {
    uk: `${v.item.name.uk} (${plain(material.name.uk)}${lid ? ', з кришкою' : ''})`,
    en: `${v.item.name.en} (${plain(material.name.en)}${lid ? ', with lid' : ''})`,
  };

  const w = substance?.mixture?.saltFraction;
  // Water + salt: total mass from the solution density, then split into the components.
  const solutionMass = w === undefined ? 0 : (v.liters / 1000) * solutionDensity(w);
  const entities: AnyEntity[] = [
    thermalBody({ id: v.id, label, mass: kilograms(mass), specificHeat: material.specificHeat.value, material: v.material, temperature: celsius(v.roomTemp) }),
    w !== undefined ? mixtureBody({
      id: v.liquidId,
      label: liquidLabel,
      water: solutionMass * (1 - w),
      salt: solutionMass * w,
      temperature: celsius(v.startTemp),
      substance: substance!.id,
      ...('evaporation' in contents && contents.evaporation ? { evaporation: contents.evaporation } : {}),
    }) : thermalBody({
      id: v.liquidId,
      label: liquidLabel,
      mass: kilograms((v.liters / 1000) * contents.density),
      specificHeat: specificHeat(contents.specificHeat),
      ...(substance ? { substance: substance.id } : { material: 'water' }),
      ...('phase' in contents && contents.phase ? { phase: contents.phase } : {}),
      ...('evaporation' in contents && contents.evaporation ? { evaporation: contents.evaporation } : {}),
      temperature: celsius(v.startTemp),
    }),
  ];
  const connections: AnyConnection[] = [
    wallLink({
      id: `${v.id}->${v.liquidId}`,
      a: v.id,
      b: v.liquidId,
      conductivity: material.conductivity.value,
      thickness: meters(spec.wallThickness.value),
      material: v.material,
      coefficient: CONVECTION.stillWater.value,
      area: squareMeters(g.wetted),
      dataRef: 'stillWater',
    }),
    // Outer walls exchange heat with the surroundings; the bottom too if it sits in a bath.
    convectionLink({
      id: `${v.id}->${outside.id}`,
      a: v.id,
      b: outside.id,
      coefficient: CONVECTION[outside.convection].value,
      area: squareMeters(g.outerSide + (outside.bottom ? g.contactArea : 0)),
      dataRef: outside.convection,
    }),
  ];
  if (lid) {
    // A lid is its own body: water surface → air gap → lid → room. It is cooler than the
    // water, so it halves the surface loss in this model. Its main real effect — stopping
    // evaporation — is not modelled yet.
    entities.push(
      thermalBody({
        id: lidId,
        label: { uk: 'Кришка', en: 'Lid' },
        mass: kilograms(mass * (spec.lidMassFraction?.value ?? 0.25)),
        specificHeat: material.specificHeat.value,
        material: v.material,
        temperature: celsius(v.roomTemp),
      }),
    );
    connections.push(
      convectionLink({ id: `${v.liquidId}->${lidId}`, a: v.liquidId, b: lidId, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.freeSurface), dataRef: 'stillAir', surface: true }),
      convectionLink({ id: `${lidId}->${surfaceTo}`, a: lidId, b: surfaceTo, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.freeSurface), dataRef: 'stillAir' }),
    );
  } else {
    connections.push(
      convectionLink({ id: `${v.liquidId}->${surfaceTo}`, a: v.liquidId, b: surfaceTo, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.freeSurface), dataRef: 'stillAir', surface: true }),
    );
  }
  return { entities, connections, warnings: [] };
}

export interface HeaterPlacement {
  readonly item: HeaterItem;
  readonly id: string;
  readonly rating: number;
  /** Knob position 0 … 1 (switch-type: > 0 = on). */
  readonly knob: number;
  /** What it heats: the vessel it stands under, and the liquid (for immersion heaters). */
  readonly vessel: { readonly item: VesselItem; readonly id: string; readonly liquidId: string; readonly material: string; readonly size: number; readonly liters: number };
  readonly roomId: string;
  readonly roomTemp: number; // °C
  readonly liquidTemp: number; // °C — immersion heaters start at the liquid temperature
}

function contactFraction(h: HeaterPlacement, plateDiameter: number | undefined): number {
  if (!plateDiameter) return 1;
  const g = vesselGeometry(h.vessel.item.spec.shape, h.vessel.size, h.vessel.liters);
  return Math.min(1, g.contactArea / (Math.PI * (plateDiameter / 2) ** 2));
}

export function placeHeater(h: HeaterPlacement): Piece {
  const spec = h.item.spec;
  const compat = canHeat(h.item, h.vessel.item, h.vessel.material, h.vessel.size);
  const power = watts(compat.ok ? powerAt(h.item, h.rating, h.knob) : 0);
  const on = power > 0;
  const warnings = compat.ok ? [] : [compat.reason];
  const entities: AnyEntity[] = [];
  const connections: AnyConnection[] = [];

  switch (spec.method) {
    case 'contact': {
      const body = spec.body!;
      const mat = MATERIALS[body.material as MaterialName];
      entities.push(
        heater({ id: h.id, label: h.item.name, mass: kilograms(body.mass.value), specificHeat: mat.specificHeat.value, material: body.material, power, on, device: h.item.id, temperature: celsius(h.roomTemp) }),
      );
      connections.push(
        // Contact scales with how much of the plate the vessel bottom covers.
        thermalLink({ id: `${h.id}->${h.vessel.id}`, a: h.id, b: h.vessel.id, conductance: thermalConductance(spec.contactConductance!.value * contactFraction(h, spec.plateDiameter?.value)) }),
        convectionLink({ id: `${h.id}->${h.roomId}`, a: h.id, b: h.roomId, coefficient: CONVECTION.stillAir.value, area: squareMeters(body.area.value), dataRef: 'stillAir' }),
      );
      break;
    }
    case 'flame':
    case 'induction': {
      const share = spec.vesselShare?.value ?? 0;
      entities.push(burner({ id: h.id, label: h.item.name, power, on, device: h.item.id }));
      connections.push(
        supplyLink({ id: `${h.id}=>${h.vessel.id}`, a: h.id, b: h.vessel.id, share, dataRef: h.item.id }),
        supplyLink({ id: `${h.id}=>${h.roomId}`, a: h.id, b: h.roomId, share: 1 - share, dataRef: h.item.id }),
      );
      break;
    }
    case 'immersion': {
      const body = spec.body!;
      const mat = MATERIALS[body.material as MaterialName];
      entities.push(
        heater({ id: h.id, label: h.item.name, mass: kilograms(body.mass.value), specificHeat: mat.specificHeat.value, material: body.material, power, on, device: h.item.id, temperature: celsius(h.liquidTemp) }),
      );
      connections.push(
        convectionLink({ id: `${h.id}->${h.vessel.liquidId}`, a: h.id, b: h.vessel.liquidId, coefficient: CONVECTION.stillWater.value, area: squareMeters(body.area.value), dataRef: 'stillWater' }),
      );
      break;
    }
  }
  return { entities, connections, warnings };
}


export interface CoolerPlacement {
  readonly item: CoolerItem;
  readonly id: string;
  /** °C, within the cooler's setting range. */
  readonly setpoint: number;
}

/** A cooler is cold surroundings at its setpoint; pass its id as the vessel's `outside`. */
export function placeCooler(c: CoolerPlacement): Piece {
  const { min, max } = c.item.spec.setpoint;
  if (c.setpoint < min - 1e-9 || c.setpoint > max + 1e-9) throw new RangeError(`${c.item.id}: setpoint ${c.setpoint} °C outside ${min}…${max} °C`);
  return {
    entities: [reservoir({ id: c.id, label: c.item.name, temperature: celsius(c.setpoint), device: c.item.id })],
    connections: [],
    warnings: [],
  };
}

/** How a vessel should be surrounded inside a cooler. */
export const coolerSurroundings = (c: CoolerItem, id: string): NonNullable<VesselPlacement['outside']> => ({
  id,
  convection: c.spec.convection as keyof typeof CONVECTION,
  bottom: c.spec.method === 'bath',
});
