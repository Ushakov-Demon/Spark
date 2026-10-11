/**
 * Console demo: boil a kettle.  Run with `npm run demo`.
 * Shows the engine working end-to-end without any UI.
 */
import { createSimulation, entityId, seconds, toCelsius, validateState } from '../src/core/index.js';
import { createThermalSolver, heatForTemperatureChange, isHeater, isThermalBody, MATERIALS } from '../src/domains/thermal/index.js';
import { kettleScenario } from '../src/scenarios/index.js';
import { kilograms } from '../src/core/units.js';

const initial = kettleScenario({ waterMass: 1, heaterPower: 2000 });

const check = validateState(initial);
if (!check.ok) {
  console.error(check.error);
  process.exit(1);
}

const dt = seconds(0.1);
const sim = createSimulation({ solvers: [createThermalSolver()], fixedDt: dt });

const water = (s: typeof initial) => {
  const e = s.entities[entityId('water')];
  if (!e || !isThermalBody(e)) throw new Error('water missing');
  return e;
};
const heaterOf = (s: typeof initial) => {
  const e = s.entities[entityId('heater')];
  if (!e || !isHeater(e)) throw new Error('heater missing');
  return e;
};

console.log(' t, с  | вода, °C | ТЭН, °C | энергия, кДж');
console.log('-------+----------+---------+-------------');
let s = initial;
const printEvery = Math.round(15 / dt);
while (toCelsius(water(s).state.temperature) < 100 && s.time < 3600) {
  s = sim.tick(s, dt);
  if (s.step % printEvery === 0) {
    console.log(
      `${s.time.toFixed(0).padStart(6)} | ${toCelsius(water(s).state.temperature).toFixed(1).padStart(8)} | ` +
        `${toCelsius(heaterOf(s).state.temperature).toFixed(1).padStart(7)} | ${(heaterOf(s).state.energyDelivered / 1000).toFixed(0).padStart(11)}`,
    );
  }
}

const ideal = heatForTemperatureChange(kilograms(1), MATERIALS.water.specificHeat, 80) / 2000;
console.log(`\nВода закипела за ${s.time.toFixed(1)} с.`);
console.log(`Теория без потерь (t = c·m·ΔT / P): ${ideal.toFixed(1)} с — разница из-за нагрева ТЭНа и потерь в комнату.`);
