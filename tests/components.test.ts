import { describe, expect, it } from 'vitest';
import { COMPONENTS, molarMass, type Component } from '../src/components/index.js';
import { getSource } from '../src/knowledge/sources.js';
import type { SourcedValue } from '../src/knowledge/types.js';
import { verifySourcedValue } from '../src/knowledge/verify.js';
import { RECIPES } from '../src/recipes/index.js';
import { SUBSTANCES } from '../src/substances/index.js';

/** Every sourced value inside a component, with its path ("water.phases.liquid.density"). */
function sourcedValues(x: unknown, path: string, out: [string, SourcedValue][] = []): [string, SourcedValue][] {
  if (!x || typeof x !== 'object') return out;
  if ('citations' in x && 'verification' in x) {
    out.push([path, x as SourcedValue]);
    return out;
  }
  for (const [k, v] of Object.entries(x)) sourcedValues(v, `${path}.${k}`, out);
  return out;
}

const all = Object.values(COMPONENTS);
const values = all.flatMap((c) => sourcedValues(c, c.id));

describe('components: data provenance', () => {
  it.each(values)('%s agrees with its citations', (_path, v) => {
    expect(verifySourcedValue(v)).toEqual([]);
  });

  it('every citation points to a registered source', () => {
    for (const [path, v] of values) for (const c of v.citations) expect(getSource(c.source), `${path}: ${c.source}`).toBeDefined();
  });

  it('ids match registry keys', () => {
    for (const [key, c] of Object.entries(COMPONENTS)) expect(c.id).toBe(key);
  });

  it('every component is described in Ukrainian and English at least for novices', () => {
    for (const c of all) {
      expect(c.name.uk && c.name.en, c.id).toBeTruthy();
      expect(c.description.novice?.uk && c.description.novice?.en, c.id).toBeTruthy();
    }
  });
});

describe('components: molar mass from the formula', () => {
  // Reference molar masses, g/mol (Wikipedia chemboxes).
  const reference: [string, number][] = [
    ['water', 18.015],
    ['sodium-chloride', 58.44],
    ['calcium-carbonate', 100.0869],
    ['copper-sulfate', 249.685],
  ];
  it.each(reference)('%s ≈ %s g/mol', (id, gPerMol) => {
    expect(molarMass(COMPONENTS[id as keyof typeof COMPONENTS])! * 1000).toBeCloseTo(gPerMol, 1);
  });

  it('every compound and element has a formula; materials do not', () => {
    for (const c of all) {
      if (c.kind === 'material') expect(c.composition, c.id).toBeUndefined();
      else expect(molarMass(c), c.id).toBeGreaterThan(0);
    }
  });
});

describe('components: physical sanity', () => {
  const t = (c: Component) => ({ melt: c.melting?.point.value, boil: c.boiling?.point.value });

  it('melting comes before boiling', () => {
    for (const c of all) {
      const { melt, boil } = t(c);
      if (melt !== undefined && boil !== undefined) expect(melt, c.id).toBeLessThan(boil);
    }
  });

  it('the state at room temperature (20 °C) agrees with the transition temperatures', () => {
    for (const c of all) {
      const { melt, boil } = t(c);
      const sub = c.sublimation?.point.value;
      if (c.stateAtRoom === 'gas') expect(boil ?? sub ?? -Infinity, c.id).toBeLessThan(20);
      if (c.stateAtRoom === 'liquid') {
        if (melt !== undefined) expect(melt, c.id).toBeLessThan(20);
        if (boil !== undefined) expect(boil, c.id).toBeGreaterThan(20);
      }
      if (c.stateAtRoom === 'solid' && melt !== undefined) expect(melt, c.id).toBeGreaterThan(20);
    }
  });

  it('densities: gases ≈ kg/m³, condensed matter hundreds to thousands (catches g/cm³ slips)', () => {
    for (const c of all) {
      const g = c.phases.gas?.density?.value;
      if (g !== undefined) expect(g, c.id).toBeLessThan(10);
      for (const p of [c.phases.solid, c.phases.liquid]) {
        const d = p?.density?.value;
        if (d !== undefined) {
          expect(d, c.id).toBeGreaterThan(500);
          expect(d, c.id).toBeLessThan(25_000);
        }
      }
    }
  });

  it('only iron-based metals are ferromagnetic here', () => {
    const ferro = all.filter((c) => c.magnetic === 'ferromagnetic').map((c) => c.id);
    expect(ferro.sort()).toEqual(['iron', 'steel']);
  });

  it('metals conduct electricity, resistivity in nΩ·m range', () => {
    for (const c of all.filter((x) => x.group === 'metal')) {
      expect(c.electrical?.conducts, c.id).toBe('metal');
      expect(c.electrical?.resistivity?.value, c.id).toBeGreaterThan(1e-9);
      expect(c.electrical?.resistivity?.value, c.id).toBeLessThan(1e-6);
    }
  });
});

describe('recipes and the shelf are built from components', () => {
  it('recipe fractions add up to 1 and name existing components', () => {
    for (const r of Object.values(RECIPES)) {
      expect(r.parts.reduce((s, p) => s + p.fraction, 0), r.id).toBeCloseTo(1, 9);
      for (const p of r.parts) expect(COMPONENTS[p.component], `${r.id}: ${p.component}`).toBeDefined();
    }
  });

  it('every shelf item comes from a component or a recipe', () => {
    for (const s of Object.values(SUBSTANCES)) expect(s.component ?? s.recipe, s.id).toBeDefined();
  });

  it('a shelf liquid uses exactly the numbers of its component', () => {
    expect(SUBSTANCES.ethanol.liquid.specificHeat).toBe(COMPONENTS.ethanol.phases.liquid!.specificHeat);
    expect(SUBSTANCES.water.boiling!.latentHeat).toBe(COMPONENTS.water.boiling!.latentHeat);
  });
});

describe('everything in the library is on the shelf (sandbox)', () => {
  it('every solid or liquid component is a shelf substance; gases only appear as products', () => {
    const onShelf = new Set(Object.values(SUBSTANCES).map((s) => s.component).filter(Boolean));
    for (const c of all) {
      if (c.stateAtRoom === 'gas') continue;
      expect(onShelf.has(c.id), `${c.id} is not on the shelf`).toBe(true);
    }
  });
});
