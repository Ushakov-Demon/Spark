import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { COMPONENTS, NACL_SOLUTE } from '../../src/components/index.js';
import { cellCurrent, cellReading, electrolysisGases, FARADAY, createElectricalSolver, isSupply } from '../../src/domains/electrical/index.js';
import { createThermalSolver, thermalEnergy, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { cellConstant, ELECTRODES, SUPPLIES } from '../../src/equipment/index.js';
import { verifySourcedValue } from '../../src/knowledge/verify.js';
import { labSetup, runProtocol, sampleOf, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(1) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const base: LabParams = { action: 'pass-current', substance: 'sea-water', liters: 0.2, startTemp: 20, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20, supply: { id: 'bench-supply', knob: 0.4 }, duration: 10 };
const run = (p: LabParams) => runProtocol({ base: p, steps: [{ kind: 'operation', action: 'pass-current', ...(p.supply ? { supply: p.supply } : {}), duration: p.duration ?? 10 }], simulation, commands, sampleEvery: seconds(60) })[0]!;
const supplyOf = (s: ReturnType<typeof labSetup>['state']) => Object.values(s.entities).find(isSupply)!;

describe('conductivity of the liquid', () => {
  it('sea water ≈ 5 S/m at 20 °C (CRC table, Wikipedia: ≈ 50 mS/cm)', () => {
    const sample = sampleOf(labSetup(base).state);
    expect(cellReading(sample).conductivity).toBeCloseTo(5.0, 1);
  });

  it('distilled water conducts ~70 000 times worse than sea water; oil — not at all', () => {
    const water = cellReading(sampleOf(labSetup({ ...base, substance: 'water' }).state)).conductivity;
    expect(water).toBeGreaterThan(1e-5);
    expect(water).toBeLessThan(1e-3);
    expect(cellReading(sampleOf(labSetup({ ...base, substance: 'sunflower-oil' }).state)).conductivity).toBe(0);
  });

  it('warmer conducts better (+2.12 %/K); frozen solid does not conduct', () => {
    const at = (t: number) => cellReading(sampleOf(labSetup({ ...base, startTemp: t }).state)).conductivity;
    expect(at(30) / at(20)).toBeCloseTo(1 + 10 * NACL_SOLUTE.conductivityTempCoeff!.value, 6);
    expect(at(-25)).toBe(0);
  });

  it('sourced data agree with their citations', () => {
    for (const v of [NACL_SOLUTE.conductivityTempCoeff!, NACL_SOLUTE.electrolysis!.voltage, COMPONENTS.water.electrical!.conductivity!, COMPONENTS.water.electrical!.electrolysis!.voltage]) expect(verifySourcedValue(v)).toEqual([]);
    for (const s of Object.values(SUPPLIES)) for (const v of [s.spec.voltage.data, s.spec.currentLimit, ...(s.spec.internalResistance ? [s.spec.internalResistance] : []), ...(s.spec.capacity ? [s.spec.capacity] : [])]) expect(verifySourcedValue(v), s.id).toEqual([]);
  });
});

describe('current, heat and gases', () => {
  it('Ohm with a counter-voltage: I = (U − U_d) / R; nothing below the decomposition voltage', () => {
    expect(cellCurrent(12, 2.19, 6, 0, 5)).toBeCloseTo(9.81 / 6, 9);
    expect(cellCurrent(1.5, 2.19, 6, 0, 5)).toBe(0);
    expect(cellCurrent(30, 2.19, 1, 0, 5)).toBe(5);
  });

  it('a 12 V supply drives ≈ 1.6 A through sea water and heats it; energy is conserved', () => {
    const o = run(base);
    const s = supplyOf(o.result.final);
    expect(s.state.current).toBeGreaterThan(1.2);
    expect(s.state.current).toBeLessThan(2.5);
    expect(sampleOf(o.result.final).state.temperature).toBeGreaterThan(sampleOf(o.result.initial).state.temperature + 1);
    // Everything the supply gave = heat in the liquid (driven source) + chemistry + heat inside the source.
    const heat = (o.result.final.entities['supply.heat' as never] as unknown as { state: { energyDelivered: number } }).state.energyDelivered;
    expect(heat + s.state.chemical + s.state.internal).toBeCloseTo(s.state.delivered, 6);
    // …and the thermal side accounts for all the heat it received.
    const absorbed = Object.values(o.result.final.entities).reduce((sum, e) => sum + (e.kind === 'thermal.reservoir' ? (e.state as { heatAbsorbed: number }).heatAbsorbed : 0), 0);
    expect(thermalEnergy(o.result.final) - thermalEnergy(o.result.initial) + absorbed).toBeCloseTo(heat, 0);
  });

  it("Faraday's law: 1 faraday of charge gives ½ mol of hydrogen", () => {
    const [h2, cl2] = electrolysisGases(NACL_SOLUTE.electrolysis!, FARADAY, 273.15);
    expect(h2!.component).toBe('hydrogen');
    expect(h2!.moles).toBeCloseTo(0.5, 12);
    expect(cl2!.component).toBe('chlorine');
    expect(h2!.volume * 1000).toBeCloseTo(11.2, 1); // 22.4 L/mol at 0 °C
  });

  it('a 9 V battery runs flat after its 550 mA·h', () => {
    const o = run({ ...base, liters: 0.2, supply: { id: 'battery-9v', knob: 1 }, duration: 120 });
    const s = supplyOf(o.result.final);
    expect(s.state.charge).toBeCloseTo(0.55 * 3600, -1);
    expect(s.state.current).toBe(0);
  });

  it('the cell constant of the standard electrodes is L / A = 30 1/m', () => {
    expect(cellConstant(ELECTRODES)).toBeCloseTo(30, 9);
  });
});

describe('the original idea: water on a burner → dissolve salt → current → heat → current again', () => {
  it('runs as one protocol on one sample; hot brine conducts better than cold', () => {
    const lamp = { id: 'bunsen-burner', rating: 1200, knob: 1 } as const;
    const bench = { id: 'bench-supply', knob: 0.4 } as const;
    const start: LabParams = { action: 'heat-to', target: 30, substance: 'water', liters: 0.2, startTemp: 20, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20, heater: lamp };
    const out = runProtocol({
      base: start,
      steps: [
        { kind: 'operation', action: 'heat-to', target: 30, heater: lamp },
        { kind: 'add', substance: 'table-salt', mass: 0.007, temperature: 20 },
        { kind: 'operation', action: 'pass-current', supply: bench, duration: 5 },
        { kind: 'operation', action: 'heat-to', target: 70, heater: lamp },
        { kind: 'operation', action: 'pass-current', supply: bench, duration: 5 },
      ],
      simulation,
      commands,
      sampleEvery: seconds(60),
    });
    expect(out.map((o) => o.status?.kind ?? (o.entry?.ok ? 'added' : 'refused'))).toEqual(['reached', 'added', 'reached', 'reached', 'reached']);
    const currentAt = (i: number) => supplyOf(out[i]!.result.final).state.current;
    // Same salt water, ≈ 40 °C hotter: ≈ +80 % conductivity, so more current at the same voltage.
    expect(currentAt(4)).toBeGreaterThan(1.4 * currentAt(2));
    // The battery-free bench supply kept counting charge across both current steps.
    expect(supplyOf(out[4]!.result.final).state.charge).toBeGreaterThan(supplyOf(out[2]!.result.final).state.charge);
  });
});
