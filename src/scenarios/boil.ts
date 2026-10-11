import { createState, type SystemState } from '../core/state.js';
import { celsius } from '../core/units.js';
import { HEATERS, type HeaterId } from '../equipment/heaters.js';
import { VESSELS, type VesselId } from '../equipment/vessels.js';
import { placeHeater, placeVessel } from '../domains/thermal/assembly.js';
import { reservoir } from '../domains/thermal/entities.js';
import type { LocalizedText } from '../knowledge/i18n.js';

/** Everything the experimenter chooses for "heat water". */
export interface HeatingParams {
  readonly heater: HeaterId;
  /** Nominal power of the chosen heater (one of its ratings), W. */
  readonly rating: number;
  /** Knob position 0 … 1 (0 = off). Switch-type heaters: > 0 = on. */
  readonly knob: number;
  readonly vessel: VesselId;
  /** Vessel capacity, litres. */
  readonly size: number;
  readonly material: string;
  /** Empty vessel mass, kg (default: typical for the size). */
  readonly vesselMass?: number;
  readonly lid: boolean;
  /** Water, litres (≤ size). */
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly roomTemp: number; // °C
}

export const DEFAULT_HEATING: HeatingParams = {
  heater: 'electric-hotplate',
  rating: 2000,
  knob: 1,
  vessel: 'pot',
  size: 3,
  material: 'steel',
  lid: false,
  liters: 2,
  startTemp: 20,
  roomTemp: 20,
};

/** Fixed ids so a UI can find the heater (to turn its knob) and the water. */
export const SOURCE_ID = 'heater';
export const VESSEL_ID = 'vessel';
export const WATER_ID = 'water';
export const ROOM_ID = 'room';

export interface HeatingSetup {
  readonly state: SystemState;
  readonly warnings: readonly LocalizedText[];
}

/** Heat water: one vessel on/with one heater, in a room. Built from equipment pieces. */
export function heatingSetup(p: HeatingParams = DEFAULT_HEATING): HeatingSetup {
  const vesselItem = VESSELS[p.vessel];
  const vessel = placeVessel({
    item: vesselItem,
    id: VESSEL_ID,
    liquidId: WATER_ID,
    size: p.size,
    material: p.material,
    ...(p.vesselMass === undefined ? {} : { mass: p.vesselMass }),
    lid: p.lid,
    liters: p.liters,
    startTemp: p.startTemp,
    roomId: ROOM_ID,
    roomTemp: p.roomTemp,
  });
  const heater = placeHeater({
    item: HEATERS[p.heater],
    id: SOURCE_ID,
    rating: p.rating,
    knob: p.knob,
    vessel: { item: vesselItem, id: VESSEL_ID, liquidId: WATER_ID, material: p.material, size: p.size, liters: p.liters },
    roomId: ROOM_ID,
    roomTemp: p.roomTemp,
    liquidTemp: p.startTemp,
  });
  const room = celsius(p.roomTemp);
  const state = createState({
    entities: [...vessel.entities, ...heater.entities, reservoir({ id: ROOM_ID, label: { uk: 'Повітря в кімнаті', en: 'Room air' }, temperature: room })],
    connections: [...vessel.connections, ...heater.connections],
    environment: { ambientTemperature: room },
  });
  return { state, warnings: [...vessel.warnings, ...heater.warnings] };
}

export const heatingLab = (p: HeatingParams = DEFAULT_HEATING): SystemState => heatingSetup(p).state;

// ---- "Boil N litres on an electric hotplate" (console `npm run boil`) -------
export type PotMetal = 'steel' | 'aluminium' | 'iron';

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

/** A pot filled to the brim, on an electric hotplate. */
export const boilLab = (p: BoilParams = DEFAULT_BOIL): SystemState =>
  heatingLab({
    heater: 'electric-hotplate',
    rating: p.power,
    knob: 1,
    vessel: 'pot',
    size: p.liters,
    material: p.potMaterial,
    vesselMass: p.potMass,
    lid: false,
    liters: p.liters,
    startTemp: p.startTemp,
    roomTemp: p.roomTemp,
  });
