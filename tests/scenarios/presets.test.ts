import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver, ELECTRICAL_COMMANDS } from '../../src/domains/electrical/index.js';
import { createThermalSolver, THERMAL_COMMANDS } from '../../src/domains/thermal/index.js';
import { readingsOf, LAB_COMMANDS, LAB_KNOWLEDGE, labSetup, PRESET_ANSWERS, PRESETS, runProtocol, type LabCommand, type ProtocolStep } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);

/** Every reading of a scripted run, in order (measurements are steps of their own there). */
const readingsAll = (out: ReturnType<typeof runProtocol>) => out.flatMap((o) => readingsOf(o.step.kind === 'operation' ? o.result.log : o.entry ? [o.entry] : []));

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
    const out = runProtocol({ base: p.params, steps: [...(p.setup ?? []), first, ...(p.plan ?? [])], simulation, commands: commands as never, sampleEvery: seconds(60), maxStepSeconds: 12 * 3600 });
    const firstOp = out.findIndex((o) => o.step.kind === 'operation');
    for (const o of out.slice(0, firstOp)) expect(o.entry?.ok, `${p.id}: setup`).toBe(true);
    expect(out[firstOp]!.status?.kind, `${p.id}: first step`).toBe(p.expect);
    for (const o of out.slice(firstOp + 1)) {
      if (o.step.kind === 'fresh') continue;
      if (o.step.kind !== 'operation') expect(o.entry?.ok, `${p.id}: ${o.step.kind}`).toBe(true);
      else expect(o.status?.kind, `${p.id}: plan step`).toBe('reached');
    }
    // The question gets an answer built from this run, in both languages, with numbers in it.
    const answer = PRESET_ANSWERS[p.id];
    expect(answer, `${p.id}: has an answer`).toBeDefined();
    const steps = out.filter((o) => o.params && o.status).map((o) => ({ params: o.params!, result: o.result as never, status: o.status! }));
    const a = answer!({ steps, simulation, readings: readingsAll(out) as never });
    for (const l of ['uk', 'en'] as const) {
      expect(a.text[l].length, `${p.id} ${l}`).toBeGreaterThan(60);
      expect(a.text[l], `${p.id} ${l}`).toMatch(/\d/);
      expect(a.text[l], `${p.id} ${l}`).not.toMatch(/NaN|Infinity|undefined/);
    }
    if (process.env['SHOW_ANSWERS']) console.log(`\n[${p.id}] ${a.say.uk}\n${a.text.uk}`);
  }, 60_000);
});

describe('choices of the ready-made experiments', () => {
  it.each(PRESETS.filter((p) => p.choices).map((p) => [p.id, p] as const))('%s: the run picks one of its choices', (_id, p) => {
    const ids = p.choices!.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of p.choices!) expect(c.label.uk.length && c.label.en.length).toBeTruthy();
    const first: ProtocolStep = { kind: 'operation', action: p.params.action, ...(p.params.target === undefined ? {} : { target: p.params.target }), ...(p.params.heater ? { heater: p.params.heater } : {}), ...(p.params.cooler ? { cooler: p.params.cooler } : {}), ...(p.params.supply ? { supply: p.params.supply } : {}), ...(p.params.duration === undefined ? {} : { duration: p.params.duration }) };
    const out = runProtocol({ base: p.params, steps: [...(p.setup ?? []), first, ...(p.plan ?? [])], simulation, commands: commands as never, sampleEvery: seconds(60), maxStepSeconds: 12 * 3600 });
    const steps = out.filter((o) => o.params && o.status).map((o) => ({ params: o.params!, result: o.result as never, status: o.status! }));
    const a = PRESET_ANSWERS[p.id]!({ steps, simulation, readings: readingsAll(out) as never });
    expect(ids, `${p.id}: ${a.correct}`).toContain(a.correct);
    if (process.env['SHOW_ANSWERS']) console.log(`[${p.id}] correct: ${a.correct}`);
  }, 60_000);
});

describe('prediction choices', () => {
  // Which one is right only the run tells, so all of them are shown: no more than four (a table may hold more).
  it('a preset offers two to four choices', () => {
    for (const p of PRESETS.filter((x) => x.choices && !x.choiceTable)) {
      expect(p.choices!.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.choices!.length, p.id).toBeLessThanOrEqual(4);
    }
  });
});
