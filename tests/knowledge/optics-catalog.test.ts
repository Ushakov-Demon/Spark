import { describe, expect, it } from 'vitest';
import { OPTICS_FORMULAS } from '../../src/domains/optics/catalog.js';
import * as formulas from '../../src/domains/optics/formulas.js';
import { getSource } from '../../src/knowledge/sources.js';

describe('optics formula catalog', () => {
  it('describes every exported formula exactly once', () => {
    const exported = Object.values(formulas).filter((v) => typeof v === 'function');
    const described = OPTICS_FORMULAS.map((s) => s.compute);
    for (const fn of exported) expect(described.filter((d) => d === fn), fn.name).toHaveLength(1);
    expect(described).toHaveLength(exported.length);
  });

  it('has unique ids', () => {
    const ids = OPTICS_FORMULAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(OPTICS_FORMULAS.map((s) => [s.id, s] as const))('%s: worked examples match hand calculations', (_id, spec) => {
    expect(spec.examples.length).toBeGreaterThan(0);
    for (const ex of spec.examples) {
      const got = spec.compute(...ex.args);
      expect(Math.abs(got - ex.expected), ex.note).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(ex.expected)));
    }
  });

  it('every entry has an explanation, a known text source and a curriculum note', () => {
    for (const s of OPTICS_FORMULAS) {
      expect(s.explanation.school.uk.length, s.id).toBeGreaterThan(20);
      expect(s.explanation.school.en.length, s.id).toBeGreaterThan(20);
      expect(getSource(s.textSource), s.id).toBeDefined();
      expect(s.curriculum.length > 0 || s.beyondCurriculum !== undefined, s.id).toBe(true);
      expect(Object.keys(s.variables).length, s.id).toBeGreaterThan(1);
    }
  });
});
