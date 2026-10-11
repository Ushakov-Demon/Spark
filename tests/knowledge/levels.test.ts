import { describe, expect, it } from 'vitest';
import { atLeast, textFor, type LeveledText } from '../../src/knowledge/levels.js';

describe('leveled texts', () => {
  const t: LeveledText = { school: { uk: 'S', en: 'S' }, expert: { uk: 'E', en: 'E' } };

  it('returns the exact level when written', () => {
    expect(textFor(t, 'expert').uk).toBe('E');
    expect(textFor(t, 'school').uk).toBe('S');
  });

  it('falls back to the nearest level, preferring the simpler one on a tie', () => {
    expect(textFor(t, 'novice').uk).toBe('S');
    expect(textFor(t, 'advanced').uk).toBe('S');
  });

  it('orders levels', () => {
    expect(atLeast('expert', 'school')).toBe(true);
    expect(atLeast('novice', 'school')).toBe(false);
  });
});
