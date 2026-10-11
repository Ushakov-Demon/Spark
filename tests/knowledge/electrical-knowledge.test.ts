import { describe, expect, it } from 'vitest';
import { createSimulation, createTraceCollector, seconds, type FormulaApplication } from '../../src/core/index.js';
import { createElectricalSolver, ELECTRICAL_FORMULAS, ELECTRICAL_LAWS } from '../../src/domains/electrical/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { getSource } from '../../src/knowledge/sources.js';
import { LAB_KNOWLEDGE, labSetup, type LabParams } from '../../src/scenarios/index.js';

const specs = new Map(ELECTRICAL_FORMULAS.map((f) => [f.id, f]));

describe('electrical formulas and laws', () => {
  it('worked examples recompute', () => {
    for (const f of ELECTRICAL_FORMULAS) for (const ex of f.examples) expect(Math.abs(f.compute(...ex.args) - ex.expected), `${f.id}: ${ex.note}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(ex.expected)));
  });

  it('every formula has a law, a curriculum quote and texts in both languages', () => {
    const laws = new Set(ELECTRICAL_LAWS.map((l) => l.id));
    for (const f of ELECTRICAL_FORMULAS) {
      expect(laws.has(f.law), f.id).toBe(true);
      expect(f.curriculum.length, f.id).toBeGreaterThan(0);
      expect(f.explanation.school.uk.length > 20 && f.explanation.school.en.length > 20, f.id).toBe(true);
      for (const s of f.argSymbols) expect(f.variables[s], `${f.id}.${s}`).toBeDefined();
    }
  });

  it('every historical claim cites a registered source', () => {
    for (const l of ELECTRICAL_LAWS) for (const c of l.history.citations) expect(getSource(c.source), `${l.id}: ${c.source}`).toBeDefined();
  });

  it('the lab knowledge holds both domains without id clashes', () => {
    const ids = LAB_KNOWLEDGE.formulas.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const laws = LAB_KNOWLEDGE.laws.map((l) => l.id);
    expect(new Set(laws).size).toBe(laws.length);
  });
});

describe('explanations match the electrical computation', () => {
  const sim = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(1) });
  const p: LabParams = { action: 'pass-current', substance: 'sea-water', liters: 0.2, startTemp: 20, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20, supply: { id: 'bench-supply', knob: 0.4 }, duration: 1 };
  const { records, sink } = createTraceCollector();
  let s = labSetup(p).state;
  for (let i = 0; i < 20; i++) s = sim.tick(s, seconds(1), { trace: sink });
  const electrical = records.filter((r): r is FormulaApplication => r.kind === 'formula' && r.formula.startsWith('electrical.'));

  it('Ohm, resistance, Joule–Lenz and Faraday were all applied', () => {
    expect(new Set(electrical.map((r) => r.formula))).toEqual(new Set(['electrical.cell-resistance', 'electrical.cell-current', 'electrical.joule-power', 'electrical.faraday-moles']));
  });

  it('re-running the catalog function on traced args reproduces the traced output', () => {
    for (const r of electrical) {
      const spec = specs.get(r.formula)!;
      expect(r.args.length, r.formula).toBe(spec.argSymbols.length);
      expect(Math.abs(spec.compute(...r.args) - r.output), r.formula).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(r.output)));
    }
  });
});
