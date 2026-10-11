import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, categoryPath, childrenOf, contextOf, EQUIPMENT, getCategory, itemsUnder } from '../src/equipment/index.js';
import { getSource } from '../src/knowledge/sources.js';
import { MATERIALS } from '../src/domains/thermal/materials.js';

describe('equipment taxonomy', () => {
  it('categories form a tree with names in every language', () => {
    for (const c of CATEGORIES) {
      if (c.parent) expect(getCategory(c.parent), c.id).toBeDefined();
      expect(c.id.startsWith(c.parent ?? '')).toBe(true);
      expect(c.name.uk && c.name.en).toBeTruthy();
    }
  });

  it('every item sits in a leaf category and knows if it is household or laboratory', () => {
    for (const i of EQUIPMENT) {
      expect(getCategory(i.category), i.id).toBeDefined();
      expect(childrenOf(i.category), `${i.id}: category must be a leaf`).toHaveLength(0);
      expect(contextOf(i.category), i.id).toMatch(/household|laboratory/);
      expect(categoryPath(i.category)[0]!.id).toBe(i.kind === 'vessel' ? 'vessel' : 'device');
    }
  });

  it('heaters are split into household and laboratory', () => {
    expect(itemsUnder('device.heater.household').map((i) => i.id)).toEqual(['electric-hotplate', 'induction-hob', 'gas-hob', 'immersion-heater']);
    expect(itemsUnder('device.heater.laboratory').map((i) => i.id)).toEqual(['bunsen-burner', 'spirit-lamp']);
  });

  it('ids are unique', () => {
    const ids = EQUIPMENT.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('equipment cards', () => {
  it.each(EQUIPMENT.map((i) => [i.id, i] as const))('%s: description in both languages, materials and sources known', (_id, i) => {
    expect(i.description.school.uk.length).toBeGreaterThan(30);
    expect(i.description.school.en.length).toBeGreaterThan(30);
    if (i.kind === 'vessel') for (const m of i.spec.materials) expect(m in MATERIALS, m).toBe(true);
    if (i.kind === 'heater' && i.spec.body) expect(i.spec.body.material in MATERIALS).toBe(true);
    if (i.kind === 'heater' && i.spec.requiresMaterial) expect(getSource(i.spec.requiresMaterial.source)).toBeDefined();
  });

  it('media (when present) have alt text, license, author and an existing file', () => {
    for (const i of EQUIPMENT) {
      for (const m of i.media) {
        expect(m.alt.uk && m.alt.en, `${i.id}: alt`).toBeTruthy();
        expect(m.author.length, `${i.id}: author`).toBeGreaterThan(0);
        expect(m.license).toBeTruthy();
        if (!/^https?:/.test(m.src)) expect(existsSync(`web/public/equipment/${m.src}`), `${i.id}: ${m.src}`).toBe(true);
      }
    }
  });
});
