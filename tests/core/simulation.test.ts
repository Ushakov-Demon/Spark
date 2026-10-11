import { describe, expect, it } from 'vitest';
import {
  advanceRealtime,
  createSimulation,
  createState,
  seconds,
  withEntities,
  type Solver,
} from '../../src/core/index.js';
import { celsius, kilograms, specificHeat } from '../../src/core/units.js';
import { thermalBody } from '../../src/domains/thermal/entities.js';

const body = (id: string) =>
  thermalBody({ id, mass: kilograms(1), specificHeat: specificHeat(1000), temperature: celsius(20) });

describe('createState', () => {
  it('rejects duplicate ids', () => {
    expect(() => createState({ entities: [body('a'), body('a')] })).toThrow(/Duplicate/);
  });

  it('starts at t = 0', () => {
    const s = createState({ entities: [body('a')] });
    expect(s.time).toBe(0);
    expect(s.step).toBe(0);
  });
});

describe('withEntities', () => {
  it('keeps identity of untouched entities and does not mutate input', () => {
    const a = body('a');
    const b = body('b');
    const s = createState({ entities: [a, b] });
    const b2 = { ...b, label: { uk: 'інше', en: 'changed' } };
    const next = withEntities(s, [b2]);
    expect(next).not.toBe(s);
    expect(Object.values(next.entities)).toContain(a);
    expect(Object.values(s.entities)).toContain(b);
  });
});

describe('createSimulation', () => {
  const calls: string[] = [];
  const spy = (name: string): Solver => ({
    name,
    step: (s) => {
      calls.push(name);
      return s;
    },
  });

  it('runs solvers in order and owns the clock', () => {
    calls.length = 0;
    const sim = createSimulation({ solvers: [spy('electrical'), spy('thermal')], fixedDt: seconds(0.5) });
    const s = sim.run(createState({ entities: [] }), seconds(2));
    expect(s.step).toBe(4);
    expect(s.time).toBeCloseTo(2);
    expect(calls).toEqual(['electrical', 'thermal', 'electrical', 'thermal', 'electrical', 'thermal', 'electrical', 'thermal']);
  });

  it('rejects non-positive dt', () => {
    expect(() => createSimulation({ solvers: [], fixedDt: seconds(0) })).toThrow(RangeError);
  });

  it('realtime driver carries the remainder between frames', () => {
    const dt = seconds(0.01);
    const sim = createSimulation({ solvers: [], fixedDt: dt });
    let state = createState({ entities: [] });
    let clock = { accumulator: 0 };
    ({ state, clock } = advanceRealtime(sim, state, clock, 0.025, dt));
    expect(state.step).toBe(2);
    expect(clock.accumulator).toBeCloseTo(0.005);
    ({ state, clock } = advanceRealtime(sim, state, clock, 0.025, dt, { timeScale: 2 }));
    expect(state.step).toBe(7);
  });
});
