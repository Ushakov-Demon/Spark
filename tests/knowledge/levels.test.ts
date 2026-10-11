import { describe, expect, it } from 'vitest';
import { atLeast, textFor, type LeveledText } from '../../src/knowledge/levels.js';

describe('leveled texts', () => {
  const t: LeveledText = { school: { ru: 'S' }, expert: { ru: 'E' } };

  it('returns the exact level when written', () => {
    expect(textFor(t, 'expert').ru).toBe('E');
    expect(textFor(t, 'school').ru).toBe('S');
  });

  it('falls back to the nearest level, preferring the simpler one on a tie', () => {
    expect(textFor(t, 'novice').ru).toBe('S');
    expect(textFor(t, 'advanced').ru).toBe('S');
  });

  it('orders levels', () => {
    expect(atLeast('expert', 'school')).toBe(true);
    expect(atLeast('novice', 'school')).toBe(false);
  });
});
