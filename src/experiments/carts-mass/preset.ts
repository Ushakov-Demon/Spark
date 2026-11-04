import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';

const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);

export const preset_carts_mass: Preset = {
  ask: msg('carts-mass-ask'),
  id: 'carts-mass',
  grade: 7,
  topic: INTERACTION,
  title: msg('carts-mass-title'),
  question: msg('carts-mass-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'carts',
  plan: [
    ...[0, 1, 2].map((weights) => ({ kind: 'bench', command: { type: 'lab.carts', mode: 'push', weights } }) as const),
    { kind: 'bench', command: { type: 'lab.carts', mode: 'weigh', weights: 2, cart: 1 } },
    { kind: 'bench', command: { type: 'lab.carts', mode: 'weigh', weights: 2, cart: 2 } },
  ],
  choices: [ch('speeds', msg('carts-mass-choices')), ch('same', msg('carts-mass-choices-2')), ch('faster', msg('carts-mass-choices-3'))],
  answerOnBoard: ['cr:'],
  formulas: ['mechanics.speed', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'залежності між масою тіла та його інертними та гравітаційними властивостями; … між масою і силою тяжіння' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: 'Явище інерції. Інертність і маса тіла', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16 «Інертність тіла. Маса»: візки зі стиснутими пружинами, m₂ / m₁ = v₁ / v₂' } },
  ],
  expect: 'reached',
};

export const answer_carts_mass = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.carts' && x.record.value !== null);
  const pushes = [0, 1, 2].map((w) => recs.filter((x) => x.command['mode'] === 'push' && Number(x.command['weights']) === w).map((x) => x.record.value!)).filter((x) => x.length === 2) as [number, number][];
  const P = (cart: number) => recs.find((x) => x.command['mode'] === 'weigh' && Number(x.command['cart']) === cart)?.record.value ?? null;
  const P1 = P(1);
  const P2 = P(2);
  const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
  const ratio = (x: number, l: Locale) => sig(x, 2, l);
  // «у 3 рази», but «у 2,9 раза».
  const times = (x: number, l: Locale) => t(l, 'carts-mass-times', { x: ratio(x, l), whole: /[,.]/.test(ratio(x, l)) ? 'no' : 'yes' });
  const slower = pushes.length === 3 && pushes.every(([a, b], w) => Math.abs(a / b - (1 + w)) < 0.1);
  return {
    ...(slower ? { correct: 'speeds' } : {}),
    why: msg('carts-mass-answer-why'),
    say: both((l) => {
      const last = pushes[2];
      return last && P1 !== null && P2 !== null ? (t(l, 'carts-mass-answer-say', { last: times(last[0] / last[1], l), P2: times(P2 / P1, l) })) : '';
    }),
    text: both((l) => {
      const parts = pushes.map(([a, b], w) => t(l, 'carts-mass-text-parts-4', { a: cm(a, l), b: cm(b, l), a2: ratio(a / b, l), value: w === 0 ? t(l, 'carts-mass-labcarts-plan-3') : t(l, 'carts-mass-text-parts-3', { value: w === 1 ? t(l, 'carts-mass-text-parts') : t(l, 'carts-mass-text-parts-2') }) }));
      const weigh = P1 !== null && P2 !== null ? (t(l, 'carts-mass-text-weigh', { P1: N(P1, l), P2: N(P2, l), P22: times(P2 / P1, l) })) : '';
      const s = `${parts.map(stepLine).join(';') + STEPS_END}${weigh}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + t(l, 'carts-mass-answer-text');
    }),
  };
};
