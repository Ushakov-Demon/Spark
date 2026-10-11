import { describe, expect, it } from 'vitest';
import { evaluateExpectation, solveKnob, type Knob } from '../../src/core/index.js';

const knob = (run: (x: number) => number, min = 0, max = 10): Knob => ({
  id: 'x',
  label: { uk: 'x', en: 'x' },
  current: 1,
  min,
  max,
  unit: '',
  run,
});

describe('expectations', () => {
  it('evaluates hit / miss with tolerance', () => {
    const e = { kind: 'goal', probe: { entity: 'w', quantity: 'temperature' }, value: 40, tolerance: 0.5 } as const;
    expect(evaluateExpectation(e, 40.4)).toMatchObject({ hit: true, deviation: expect.closeTo(0.4, 9) });
    expect(evaluateExpectation(e, 38)).toMatchObject({ hit: false, deviation: -2 });
  });

  it('solveKnob finds the value for increasing and decreasing responses', () => {
    const up = solveKnob(knob((x) => 3 * x + 1), 10, 0.01);
    expect(up.status).toBe('found');
    if (up.status === 'found') expect(up.value).toBeCloseTo(3, 2);
    const down = solveKnob(knob((x) => 100 - x * x), 75, 0.01);
    expect(down.status).toBe('found');
    if (down.status === 'found') expect(down.value).toBeCloseTo(5, 2);
  });

  it('solveKnob reports unreachable targets with the closest end of the range', () => {
    const r = solveKnob(knob((x) => x), 20, 0.1);
    expect(r).toMatchObject({ status: 'unreachable', closest: 10, achievedAtClosest: 10 });
  });
});
