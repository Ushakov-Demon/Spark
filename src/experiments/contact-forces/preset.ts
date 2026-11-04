import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type TouchCase, touchPlan, touchSeen } from './bench.js';
import { tr } from '../../knowledge/i18n.js';

export const preset_contact_forces: Preset = {
  ask: msg('contact-forces-ask'),
  id: 'contact-forces',
  grade: 7,
  topic: INTERACTION,
  title: msg('contact-forces-title'),
  question: msg('contact-forces-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'touch',
  plan: (['magnet', 'card', 'comb', 'lifted', 'fall'] as const).map((c) => ({ kind: 'bench', command: { type: 'lab.touch', case: c } }) as const),
  choices: [ch('field', msg('contact-forces-choices')), ch('none', msg('contact-forces-choices-2')), ch('magnet', msg('contact-forces-choices-3'))],
  formulas: ['mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'контактних і безконтактних сил' },
  ],
  expect: 'reached',
};

export const answer_contact_forces = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.touch').map((x) => ({ c: String(x.command['case']) as TouchCase, acts: x.record.inputs?.['acts'] === 1, touch: x.record.inputs?.['touch'] === 1 }));
  const farOk = R.filter((x) => x.c !== 'lifted').every((x) => x.acts && !x.touch);
  const frictionNeedsTouch = R.some((x) => x.c === 'lifted' && !x.acts);
  return {
    ...(farOk && frictionNeedsTouch ? { correct: 'field' } : {}),
    why: msg('contact-forces-answer-why'),
    say: msg('contact-forces-answer-say'),
    text: both((l) => {
      const s = `${R.map((x) => `${tr(touchPlan(x.c), l)} — ${tr(touchSeen(x.c), l)}`).map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1);
    }),
  };
};
