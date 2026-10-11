import { describe, expect, it } from 'vitest';
import { THERMAL_FORMULAS } from '../../src/domains/thermal/catalog.js';
import * as formulas from '../../src/domains/thermal/formulas.js';
import { getSource } from '../../src/knowledge/sources.js';

describe('thermal formula catalog', () => {
  it('describes every exported formula exactly once', () => {
    const exported = Object.values(formulas).filter((v) => typeof v === 'function');
    const described = THERMAL_FORMULAS.map((s) => s.compute);
    for (const fn of exported) expect(described.filter((d) => d === fn), fn.name).toHaveLength(1);
    expect(described).toHaveLength(exported.length);
  });

  it('has unique ids', () => {
    const ids = THERMAL_FORMULAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(THERMAL_FORMULAS.map((s) => [s.id, s] as const))('%s: worked examples match hand calculations', (_id, spec) => {
    expect(spec.examples.length).toBeGreaterThan(0);
    for (const ex of spec.examples) {
      const got = spec.compute(...ex.args);
      expect(Math.abs(got - ex.expected), ex.note).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(ex.expected)));
    }
  });

  it('every entry has an explanation, a known text source and a curriculum note', () => {
    for (const s of THERMAL_FORMULAS) {
      expect(s.explanation.school.ru.length, s.id).toBeGreaterThan(20);
      expect(getSource(s.textSource), s.id).toBeDefined();
      expect(s.curriculum.length, s.id).toBeGreaterThan(0);
      expect(Object.keys(s.variables).length, s.id).toBeGreaterThan(1);
    }
  });
});
