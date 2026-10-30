import { describe, expect, it } from 'vitest';
import { answerLines, STEPS_END, stepLine } from '../../src/scenarios/preset-kit.js';

describe('an answer’s steps, a line each', () => {
  it('puts each step and what follows them on lines of their own; a mark after the list stays on its last line', () => {
    const text = `The ball is 64 g.${['from 5 cm — 0.72', 'from 10 cm — 0.72'].map(stepLine).join(';') + STEPS_END}. The share is the same.`;
    expect(answerLines(text)).toEqual(['The ball is 64 g.', 'from 5 cm — 0.72;', 'from 10 cm — 0.72.', 'The share is the same.']);
  });
  it('a list at the very start or end leaves no empty lines', () => {
    expect(answerLines(`${['a', 'b'].map(stepLine).join(';') + STEPS_END}.`)).toEqual(['a;', 'b.']);
  });
});
