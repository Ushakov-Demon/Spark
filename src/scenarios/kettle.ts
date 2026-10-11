import { createState, type SystemState } from '../core/state.js';
import { celsius, kilograms, squareMeters, thermalConductance, watts } from '../core/units.js';
import { heater, reservoir, thermalBody } from '../domains/thermal/entities.js';
import { convectionLink, thermalLink } from '../domains/thermal/links.js';
import { CONVECTION, MATERIALS } from '../domains/thermal/materials.js';

export interface KettleOptions {
  readonly waterMass?: number; // kg
  readonly heaterPower?: number; // W
  readonly startTemperature?: number; // °C
  readonly roomTemperature?: number; // °C
}

/**
 * Electric kettle: a steel heating element immersed in water,
 * the water loses heat to the room through the kettle walls.
 *
 *   [heater] ──30 W/K── [water] ──h·A── [room air]
 */
export function kettleScenario(o: KettleOptions = {}): SystemState {
  const room = celsius(o.roomTemperature ?? 20);
  const start = celsius(o.startTemperature ?? 20);
  return createState({
    entities: [
      heater({
        id: 'heater',
        label: 'Нагревательный элемент',
        mass: kilograms(0.2),
        specificHeat: MATERIALS.steel.specificHeat,
        power: watts(o.heaterPower ?? 2000),
        temperature: start,
      }),
      thermalBody({
        id: 'water',
        label: 'Вода',
        mass: kilograms(o.waterMass ?? 1),
        specificHeat: MATERIALS.water.specificHeat,
        temperature: start,
      }),
      reservoir({ id: 'room', label: 'Воздух в комнате', temperature: room }),
    ],
    connections: [
      thermalLink({ id: 'heater-water', a: 'heater', b: 'water', conductance: thermalConductance(30) }),
      convectionLink({
        id: 'water-room',
        a: 'water',
        b: 'room',
        coefficient: CONVECTION.stillAir,
        area: squareMeters(0.06),
      }),
    ],
    environment: { ambientTemperature: room },
  });
}
