import { describe, expect, it } from 'vitest';
import {
  createCommandRegistry,
  createSimulation,
  entityId,
  evaluateExpectation,
  runExperiment,
  seconds,
  solveKnob,
} from '../../../src/core/index.js';
import { celsius, kelvin, toCelsius } from '../../../src/core/units.js';
import {
  analyzeTemperature,
  buildDebrief,
  createThermalSolver,
  equilibriumTemperature,
  isReservoir,
  isThermalBody,
  MATERIALS,
  THERMAL_COMMANDS,
  type ThermalCommand,
} from '../../../src/domains/thermal/index.js';
import { renderText } from '../../../src/explain/index.js';
import { DEFAULT_MIXING, mixingLab, type MixingParams } from '../../../src/scenarios/index.js';
import { kilograms } from '../../../src/core/units.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.1) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const run = (p: MixingParams = DEFAULT_MIXING, extra: Parameters<typeof runExperiment<ThermalCommand>>[0]['schedule'] = []) => {
  const setup = mixingLab(p);
  return runExperiment<ThermalCommand>({ ...setup, schedule: [...setup.schedule, ...(extra ?? [])], simulation, commands, sampleEvery: seconds(10) });
};

describe('energy transfers per connection', () => {
  const result = run();

  it('the room received exactly what flowed over its links', () => {
    const room = result.final.entities[entityId('room')]!;
    if (!isReservoir(room)) throw new Error();
    const intoRoom = [...result.transfers.values()].filter((t) => t.b === 'room').reduce((s, t) => s + t.amount, 0);
    expect(intoRoom).toBeCloseTo(room.state.heatAbsorbed, 6);
  });
});

describe('temperature analysis', () => {
  it('naive part equals the heat balance of the mixed portions', () => {
    const a = analyzeTemperature(run(), 'water');
    const c = MATERIALS.water.specificHeat.value;
    const expected = equilibriumTemperature([
      { mass: kilograms(0.5), specificHeat: c, temperature: celsius(15) },
      { mass: kilograms(0.5), specificHeat: c, temperature: celsius(80) },
    ]);
    expect(a.naive).toBeCloseTo(expected, 9);
    expect(toCelsius(kelvin(a.naive))).toBeCloseTo(47.5, 9);
  });

  it('contributions add up exactly to the final temperature', () => {
    const a = analyzeTemperature(run(), 'water');
    expect(Math.abs(a.residual)).toBeLessThan(1e-9);
    const w = run().final.entities[entityId('water')]!;
    if (!isThermalBody(w)) throw new Error();
    expect(a.final).toBeCloseTo(w.state.temperature, 9);
  });

  it('the pot takes heat, and a heavier pot takes more', () => {
    const light = analyzeTemperature(run(), 'water').contributions.find((c) => c.other === 'pot')!;
    const heavy = analyzeTemperature(run({ ...DEFAULT_MIXING, potMass: 1.2 }), 'water').contributions.find((c) => c.other === 'pot')!;
    expect(light.deltaT).toBeLessThan(0);
    expect(heavy.deltaT).toBeLessThan(light.deltaT);
  });

  it('manual interventions are accounted separately', () => {
    const r = run(DEFAULT_MIXING, [{ at: seconds(60), command: { type: 'thermal.temperature.set', entity: 'water', temperature: celsius(60) } }]);
    const a = analyzeTemperature(r, 'water');
    expect(a.interventions).not.toBe(0);
    expect(Math.abs(a.residual)).toBeLessThan(1e-9);
  });
});

describe('debrief', () => {
  const result = run();
  const analysis = analyzeTemperature(result, 'water');
  const probe = { entity: 'water', quantity: 'temperature' } as const;
  const text = (o?: ReturnType<typeof evaluateExpectation>, solutions?: Parameters<typeof buildDebrief>[0]['solutions']) =>
    renderText(buildDebrief({ result, analysis, ...(o ? { outcome: o } : {}), ...(solutions ? { solutions } : {}), ctx: { level: 'school', locale: 'uk' } }));

  it('without expectation: explains the result anyway', () => {
    const t = text();
    expect(t).toContain('Простий розрахунок');
    expect(t).toContain('«Каструля (алюміній)»: −');
    expect(t).not.toContain('Ціль');
  });

  it('prediction equal to the simple calculation is recognised', () => {
    const o = evaluateExpectation({ kind: 'prediction', probe, value: celsius(47.5), tolerance: 1 }, analysis.final);
    expect(text(o)).toContain('Прогноз збігається з простим розрахунком');
  });

  it('missed goal: suggests changes that really hit the goal', () => {
    const o = evaluateExpectation({ kind: 'goal', probe, value: celsius(40), tolerance: 0.5 }, analysis.final);
    expect(o.hit).toBe(false);
    const water = (p: MixingParams) => {
      const w = run(p).final.entities[entityId('water')]!;
      if (!isThermalBody(w)) throw new Error();
      return w.state.temperature;
    };
    const s = solveKnob(
      { id: 'hotMass', label: { uk: 'Маса гарячої води', en: 'Hot water mass' }, current: 0.5, min: 0.01, max: 3, unit: 'kg', run: (v) => water({ ...DEFAULT_MIXING, hotMass: v }) },
      celsius(40),
      0.5,
    );
    expect(s.status).toBe('found');
    if (s.status !== 'found') return;
    expect(Math.abs(water({ ...DEFAULT_MIXING, hotMass: s.value }) - celsius(40))).toBeLessThan(0.5);
    expect(text(o, [s])).toContain('Маса гарячої води: 380 г замість 500 г');
  });

  it('addresses the student without grammatical gender (uk)', () => {
    const o = evaluateExpectation({ kind: 'prediction', probe, value: celsius(30), tolerance: 1 }, analysis.final);
    for (const t of [text(), text(o)]) expect(t).not.toMatch(/\b(хотів|хотіла|зробив|зробила|передбачив|передбачила|врахував|врахувала)\b/);
  });
});
