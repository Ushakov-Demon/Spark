import { describe, expect, it } from 'vitest';
import { createCommandRegistry, entityId, seconds, type CommandHandler } from '../../src/core/index.js';
import { celsius, kelvin, kilograms, watts } from '../../src/core/units.js';
import {
  equilibriumTemperature,
  isHeater,
  isReservoir,
  isThermalBody,
  thermalEnergy,
  type ThermalCommand,
} from '../../src/domains/thermal/index.js';
import { kettleScenario } from '../../src/scenarios/index.js';
import { kettleRun, thermalCommands } from '../helpers.js';

const cmds = thermalCommands();

describe('command registry', () => {
  it('rejects unknown commands without throwing', () => {
    const r = cmds.apply(kettleScenario(), { type: 'nope' } as unknown as ThermalCommand);
    expect(r.ok).toBe(false);
  });

  it('rejects duplicate handlers', () => {
    const h: CommandHandler<{ type: 'x' }> = { type: 'x', apply: () => ({ ok: false, error: '' }) };
    expect(() => createCommandRegistry<{ type: 'x' }>([h, h])).toThrow(/Duplicate/);
  });
});

describe('thermal commands', () => {
  const s0 = kettleScenario();

  it('heater.set switches off and changes power', () => {
    const r = cmds.apply(s0, { type: 'thermal.heater.set', entity: 'heater', on: false, power: watts(500) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const h = r.value.state.entities[entityId('heater')];
    expect(h && isHeater(h) && h.params).toMatchObject({ on: false, power: 500 });
    expect(r.value.kind).toBe('control');
    expect(cmds.apply(s0, { type: 'thermal.heater.set', entity: 'water', on: false }).ok).toBe(false);
  });

  it('pour mixes by heat balance and accounts the energy it brings', () => {
    const r = cmds.apply(s0, { type: 'thermal.pour', into: 'water', mass: kilograms(0.5), temperature: celsius(80) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const w = r.value.state.entities[entityId('water')]!;
    if (!isThermalBody(w)) throw new Error();
    expect(w.params.mass).toBeCloseTo(1.5);
    const c = w.params.specificHeat;
    expect(w.state.temperature).toBeCloseTo(
      equilibriumTemperature([
        { mass: kilograms(1), specificHeat: c, temperature: celsius(20) },
        { mass: kilograms(0.5), specificHeat: c, temperature: celsius(80) },
      ]),
    );
    expect(thermalEnergy(r.value.state) - thermalEnergy(s0)).toBeCloseTo(r.value.externalEnergy, 6);
    expect(r.value.kind).toBe('matter');
  });

  it('temperature.set is an intervention with logged external energy', () => {
    const r = cmds.apply(s0, { type: 'thermal.temperature.set', entity: 'water', temperature: celsius(50) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.kind).toBe('intervention');
    expect(r.value.externalEnergy).toBeCloseTo(1 * 4181 * 30);
    expect(thermalEnergy(r.value.state) - thermalEnergy(s0)).toBeCloseTo(r.value.externalEnergy, 6);
  });

  it('rejects non-physical input', () => {
    expect(cmds.apply(s0, { type: 'thermal.pour', into: 'water', mass: kilograms(-1), temperature: celsius(20) }).ok).toBe(false);
    expect(cmds.apply(s0, { type: 'thermal.temperature.set', entity: 'water', temperature: kelvin(-1) }).ok).toBe(false);
    expect(cmds.apply(s0, { type: 'thermal.pour', into: 'room', mass: kilograms(1), temperature: celsius(20) }).ok).toBe(false);
  });
});

describe('runExperiment', () => {
  const { result } = kettleRun();

  it('applies commands at the scheduled time', () => {
    expect(result.log.map((e) => [e.time, e.ok])).toEqual([
      [expect.closeTo(90, 6), true],
      [expect.closeTo(150, 6), true],
    ]);
  });

  it('energy balance closes: ΔU = E_heater + E_external − Q_room', () => {
    const heater = result.final.entities[entityId('heater')]!;
    const room = result.final.entities[entityId('room')]!;
    if (!isHeater(heater) || !isReservoir(room)) throw new Error();
    const dU = thermalEnergy(result.final) - thermalEnergy(result.initial);
    const expected = heater.state.energyDelivered + result.externalEnergy - room.state.heatAbsorbed;
    expect(Math.abs(dU - expected)).toBeLessThan(1e-6 * Math.abs(dU));
    expect(heater.state.energyDelivered).toBeCloseTo(2000 * 150, 3); // switched off at 150 s
  });

  it('logs a failed command and keeps running', () => {
    const { result: r } = kettleRun([{ at: seconds(10), command: { type: 'thermal.heater.set', entity: 'ghost', on: false } }], 30);
    expect(r.log[0]?.ok).toBe(false);
    expect(r.final.time).toBeCloseTo(30);
  });

  it('collects formula usage and samples', () => {
    expect([...result.usage.keys()]).toContain('thermal.equilibrium-temperature');
    expect(result.samples[0]).toBe(result.initial);
    expect(result.samples.at(-1)).toBe(result.final);
  });

  it('is deterministic', () => {
    expect(kettleRun().result.final).toEqual(result.final);
  });
});
