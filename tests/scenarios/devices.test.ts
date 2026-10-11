import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, entityId, runExperiment, seconds } from '../../src/core/index.js';
import { celsius, watts } from '../../src/core/units.js';
import {
  createThermalSolver,
  deviceWorksWith,
  energySplit,
  HEATING_DEVICES,
  isBurner,
  isThermalBody,
  powerAt,
  THERMAL_COMMANDS,
  type ThermalCommand,
} from '../../src/domains/thermal/index.js';
import { verifySourcedValue } from '../../src/knowledge/verify.js';
import { DEFAULT_HEATING, heatingLab, SOURCE_ID, type HeatingParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.5) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const water = (s: ReturnType<typeof heatingLab>) => {
  const w = s.entities[entityId('water')]!;
  if (!isThermalBody(w)) throw new Error();
  return w.state.temperature;
};
const heatFor = (p: Partial<HeatingParams>, secs = 600) => {
  const initial = heatingLab({ ...DEFAULT_HEATING, liters: 1, potMass: 0.5, ...p });
  return runExperiment<ThermalCommand>({ initial, simulation, commands, duration: seconds(secs), sampleEvery: seconds(60) });
};

describe('heating devices catalog', () => {
  it.each(Object.values(HEATING_DEVICES).map((d) => [d.id, d] as const))('%s: data agrees with its sources', (_id, d) => {
    expect(verifySourcedValue(d.ratingData)).toEqual([]);
    if (d.vesselShare) expect(verifySourcedValue(d.vesselShare)).toEqual([]);
    if (d.minFraction > 0) {
      expect(d.minFractionData, 'a minimum flame needs a justification').toBeDefined();
      expect(verifySourcedValue(d.minFractionData!)).toEqual([]);
    }
    expect(d.ratings).toContain(d.defaultRating);
  });

  it('knob: 0 is off, flames never go below their minimum, switches are on/off', () => {
    const gas = HEATING_DEVICES['gas-hob'];
    expect(powerAt(gas, 1750, 0)).toBe(0);
    expect(powerAt(gas, 1750, 0.01)).toBeGreaterThanOrEqual(1750 * gas.minFraction);
    expect(powerAt(gas, 1750, 1)).toBe(1750);
    expect(powerAt(HEATING_DEVICES['immersion-heater'], 1000, 0.3)).toBe(1000);
    expect(powerAt(HEATING_DEVICES['electric-hotplate'], 2000, 0.5)).toBe(1000);
  });

  it('induction works with steel and iron, not with aluminium', () => {
    const ind = HEATING_DEVICES['induction-hob'];
    expect(deviceWorksWith(ind, 'steel')).toBe(true);
    expect(deviceWorksWith(ind, 'iron')).toBe(true);
    expect(deviceWorksWith(ind, 'aluminium')).toBe(false);
    const r = heatFor({ device: 'induction-hob', rating: 2300, potMaterial: 'aluminium' });
    expect(water(r.final)).toBeCloseTo(water(r.initial), 0); // nothing heated it (only room exchange)
    const ok = heatFor({ device: 'induction-hob', rating: 2300, potMaterial: 'steel' });
    expect(water(ok.final)).toBeGreaterThan(celsius(60));
  });
});

describe('every device conserves energy and heats water', () => {
  it.each(Object.values(HEATING_DEVICES).map((d) => [d.id, d] as const))('%s', (_id, d) => {
    const r = heatFor({ device: d.id, rating: d.defaultRating, knob: 1 }, 300);
    expect(water(r.final)).toBeGreaterThan(water(r.initial));
    const split = energySplit(r.initial, r.final);
    expect(split.produced).toBeCloseTo(d.defaultRating * 300, 0);
    expect(Math.abs(split.residual)).toBeLessThan(1e-6 * split.produced);
  });

  it('a flame delivers its vessel share; the rest goes to the room', () => {
    const r = heatFor({ device: 'gas-hob', rating: 1750 }, 300);
    const toPot = r.transfers.get('flame-pot')!.amount;
    const toRoom = r.transfers.get('flame-room')!.amount;
    expect(toPot / (toPot + toRoom)).toBeCloseTo(HEATING_DEVICES['gas-hob'].vesselShare!.value, 9);
  });

  it('measured efficiency ordering matches the sources: induction > gas', () => {
    const eff = (device: HeatingParams['device'], rating: number) => {
      const r = heatFor({ device, rating, liters: 2, potMass: 1 }, 400);
      const s = energySplit(r.initial, r.final);
      return s.shares.find((x) => x.entity === 'water')!.energy / s.produced;
    };
    expect(eff('induction-hob', 2300)).toBeGreaterThan(eff('gas-hob', 1750) + 0.2);
  });
});

describe('live session', () => {
  it('turning the knob mid-run changes the power', () => {
    const initial = heatingLab({ ...DEFAULT_HEATING, device: 'gas-hob', rating: 1750, liters: 1 });
    const s = createExperimentSession<ThermalCommand>({ initial, simulation, commands, sampleEvery: seconds(10) });
    s.advance(60);
    s.apply({ type: 'thermal.heater.set', entity: SOURCE_ID, power: watts(600) });
    s.advance(60);
    const b = s.state.entities[entityId(SOURCE_ID)]!;
    if (!isBurner(b)) throw new Error();
    expect(b.state.energyDelivered).toBeCloseTo(1750 * 60 + 600 * 60, 3);
    expect(s.result().log).toHaveLength(1);
  });

  it('session and scripted run give identical results', () => {
    const initial = heatingLab({ ...DEFAULT_HEATING, liters: 1 });
    const s = createExperimentSession<ThermalCommand>({ initial, simulation, commands, sampleEvery: seconds(10) });
    s.advance(120);
    const r = runExperiment<ThermalCommand>({ initial, simulation, commands, duration: seconds(120), sampleEvery: seconds(10) });
    expect(s.state).toEqual(r.final);
  });
});
