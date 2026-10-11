import type { ScheduledCommand } from '../core/experiment.js';
import { createState, type SystemState } from '../core/state.js';
import { celsius, kilograms, seconds, squareMeters, type Seconds } from '../core/units.js';
import type { ThermalCommand } from '../domains/thermal/commands.js';
import { thermalBody, reservoir } from '../domains/thermal/entities.js';
import { convectionLink } from '../domains/thermal/links.js';
import { CONVECTION, MATERIALS } from '../domains/thermal/materials.js';

export type PotMaterial = 'aluminium' | 'steel' | 'glass';

/** Everything the experimenter can choose. Temperatures in °C, masses in kg, time in s. */
export interface MixingParams {
  readonly coldMass: number;
  readonly coldTemp: number;
  readonly hotMass: number;
  readonly hotTemp: number;
  readonly potMaterial: PotMaterial;
  readonly potMass: number;
  readonly roomTemp: number;
  /** How long to wait after pouring before reading the thermometer. */
  readonly wait: number;
}

export const DEFAULT_MIXING: MixingParams = {
  coldMass: 0.5,
  coldTemp: 15,
  hotMass: 0.5,
  hotTemp: 80,
  potMaterial: 'aluminium',
  potMass: 0.4,
  roomTemp: 20,
  wait: 180,
};

export interface MixingSetup {
  readonly initial: SystemState;
  readonly schedule: readonly ScheduledCommand<ThermalCommand>[];
  readonly duration: Seconds;
}

/**
 * Lab: a pot with cold water stands in a room; hot water is poured in; after
 * `wait` seconds the water temperature is read. Matches the Ukrainian grade-8
 * lab «тепловий баланс за умов змішування води різної температури», but with
 * a real pot and real air — the things a paper calculation leaves out.
 *
 *   [pot] ─ water contact ─ [water] ─ surface ─ [room]
 *     └──────────── outer surface ──────────────┘
 *
 * Geometry (areas) is a typical 2–3 L pot; the transfer coefficients are
 * estimates and are reported as such.
 */
export function mixingLab(p: MixingParams = DEFAULT_MIXING): MixingSetup {
  const pot = MATERIALS[p.potMaterial];
  const initial = createState({
    entities: [
      thermalBody({
        id: 'pot',
        label: { uk: `Каструля (${pot.name.uk.toLowerCase()})`, en: `Pot (${pot.name.en.toLowerCase()})` },
        mass: kilograms(p.potMass),
        specificHeat: pot.specificHeat.value,
        material: p.potMaterial,
        temperature: celsius(p.roomTemp),
      }),
      thermalBody({
        id: 'water',
        label: { uk: 'Вода', en: 'Water' },
        mass: kilograms(p.coldMass),
        specificHeat: MATERIALS.water.specificHeat.value,
        material: 'water',
        temperature: celsius(p.coldTemp),
      }),
      reservoir({ id: 'room', label: { uk: 'Повітря в кімнаті', en: 'Room air' }, temperature: celsius(p.roomTemp) }),
    ],
    connections: [
      convectionLink({ id: 'pot-water', a: 'pot', b: 'water', coefficient: CONVECTION.stillWater.value, area: squareMeters(0.05), dataRef: 'stillWater' }),
      convectionLink({ id: 'water-room', a: 'water', b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(0.03), dataRef: 'stillAir' }),
      convectionLink({ id: 'pot-room', a: 'pot', b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(0.08), dataRef: 'stillAir' }),
    ],
    environment: { ambientTemperature: celsius(p.roomTemp) },
  });
  return {
    initial,
    schedule: [{ at: seconds(0), command: { type: 'thermal.pour', into: 'water', mass: kilograms(p.hotMass), temperature: celsius(p.hotTemp) } }],
    duration: seconds(p.wait),
  };
}
