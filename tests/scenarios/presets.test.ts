import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver, ELECTRICAL_COMMANDS } from '../../src/domains/electrical/index.js';
import { createThermalSolver, THERMAL_COMMANDS } from '../../src/domains/thermal/index.js';
import { LAB_KNOWLEDGE, labSetup, PRESET_ANSWERS, PRESETS, runProtocol, type LabCommand, type ProtocolStep } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>([...THERMAL_COMMANDS, ...ELECTRICAL_COMMANDS] as never);

describe('ready-made experiments', () => {
  it('ids are unique; every preset names known formulas with curriculum quotes', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    const formulas = new Map(LAB_KNOWLEDGE.formulas.map((f) => [f.id, f]));
    for (const p of PRESETS) for (const id of p.formulas) expect(formulas.get(id)?.curriculum.length, `${p.id}: ${id}`).toBeGreaterThan(0);
    // A preset that narrows the quotes still has at least one to show.
    for (const p of PRESETS.filter((x) => x.quoteHas)) {
      const quotes = p.formulas.flatMap((id) => formulas.get(id)!.curriculum).filter((c) => c.quote.includes(p.quoteHas!));
      expect(quotes.length, p.id).toBeGreaterThan(0);
    }
  });

  it('every preset sets up without warnings', () => {
    for (const p of PRESETS) expect(labSetup(p.params).warnings, p.id).toEqual([]);
  });

  it.each(PRESETS.map((p) => [p.id, p] as const))('%s ends as expected in the model', (_id, p) => {
    const first: ProtocolStep = { kind: 'operation', action: p.params.action, ...(p.params.target === undefined ? {} : { target: p.params.target }), ...(p.params.heater ? { heater: p.params.heater } : {}), ...(p.params.cooler ? { cooler: p.params.cooler } : {}), ...(p.params.supply ? { supply: p.params.supply } : {}), ...(p.params.duration === undefined ? {} : { duration: p.params.duration }) };
    const out = runProtocol({ base: p.params, steps: [first, ...(p.plan ?? [])], simulation, commands: commands as never, sampleEvery: seconds(60), maxStepSeconds: 12 * 3600 });
    expect(out[0]!.status?.kind, `${p.id}: first step`).toBe(p.expect);
    for (const o of out.slice(1)) {
      if (o.step.kind === 'add') expect(o.entry?.ok, `${p.id}: add`).toBe(true);
      else expect(o.status?.kind, `${p.id}: plan step`).toBe('reached');
    }
    // The question gets an answer built from this run, in both languages, with numbers in it.
    const answer = PRESET_ANSWERS[p.id];
    expect(answer, `${p.id}: has an answer`).toBeDefined();
    const steps = out.filter((o) => o.params && o.status).map((o) => ({ params: o.params!, result: o.result as never, status: o.status! }));
    const a = answer!({ steps, simulation });
    for (const l of ['uk', 'en'] as const) {
      expect(a.text[l].length, `${p.id} ${l}`).toBeGreaterThan(60);
      expect(a.text[l], `${p.id} ${l}`).toMatch(/\d/);
      expect(a.text[l], `${p.id} ${l}`).not.toMatch(/NaN|Infinity|undefined/);
    }
    if (process.env['SHOW_ANSWERS']) console.log(`\n[${p.id}] ${a.say.uk}\n${a.text.uk}`);
  }, 60_000);
});
