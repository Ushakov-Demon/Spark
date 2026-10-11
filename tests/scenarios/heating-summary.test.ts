import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, runExperiment, seconds, entityId } from '../../src/core/index.js';
import { celsius } from '../../src/core/units.js';
import { createThermalSolver, isThermalBody, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { renderText } from '../../src/explain/index.js';
import { DEFAULT_HEATING, heatingSetup, heatingStatus, heatingSummary, WATER_ID, type HeatingParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.5) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);

function run(p: HeatingParams, duration: number, untilBoil = true) {
  const setup = heatingSetup(p);
  const result = runExperiment<ThermalCommand>({
    initial: setup.state,
    simulation,
    commands,
    duration: seconds(duration),
    sampleEvery: seconds(10),
    ...(untilBoil
      ? {
          until: (s: typeof setup.state) => {
            const w = s.entities[entityId(WATER_ID)]!;
            return isThermalBody(w) && w.state.temperature >= celsius(100);
          },
        }
      : {}),
  });
  const status = heatingStatus(result, simulation, setup.warnings);
  const text = (locale: 'uk' | 'en' = 'uk') => renderText(heatingSummary(p, result, status, { level: 'school', locale }));
  return { status, text };
}

describe('heating headline', () => {
  it('boiled: names vessel, material and heater in one sentence', () => {
    const r = run({ ...DEFAULT_HEATING, heater: 'gas-hob', rating: 1750, material: 'aluminium' }, 3600);
    expect(r.status.kind).toBe('boiled');
    expect(r.text()).toMatch(/^\s*✅ Вода \(2 л\) в алюмінієвій каструлі на газовій кухонній плиті закипіла за \d+ хв/);
    expect(r.text('en')).toMatch(/Water \(2 L\) in an aluminium pot on a kitchen gas hob boiled in \d+ min/);
  });

  it('stopped early: forecasts the remaining time', () => {
    const r = run({ ...DEFAULT_HEATING }, 120, false);
    expect(r.status.kind).toBe('will-boil');
    expect(r.text()).toContain('Якщо продовжити, вона закипить приблизно ще за');
  });

  it('too weak: explains why it will never boil, with its maximum', () => {
    const r = run({ ...DEFAULT_HEATING, heater: 'spirit-lamp', rating: 100 }, 600);
    expect(r.status.kind).toBe('never-boils');
    if (r.status.kind !== 'never-boils') return;
    expect(r.status.maxTemp).toBeLessThan(celsius(100));
    expect(r.text()).toContain('не закипить');
    expect(r.text()).toContain('втрати зрівнюються');
    expect(r.text()).toContain('або кришка');
  });

  it('incompatible: says why nothing heats', () => {
    const r = run({ ...DEFAULT_HEATING, heater: 'induction-hob', rating: 2300, vessel: 'beaker', size: 0.6, liters: 0.4, material: 'glass' }, 60);
    expect(r.status.kind).toBe('no-heat');
    expect(r.text()).toContain('не нагрівається');
    expect(r.text()).toContain('скло');
  });

  it('heater off: says so', () => {
    const r = run({ ...DEFAULT_HEATING, knob: 0 }, 60);
    expect(r.status.kind).toBe('off');
    expect(r.text()).toContain('Нагрівач вимкнено');
  });
});
