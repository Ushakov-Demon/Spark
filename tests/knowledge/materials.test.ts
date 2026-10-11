import { describe, expect, it } from 'vitest';
import { CONVECTION, MATERIALS } from '../../src/domains/thermal/materials.js';
import { citationAgrees, verifySourcedValue } from '../../src/knowledge/verify.js';
import type { SourcedValue } from '../../src/knowledge/types.js';

const allValues: [string, SourcedValue][] = [
  ...Object.values(MATERIALS).flatMap((m): [string, SourcedValue][] => [
    [`${m.id}.specificHeat`, m.specificHeat],
    [`${m.id}.conductivity`, m.conductivity],
  ]),
  ...Object.entries(CONVECTION).map(([k, v]): [string, SourcedValue] => [`convection.${k}`, v]),
];

describe('material data provenance', () => {
  it.each(allValues)('%s agrees with its citations', (_name, v) => {
    expect(verifySourcedValue(v)).toEqual([]);
  });

  it('every value has at least one citation', () => {
    for (const [name, v] of allValues) expect(v.citations.length, name).toBeGreaterThan(0);
  });

  it('material ids match their keys', () => {
    for (const [key, m] of Object.entries(MATERIALS)) expect(m.id).toBe(key);
  });
});

describe('physical sanity (catches typos and unit slips like kJ vs J)', () => {
  const c = (id: keyof typeof MATERIALS) => MATERIALS[id].specificHeat.value;
  const k = (id: keyof typeof MATERIALS) => MATERIALS[id].conductivity.value;

  it('specific heats lie in the physically plausible range for solids/liquids/gases', () => {
    for (const m of Object.values(MATERIALS)) {
      expect(m.specificHeat.value, m.id).toBeGreaterThan(100);
      expect(m.specificHeat.value, m.id).toBeLessThan(5000);
    }
  });

  it('water has the highest specific heat among the listed materials', () => {
    for (const m of Object.values(MATERIALS)) expect(c('water')).toBeGreaterThanOrEqual(m.specificHeat.value);
  });

  it('metals conduct heat much better than insulators', () => {
    expect(k('copper')).toBeGreaterThan(k('aluminium'));
    expect(k('aluminium')).toBeGreaterThan(k('iron'));
    expect(k('iron')).toBeGreaterThan(50 * k('glass'));
    expect(k('wood')).toBeGreaterThan(k('air'));
  });

  it('ice: lower specific heat, higher conductivity than liquid water', () => {
    expect(c('ice')).toBeLessThan(c('water'));
    expect(k('ice')).toBeGreaterThan(k('water'));
  });
});

describe('verifier itself', () => {
  const base: SourcedValue = {
    value: 100,
    unit: 'x',
    conditions: '',
    verification: 'cross-checked',
    tolerance: 0.05,
    citations: [
      { source: 'wikidata', locator: '', conditions: '', value: 101 },
      { source: 'openstax-cp2e', locator: '', conditions: '', range: [90, 110] },
    ],
  };

  it('accepts agreeing sources', () => expect(verifySourcedValue(base)).toEqual([]));

  it('rejects a citation outside tolerance', () => {
    const bad = { ...base, citations: [...base.citations, { source: 'spark', locator: '', conditions: '', value: 130 }] };
    expect(verifySourcedValue(bad)).toHaveLength(1);
  });

  it('rejects cross-checked backed by a single source twice', () => {
    const bad: SourcedValue = { ...base, citations: [base.citations[0]!, base.citations[0]!] };
    expect(verifySourcedValue(bad).length).toBeGreaterThan(0);
  });

  it('rejects unknown sources', () => {
    const bad: SourcedValue = { ...base, citations: [...base.citations, { source: 'my-memory', locator: '', conditions: '', value: 100 }] };
    expect(verifySourcedValue(bad).some((p) => p.message.includes('unknown source'))).toBe(true);
  });

  it('requires a note for estimates and single-source values', () => {
    expect(verifySourcedValue({ ...base, verification: 'estimate' })).toHaveLength(1);
    expect(verifySourcedValue({ ...base, verification: 'single-source' })).toHaveLength(1);
  });

  it('range check', () => {
    expect(citationAgrees(100, { source: 's', locator: '', conditions: '', range: [80, 95] }, 0.05)).toBe(false);
    expect(citationAgrees(100, { source: 's', locator: '', conditions: '', range: [80, 96] }, 0.05)).toBe(true);
  });
});
