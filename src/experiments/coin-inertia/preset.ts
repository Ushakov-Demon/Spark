import { msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_coin_inertia: Preset = {
  ask: msg('coin-inertia-ask'),
  id: 'coin-inertia',
  grade: 7,
  topic: INTERACTION,
  title: msg('coin-inertia-title'),
  question: msg('coin-inertia-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'coin',
  plan: (['slow', 'push', 'flick', 'snap'] as const).map((pull) => ({ kind: 'bench', command: { type: 'lab.coin', pull } }) as const),
  choices: [ch('inertia', msg('coin-inertia-choices')), ch('heavy', msg('coin-inertia-choices-2')), ch('air', msg('coin-inertia-choices-3'))],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження • інерції' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: 'Явище інерції. Інертність і маса тіла', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 15 «Явище інерції»: «Інерція — це явище зберігання швидкості руху тіла за відсутності або скомпенсованості дії на нього інших тіл»' } },
  ],
  expect: 'reached',
};

export const answer_coin_inertia = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.coin' && x.record.value !== null).map((x) => ({ pull: String(x.command['pull']), s: x.record.value!, v: x.record.inputs?.['speed'] ?? 0, t: x.record.inputs?.['time'] ?? 0, slipped: x.record.inputs?.['slipped'] === 1, inGlass: x.record.inputs?.['inGlass'] === 1 }));
  const fastIn = R.filter((x) => x.v >= 1).every((x) => x.inGlass);
  const slowOut = R.some((x) => !x.inGlass);
  const mm = (x: number) => Math.round(x * 1000);
  const where = (x: (typeof R)[number], l: Locale) => ((x.inGlass ? tl(l, 'coin-inertia-answer-where') : x.slipped ? tl(l, 'coin-inertia-answer-where-2') : tl(l, 'coin-inertia-answer-where-3')));
  return {
    ...(fastIn && slowOut ? { correct: 'inertia' } : {}),
    why: msg('coin-inertia-answer-why'),
    say: both((l) => {
      const snap = R.find((x) => x.pull === 'snap');
      return snap ? (tl(l, 'coin-inertia-answer-say', { t: sig(snap.t, 2, l), s: String(mm(snap.s)) })) : '';
    }),
    text: both((l) => {
      const how: Record<string, string> = { slow: tl(l, 'coin-inertia-how-slow'), push: tl(l, 'coin-inertia-how-push'), flick: tl(l, 'coin-inertia-how-flick'), snap: tl(l, 'coin-inertia-how-snap') };
      const s = `${R.map((x) => `${how[x.pull] ?? x.pull}: ${tl(l, 'coin-inertia-text-s')} ${mm(x.s)} ${tl(l, 'unit-sym-mm')} — ${where(x, l)}`).map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + tl(l, 'coin-inertia-answer-text');
    }),
  };
};
