import { describe, expect, it } from 'vitest';
import { createTraceCollector, seconds, type FormulaApplication } from '../../src/core/index.js';
import { celsius, kelvin, kilograms } from '../../src/core/units.js';
import { THERMAL_FORMULAS, THERMAL_LAWS } from '../../src/domains/thermal/index.js';
import { getSource } from '../../src/knowledge/sources.js';
import { kettleScenario } from '../../src/scenarios/index.js';
import { thermalCommands, thermalSim } from '../helpers.js';

const specs = new Map(THERMAL_FORMULAS.map((f) => [f.id, f]));

/** Collects trace records from real solver ticks and real commands. */
function collect(): FormulaApplication[] {
  const sim = thermalSim();
  const { records, sink } = createTraceCollector();
  let s = kettleScenario();
  for (let i = 0; i < 50; i++) s = sim.tick(s, seconds(0.1), { trace: sink });
  const cmds = thermalCommands();
  for (const cmd of [
    { type: 'thermal.pour', into: 'water', mass: kilograms(0.3), temperature: celsius(15) },
    { type: 'thermal.temperature.set', entity: 'water', temperature: kelvin(350) },
  ] as const) {
    const r = cmds.apply(s, cmd);
    if (!r.ok) throw new Error(r.error.en);
    r.value.trace.forEach((t) => sink.record(t));
    s = r.value.state;
  }
  for (let i = 0; i < 5; i++) s = sim.tick(s, seconds(0.1), { trace: sink });
  return records.filter((r): r is FormulaApplication => r.kind === 'formula');
}

describe('explanations match computations', () => {
  const records = collect();

  it('records were produced', () => expect(records.length).toBeGreaterThan(100));

  it('every traced formula exists in the catalog', () => {
    for (const r of records) expect(specs.has(r.formula), r.formula).toBe(true);
  });

  it('re-running the catalog function on traced args reproduces the traced output', () => {
    for (const r of records) {
      const spec = specs.get(r.formula)!;
      const again = spec.compute(...r.args);
      expect(Math.abs(again - r.output), `${r.formula} ${JSON.stringify(r.args)}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(r.output)));
    }
  });

  it('traced args match the formula signature', () => {
    for (const r of records) {
      const spec = specs.get(r.formula)!;
      expect(r.args.length, r.formula).toBe(spec.argSymbols.length);
    }
  });
});

describe('catalog ↔ laws', () => {
  const lawIds = new Set(THERMAL_LAWS.map((l) => l.id));

  it('every formula points to an existing law, with consistent symbols', () => {
    for (const f of THERMAL_FORMULAS) {
      expect(lawIds.has(f.law), `${f.id} → ${f.law}`).toBe(true);
      expect(f.argSymbols.length, f.id).toBe(f.compute.length);
      for (const sym of [...f.argSymbols, f.resultSymbol]) expect(f.variables[sym], `${f.id}: ${sym}`).toBeDefined();
    }
  });

  it('every law is expressed by at least one formula', () => {
    for (const l of THERMAL_LAWS) expect(THERMAL_FORMULAS.some((f) => f.law === l.id), l.id).toBe(true);
  });

  it('historical claims are sourced', () => {
    for (const l of THERMAL_LAWS) {
      if (l.history.people.length) expect(l.history.citations.length, l.id).toBeGreaterThan(0);
      for (const c of l.history.citations) expect(getSource(c.source), `${l.id}: ${c.source}`).toBeDefined();
      for (const person of l.history.people) {
        expect(person.wikidata).toMatch(/^Q\d+$/);
        expect(person.born).toBeLessThan(person.died);
        // Life dates are cited from Wikidata by Q-id.
        expect(l.history.citations.some((c) => c.source === 'wikidata' && c.locator.includes(person.wikidata)), `${l.id}: ${person.wikidata}`).toBe(
          l.history.role === 'discovered',
        );
      }
    }
  });
});
