import { describe, expect, it } from 'vitest';
import { createSimulation, seconds } from '../../src/core/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { labFixes, labImpossibility, noProgress, stallFixes, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const base = { liters: 1, startTemp: 20, vessel: 'pot', size: 2, material: 'steel', lid: false, roomTemp: 20 } as const;

describe('when the goal cannot be reached, the lab offers changes that work', () => {
  it('sea water in a −18 °C freezer: set the freezer colder than the eutectic', () => {
    const p: LabParams = { ...base, action: 'freeze', substance: 'sea-water', cooler: { id: 'freezer', setpoint: -18 } };
    expect(labImpossibility(p)).toBeDefined();
    const fixes = labFixes(p);
    expect(fixes.map((f) => f.params.cooler)).toEqual([{ id: 'freezer', setpoint: -22 }]);
    for (const f of fixes) expect(labImpossibility(f.params)).toBeUndefined();
  });

  it('cooling below the surroundings: a colder cooler or a reachable target', () => {
    const fixes = labFixes({ ...base, action: 'cool-to', target: 2, substance: 'water', cooler: { id: 'fridge', setpoint: 4 } });
    expect(fixes.some((f) => f.params.target === 5)).toBe(true);
    expect(fixes.some((f) => f.params.cooler?.id === 'fridge' && f.params.cooler.setpoint === 1)).toBe(true);
  });

  it('heating water above its boiling point in an open pot: lower the target', () => {
    const fixes = labFixes({ ...base, action: 'heat-to', target: 120, substance: 'water', heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } });
    expect(fixes.map((f) => f.params.target)).toEqual([100]);
  });

  it('a spirit lamp under a litre of water stalls: another heater, checked by calculation', () => {
    const p = { ...base, action: 'boil', substance: 'water', heater: { id: 'spirit-lamp', rating: 60, knob: 1 } } as LabParams;
    const fixes = stallFixes(p, simulation);
    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes.every((f) => f.params.heater?.id !== 'spirit-lamp')).toBe(true);
  });

  it('slow evaporation is not progress, except when boiling dry', () => {
    const a = { T: 311, s: 0, m: 1 };
    const b = { T: 311.01, s: 0, m: 0.99 };
    expect(noProgress({ ...base, action: 'boil', substance: 'water' }, a, b)).toBe(true);
    expect(noProgress({ ...base, action: 'evaporate', substance: 'water' }, a, b)).toBe(false);
  });
});
