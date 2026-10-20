import { describe, expect, it } from 'vitest';
import { createCommandRegistry } from '../../src/core/index.js';
import { ELECTRICAL_COMMANDS } from '../../src/domains/electrical/index.js';
import { THERMAL_COMMANDS } from '../../src/domains/thermal/index.js';
import { addableTo, fitChoices, labSetup, substancesFor, vesselsFor, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const commands = createCommandRegistry<LabCommand>([...THERMAL_COMMANDS, ...ELECTRICAL_COMMANDS] as never);
const base: LabParams = { action: 'boil', substance: 'water', liters: 1, startTemp: 20, vessel: 'pot', size: 2, material: 'steel', lid: false, roomTemp: 20, heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } };
const ids = (xs: readonly { id: string }[]) => xs.map((x) => x.id);

describe('the shelf shows only what can work together', () => {
  it('melting and freezing need a solid state: no oil', () => {
    expect(ids(substancesFor('melt'))).not.toContain('sunflower-oil');
    expect(ids(substancesFor('freeze'))).not.toContain('sunflower-oil');
    expect(ids(substancesFor('melt'))).toContain('water');
  });

  it('boiling dry needs a boiling point; heating and current take any liquid', () => {
    expect(ids(substancesFor('evaporate'))).not.toContain('sunflower-oil');
    expect(ids(substancesFor('heat-to'))).toContain('sunflower-oil');
    expect(ids(substancesFor('pass-current'))).toContain('sunflower-oil');
  });

  it('an induction hob keeps only magnetic metal vessels; hobs drop round bottoms', () => {
    const induction = vesselsFor({ ...base, heater: { id: 'induction-hob', rating: 2000, knob: 1 } });
    for (const v of induction) expect(v.materials.every((m) => m !== 'aluminium' && m !== 'glass' && m !== 'copper'), v.vessel.id).toBe(true);
    expect(induction.map((v) => v.vessel.id)).not.toContain('flask-round');
    expect(vesselsFor(base).map((v) => v.vessel.id)).not.toContain('flask-round');
  });

  it('electrodes do not fit into a test tube', () => {
    const { heater: _h, ...rest } = base;
    void _h;
    const p: LabParams = { ...rest, action: 'pass-current', supply: { id: 'bench-supply', knob: 0.4 }, duration: 5 };
    expect(vesselsFor(p).map((v) => v.vessel.id)).not.toContain('test-tube');
  });

  it('fitChoices repairs a setup that no longer fits', () => {
    const q = fitChoices({ ...base, action: 'melt', substance: 'sunflower-oil', vessel: 'flask-round', size: 0.25, material: 'glass' });
    expect(q.substance).not.toBe('sunflower-oil');
    expect(q.vessel).not.toBe('flask-round');
  });

  it('only what the engine can really add to the contents is offered', () => {
    const water = ids(addableTo(labSetup(base).state, commands));
    expect(water).toContain('table-salt');
    expect(water).toContain('sea-water');
    expect(water).not.toContain('ethanol'); // mixing alcohol into water is not modelled
  });
});
