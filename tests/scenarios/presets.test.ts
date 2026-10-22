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

describe('programmes of the ready-made experiments', () => {
  it('every graded experiment names at least one programme it belongs to, all of them known', async () => {
    const { presetPrograms } = await import('../../src/scenarios/index.js');
    const { getCurriculum } = await import('../../src/knowledge/curricula.js');
    for (const p of PRESETS) {
      const list = presetPrograms(p);
      if (p.grade !== null) expect(list.length, p.id).toBeGreaterThan(0);
      for (const x of list) {
        expect(getCurriculum(x.program), `${p.id}: ${x.program}`).toBeDefined();
        expect(x.quote.length, p.id).toBeGreaterThan(5);
      }
    }
  });
});

describe('growing crystals: the answer', () => {
  it('counts what lay on the bottom before heating, whatever state the first step starts from', () => {
    const p = PRESETS.find((x) => x.id === 'grow-crystals')!;
    const first: ProtocolStep = { kind: 'operation', action: p.params.action, target: p.params.target!, heater: p.params.heater! };
    const out = runProtocol({ base: p.params, steps: [...(p.setup ?? []), first, ...(p.plan ?? [])], simulation, commands: commands as never, sampleEvery: seconds(60), maxStepSeconds: 12 * 3600 });
    const steps = out.filter((o) => o.params && o.status).map((o) => ({ params: o.params!, result: o.result as never, status: o.status! }));
    const a = PRESET_ANSWERS['grow-crystals']!({ steps, simulation });
    expect(a.text.uk).toContain('спочатку на дні лишилося 18,1 г');
    expect(a.correct).toBe('part');
  }, 60_000);
});

describe('ready-made experiments with values to change', () => {
  const run = (p: (typeof PRESETS)[number]) => {
    const first: ProtocolStep = { kind: 'operation', action: p.params.action, ...(p.params.target === undefined ? {} : { target: p.params.target }), ...(p.params.heater ? { heater: p.params.heater } : {}), ...(p.params.cooler ? { cooler: p.params.cooler } : {}), ...(p.params.supply ? { supply: p.params.supply } : {}), ...(p.params.duration === undefined ? {} : { duration: p.params.duration }) };
    const out = runProtocol({ base: p.params, steps: [...(p.setup ?? []), first, ...(p.plan ?? [])], simulation, commands: commands as never, sampleEvery: seconds(60), maxStepSeconds: 12 * 3600 });
    const steps = out.filter((o) => o.params && o.status).map((o) => ({ params: o.params!, result: o.result as never, status: o.status! }));
    return { out, answer: PRESET_ANSWERS[p.id]!({ steps, simulation, readings: readingsAll(out) as never }) };
  };
  // Every control at each end of its range (or each option), the others at their defaults.
  const cases = PRESETS.filter((p) => p.vary).flatMap((p) =>
    p.vary!.controls.flatMap((c) => (c.kind === 'number' ? [c.min, c.max] : c.options.map((o) => o.id)).map((x) => [`${p.id} ${c.id}=${x}`, p, { [c.id]: x }] as const)),
  );
  it.each(cases)('%s: still the same experiment, answered from its run', async (_n, p, v) => {
    const { withValues } = await import('../../src/scenarios/index.js');
    const q = withValues(p, v);
    expect(labSetup(q.params).warnings, _n).toEqual([]);
    const { out, answer } = run(q);
    expect(out.find((o) => o.step.kind === 'operation')?.status?.kind, _n).toBe(q.expect);
    for (const l of ['uk', 'en'] as const) expect(answer.text[l], `${_n} ${l}`).not.toMatch(/NaN|Infinity|undefined|—$/);
    if (q.choices && !q.choiceTable) expect(q.choices.map((c) => c.id), _n).toContain(answer.correct);
    if (process.env['SHOW_ANSWERS']) console.log(`[${_n}] ${answer.say.uk} (${answer.correct})`);
  }, 60_000);

  it('values outside the frame fall back to the defaults', async () => {
    const { withValues, defaultValues } = await import('../../src/scenarios/index.js');
    const p = PRESETS.find((x) => x.id === 'mix-hot-cold')!;
    expect(withValues(p, { cold: 5000, tHot: 'boiling' }).params).toEqual(withValues(p, defaultValues(p)).params);
  });
});
