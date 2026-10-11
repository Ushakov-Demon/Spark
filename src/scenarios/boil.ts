import { createState, type SystemState } from '../core/state.js';
import { celsius, kilograms, squareMeters, thermalConductance, watts } from '../core/units.js';
import { heater, reservoir, thermalBody } from '../domains/thermal/entities.js';
import { convectionLink, thermalLink } from '../domains/thermal/links.js';
import { CONVECTION, MATERIALS } from '../domains/thermal/materials.js';

export type PotMetal = 'steel' | 'aluminium' | 'iron';

export interface BoilParams {
  /** Volume of water, litres. */
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly roomTemp: number; // °C
  readonly potMaterial: PotMetal;
  readonly potMass: number; // kg
  /** Electric hotplate power, W. */
  readonly power: number;
}

export const DEFAULT_BOIL: BoilParams = { liters: 20, startTemp: 20, roomTemp: 20, potMaterial: 'steel', potMass: 3, power: 2000 };

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
 * Heat water on an electric hotplate:
 *
 *   [hotplate] ─ contact ─ [pot] ─ wetted surface ─ [water] ─ open surface ─ [room]
 *                            └────────── outer side ───────────────────────────┘
 *
 * Contact conductance and the hotplate's own mass are scenario estimates;
 * convection coefficients come from the (estimate-level) CONVECTION table.
 * Evaporation is not modelled — near 100 °C real losses are larger.
 */
export function boilLab(p: BoilParams = DEFAULT_BOIL): SystemState {
  const water = MATERIALS.water;
  const metal = MATERIALS[p.potMaterial];
  const g = potGeometry(p.liters);
  const waterMass = (p.liters / 1000) * water.density.value; // L → m³ → kg
  return createState({
    entities: [
      heater({
        id: 'plate',
        label: { uk: 'Електроплита', en: 'Hotplate' },
        mass: kilograms(1.5),
        specificHeat: MATERIALS.iron.specificHeat.value,
        material: 'iron',
        power: watts(p.power),
        temperature: celsius(p.roomTemp),
      }),
      thermalBody({
        id: 'pot',
        label: { uk: `Каструля (${metal.name.uk.toLowerCase()})`, en: `Pot (${metal.name.en.toLowerCase()})` },
        mass: kilograms(p.potMass),
        specificHeat: metal.specificHeat.value,
        material: p.potMaterial,
        temperature: celsius(p.roomTemp),
      }),
      thermalBody({
        id: 'water',
        label: { uk: 'Вода', en: 'Water' },
        mass: kilograms(waterMass),
        specificHeat: water.specificHeat.value,
        material: 'water',
        temperature: celsius(p.startTemp),
      }),
      reservoir({ id: 'room', label: { uk: 'Повітря в кімнаті', en: 'Room air' }, temperature: celsius(p.roomTemp) }),
    ],
    connections: [
      thermalLink({ id: 'plate-pot', a: 'plate', b: 'pot', conductance: thermalConductance(60) }),
      convectionLink({ id: 'pot-water', a: 'pot', b: 'water', coefficient: CONVECTION.stillWater.value, area: squareMeters(g.wetted), dataRef: 'stillWater' }),
      convectionLink({ id: 'water-room', a: 'water', b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(g.waterSurface), dataRef: 'stillAir' }),
      convectionLink({ id: 'pot-room', a: 'pot', b: 'room', coefficient: CONVECTION.stillAir.value, area: squareMeters(g.outerSide), dataRef: 'stillAir' }),
    ],
    environment: { ambientTemperature: celsius(p.roomTemp) },
  });
}
