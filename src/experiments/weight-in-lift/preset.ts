import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type LiftPhase, liftPhaseText } from './bench.js';
import { sig } from '../../explain/format.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);

export const preset_weight_in_lift: Preset = {
  ask: msg('weight-in-lift-ask'),
  id: 'weight-in-lift',
  grade: 7,
  topic: INTERACTION,
  title: msg('weight-in-lift-title'),
  question: msg('weight-in-lift-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'lift',
  plan: (['rest', 'up-start', 'up', 'up-stop', 'down-start', 'down', 'down-stop', 'fall'] as const).map((phase) => ({ kind: 'bench', command: { type: 'lab.lift', phase } }) as const),
  choices: [ch('accel', msg('weight-in-lift-choices')), ch('up', msg('weight-in-lift-choices-2')), ch('same', msg('weight-in-lift-choices-3'))],
  formulas: ['mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … ваги в ліфтах' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Сили тяжіння та пружності. Вага та невагомість.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 25, дослідження «невагомість», с. 177' } },
  ],
  expect: 'reached',
};

export const answer_weight_in_lift = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.lift' && x.record.value !== null).map((x) => ({ phase: String(x.command['phase']) as LiftPhase, P: x.record.value!, a: x.record.inputs?.['a'] ?? 0 }));
  const at = (p: LiftPhase) => R.find((x) => x.phase === p)?.P;
  const rest = at('rest');
  const steady = R.filter((x) => x.a === 0).every((x) => x.P === rest);
  const more = R.filter((x) => x.a > 0).every((x) => rest !== undefined && x.P > rest);
  const less = R.filter((x) => x.a < 0 && x.phase !== 'fall').every((x) => rest !== undefined && x.P < rest);
  return {
    ...(steady && more && less ? { correct: 'accel' } : {}),
    why: msg('weight-in-lift-answer-why'),
    say: both((l) => {
      const up = at('up-start');
      const down = at('down-start');
      return rest !== undefined && up !== undefined && down !== undefined ? (t(l, 'weight-in-lift-answer-say', { rest: N(rest, l), up: N(up, l), down: N(down, l) })) : '';
    }),
    text: both((l) => {
      const parts = R.map((x) => `${x.phase === 'fall' ? t(l, 'weight-in-lift-text-parts') : tr(liftPhaseText(x.phase).plan, l)} — ${N(x.P, l)}`);
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return (s.charAt(0).toUpperCase() + s.slice(1)) + (t(l, 'weight-in-lift-answer-text', { a: sig(R.find((x) => x.a > 0)?.a ?? 1.2, 2, l) }));
    }),
  };
};
