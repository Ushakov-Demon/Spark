import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, runExperiment, seconds } from '../../src/core/index.js';
import { createThermalSolver, thermalEnergy, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { renderText } from '../../src/explain/index.js';
import { labGoalReached, labSetup, labStatus, labSummary, sampleOf, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);

const BASE: LabParams = {
  action: 'boil',
  substance: 'water',
  liters: 1,
  startTemp: 20,
  vessel: 'pot',
  size: 2,
  material: 'steel',
  lid: false,
  heater: { id: 'electric-hotplate', rating: 2000, knob: 1 },
  roomTemp: 20,
};

function run(p: LabParams, hours = 12) {
  const setup = labSetup(p);
  const result = runExperiment<ThermalCommand>({
    initial: setup.state,
    simulation,
    commands,
    duration: seconds(hours * 3600),
    sampleEvery: seconds(60),
    until: (s) => labGoalReached(p, s),
  });
  const status = labStatus(p, result, simulation, setup.warnings);
  const text = (locale: 'uk' | 'en' = 'uk') => renderText(labSummary(p, result, status, { level: 'school', locale }));
  return { status, text, result };
}

const cooling = (p: Partial<LabParams>): LabParams => {
  const { heater: _h, ...rest } = { ...BASE, ...p };
  void _h;
  return rest;
};

describe('thermal lab presets', () => {
  it('boil water on an electric hob', () => {
    const r = run(BASE);
    expect(r.status.kind).toBe('reached');
    expect(r.text()).toMatch(/Дистильована вода \(1 л\) у сталевій каструлі на електроплиті закипіла за/);
  });

  it('heat to 60 °C with a thermostat', () => {
    const r = run({ ...BASE, action: 'heat-to', target: 60 });
    expect(r.status.kind).toBe('reached');
    expect(r.text()).toContain('нагрілася до 60,0 °C');
  });

  it('water freezes in a freezer; energy balance closes', () => {
    const p = cooling({ action: 'freeze', liters: 0.2, size: 0.25, vessel: 'beaker', material: 'glass', cooler: { id: 'freezer', setpoint: -18 } });
    const r = run(p, 24);
    expect(r.status.kind).toBe('reached');
    expect(r.text()).toMatch(/у морозильній камері повністю замерзла за/);
    expect(r.text()).toContain('приховану теплоту замерзання');
  });

  it('ethanol will not freeze in a freezer — known before running', () => {
    const r = run(cooling({ action: 'freeze', substance: 'ethanol', cooler: { id: 'freezer', setpoint: -18 } }), 1);
    expect(r.status.kind).toBe('impossible');
    expect(r.text()).toMatch(/не замерзне\.[\s\S]*замерзає при [−-]114 °C/);
  });

  it('salt water: 10 % freezes only partly in a freezer, 20 % not at all in a refrigerator', () => {
    // −18 °C is above the eutectic (−21.1 °C): ice forms, a pocket of salty brine stays liquid.
    const part = run(cooling({ action: 'freeze', substance: 'salt-water-10', liters: 0.2, size: 0.25, vessel: 'beaker', material: 'glass', cooler: { id: 'freezer', setpoint: -18 } }), 6);
    expect(part.status.kind).toBe('impossible');
    const s = sampleOf(part.result.final).state.solidFraction!;
    expect(s).toBeGreaterThan(0.5);
    expect(s).toBeLessThan(1);
    const no = run(cooling({ action: 'freeze', substance: 'salt-water-20', cooler: { id: 'fridge', setpoint: 4 } }), 1);
    expect(no.status.kind).toBe('impossible');
  }, 20_000); // two long freezing runs: slow when the whole suite runs in parallel

  it('cool to 5 °C in a fridge works, to 2 °C does not', () => {
    expect(run(cooling({ action: 'cool-to', target: 5, liters: 0.3, size: 0.6, vessel: 'beaker', material: 'glass', cooler: { id: 'fridge', setpoint: 4 } }), 24).status.kind).toBe('reached');
    const no = run(cooling({ action: 'cool-to', target: 2, cooler: { id: 'fridge', setpoint: 4 } }), 1);
    expect(no.status.kind).toBe('impossible');
    expect(no.text()).toContain('не може охолонути нижче');
  });

  it('ice melts in the room', () => {
    const r = run(cooling({ action: 'melt', startTemp: -18, liters: 0.2, size: 0.25, vessel: 'beaker', material: 'glass' }), 24);
    expect(r.status.kind).toBe('reached');
    expect(r.text()).toMatch(/^\s*✅ Лід \(200 мл\) у скляному хімічному стакані у кімнаті повністю розтанув за/);
  });

  it('sunflower oil does not boil — it reaches its smoke point', () => {
    const r = run({ ...BASE, substance: 'sunflower-oil', liters: 0.5 });
    expect(r.status.kind).toBe('decomposes');
    expect(r.text()).toContain('починає димітися');
  });

  it('water cannot be heated above 100 °C in an open vessel', () => {
    const r = run({ ...BASE, action: 'heat-to', target: 120 }, 1);
    expect(r.status.kind).toBe('impossible');
  });

  it('a spirit lamp under a 1 L pot stalls; the reason is explained', () => {
    const r = run({ ...BASE, heater: { id: 'spirit-lamp', rating: 100, knob: 1 } }, 1);
    expect(r.status.kind).toBe('stalls');
    expect(r.text()).toContain('втрати зрівнюються');
  });

  it('energy is conserved in a cooling run', () => {
    const p = cooling({ action: 'cool-to', target: 10, cooler: { id: 'ice-bath', setpoint: 0 } });
    const r = run(p, 12);
    expect(r.status.kind).toBe('reached');
    const absorbed = Object.values(r.result.final.entities).reduce((s, e) => s + (e.kind === 'thermal.reservoir' ? (e.state as { heatAbsorbed: number }).heatAbsorbed : 0), 0);
    expect(Math.abs(thermalEnergy(r.result.final) - thermalEnergy(r.result.initial) + absorbed)).toBeLessThan(1e-6 * Math.abs(absorbed));
  });

  it('English headline', () => {
    expect(run(BASE).text('en')).toMatch(/Distilled water \(1 L\) in a steel pot on an electric hob boiled in/);
  });
});

describe('the Professor names what came of each step', () => {
  it('heating dissolves the crystals; cooling a supersaturating solution brings none; others crystallise', async () => {
    const { runProtocol, stepOutcome, crystalNote, LAB_COMMANDS } = await import('../../src/scenarios/index.js');
    const { createCommandRegistry, createSimulation, seconds } = await import('../../src/core/index.js');
    const { createThermalSolver } = await import('../../src/domains/thermal/index.js');
    const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
    const commands = createCommandRegistry(LAB_COMMANDS as never);
    const run = (substance: 'sodium-acetate' | 'copper-sulfate', mass: number, water: number, cool: number) =>
      runProtocol({ base: { roomTemp: 20, lid: false, vessel: 'beaker', size: 0.25, material: 'glass', liters: water, action: 'heat-to', target: 70, substance: 'water', startTemp: 20, heater: { id: 'electric-hotplate', rating: 2000, knob: 0.5 } }, simulation, commands: commands as never, sampleEvery: seconds(30), maxStepSeconds: 6 * 3600, steps: [
        { kind: 'add', substance, mass, temperature: 20 },
        { kind: 'operation', action: 'heat-to', target: 70, heater: { id: 'electric-hotplate', rating: 2000, knob: 0.5 } },
        { kind: 'operation', action: 'cool-to', target: cool, cooler: { id: 'fridge', setpoint: 4 } },
      ] });
    const acetate = run('sodium-acetate', 0.1, 0.02, 22);
    const note = (o: (typeof acetate)[number]) => crystalNote([o.result!.initial, ...o.result!.samples, o.result!.final], 'uk');
    expect(note(acetate[1]!)?.short).toBe('Усі кристали розчинилися!');
    expect(note(acetate[2]!)?.short).toBe('Кристали не випали — розчин пересичений!');
    const copper = run('copper-sulfate', 0.05, 0.1, 20);
    expect(note(copper[2]!)?.short).toBe('Випали кристали!');
    const o = copper[1]!;
    expect(stepOutcome(o.params!, o.result as never, o.status!, 'uk')).toMatch(/^Розчин мідного купоросу нагрівся до 70(,0)? °C за .+\. Усі кристали розчинилися!$/);
  }, 60_000);
});
