/**
 * Console lab: mix hot and cold water in a pot — you choose everything.
 *
 *   npm run lab                                     # "what happens if…?" with default conditions
 *   npm run lab -- --hot 0.3 --hot-temp 90 --pot glass
 *   npm run lab -- --predict 47.5                   # optional prediction, °C
 *   npm run lab -- --goal 40                        # optional goal, °C → what to change to hit it
 *   npm run lab -- --goal 40 --level novice --lang en --full
 *
 * Options: --cold kg, --cold-temp °C, --hot kg, --hot-temp °C, --pot aluminium|steel|glass,
 *          --pot-mass kg, --room °C, --wait s, --tol °C, --level, --lang uk|en, --full (whole report)
 */
import {
  createCommandRegistry,
  createSimulation,
  entityId,
  evaluateExpectation,
  runExperiment,
  seconds,
  solveKnob,
  type Expectation,
  type Knob,
} from '../src/core/index.js';
import { celsius, ZERO_CELSIUS_IN_KELVIN } from '../src/core/units.js';
import {
  analyzeTemperature,
  buildDebrief,
  createThermalSolver,
  isThermalBody,
  MATERIALS,
  THERMAL_COMMANDS,
  THERMAL_KNOWLEDGE,
  type ThermalCommand,
} from '../src/domains/thermal/index.js';
import { buildReport, formatQuantity, renderText, type ExplainContext } from '../src/explain/index.js';
import { isLocale, tr } from '../src/knowledge/i18n.js';
import { LEVELS, type Level } from '../src/knowledge/levels.js';
import { DEFAULT_MIXING, mixingLab, type MixingParams, type PotMaterial } from '../src/scenarios/index.js';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const num = (name: string, fallback: number): number => {
  const v = arg(name);
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) fail(`--${name} must be a number`);
  return n;
};
function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const level = (arg('level') ?? 'school') as Level;
const locale = arg('lang') ?? 'uk';
if (!LEVELS.includes(level)) fail(`--level ${LEVELS.join('|')}`);
if (!isLocale(locale)) fail('--lang uk|en');
const pot = (arg('pot') ?? DEFAULT_MIXING.potMaterial) as PotMaterial;
if (!['aluminium', 'steel', 'glass'].includes(pot)) fail('--pot aluminium|steel|glass');

const params: MixingParams = {
  coldMass: num('cold', DEFAULT_MIXING.coldMass),
  coldTemp: num('cold-temp', DEFAULT_MIXING.coldTemp),
  hotMass: num('hot', DEFAULT_MIXING.hotMass),
  hotTemp: num('hot-temp', DEFAULT_MIXING.hotTemp),
  potMaterial: pot,
  potMass: num('pot-mass', DEFAULT_MIXING.potMass),
  roomTemp: num('room', DEFAULT_MIXING.roomTemp),
  wait: num('wait', DEFAULT_MIXING.wait),
};
const ctx: ExplainContext = { level, locale };

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const run = (p: MixingParams) => {
  const setup = mixingLab(p);
  return runExperiment<ThermalCommand>({ ...setup, simulation, commands, sampleEvery: seconds(10) });
};
const waterTemp = (p: MixingParams): number => {
  const w = run(p).final.entities[entityId('water')];
  if (!w || !isThermalBody(w)) throw new Error('no water');
  return w.state.temperature;
};

let result;
try {
  result = run(params);
} catch (e) {
  fail(String(e));
}

// Optional prediction or goal.
const goal = arg('goal');
const predict = arg('predict');
const expectation: Expectation | undefined =
  goal !== undefined
    ? { kind: 'goal', probe: { entity: 'water', quantity: 'temperature' }, value: celsius(Number(goal)), tolerance: num('tol', 0.5) }
    : predict !== undefined
      ? { kind: 'prediction', probe: { entity: 'water', quantity: 'temperature' }, value: celsius(Number(predict)), tolerance: num('tol', 1) }
      : undefined;

const analysis = analyzeTemperature(result, 'water');
const outcome = expectation ? evaluateExpectation(expectation, analysis.final) : undefined;

// What could be changed — each knob replays the whole experiment.
const C = (c: number) => c + ZERO_CELSIUS_IN_KELVIN;
const knobs: Knob[] = [
  { id: 'hotMass', label: { uk: 'Маса гарячої води', en: 'Mass of hot water' }, current: params.hotMass, min: 0.01, max: 3, unit: 'kg', run: (v) => waterTemp({ ...params, hotMass: v }) },
  { id: 'coldMass', label: { uk: 'Маса холодної води', en: 'Mass of cold water' }, current: params.coldMass, min: 0.01, max: 3, unit: 'kg', run: (v) => waterTemp({ ...params, coldMass: v }) },
  {
    id: 'hotTemp',
    label: { uk: 'Температура гарячої води', en: 'Temperature of hot water' },
    current: C(params.hotTemp),
    min: C(Math.max(params.coldTemp, 0)),
    max: C(100),
    unit: 'K',
    run: (v) => waterTemp({ ...params, hotTemp: v - ZERO_CELSIUS_IN_KELVIN }),
  },
  { id: 'wait', label: { uk: 'Час очікування', en: 'Waiting time' }, current: params.wait, min: 1, max: 3600, unit: 's', run: (v) => waterTemp({ ...params, wait: Math.round(v) }) },
];
const solutions = outcome && outcome.expectation.kind === 'goal' && !outcome.hit ? knobs.map((k) => solveKnob(k, outcome.expectation.value, outcome.expectation.tolerance)) : undefined;

// Setup summary.
const q = (v: number, unit: string) => formatQuantity(v, unit, ctx);
const potName = tr(MATERIALS[pot].name, locale).toLowerCase();
const setupLines =
  locale === 'uk'
    ? [
        `У каструлі (${potName}, ${q(params.potMass, 'kg')}): ${q(params.coldMass, 'kg')} води за ${q(C(params.coldTemp), 'K')}.`,
        `Доливаємо ${q(params.hotMass, 'kg')} води за ${q(C(params.hotTemp), 'K')}, кімната ${q(C(params.roomTemp), 'K')}, чекаємо ${q(params.wait, 's')}.`,
      ]
    : [
        `In the pot (${potName}, ${q(params.potMass, 'kg')}): ${q(params.coldMass, 'kg')} of water at ${q(C(params.coldTemp), 'K')}.`,
        `Pour in ${q(params.hotMass, 'kg')} of water at ${q(C(params.hotTemp), 'K')}, room ${q(C(params.roomTemp), 'K')}, wait ${q(params.wait, 's')}.`,
      ];

console.log(`\n${locale === 'uk' ? '▌ Дослід: змішування води' : '▌ Experiment: mixing water'}\n`);
console.log(setupLines.join('\n'));
console.log(renderText(buildDebrief({ result, analysis, ...(outcome ? { outcome } : {}), ...(solutions ? { solutions } : {}), ctx })));
if (process.argv.includes('--full')) {
  console.log(renderText(buildReport({ title: locale === 'uk' ? 'Повний звіт' : 'Full report', level, locale, country: 'UA', result, simulation, domain: THERMAL_KNOWLEDGE, focusTime: 5 })));
}
