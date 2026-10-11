/**
 * Console experiment with explanations.
 *
 *   npm run experiment                                  # level "school", Ukrainian
 *   npm run experiment -- --level novice                # novice | school | advanced | expert | all
 *   npm run experiment -- --lang en --level advanced    # uk | en
 *   npm run experiment -- --level expert --at 120 --country UA
 *
 * Scenario: heat water in a kettle, pour in cold water, switch the kettle off
 * and watch it cool. Then the engine explains what it computed.
 */
import { createCommandRegistry, createSimulation, runExperiment, seconds, validateState } from '../src/core/index.js';
import { celsius, kilograms } from '../src/core/units.js';
import { createThermalSolver, THERMAL_COMMANDS, THERMAL_KNOWLEDGE, type ThermalCommand } from '../src/domains/thermal/index.js';
import { buildReport, renderText } from '../src/explain/index.js';
import { isLocale, LOCALES } from '../src/knowledge/i18n.js';
import { LEVELS, type Level } from '../src/knowledge/levels.js';
import { kettleScenario } from '../src/scenarios/index.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
}
const levelArg = arg('level') ?? 'school';
const levels: readonly Level[] = levelArg === 'all' ? LEVELS : [levelArg as Level];
const locale = arg('lang') ?? 'uk';
if (!levels.every((l) => (LEVELS as readonly string[]).includes(l)) || !isLocale(locale)) {
  console.error(`Usage: --level ${LEVELS.join('|')}|all  --lang ${LOCALES.join('|')}  [--country UA] [--at seconds]`);
  process.exit(1);
}
const country = arg('country') ?? 'UA';
const focusTime = Number(arg('at') ?? 100);

const initial = kettleScenario({ waterMass: 1, heaterPower: 2000, startTemperature: 20 });
const check = validateState(initial);
if (!check.ok) throw new Error(JSON.stringify(check.error));

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
const result = runExperiment<ThermalCommand>({
  initial,
  simulation,
  commands: createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS),
  duration: seconds(600),
  sampleEvery: seconds(10),
  schedule: [
    { at: seconds(90), command: { type: 'thermal.pour', into: 'water', mass: kilograms(0.3), temperature: celsius(15) } },
    { at: seconds(150), command: { type: 'thermal.heater.set', entity: 'heater', on: false } },
  ],
});

const title = locale === 'uk' ? 'Дослід «Чайник»' : 'Experiment «Kettle»';
for (const level of levels) {
  console.log(renderText(buildReport({ title, level, locale, country, result, simulation, domain: THERMAL_KNOWLEDGE, focusTime })));
}
