import { describe, expect, it } from 'vitest';
import { atLeast, textFor, type LeveledText } from '../../src/knowledge/levels.js';
import { pluralUk } from '../../src/explain/format.js';

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

describe('Ukrainian plural forms', () => {
  it.each([
    [1, 'запис'],
    [2, 'записи'],
    [4, 'записи'],
    [5, 'записів'],
    [11, 'записів'],
    [14, 'записів'],
    [21, 'запис'],
    [22, 'записи'],
    [25, 'записів'],
    [111, 'записів'],
  ])('%i %s', (n, form) => expect(pluralUk(n, 'запис', 'записи', 'записів')).toBe(form));
});
