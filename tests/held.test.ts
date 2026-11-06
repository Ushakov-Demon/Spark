import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/experiments/cards.js';
import { heldOn } from '../web/graphics/professor/held.js';

describe('what the Professor holds', () => {
  it('a stopwatch before a thermometer; a vessel — the thermometer, if it has one; else a finger', () => {
    expect(heldOn('thermometer', false)).toBe('stopwatch');
    expect(heldOn(undefined, true)).toBe('thermometer');
    expect(heldOn(undefined, false)).toBe('finger');
    expect(heldOn('cannon', false)).toBe('finger');
  });
  it('every bench named has a module: a kind renamed is not silently left with a finger', () => {
    const kinds = new Set(CARDS.map((c) => c.kind as string));
    for (const k of ['sink', 'motion', 'thermometer', 'carry', 'snail', 'stairs', 'wind', 'forces', 'pressure', 'atm', 'friction', 'slope', 'lever', 'lift', 'mg', 'press', 'rows', 'area', 'map', 'bounce', 'planets', 'scales', 'spring', 'winch', 'luxmeter', 'energy', 'balance', 'pulley', 'touch', 'induct', 'circuit', 'pair', 'box', 'magnet', 'air', 'coin', 'plant']) {
      expect(kinds.has(k), k).toBe(true);
      expect(heldOn(k, false), k).not.toBe('finger');
    }
  });
});
