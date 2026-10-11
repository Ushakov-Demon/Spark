import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { bodyEnergy, createThermalSolver, isThermalBody, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { renderText } from '../../src/explain/index.js';
import { labSummary, runProtocol, sampleOf, type LabParams, type ProtocolStep } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const hob = { id: 'electric-hotplate', rating: 2000, knob: 1 } as const;
const BASE: LabParams = { action: 'boil', substance: 'water', liters: 1, startTemp: 20, vessel: 'pot', size: 2, material: 'steel', lid: false, heater: hob, roomTemp: 20 };
const run = (steps: ProtocolStep[], base = BASE) => runProtocol({ base, steps, simulation, commands, sampleEvery: seconds(60) });

describe('protocol: several steps on one sample', () => {
  it('boil → add salt → boil dry: the salt comes back as crystals', () => {
    const out = run([
      { kind: 'operation', action: 'boil', heater: hob },
      { kind: 'add', substance: 'table-salt', mass: 0.036, temperature: 20 },
      { kind: 'operation', action: 'evaporate', heater: hob },
    ]);
    expect(out.map((o) => o.status?.kind ?? (o.entry?.ok ? 'added' : 'refused'))).toEqual(['reached', 'added', 'reached']);
    // Each step starts where the previous one ended.
    expect(out[1]!.result.initial).toBe(out[0]!.result.final);
    expect(out[2]!.result.initial.time).toBe(out[1]!.result.final.time);
    // The pot stays on the same hot hob: the hob does not start cold again.
    const hobT = (st: typeof out[0]['result']['final']) => (st.entities['heater' as never] as unknown as { state: { temperature: number } }).state.temperature;
    expect(hobT(out[2]!.result.initial)).toBe(hobT(out[1]!.result.final));
    const end = sampleOf(out[2]!.result.final).state.mixture!;
    expect(end.water).toBeLessThan(1e-6);
    expect(end.crystals).toBeCloseTo(0.036, 9);
    // Headline times are per step, not since the very start.
    const text = renderText(labSummary(out[2]!.params!, out[2]!.result, out[2]!.status!, { level: 'school', locale: 'uk' }));
    expect(text).toMatch(/Вода з сіллю .* википіла досуха за/);
    expect(out[2]!.status!.kind === 'reached' && out[2]!.status!.at).toBeLessThan(out[2]!.result.final.time);
  });

  it('boil on the hob → cool in the fridge → freeze in the freezer: the vessel moves, the matter stays', () => {
    const out = run([
      { kind: 'operation', action: 'boil', heater: hob },
      { kind: 'operation', action: 'cool-to', target: 10, cooler: { id: 'fridge', setpoint: 4 } },
      { kind: 'operation', action: 'freeze', cooler: { id: 'freezer', setpoint: -18 } },
    ], { ...BASE, liters: 0.3, size: 0.6, vessel: 'beaker', material: 'glass' });
    expect(out.map((o) => o.status?.kind)).toEqual(['reached', 'reached', 'reached']);
    // The fridge step starts with boiling water and no hob.
    const s1 = out[1]!.result.initial;
    expect(sampleOf(s1).state.temperature - 273.15).toBeGreaterThan(99);
    expect(Object.keys(s1.entities)).not.toContain('heater');
    expect(Object.keys(s1.entities)).toContain('cooler');
    // Energy of the matter (vessel + water): moving it adds or removes nothing. The hot hob stays behind.
    const matter = (s: typeof s1) => Object.values(s.entities).reduce((sum, e) => sum + (isThermalBody(e) ? bodyEnergy(e) : 0), 0);
    expect(matter(out[1]!.result.initial)).toBeCloseTo(matter(out[0]!.result.final), 6);
    expect(sampleOf(out[2]!.result.final).state.solidFraction).toBe(1);
  });
});
