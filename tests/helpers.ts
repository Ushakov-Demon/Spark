import { createCommandRegistry, createSimulation, runExperiment, seconds, type ScheduledCommand } from '../src/core/index.js';
import { celsius, kilograms } from '../src/core/units.js';
import { createThermalSolver, THERMAL_COMMANDS, type ThermalCommand } from '../src/domains/thermal/index.js';
import { kettleScenario } from '../src/scenarios/index.js';

export const thermalSim = () => createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
export const thermalCommands = () => createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);

export const KETTLE_SCHEDULE: readonly ScheduledCommand<ThermalCommand>[] = [
  { at: seconds(90), command: { type: 'thermal.pour', into: 'water', mass: kilograms(0.3), temperature: celsius(15) } },
  { at: seconds(150), command: { type: 'thermal.heater.set', entity: 'heater', on: false } },
];

export function kettleRun(schedule: readonly ScheduledCommand<ThermalCommand>[] = KETTLE_SCHEDULE, duration = 300) {
  const simulation = thermalSim();
  const result = runExperiment<ThermalCommand>({
    initial: kettleScenario(),
    simulation,
    commands: thermalCommands(),
    schedule,
    duration: seconds(duration),
    sampleEvery: seconds(10),
  });
  return { simulation, result };
}
