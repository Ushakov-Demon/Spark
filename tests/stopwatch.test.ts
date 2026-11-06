import { describe, expect, it } from 'vitest';
import { stopwatchEar, stopwatchStarted } from '../web/graphics/scene/kit.js';

describe('a stopwatch starting', () => {
  it('starts from nought, from not being there, and when it falls back to run again', () => {
    expect(stopwatchStarted('0,00', '0,02')).toBe(true);
    expect(stopwatchStarted('0.0', '0.1')).toBe(true);
    expect(stopwatchStarted(undefined, '0,03')).toBe(true);
    expect(stopwatchStarted('15,0', '0,2')).toBe(true);
    expect(stopwatchStarted('0,00 с', '0,02 с')).toBe(true);
  });
  it('does not start while it runs, stands at nought, or ends on a rounded reading', () => {
    expect(stopwatchStarted('1,20', '1,24')).toBe(false);
    expect(stopwatchStarted('0,00', '0,00')).toBe(false);
    expect(stopwatchStarted('3,01', '2,98')).toBe(false);
    expect(stopwatchStarted('1,20', undefined)).toBe(false);
  });
  it('signals at the start and when the display stands still, once; the motion ending stops it at the latest', () => {
    let signals = 0;
    const ear = stopwatchEar('0,0', () => signals++);
    ear.hear('0,0', 0);
    ear.hear('0,1', 100);
    expect(signals).toBe(1);
    ear.hear('0,2', 200);
    ear.hear('0,2', 300);
    expect(signals).toBe(1);
    ear.hear('0,2', 500);
    expect(signals).toBe(2);
    ear.hear('0,2', 900);
    ear.end();
    expect(signals).toBe(2);
    const cut = stopwatchEar(undefined, () => signals++);
    cut.hear('1,0', 0);
    cut.end();
    expect(signals).toBe(4);
  });
});
