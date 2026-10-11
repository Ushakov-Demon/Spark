import { describe, expect, it } from 'vitest';
import { createSimulation, createState, createTraceCollector, entityId, seconds, type SystemState } from '../../../src/core/index.js';
import { celsius, kilograms, specificHeat, thermalConductance, watts, ZERO_CELSIUS_IN_KELVIN } from '../../../src/core/units.js';
import {
  createThermalSolver,
  decodeEnthalpy,
  heater,
  isReservoir,
  isThermalBody,
  reservoir,
  specificEnthalpy,
  substanceThermal,
  THERMAL_FORMULAS,
  thermalBody,
  thermalEnergy,
  thermalLink,
  thermostat,
} from '../../../src/domains/thermal/index.js';
import type { FormulaApplication } from '../../../src/core/index.js';
import { SUBSTANCES } from '../../../src/substances/index.js';

const sim = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(1) });
const water = substanceThermal(SUBSTANCES.water);
const body = (s: SystemState, id = 'x') => {
  const e = s.entities[entityId(id)]!;
  if (!isThermalBody(e)) throw new Error();
  return e;
};
const roomHeat = (s: SystemState) => {
  const r = s.entities[entityId('env')]!;
  if (!isReservoir(r)) throw new Error();
  return r.state.heatAbsorbed;
};
const scene = (temperature: number, env: number, g = 5, extra: Parameters<typeof createState>[0]['entities'] = []) =>
  createState({
    entities: [
      thermalBody({ id: 'x', mass: kilograms(0.5), specificHeat: specificHeat(water.specificHeat), phase: water.phase!, temperature: celsius(temperature) }),
      reservoir({ id: 'env', temperature: celsius(env) }),
      ...extra,
    ],
    connections: [thermalLink({ id: 'l', a: 'x', b: 'env', conductance: thermalConductance(g) })],
  });

describe('enthalpy ↔ temperature', () => {
  it('round-trips in every region and has a plateau at the melting point', () => {
    const p = water.phase!;
    for (const [T, s] of [[celsius(-10), 1], [celsius(0), 0.3], [celsius(50), 0]] as const) {
      const d = decodeEnthalpy(specificEnthalpy(T, s, water.specificHeat, p), water.specificHeat, p);
      expect(d.temperature).toBeCloseTo(T, 9);
      expect(d.solidFraction).toBeCloseTo(s, 9);
    }
    // Melting 1 kg takes exactly the latent heat.
    expect(specificEnthalpy(celsius(0), 0, water.specificHeat, p) - specificEnthalpy(celsius(0), 1, water.specificHeat, p)).toBeCloseTo(334_000, 6);
  });
});

describe('phase changes', () => {
  it('ice warms to 0 °C, stays there while melting, then the water warms', () => {
    let s = scene(-10, 20);
    const seen: { t: number; T: number; s: number }[] = [];
    for (let i = 0; i < 6 * 3600; i++) {
      s = sim.tick(s, seconds(1));
      if (i % 60 === 0) seen.push({ t: s.time, T: body(s).state.temperature - ZERO_CELSIUS_IN_KELVIN, s: body(s).state.solidFraction ?? 0 });
    }
    const melting = seen.filter((x) => x.s > 0.01 && x.s < 0.99);
    expect(melting.length).toBeGreaterThan(10);
    for (const x of melting) expect(x.T).toBeCloseTo(0, 9);
    expect(seen.at(-1)!.s).toBe(0);
    expect(seen.at(-1)!.T).toBeGreaterThan(5);
    // Energy: what the body gained equals what the room gave.
    expect(thermalEnergy(s) - thermalEnergy(scene(-10, 20)) + roomHeat(s)).toBeCloseTo(0, 3);
  });

  it('water in a −18 °C freezer freezes completely and keeps cooling', () => {
    let s = scene(20, -18);
    for (let i = 0; i < 12 * 3600; i++) s = sim.tick(s, seconds(1));
    expect(body(s).state.solidFraction).toBe(1);
    expect(body(s).state.temperature).toBeLessThan(celsius(-10));
    expect(thermalEnergy(s) - thermalEnergy(scene(20, -18)) + roomHeat(s)).toBeCloseTo(0, 3);
  });

  it('a heater keeps water at 100 °C while it boils away; vapour takes its energy along', () => {
    const h = heater({ id: 'h', mass: kilograms(0.2), specificHeat: specificHeat(460), power: watts(2000), temperature: celsius(90) });
    const start = createState({
      entities: [thermalBody({ id: 'x', mass: kilograms(0.5), specificHeat: specificHeat(water.specificHeat), phase: water.phase!, temperature: celsius(90) }), h, reservoir({ id: 'env', temperature: celsius(20) })],
      connections: [thermalLink({ id: 'hx', a: 'h', b: 'x', conductance: thermalConductance(200) }), thermalLink({ id: 'l', a: 'x', b: 'env', conductance: thermalConductance(1) })],
    });
    let s = start;
    for (let i = 0; i < 300; i++) s = sim.tick(s, seconds(1));
    const b = body(s);
    expect(b.state.temperature).toBeCloseTo(celsius(100), 6);
    expect(b.state.boiledOff).toBeGreaterThan(0.1);
    // 2000 W for 300 s; nearly all of it boils water: Δm ≈ E / L (minus heating 90 → 100 and losses).
    expect(b.state.boiledOff!).toBeLessThan((2000 * 300) / 2_256_000);
    const hh = s.entities[entityId('h')]!;
    const produced = 'energyDelivered' in hh.state ? (hh.state as { energyDelivered: number }).energyDelivered : 0;
    expect(thermalEnergy(s) - thermalEnergy(start) + roomHeat(s)).toBeCloseTo(produced, 2);
  });

  it('ethanol boils at 78.3 °C', () => {
    const e = substanceThermal(SUBSTANCES.ethanol);
    const h = heater({ id: 'h', mass: kilograms(0.1), specificHeat: specificHeat(460), power: watts(500), temperature: celsius(20) });
    let s = createState({
      entities: [thermalBody({ id: 'x', mass: kilograms(0.2), specificHeat: specificHeat(e.specificHeat), phase: e.phase!, temperature: celsius(20) }), h, reservoir({ id: 'env', temperature: celsius(20) })],
      connections: [thermalLink({ id: 'hx', a: 'h', b: 'x', conductance: thermalConductance(100) })],
    });
    for (let i = 0; i < 300; i++) s = sim.tick(s, seconds(1));
    expect(body(s).state.temperature).toBeCloseTo(celsius(78.3), 6);
    expect(body(s).state.boiledOff).toBeGreaterThan(0);
    // Keep heating until it boils dry: no NaN, energy still balanced.
    const start = s;
    for (let i = 0; i < 1200; i++) s = sim.tick(s, seconds(1));
    expect(body(s).state.boiledOff).toBeCloseTo(0.2, 6);
    expect(Number.isFinite(thermalEnergy(s))).toBe(true);
    const hh = s.entities[entityId('h')]!;
    const h0 = start.entities[entityId('h')]!;
    const delivered = (x: typeof hh) => ('energyDelivered' in x.state ? (x.state as { energyDelivered: number }).energyDelivered : 0);
    const produced = delivered(hh) - delivered(h0);
    expect(Math.abs(thermalEnergy(s) - thermalEnergy(start) + roomHeat(s) - roomHeat(start) - produced)).toBeLessThan(1e-6 * produced);
  });

  it('sunflower oil has no boiling data: it just keeps heating', () => {
    const o = substanceThermal(SUBSTANCES['sunflower-oil']);
    expect(o.phase).toBeUndefined();
  });

  it('a thermostat holds the target within its band', () => {
    const h = heater({ id: 'h', mass: kilograms(0.2), specificHeat: specificHeat(460), power: watts(1000), temperature: celsius(20) });
    let s = createState({
      entities: [
        thermalBody({ id: 'x', mass: kilograms(1), specificHeat: specificHeat(water.specificHeat), phase: water.phase!, temperature: celsius(20) }),
        h,
        reservoir({ id: 'env', temperature: celsius(20) }),
        thermostat({ id: 't', sensor: 'x', actuator: 'h', target: celsius(60), hysteresis: 1 }),
      ],
      connections: [thermalLink({ id: 'hx', a: 'h', b: 'x', conductance: thermalConductance(100) }), thermalLink({ id: 'l', a: 'x', b: 'env', conductance: thermalConductance(2) })],
    });
    const temps: number[] = [];
    for (let i = 0; i < 3 * 3600; i++) {
      s = sim.tick(s, seconds(1));
      if (i > 3600) temps.push(body(s).state.temperature);
    }
    expect(Math.max(...temps)).toBeLessThan(celsius(62));
    expect(Math.min(...temps)).toBeGreaterThan(celsius(58));
  });

  it('latent heat appears in the trace and matches the catalog formula', () => {
    const { records, sink } = createTraceCollector();
    let s = scene(-1, 20);
    for (let i = 0; i < 120; i++) s = sim.tick(s, seconds(1), { trace: sink });
    const latent = records.filter((r): r is FormulaApplication => r.kind === 'formula' && r.formula === 'thermal.latent-heat');
    expect(latent.length).toBeGreaterThan(0);
    const spec = THERMAL_FORMULAS.find((f) => f.id === 'thermal.latent-heat')!;
    for (const r of latent) expect(spec.compute(...r.args)).toBeCloseTo(r.output, 6);
  });
});
