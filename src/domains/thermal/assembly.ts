import type { AnyConnection, AnyEntity } from '../../core/entity.js';
import { celsius, kilograms, meters, squareMeters, thermalConductance, watts } from '../../core/units.js';
import { canHeat, powerAt, typicalVesselMass } from '../../equipment/compatibility.js';
import { vesselGeometry } from '../../equipment/geometry.js';
import type { HeaterItem, VesselItem } from '../../equipment/types.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { burner, heater, thermalBody } from './entities.js';
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
  /** Water inside. */
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly roomId: string;
  readonly roomTemp: number; // °C
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
  const water = MATERIALS.water;
  const label = {
    uk: `${v.item.name.uk} (${plain(material.name.uk)}${lid ? ', з кришкою' : ''})`,
    en: `${v.item.name.en} (${plain(material.name.en)}${lid ? ', with lid' : ''})`,
  };

  const entities: AnyEntity[] = [
    thermalBody({ id: v.id, label, mass: kilograms(mass), specificHeat: material.specificHeat.value, material: v.material, temperature: celsius(v.roomTemp) }),
    thermalBody({
      id: v.liquidId,
      label: { uk: 'Вода', en: 'Water' },
      mass: kilograms((v.liters / 1000) * water.density.value),
      specificHeat: water.specificHeat.value,
      material: 'water',
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
    // Outer walls lose heat to the room; the bottom stands on the heater.
    convectionLink({ id: `${v.id}->${v.roomId}`, a: v.id, b: v.roomId, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.outerSide), dataRef: 'stillAir' }),
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
      convectionLink({ id: `${v.liquidId}->${lidId}`, a: v.liquidId, b: lidId, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.freeSurface), dataRef: 'stillAir' }),
      convectionLink({ id: `${lidId}->${v.roomId}`, a: lidId, b: v.roomId, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.freeSurface), dataRef: 'stillAir' }),
    );
  } else {
    connections.push(
      convectionLink({ id: `${v.liquidId}->${v.roomId}`, a: v.liquidId, b: v.roomId, coefficient: CONVECTION.stillAir.value, area: squareMeters(g.freeSurface), dataRef: 'stillAir' }),
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

