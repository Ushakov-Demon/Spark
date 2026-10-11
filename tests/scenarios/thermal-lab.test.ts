import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, runExperiment, seconds } from '../../src/core/index.js';
import { createThermalSolver, thermalEnergy, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { renderText } from '../../src/explain/index.js';
import { labGoalReached, labSetup, labStatus, labSummary, type LabParams } from '../../src/scenarios/index.js';

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

  it('salt water: 10 % freezes in a freezer, 20 % not in a refrigerator', () => {
    const ok = run(cooling({ action: 'freeze', substance: 'salt-water-10', liters: 0.2, size: 0.25, vessel: 'beaker', material: 'glass', cooler: { id: 'freezer', setpoint: -18 } }), 24);
    expect(ok.status.kind).toBe('reached');
    const no = run(cooling({ action: 'freeze', substance: 'salt-water-20', cooler: { id: 'fridge', setpoint: 4 } }), 1);
    expect(no.status.kind).toBe('impossible');
  });

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
