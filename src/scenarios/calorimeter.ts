import { createState, type SystemState } from '../core/state.js';
import { celsius, kilograms, thermalConductance } from '../core/units.js';
import { thermalBody } from '../domains/thermal/entities.js';
import { thermalLink } from '../domains/thermal/links.js';
import { MATERIALS } from '../domains/thermal/materials.js';

/**
 * Classic lab: drop a hot copper cylinder into cold water (ideal calorimeter,
 * no losses). Students compare the final temperature with the heat balance
 * equation  c₁m₁(t₁ − θ) = c₂m₂(θ − t₂).
 */
export function calorimeterScenario(): SystemState {
  return createState({
    entities: [
      thermalBody({
        id: 'copper',
        label: 'Медный цилиндр',
        mass: kilograms(0.5),
        specificHeat: MATERIALS.copper.specificHeat.value,
        material: 'copper',
        temperature: celsius(100),
      }),
      thermalBody({
        id: 'water',
        label: 'Вода',
        mass: kilograms(0.2),
        specificHeat: MATERIALS.water.specificHeat.value,
        material: 'water',
        temperature: celsius(20),
      }),
    ],
    connections: [thermalLink({ id: 'contact', a: 'copper', b: 'water', conductance: thermalConductance(20) })],
  });
}
