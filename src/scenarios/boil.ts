import type { AnyConnection, AnyEntity } from '../core/entity.js';
import { createState, type SystemState } from '../core/state.js';
import { celsius, kilograms, squareMeters, thermalConductance, watts } from '../core/units.js';
import { deviceWorksWith, HEATING_DEVICES, powerAt, type DeviceId } from '../domains/thermal/devices.js';
import { burner, heater, reservoir, thermalBody } from '../domains/thermal/entities.js';
import { convectionLink, supplyLink, thermalLink } from '../domains/thermal/links.js';
import { CONVECTION, MATERIALS } from '../domains/thermal/materials.js';

export type PotMetal = 'steel' | 'aluminium' | 'iron';

export interface HeatingParams {
  readonly device: DeviceId;
  /** Nominal power of the chosen device (one of its ratings), W. */
  readonly rating: number;
  /** Knob position 0 … 1 (0 = off). Switch-type devices: any value > 0 = on. */
  readonly knob: number;
  /** Volume of water, litres. */
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly roomTemp: number; // °C
  readonly potMaterial: PotMetal;
  readonly potMass: number; // kg
}

export const DEFAULT_HEATING: HeatingParams = {
  device: 'electric-hotplate',
  rating: 2000,
  knob: 1,
  liters: 20,
  startTemp: 20,
  roomTemp: 20,
  potMaterial: 'steel',
  potMass: 3,
};

/** "Сталь (вуглецева)" → "сталь": keeps labels free of nested brackets. */
const plain = (name: string): string => name.replace(/\s*\(.*\)\s*/, '').toLowerCase();

/** The heat source always has this id, so a UI can turn its knob. */
export const SOURCE_ID = 'source';

/**
 * Pot geometry from its volume: a cylinder filled to the brim with height = diameter.
 *   V = π r² · 2r  →  r = (V / 2π)^(1/3)
 */
export function potGeometry(liters: number) {
  const v = liters / 1000;
  const r = Math.cbrt(v / (2 * Math.PI));
  const h = 2 * r;
  const top = Math.PI * r * r;
  const side = 2 * Math.PI * r * h;
  return { radius: r, height: h, waterSurface: top, wetted: top + side, outerSide: side };
}

/**
 * Heat water in a pot with any of the catalog devices.
 *
 *   contact:   [hotplate] ─ contact ─ [pot] … ; the hot plate also loses heat to the room
 *   flame:     [flame] ⇒ share → [pot], rest → [room]          (a flame has no mass)
 *   immersion: [heater] ─ in the water ─ [water]
 *   always:    [pot] ─ wetted surface ─ [water] ─ open surface ─ [room], [pot] ─ outer side ─ [room]
 *
 * Masses of the hotplate and immersion element, and the plate contact, are
 * scenario estimates; evaporation is not modelled.
 */
export function heatingLab(p: HeatingParams = DEFAULT_HEATING): SystemState {
  const device = HEATING_DEVICES[p.device];
  const water = MATERIALS.water;
  const metal = MATERIALS[p.potMaterial];
  const g = potGeometry(p.liters);
  const waterMass = (p.liters / 1000) * water.density.value; // L → m³ → kg
  // An induction hob with a non-magnetic pot does not detect it and stays off.
  const power = watts(deviceWorksWith(device, p.potMaterial) ? powerAt(device, p.rating, p.knob) : 0);
  const on = power > 0;
  const room = celsius(p.roomTemp);

  const entities: AnyEntity[] = [
    thermalBody({
      id: 'pot',
      label: { uk: `Каструля (${plain(metal.name.uk)})`, en: `Pot (${plain(metal.name.en)})` },
      mass: kilograms(p.potMass),
      specificHeat: metal.specificHeat.value,
      material: p.potMaterial,
      temperature: room,
    }),
    thermalBody({
      id: 'water',
      label: { uk: 'Вода', en: 'Water' },
      mass: kilograms(waterMass),
      specificHeat: water.specificHeat.value,
      material: 'water',
      temperature: celsius(p.startTemp),
    }),
    reservoir({ id: 'room', label: { uk: 'Повітря в кімнаті', en: 'Room air' }, temperature: room }),
  ];
  const connections: AnyConnection[] = [
    convectionLink({ id: 'pot-water', a: 'pot', b: 'water', coefficient: CONVECTION.stillWater.value, area: squareMeters(g.wetted), dataRef: 'stillWater' }),
    convectionLink({ id: 'water-room', a: 'water', b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(g.waterSurface), dataRef: 'stillAir' }),
    convectionLink({ id: 'pot-room', a: 'pot', b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(g.outerSide), dataRef: 'stillAir' }),
  ];

  switch (device.kind) {
    case 'contact':
      entities.push(
        heater({
          id: SOURCE_ID,
          label: device.name,
          mass: kilograms(1.5),
          specificHeat: MATERIALS.iron.specificHeat.value,
          material: 'iron',
          power,
          on,
          device: device.id,
          temperature: room,
        }),
      );
      connections.push(
        thermalLink({ id: 'source-pot', a: SOURCE_ID, b: 'pot', conductance: thermalConductance(60) }),
        // The exposed rim and underside of a hot plate; radiation is folded into h (estimate).
        convectionLink({ id: 'source-room', a: SOURCE_ID, b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(0.1), dataRef: 'stillAir' }),
      );
      break;
    case 'flame':
    case 'induction': {
      // Induction heats the pot base itself (the rest is lost in the hob and around the pot).
      const share = device.vesselShare?.value ?? 0.3;
      entities.push(burner({ id: SOURCE_ID, label: device.name, power, on, device: device.id }));
      connections.push(
        supplyLink({ id: 'flame-pot', a: SOURCE_ID, b: 'pot', share, dataRef: device.id }),
        supplyLink({ id: 'flame-room', a: SOURCE_ID, b: 'room', share: 1 - share, dataRef: device.id }),
      );
      break;
    }
    case 'immersion':
      entities.push(
        heater({
          id: SOURCE_ID,
          label: device.name,
          mass: kilograms(0.2),
          specificHeat: MATERIALS.steel.specificHeat.value,
          material: 'steel',
          power,
          on,
          device: device.id,
          temperature: celsius(p.startTemp),
        }),
      );
      // Element 315 mm × Ø 50 mm (sourced listing) → surface π·d·L ≈ 0.049 m².
      connections.push(
        convectionLink({ id: 'source-water', a: SOURCE_ID, b: 'water', coefficient: CONVECTION.stillWater.value, area: squareMeters(Math.PI * 0.05 * 0.315), dataRef: 'stillWater' }),
      );
      break;
  }

  return createState({ entities, connections, environment: { ambientTemperature: room } });
}

// ---- Backwards-compatible "boil on an electric hotplate" -------------------
export interface BoilParams {
  readonly liters: number;
  readonly startTemp: number;
  readonly roomTemp: number;
  readonly potMaterial: PotMetal;
  readonly potMass: number;
  /** Electric hotplate power, W. */
  readonly power: number;
}

export const DEFAULT_BOIL: BoilParams = { liters: 20, startTemp: 20, roomTemp: 20, potMaterial: 'steel', potMass: 3, power: 2000 };

export const boilLab = (p: BoilParams = DEFAULT_BOIL): SystemState =>
  heatingLab({ ...p, device: 'electric-hotplate', rating: p.power, knob: 1 });
