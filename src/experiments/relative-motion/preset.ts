import { msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_relative_motion: Preset = {
  ask: msg('relative-motion-ask'),
  id: 'relative-motion',
  grade: 7,
  topic: MOTION,
  title: msg('relative-motion-title'),
  question: msg('relative-motion-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'carry',
  plan: [0, 0.005, 0.01].map((speed) => ({ kind: 'bench', command: { type: 'lab.carry', speed } }) as const),
  choices: [ch('depends', msg('relative-motion-choices')), ch('same', msg('relative-motion-choices-2')), ch('slower', msg('relative-motion-choices-3'))],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'моделювання: відносності руху' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 2. Механічний рух', match: 'related', quote: 'Механічний рух. Відносність руху та спокою. Система відліку.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 7, «Чому механічний рух є відносним?»: «Форма траєкторії руху, шлях і переміщення тіла залежать від того, відносно якої системи відліку розглядають рух»' } },
  ],
  expect: 'reached',
};

export const answer_relative_motion = (run: PresetRun): PresetAnswer => {
  // Each step: the time, the bottle's shift and the bubble's path on the paper (the records by `which`).
  const steps = new Map<number, { u: number; t?: number; x?: number; s?: number }>();
  for (const r of (run.readings ?? []).filter((x) => x.command.type === 'lab.carry' && x.record.value !== null)) {
    const u = Number(r.command['speed']);
    const e = steps.get(u) ?? { u };
    const w = r.record.inputs?.['which'];
    if (w === 0) e.t = r.record.value!;
    else if (w === 1) e.x = r.record.value!;
    else e.s = r.record.value!;
    steps.set(u, e);
  }
  const R = [...steps.values()].sort((a, b) => a.u - b.u);
  const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${tl(l, 'unit-sym-cm')}`;
  const sec = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  const longer = R.length > 1 && R.every((x, i) => i === 0 || (x.s ?? 0) > (R[i - 1]!.s ?? 0));
  const sameTime = R.every((x) => Math.abs((x.t ?? 0) - (R[0]!.t ?? 0)) < 0.05);
  return {
    ...(longer && sameTime ? { correct: 'depends' } : {}),
    why: msg('relative-motion-answer-why'),
    say: both((l) => {
      const a = R[0];
      const z = R.at(-1);
      return a && z && a !== z ? (tl(l, 'relative-motion-answer-say', { s: cm(a.s ?? 0, l), s2: cm(z.s ?? 0, l) })) : '';
    }),
    text: both((l) => {
      const parts = R.map((x) => {
        const how = x.u === 0 ? tl(l, 'relative-motion-labcarry-plan') : tl(l, 'relative-motion-parts-how', { u: sig(x.u * 100, 2, l) });
        const moved = x.u === 0 ? tl(l, 'relative-motion-parts-moved') : tl(l, 'relative-motion-parts-moved-2', { x: cm(x.x ?? 0, l) });
        return tl(l, 'relative-motion-text-parts', { how, t: sec(x.t ?? 0, l), moved, s: cm(x.s ?? 0, l) });
      });
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + tl(l, 'relative-motion-answer-text');
    }),
  };
};
