import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver, ELECTRICAL_COMMANDS } from '../../src/domains/electrical/index.js';
import { createThermalSolver, THERMAL_COMMANDS } from '../../src/domains/thermal/index.js';
import { readingsOf, LAB_COMMANDS, LAB_KNOWLEDGE, labSetup, PRESET_ANSWERS, PRESET_ORDER, PRESETS, runProtocol, type LabCommand, type ProtocolStep, type PresetControl } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);

/** Every reading of a scripted run, in order (measurements are steps of their own there). */
const readingsAll = (out: ReturnType<typeof runProtocol>) => out.flatMap((o) => readingsOf(o.step.kind === 'operation' ? o.result.log : o.entry ? [o.entry] : []));

describe('the order of the ready-made experiments', () => {
  it('every experiment has its place in the programmes’ order, once', () => {
    const ids = PRESETS.map((p) => p.id);
    expect([...PRESET_ORDER].sort()).toEqual([...ids].sort());
    expect(new Set(PRESET_ORDER).size).toBe(PRESET_ORDER.length);
    expect(ids).toEqual([...PRESET_ORDER]);
  });
});

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
      // And why it comes out so — not only what came out.
      expect(a.why?.[l].length ?? 0, `${p.id} ${l}: «Чому так?»`).toBeGreaterThan(150);
    }
    if (process.env['SHOW_ANSWERS']) console.log(`\n[${p.id}] ${a.say.uk}\n${a.text.uk}`);
  }, 60_000);
});

describe('every experiment has the same structure, whatever its grade or subject', () => {
  it.each(PRESETS.map((p) => [p.id, p] as const))('%s: title, question, its one-line ask, choices, formulas, programmes', async (_id, p) => {
    const { presetAsk, presetPrograms, MAX_CHOICES } = await import('../../src/scenarios/index.js');
    for (const l of ['uk', 'en'] as const) {
      expect(p.title[l].length, `${p.id} title ${l}`).toBeGreaterThan(5);
      expect(p.question[l].length, `${p.id} question ${l}`).toBeGreaterThan(40);
      expect(presetAsk(p)[l], `${p.id} ask ${l}`).toMatch(/\?$/);
    }
    // A question with choices — a prediction before, or a conclusion after (picking is never a must).
    expect(p.choices?.length ?? 0, `${p.id}: choices`).toBeGreaterThanOrEqual(2);
    if (!p.choiceTable) expect(p.choices!.length, p.id).toBeLessThanOrEqual(MAX_CHOICES);
    // The formulas behind it, each found in a programme; the programmes it is in.
    expect(p.formulas.length, `${p.id}: formulas`).toBeGreaterThan(0);
    for (const id of p.formulas) expect(LAB_KNOWLEDGE.formulas.find((f) => f.id === id)?.curriculum.length, `${p.id}: ${id}`).toBeGreaterThan(0);
    expect(presetPrograms(p).length, `${p.id}: programmes`).toBeGreaterThan(0);
    // (The answer from the run — what happened, with its numbers, and «Чому так?» — is checked by «ends as expected».)
    expect(PRESET_ANSWERS[p.id], `${p.id}: answer`).toBeDefined();
  });
});

describe('choices of the ready-made experiments', () => {
  it('the choices come with the question they answer, in one short line', async () => {
    const { presetAsk } = await import('../../src/scenarios/index.js');
    for (const p of PRESETS.filter((x) => x.choices))
      for (const l of ['uk', 'en'] as const) {
        const ask = presetAsk(p)[l];
        expect(ask, `${p.id} ${l}`).toMatch(/\?$/);
        // A question that stands on its own: not «А олія?».
        expect(ask.length, `${p.id} ${l}: ${ask}`).toBeGreaterThan(20);
        expect(ask.length, `${p.id} ${l}: ${ask}`).toBeLessThan(110);
      }
  });

  it('a thermometer only where the temperature matters', async () => {
    const { needsThermometer } = await import('../../src/scenarios/index.js');
    const need = (id: string) => needsThermometer(PRESETS.find((p) => p.id === id)!);
    expect(need('mystery-metal')).toBe(false);
    expect(need('archimedes-salt')).toBe(false);
    expect(need('freeze-water')).toBe(true);
    expect(need('joule-heating')).toBe(true);
    // Solutions: solubility goes with temperature.
    expect(need('grow-crystals')).toBe(true);
  });

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

  it('never more than ten at once: a table offers the rows nearest to what was measured', async () => {
    const { MAX_CHOICES, nearestRows, DENSITY_TABLE } = await import('../../src/scenarios/index.js');
    const { SUBSTANCES } = await import('../../src/substances/index.js');
    for (const p of PRESETS.filter((x) => x.choices && !x.choiceTable)) expect(p.choices!.length, p.id).toBeLessThanOrEqual(MAX_CHOICES);
    const rho = (id: string) => SUBSTANCES[id as keyof typeof SUBSTANCES].liquid.density.value;
    expect(DENSITY_TABLE.length).toBeGreaterThan(MAX_CHOICES);
    // Whatever the block is made of, measured within 3 %, it is among the rows offered, in the table's order.
    for (const c of DENSITY_TABLE)
      for (const k of [0.97, 1, 1.03]) {
        const rows = nearestRows(DENSITY_TABLE, rho(c.id) * k, rho);
        expect(rows.length).toBe(MAX_CHOICES);
        expect(rows.map((r) => r.id), `${c.id} × ${k}`).toContain(c.id);
        expect(rows.map((r) => rho(r.id))).toEqual([...rows.map((r) => rho(r.id))].sort((a, b) => a - b));
      }
  });
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

  it('sorts them by subject, with the grade of that subject’s programme', async () => {
    const { presetSubjects, presetGradeIn } = await import('../../src/scenarios/index.js');
    const byId = (id: string) => PRESETS.find((p) => p.id === id)!;
    expect(presetSubjects(byId('hooke-spring'))).toEqual(['physics']);
    expect(presetSubjects(byId('grow-crystals'))).toEqual(['chemistry']);
    // In both programmes: under each.
    expect(presetSubjects(byId('electrolysis')).sort()).toEqual(['chemistry', 'physics']);
    // Salt on the roads: physics in the 8th grade, the chemistry of solutions in the 9th.
    expect(presetGradeIn(byId('road-salt'), 'physics')).toBe(8);
    expect(presetGradeIn(byId('road-salt'), 'chemistry')).toBe(9);
    // Under another subject, that programme's topic; under its own, its own.
    const { presetTopicIn } = await import('../../src/scenarios/index.js');
    expect(presetTopicIn(byId('road-salt'), 'chemistry', 'uk')).toMatch(/^Тема \d/);
    expect(presetTopicIn(byId('road-salt'), 'physics', 'uk')).toBe(byId('road-salt').topic.uk);
    // "≈" (the same idea, another substance) does not put it under a subject.
    expect(presetSubjects(byId('mystery-metal'))).toEqual(['physics']);
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
  it('the answers say why it comes out so, not only what came out', () => {
    for (const id of ['lever-moments', 'slope-efficiency', 'pendulum', 'rotation-period', 'average-speed', 'electrochemical-equivalent', 'floating-conditions', 'heater-efficiency', 'hooke-spring', 'friction-coefficient', 'block-pressure']) {
      const why = run(PRESETS.find((p) => p.id === id)!).answer.why;
      expect(why?.uk.length ?? 0, id).toBeGreaterThan(200);
      expect(why?.en.length ?? 0, id).toBeGreaterThan(200);
    }
  }, 120_000);

  it('the slope: the higher it is raised, the higher its efficiency', () => {
    const { answer } = run(PRESETS.find((p) => p.id === 'slope-efficiency')!);
    expect(answer.correct).toBe('grows');
    expect(answer.text.uk).toMatch(/η ≈ \d+ %.*η ≈ \d+ %.*η ≈ \d+ %/);
  }, 60_000);

  it('the power of a consumer: twice the voltage, four times the power', () => {
    expect(run(PRESETS.find((p) => p.id === 'consumer-power')!).answer.correct).toBe('four');
  }, 60_000);

  it('series and parallel: the voltages add up in series, the currents in parallel', () => {
    expect(run(PRESETS.find((p) => p.id === 'series-circuit')!).answer.correct).toBe('sum');
    expect(run(PRESETS.find((p) => p.id === 'parallel-circuit')!).answer.correct).toBe('sum');
  }, 60_000);

  it('the resistance of a conductor: U / I stays the same as the voltage grows', () => {
    const { answer } = run(PRESETS.find((p) => p.id === 'conductor-resistance')!);
    expect(answer.correct).toBe('same');
    expect(answer.text.uk).toMatch(/R ≈ [45],\d Ом/);
  }, 60_000);

  it('the lever: it balances when the moments are equal, not the forces or the arms', () => {
    expect(run(PRESETS.find((p) => p.id === 'lever-moments')!).answer.correct).toBe('moments');
  }, 60_000);

  it('the electrochemical equivalent of copper: m₂ − m₁ over I·t is the table’s M / (2F)', () => {
    const { answer } = run(PRESETS.find((p) => p.id === 'electrochemical-equivalent')!);
    expect(answer.correct).toBe('table');
    expect(answer.text.uk).toMatch(/k = Δm \/ \(I·t\) ≈ 0,3[23]\d? мг\/Кл/);
  }, 60_000);

  it('the heater’s efficiency: most of the energy, not all of it', () => {
    const { answer } = run(PRESETS.find((p) => p.id === 'heater-efficiency')!);
    expect(answer.correct).toBe('most');
    expect(answer.text.uk).toMatch(/ККД η = Q \/ E ≈ \d/);
  }, 60_000);

  it('motion (lab works 1–3): the ball speeds up, a shorter thread turns quicker, only the length sets the pendulum', () => {
    const answer = (id: string) => run(PRESETS.find((p) => p.id === id)!).answer;
    expect(answer('average-speed').correct).toBe('whole');
    expect(answer('rotation-period').correct).toBe('shorter');
    expect(answer('pendulum').correct).toBe('length');
    // A metre pendulum: T = 2π·√(1/g) ≈ 2.01 s.
    expect(answer('pendulum').text.uk).toMatch(/T ≈ 2,01 с/);
  }, 60_000);

  it('the conditions of floating: sinks, floats inside, comes up — by the tube’s mean density', () => {
    const { answer } = run(PRESETS.find((p) => p.id === 'floating-conditions')!);
    expect(answer.correct).toBe('density');
    expect(answer.text.uk).toMatch(/потонула.*плавала всередині води.*спливла/);
  }, 60_000);

  it('the floating ice: mass and volume are told apart, with the numbers of the run', () => {
    const { answer } = run(PRESETS.find((p) => p.id === 'ice-level')!);
    const text = answer.text.uk;
    // What it pushed aside (mL) is the water of the ice's mass (g); the cube itself takes more room.
    expect(text).toMatch(/витіснив [\d,]+ мл води — це ≈ [\d,]+ г: маса витісненої води дорівнює масі льоду/);
    expect(text).toMatch(/займає більше — ≈ [\d,]+ мл/);
    expect(text).not.toContain('скільки важить сам');
  }, 60_000);

  // Every control at each end of its range (or each option), the others at their defaults; when there are only a
  // few of them, every combination (the circuit's resistor with each set of voltages: the smallest current and the largest).
  const values = (c: PresetControl) => (c.kind === 'number' ? [c.min, c.max] : c.kind === 'place' ? [c.value, c.en, 'Reykjavík|64.1355|-21.8954'] : c.options.map((o) => o.id));
  const cases = PRESETS.filter((p) => p.vary).flatMap((p) => {
    const cs = p.vary!.controls;
    const all = cs.reduce<Record<string, number | string>[]>((acc, c) => acc.flatMap((v) => values(c).map((x) => ({ ...v, [c.id]: x }))), [{}]);
    const sets = cs.length > 1 && all.length <= 12 ? all : cs.flatMap((c) => values(c).map((x) => ({ [c.id]: x })));
    return sets.map((v) => [`${p.id} ${Object.entries(v).map(([k, x]) => `${k}=${x}`).join(' ')}`, p, v] as const);
  });
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

  it('the hydraulic machine: the gain in force is the ratio of the areas, and none in work', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'hydraulic-press')!);
    expect(answer.correct).toBe('areas');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const [w1, w2] = [...answer.text.uk.matchAll(/≈ ([\d,]+) Дж/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(Math.abs(w1! / w2! - 1)).toBeLessThan(0.15);
  }, 60_000);

  it('a bubble rises uniformly — equal times for equal paths — and a bigger one faster', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'bubble-speed')!);
    expect(answer.correct).toBe('bigger');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const t = [...answer.text.uk.matchAll(/\d+ см — ([\d,]+) с/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(t).toHaveLength(8);
    // 3, 6, 9, 12 cm: the times as 1 : 2 : 3 : 4.
    for (const k of [1, 2, 3]) expect(Math.abs(t[k]! / t[0]! - (k + 1))).toBeLessThan(0.02);
  }, 60_000);

  it('a ball sinks slowest in glycerol and slower in oil than in water: the viscosity, not the density', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'ball-in-liquids')!);
    expect(answer.correct).toBe('glycerol');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const t = [...answer.text.uk.matchAll(/за ([\d,]+) с/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(t).toHaveLength(3);
    expect(t[0]!).toBeGreaterThan(t[1]!);
    expect(t[1]!).toBeGreaterThan(t[2]!);
  }, 60_000);

  it('weight in a lift: more while accelerating up, less while accelerating down, the same moving steadily, zero falling', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'weight-in-lift')!);
    expect(answer.correct).toBe('accel');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const P = [...answer.text.uk.matchAll(/— ([\d,]+) Н/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(P).toEqual([3.9, 4.4, 3.9, 3.4, 3.4, 3.9, 4.4, 0]);
  }, 60_000);

  it('carts: the paths in 0.5 s go as the inverse of the masses, and the weights as the masses', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'carts-mass')!);
    expect(answer.correct).toBe('speeds');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const r = [...answer.text.uk.matchAll(/l₁ \/ l₂ ≈ ([\d,]+)/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(r).toEqual([1, 2, 3]);
    expect(answer.text.uk).toContain('візок 1 — 1,0 Н, візок 2 з двома тягарцями — 2,9 Н');
  }, 60_000);

  it('the Solar System to scale: the Earth a 1.8 mm grain 21.5 m from a 20 cm Sun, Neptune 650 m off; T²/a³ the same', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'solar-system-model')!);
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.correct).toBe('grain');
    expect(answer.text.uk).toContain('крупинка 1,8 мм за 21,5 м');
    expect(answer.text.uk).toContain('Нептун — за 649 м');
    expect(answer.text.uk).toContain('від 0,98 до 1,00');
    expect(answer.text.uk).toContain('за 871 м');
  }, 60_000);

  it('roots and gravity: on its side the root bends down to 90° in two hours (lag, then ~1.4°/min); on a clinostat it does not', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'roots-gravity')!);
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.correct).toBe('down');
    expect(answer.text.uk).toContain('0 хв — 0°, 20 хв — 0°, 40 хв — 20°, 60 хв — 45°');
    expect(answer.text.uk).toContain('120 хв — 90°');
    expect(answer.text.uk).toContain('На клиностаті за ті самі дві години — 0°');
  });

  it('every story told after «Чому так?» is written in both languages', () => {
    for (const p of PRESETS) for (const a of p.asides ?? []) {
      expect(a.uk.length, p.id).toBeGreaterThan(40);
      expect(a.en.length, p.id).toBeGreaterThan(40);
    }
  });

  it('rubber motor: the band 20 N/m; 3, 6, 9 turns — 0.44, 1.74, 3.92 m: twice the turns, four times as far', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'rubber-motor')!);
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.correct).toBe('four');
    expect(answer.text.uk).toContain('k = F/x ≈ 20 Н/м');
    expect(answer.text.uk).toContain('3 оберти — 0,44 м, 6 обертів — 1,74 м, 9 обертів — 3,92 м');
    expect(answer.say.uk).toContain('у 4 рази далі');
    expect(answer.text.uk).toContain('утричі більше — у 8,9 раза');
  });

  it('home-made dynamometer: even marks 39, 78, 118 mm; 40 mm to the newton; the apple 1 N, the egg 0.6 N', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'dyno-diy')!);
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.correct).toBe('one');
    expect(answer.text.uk).toContain('39 мм, 78 мм, 118 мм');
    expect(answer.text.uk).toContain('На 1 Н припадає 40 мм, на поділку 0,1 Н — 4 мм');
    expect(answer.text.uk).toContain('Яблуко масою 100 г — 1,0 Н');
    expect(answer.text.uk).toContain('Яйце — 0,6 Н; на саморобних терезах воно важило 58 г');
  });

  it('home-made scales: a sheet of A4 against 5 mL of water; the egg — 11 sheets and 3 mL, 58 g', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'scales-diy')!);
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.correct).toBe('known');
    expect(answer.text.uk).toContain('врівноважили 5 мл води — 5 г');
    expect(answer.text.uk).toContain('11 аркушів по 5 г і 3 мл води — 58 г');
    expect(answer.say.uk).toContain('Яйце — 58 г');
  });

  it('calendars: the equinox slides a month in 120 Egyptian years, ten days by 1582; Shakespeare 11 days after Cervantes', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'calendars')!);
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk, '\n', answer.text.en);
    expect(answer.correct).toBe('days');
    expect(answer.text.uk).toContain('на 29,1 доби пізніше — з 21 березня на 19 квітня');
    expect(answer.text.uk).toContain('на 9,8 доби раніше, на 11 березня');
    expect(answer.text.uk).toContain('викреслила 10 днів');
    expect(answer.text.uk).toContain('лише на 0,4 доби');
    expect(answer.text.uk).toContain('3 травня за григоріанським');
    expect(answer.say.uk).toContain('11 діб');
  }, 60_000);

  it('the air: about 10 t above each m², a density of 1.2 kg/m³ from two floors, a fifth of it below the airship at 2 km', async () => {
    const { withValues } = await import('../../src/scenarios/index.js');
    const p = PRESETS.find((x) => x.id === 'air-column')!;
    const { answer } = run(withValues(p, { place: 'Київ|50.4500|30.5233|179|Europe/Kyiv' }));
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.correct).toBe('tonnes');
    expect(answer.text.uk).toMatch(/m = p·S \/ g ≈ 10\s?100 кг/u);
    expect(answer.text.uk).toContain('ρ = Δp / (g·Δh) ≈ 1,2 кг/м³');
    expect(answer.text.uk).toMatch(/На 2 км — [\d,]+ гПа: 2[0-9] % повітря/);
    // High up in Mexico City there is less air above already: about 7.9 t.
    const mx = run(withValues(p, { place: 'Мехіко|19.4285|-99.1277|2240|America/Mexico_City' })).answer;
    if (process.env['SHOW_ANSWERS']) console.log(mx.text.uk);
    expect(mx.say.uk).toContain('≈ 7,9 т');
  }, 60_000);

  it('gnomon: the noon by equal shadows anywhere — its clock, longitude and hemisphere; the latitude from the noon shadow', async () => {
    const { withValues } = await import('../../src/scenarios/index.js');
    const at = (place: string) => run(withValues(PRESETS.find((x) => x.id === 'solar-noon')!, { place })).answer;
    const kyiv = at('Київ|50.4500|30.5233|179|Europe/Kyiv');
    if (process.env['SHOW_ANSWERS']) console.log(kyiv.text.uk, '\n', kyiv.say.uk);
    expect(kyiv.correct).toBe('later');
    expect(kyiv.say.uk).toMatch(/о 12:0[5-7] за годинником/);
    expect(at('Львів|49.8425|24.0322|296|Europe/Kyiv').say.uk).toMatch(/о 12:3[0-4]/);
    expect(at('Харків|49.9925|36.2311|152|Europe/Kyiv').correct).toBe('earlier');
    const lat = (t: string) => Number(/широта ≈ (−?[\d,]+)°/.exec(t)![1]!.replace(',', '.').replace('−', '-'));
    expect(Math.abs(lat(kyiv.text.uk) - 50.45)).toBeLessThan(0.5);
    // Summer time in New York from 8 March: the noon by the clock after 13:00.
    const ny = at('New York|40.7143|-74.0060|10|America/New_York');
    if (process.env['SHOW_ANSWERS']) console.log(ny.text.uk);
    expect(ny.say.uk).toMatch(/о 13:\d\d/);
    expect(ny.text.uk).toContain('UTC−4 — літній час');
    // The southern hemisphere: the shadow points south, the latitude negative.
    const sp = at('Сан-Паулу|-23.5475|-46.6361|769|America/Sao_Paulo');
    if (process.env['SHOW_ANSWERS']) console.log(sp.text.uk);
    expect(sp.text.uk).toContain('на південь');
    expect(Math.abs(lat(sp.text.uk) + 23.55)).toBeLessThan(0.5);
    const mx = at('Мехіко|19.4285|-99.1277|2240|America/Mexico_City');
    // (Near the tropics the noon shadow is short — about 35 cm — so a centimetre of the tape is worth more.)
    expect(Math.abs(lat(mx.text.uk) - 19.43)).toBeLessThan(1);
  }, 60_000);

  it('liquid tower: the nut on the bottom, acrylic on the glycerol, polyethylene on the water, pine in the ethanol', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'liquid-tower')!);
    expect(answer.correct).toBe('glycerol');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.text.uk).toContain('лягла на дно');
    expect(answer.text.uk).toContain('межі «гліцерин — вода»: 69 % його об’єму у гліцерині');
    expect(answer.text.uk).toContain('межі «вода — олія»: 54 % його об’єму у воді');
    expect(answer.text.uk).toContain('плаває у спирті, занурений на 65 %');
  }, 60_000);

  it('drag: from the same plasticine the plate sinks slowest, the ball fastest; in the air the ball nearly falls freely', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'drag-form')!);
    expect(answer.correct).toBe('plate');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.why?.uk, '\n', answer.say.uk);
    const frames = [...answer.text.uk.matchAll(/(\d+) кадр/g)].map((m) => Number(m[1]));
    expect(frames).toEqual([11, 15, 28, 4]);
    expect(answer.text.uk).toContain('≈ 0,018 Н');
  }, 60_000);

  it('friction: the same on the narrower face, more over paper, growing with the load', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'friction-factors')!);
    expect(answer.correct).toBe('same');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    expect(answer.text.uk).toContain('на широкій грані — 0,6 Н, на вужчій — 0,6 Н');
    expect(answer.text.uk).toContain('По аркушу паперу — 1,0 Н');
    expect(answer.text.uk).toContain('З трьома тягарцями — 1,1 Н');
  }, 60_000);

  it('contact and non-contact forces: magnet, comb and gravity act without touching, friction does not', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'contact-forces')!);
    expect(answer.correct).toBe('field');
    expect(answer.text.uk).toContain('тертя об стіл немає');
  }, 60_000);

  it('inertia: the faster the card goes, the less the coin moves; snatched, it drops into the glass', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'coin-inertia')!);
    expect(answer.correct).toBe('inertia');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const s = [...answer.text.uk.matchAll(/зсув (\d+) мм/g)].map((m) => Number(m[1]));
    expect(s).toEqual([150, 32, 8, 1]);
    expect(answer.text.uk.match(/впала в склянку/g)).toHaveLength(2);
  }, 60_000);

  it('a snail’s speed: the study’s distances in 30 s, slowest on sandpaper', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'snail-speed')!);
    expect(answer.correct).toBe('sandpaper');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const l = [...answer.text.uk.matchAll(/— (\d+) мм за 30 с/g)].map((m) => Number(m[1]));
    expect(l).toEqual([45, 41, 38, 25]);
  }, 60_000);

  it('a stroboscopic photo: equal gaps on the table, growing ones in the groove', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'strobe-photo')!);
    expect(answer.correct).toBe('gaps');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const lists = [...answer.text.uk.matchAll(/: ([\d, ]+) мм/g)].map((m) => m[1]!.split(', ').map(Number));
    expect(lists).toEqual([[54, 54, 54, 54], [4, 11, 18, 26]]);
  }, 60_000);

  it('the wind’s speed by soap bubbles: each day’s speed falls in its Beaufort force', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'wind-speed')!);
    expect(answer.correct).toBe('walk');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const v = [...answer.text.uk.matchAll(/v ≈ ([\d,]+) м\/с — (\d) бал/g)].map((m) => [Number(m[1]!.replace(',', '.')), Number(m[2])]);
    expect(v).toEqual([[1, 1], [2.5, 2], [4.4, 3]]);
  }, 60_000);

  it('a windlass: the turns are the length over the circumference, and a turn winds π·d', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'windlass')!);
    expect(answer.correct).toBe('circle');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const n = [...answer.text.uk.matchAll(/— ([\d,]+) об\./g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(n).toEqual([4.75, 12]);
    const h = [...answer.text.uk.matchAll(/піднявся на ([\d,]+) см/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(h).toEqual([31.4, 12.6]);
  }, 60_000);

  it('the relativity of motion: the same time each step, a longer path relative to the table the faster the bottle goes', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'relative-motion')!);
    expect(answer.correct).toBe('depends');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const s = [...answer.text.uk.matchAll(/відносно стола ([\d,]+) см/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(s).toEqual([9, 10.7, 14.7]);
  }, 60_000);

  it('a ball’s bounce: each bounce lower by about the same share, the tennis ball lower still, plasticine not at all', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'ball-bounce')!);
    expect(answer.correct).toBe('heat');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk, '\n', answer.say.uk);
    const h = [...answer.text.uk.matchAll(/(\d+) см/g)].map((m) => Number(m[1]!));
    expect(h).toEqual([82, 67, 55, 56, 0]);
  }, 60_000);

  it('the method of rows: a row gives the size of one to hundredths of a millimetre, near the sources’ sizes', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'small-bodies')!);
    expect(answer.correct).toBe('row');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const d = [...answer.text.uk.matchAll(/≈ ([\d,]+) мм/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(d).toHaveLength(3);
    const [pea, millet, thread] = d as [number, number, number];
    expect(pea).toBeGreaterThan(6.2);
    expect(pea).toBeLessThan(6.9);
    expect(millet).toBeGreaterThan(2.07);
    expect(millet).toBeLessThan(2.27);
    expect(thread).toBeCloseTo(0.4, 2);
  }, 60_000);

  it('adding forces: the two dynamometers’ resultant equals one dynamometer’s reading each time', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'adding-forces')!);
    expect(answer.correct).toBe('same');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const R = [...answer.text.uk.matchAll(/= ([\d,]+) Н/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(R).toHaveLength(3);
    expect(new Set(R).size).toBe(1);
    expect(answer.text.uk).toMatch(/силою 2,2 Н/);
  }, 60_000);

  it('induction: a current only while the magnet moves; its sign with the direction and the pole; larger when faster', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'electromagnetic-induction')!);
    expect(answer.correct).toBe('motion');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const I = [...answer.text.uk.matchAll(/— ([+−]?[\d,]+) мА/g)].map((m) => Number(m[1]!.replace('−', '-').replace(',', '.')));
    expect(I).toHaveLength(6);
    const [still, out, inFast, inSlow, south, coil] = I as [number, number, number, number, number, number];
    expect(still).toBe(0);
    expect(Math.sign(out)).toBe(-Math.sign(inFast));
    expect(Math.sign(south)).toBe(-Math.sign(inFast));
    expect(coil).toBe(inFast);
    expect(Math.abs(inSlow)).toBeLessThan(Math.abs(inFast) / 2);
  }, 60_000);

  it('the electromagnet: the field grows with the current, the nail strengthens it, the reversed current turns the needle back', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'electromagnet')!);
    expect(answer.correct).toBe('both');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const fields = [...answer.text.uk.matchAll(/B ≈ ([\d,]+) мкТл/g)].map((m) => Number(m[1]!.replace(',', '.')));
    expect(fields).toHaveLength(3);
    expect(fields[2]! / fields[0]!).toBeGreaterThan(2.5);
    expect(fields[2]! / fields[0]!).toBeLessThan(3.5);
    expect(answer.text.uk).toMatch(/відхилилася на \d+°, але в інший бік/);
  }, 60_000);

  it('the hydrostatic paradox: the same force on the bottom, the water poured several times different', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'hydrostatic-paradox')!);
    expect(answer.correct).toBe('same');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const ml = [...answer.text.uk.matchAll(/води ([^м]+) мл/g)].map((m) => Number(m[1]!.replace(/\D/g, '')));
    expect(ml).toHaveLength(3);
    expect(ml[1]! / ml[2]!).toBeGreaterThan(3);
  }, 60_000);

  it('the atmospheric pressure: the syringe shows a little less than the barometer, nearer as the plunger goes out', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'atmospheric-pressure')!);
    expect(answer.correct).toBe('less');
    if (process.env['SHOW_ANSWERS']) console.log(answer.text.uk);
    const ps = [...answer.text.uk.matchAll(/→ ([^г]+) гПа/g)].map((m) => Number(m[1]!.replace(/\D/g, '')));
    expect(ps).toHaveLength(3);
    expect(ps[0]!).toBeLessThan(ps[1]!);
    expect(ps[1]!).toBeLessThan(ps[2]!);
  }, 60_000);

  it('communicating vessels: water level alike; the oil column taller; the oil’s density from ρ₁h₁ = ρ₂h₂', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'communicating-vessels')!);
    expect(answer.correct).toBe('oil');
    expect(answer.text.uk).toMatch(/різниця 0 см/);
    const found = Number(answer.text.uk.match(/ρ = ρ_води·h_води \/ h_олії ≈ ([^к]+)кг/)![1]!.replace(/[^\d,]/g, '').replace(',', '.'));
    expect(Math.abs(found / 919 - 1)).toBeLessThan(0.03);
  }, 60_000);

  it('the pressure at a depth: in proportion to it, the same sideways; the manometer gives the liquid’s density', async () => {
    const { withValues } = await import('../../src/scenarios/index.js');
    const p = PRESETS.find((x) => x.id === 'depth-pressure')!;
    for (const [liquid, rho] of [['water', 997], ['salt-water-20', 1150], ['sunflower-oil', 919]] as const) {
      const { answer } = run(withValues(p, { liquid }));
      expect(answer.correct, liquid).toBe('proportional');
      const found = Number(answer.text.uk.match(/ρ = p \/ \(g·h\) ≈ ([^к]+)кг\/м³/)![1]!.replace(/[^\d,]/g, '').replace(',', '.'));
      expect(Math.abs(found / rho - 1), liquid).toBeLessThan(0.03);
      expect(answer.text.uk, liquid).toMatch(/повернута вбік на 9 см, дала ті самі/);
    }
  }, 60_000);

  it('the black box: current one way, none turned round — a diode; the resistance falls with the voltage', () => {
    const { answer } = run(PRESETS.find((x) => x.id === 'diode-black-box')!);
    expect(answer.correct).toBe('diode');
    expect(answer.text.uk).toMatch(/Скринька як стоїть: 1 В — 3,\d мА.*3 В — 2\d,\d мА.*Перевернута: 1 В — 0,0 мА, 2 В — 0,0 мА, 3 В — 0,0 мА/);
    expect(answer.text.uk).toMatch(/не в 3 раза, а в [56],\d/);
  }, 60_000);

  it('a copper coil heated in water: its resistance grows, α comes out as copper’s ≈ 0.0039 1/°C', () => {
    const p = PRESETS.find((x) => x.id === 'resistance-temperature')!;
    const { answer } = run(p);
    expect(answer.correct).toBe('grows');
    const alpha = Number(answer.text.uk.match(/≈ ([\d,]+) 1\/°C, а в таблиці/)![1]!.replace(',', '.'));
    expect(alpha).toBeGreaterThan(0.0035);
    expect(alpha).toBeLessThan(0.0043);
    expect(answer.text.uk).toMatch(/^20 °C: R = 10,00 Ом;.*80,\d °C: R = 12,\d\d Ом/);
  }, 60_000);

  it('a resistor keeps its resistance with any resistor and any voltages: the spread is within the instruments', async () => {
    const { withValues } = await import('../../src/scenarios/index.js');
    const p = PRESETS.find((x) => x.id === 'conductor-resistance')!;
    for (const resistor of ['3', '5', '6'])
      for (const volts of ['1.5-3-4.5', '1-2-3-4', '2-4-6']) expect(run(withValues(p, { resistor, volts })).answer.correct, `${resistor} Ω, ${volts} V`).toBe('same');
  });

  it('values outside the frame fall back to the defaults', async () => {
    const { withValues, defaultValues } = await import('../../src/scenarios/index.js');
    const p = PRESETS.find((x) => x.id === 'mix-hot-cold')!;
    expect(withValues(p, { cold: 5000, tHot: 'boiling' }).params).toEqual(withValues(p, defaultValues(p)).params);
  });
});
