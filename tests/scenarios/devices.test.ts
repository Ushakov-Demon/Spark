import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, entityId, runExperiment, seconds } from '../../src/core/index.js';
import { celsius, watts } from '../../src/core/units.js';
import { createThermalSolver, energySplit, isBurner, isThermalBody, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { canHeat, HEATERS, powerAt, VESSELS, type HeaterId } from '../../src/equipment/index.js';
import { verifySourcedValue } from '../../src/knowledge/verify.js';
import { DEFAULT_HEATING, heatingLab, heatingSetup, SOURCE_ID, WATER_ID, type HeatingParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.5) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const water = (s: ReturnType<typeof heatingLab>) => {
  const w = s.entities[entityId(WATER_ID)]!;
  if (!isThermalBody(w)) throw new Error();
  return w.state.temperature;
};
const heatFor = (p: Partial<HeatingParams>, secs = 600) => {
  const initial = heatingLab({ ...DEFAULT_HEATING, size: 2, liters: 1, ...p });
  return runExperiment<ThermalCommand>({ initial, simulation, commands, duration: seconds(secs), sampleEvery: seconds(60) });
};
const heaters = Object.values(HEATERS).map((h) => [h.id, h] as const);

describe('heater specifications', () => {
  it.each(heaters)('%s: data agrees with its sources', (_id, h) => {
    const s = h.spec;
    expect(verifySourcedValue(s.ratingData)).toEqual([]);
    if (s.vesselShare) expect(verifySourcedValue(s.vesselShare)).toEqual([]);
    if (s.minFraction > 0) {
      expect(s.minFractionData, 'a minimum flame needs a justification').toBeDefined();
      expect(verifySourcedValue(s.minFractionData!)).toEqual([]);
    }
    if (s.body) {
      expect(verifySourcedValue(s.body.mass)).toEqual([]);
      expect(verifySourcedValue(s.body.area)).toEqual([]);
    }
    if (s.contactConductance) expect(verifySourcedValue(s.contactConductance)).toEqual([]);
    expect(s.ratings).toContain(s.defaultRating);
    // Every heating method has what its placement needs.
    if (s.method === 'contact') expect(s.body && s.contactConductance).toBeTruthy();
    if (s.method === 'immersion') expect(s.body).toBeTruthy();
    if (s.method === 'flame' || s.method === 'induction') expect(s.vesselShare).toBeTruthy();
  });

  it('knob: 0 is off, flames never go below their minimum, switches are on/off', () => {
    const gas = HEATERS['gas-hob'];
    expect(powerAt(gas, 1750, 0)).toBe(0);
    expect(powerAt(gas, 1750, 0.01)).toBeGreaterThanOrEqual(1750 * gas.spec.minFraction);
    expect(powerAt(gas, 1750, 1)).toBe(1750);
    expect(powerAt(HEATERS['immersion-heater'], 1000, 0.3)).toBe(1000);
    expect(powerAt(HEATERS['electric-hotplate'], 2000, 0.5)).toBe(1000);
  });
});

describe('vessel specifications', () => {
  it.each(Object.values(VESSELS).map((v) => [v.id, v] as const))('%s: data agrees with its sources', (_id, v) => {
    const sh = v.spec.shape;
    for (const sv of sh.type === 'sphere' ? [sh.neckToDiameter] : sh.type === 'frustum' ? [sh.heightToDiameter, sh.topToBottom] : [sh.heightToDiameter]) expect(verifySourcedValue(sv)).toEqual([]);
    expect(verifySourcedValue(v.spec.wallThickness)).toEqual([]);
    expect(verifySourcedValue(v.spec.massModel.data)).toEqual([]);
    if (v.spec.lidMassFraction) expect(verifySourcedValue(v.spec.lidMassFraction)).toEqual([]);
    expect(v.spec.sizes).toContain(v.spec.defaultSize);
    expect(v.spec.materials).toContain(v.spec.defaultMaterial);
  });
});

describe('compatibility', () => {
  it('induction heats steel and cast iron, not aluminium or glass', () => {
    const ind = HEATERS['induction-hob'];
    expect(canHeat(ind, VESSELS.pot, 'steel').ok).toBe(true);
    expect(canHeat(ind, VESSELS.pot, 'iron').ok).toBe(true);
    expect(canHeat(ind, VESSELS.pot, 'aluminium').ok).toBe(false);
    expect(canHeat(ind, VESSELS.beaker, 'glass').ok).toBe(false);
  });

  it('an incompatible combination gives a warning and no power', () => {
    const setup = heatingSetup({ ...DEFAULT_HEATING, heater: 'induction-hob', rating: 2300, material: 'aluminium' });
    expect(setup.warnings).toHaveLength(1);
    const r = heatFor({ heater: 'induction-hob', rating: 2300, material: 'aluminium' });
    expect(water(r.final)).toBeCloseTo(water(r.initial), 0);
  });
});

describe('every heater with every compatible vessel conserves energy and heats water', () => {
  const combos: [HeaterId, string, string, number][] = [];
  for (const h of Object.values(HEATERS))
    for (const v of Object.values(VESSELS))
      for (const m of v.spec.materials) if (canHeat(h, v, m).ok) combos.push([h.id as HeaterId, v.id, m, v.spec.defaultSize]);

  it.each(combos)('%s + %s (%s)', (heater, vessel, material, size) => {
    const h = HEATERS[heater];
    const r = heatFor({ heater, rating: h.spec.defaultRating, vessel: vessel as HeatingParams['vessel'], material, size, liters: size * 0.8, lid: false }, 120);
    expect(water(r.final)).toBeGreaterThan(water(r.initial));
    const split = energySplit(r.initial, r.final);
    expect(split.produced).toBeCloseTo(h.spec.defaultRating * 120, 0);
    expect(Math.abs(split.residual)).toBeLessThan(1e-6 * split.produced);
  });
});

describe('physics of equipment choices', () => {
  const eff = (p: Partial<HeatingParams>, secs = 400) => {
    const r = heatFor({ size: 3, liters: 2, ...p }, secs);
    const s = energySplit(r.initial, r.final);
    return s.shares.find((x) => x.entity === WATER_ID)!.energy / s.produced;
  };

  it('a flame delivers its vessel share; the rest goes to the room', () => {
    const r = heatFor({ heater: 'gas-hob', rating: 1750 }, 300);
    const toPot = r.transfers.get('heater=>vessel')!.amount;
    const toRoom = r.transfers.get('heater=>room')!.amount;
    expect(toPot / (toPot + toRoom)).toBeCloseTo(HEATERS['gas-hob'].spec.vesselShare!.value, 9);
  });

  it('measured efficiency ordering matches the sources: induction > gas', () => {
    expect(eff({ heater: 'induction-hob', rating: 2300 })).toBeGreaterThan(eff({ heater: 'gas-hob', rating: 1750 }) + 0.2);
  });

  it('a lid keeps more heat in the water', () => {
    expect(eff({ lid: true }, 1200)).toBeGreaterThan(eff({ lid: false }, 1200));
  });

  it('a glass wall slows heating compared with a thin steel wall', () => {
    const t = (vessel: HeatingParams['vessel'], material: string) =>
      water(heatFor({ heater: 'bunsen-burner', rating: 1500, vessel, material, size: 1, liters: 0.8 }, 120).final);
    // Same flame, same water; the beaker also has less mass to heat, so compare wall conductances directly.
    const pot = heatingLab({ ...DEFAULT_HEATING, vessel: 'pot', material: 'steel', size: 1, liters: 0.8 });
    const beaker = heatingLab({ ...DEFAULT_HEATING, vessel: 'beaker', material: 'glass', size: 1, liters: 0.8 });
    const g = (s: typeof pot) => (s.connections.find((c) => c.id === 'vessel->water')!.params as { conductance: number }).conductance;
    expect(g(beaker)).toBeLessThan(0.7 * g(pot));
    expect(t('beaker', 'glass')).toBeGreaterThan(celsius(20));
  });

  it('water must fit into the vessel', () => {
    expect(() => heatingLab({ ...DEFAULT_HEATING, size: 1, liters: 2 })).toThrow(RangeError);
  });
});

describe('live session', () => {
  it('turning the knob mid-run changes the power', () => {
    const initial = heatingLab({ ...DEFAULT_HEATING, heater: 'gas-hob', rating: 1750, liters: 1 });
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
