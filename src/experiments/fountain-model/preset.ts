import { riseHeight } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_fountain_model: Preset = {
  id: 'fountain-model',
  ask: msg('fountain-model-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('fountain-model-title'),
  question: msg('fountain-model-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'fountain',
  plan: [-0.05, 0.1, 0.3, 0.5].map((head) => ({ kind: 'bench', command: { type: 'lab.fountain', head } }) as const),
  choices: [
    ch('level', msg('fountain-model-choices')),
    ch('above', msg('fountain-model-choices-2')),
    ch('low', msg('fountain-model-choices-3')),
  ],
  // The share of the head the jet reached is the answer: chalked in once a guess is made.
  answerOnBoard: ['fh:'],
  asides: [
    msg('fountain-model-asides'),
  ],
  formulas: ['mechanics.torricelli', 'mechanics.rise-height', 'mechanics.potential-energy'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'конструювання: моделі фонтана' }],
  expect: 'reached',
};

export const answer_fountain_model = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.fountain' && x.record.value !== null);
  const jets = R.filter((x) => (x.record.inputs?.['head'] ?? 0) > 0).map((x) => {
    const i = x.record.inputs ?? {};
    return { head: i['head'] ?? 0, jet: x.record.value!, ideal: i['ideal'] ?? 0, speed: i['speed'] ?? 0, loss: i['loss'] ?? 0, re: i['reynolds'] ?? 0, g: i['g'] ?? 9.81 };
  });
  const below = R.some((x) => (x.record.inputs?.['head'] ?? 0) <= 0);
  const correct = !jets.length ? undefined : jets.every((x) => x.jet <= x.head && x.jet >= 0.8 * x.head) ? 'level' : jets.some((x) => x.jet > x.head) ? 'above' : 'low';
  const cm = (x: number) => Math.round(x * 100);
  const u = (l: Locale) => t(l, 'unit-sym-cm');
  const ms = (x: number, l: Locale) => `${sig(x, 3, l)} ${t(l, 'unit-sym-m-per-s')}`;
  const last = jets[jets.length - 1];
  return {
    ...(correct ? { correct } : {}),
    why: msg('fountain-model-answer-why'),
    say: both((l) => (correct === 'level' && last ? (t(l, 'fountain-model-answer-say', { jet: String(cm(last.jet)), head: String(cm(last.head)) })) : t(l, 'fountain-model-answer-say-2'))),
    text: both((l) => {
      if (!jets.length) return '';
      const list = jets.map((x) => t(l, 'fountain-model-text-list', { head: String(cm(x.head)), jet: String(cm(x.jet)) })).map(stepLine).join(';') + STEPS_END;
      const lost = jets.map((x) => `${cm(x.head - x.jet)} ${u(l)}`).join(', ');
      const tail = last
        ? t(l, 'fountain-model-text-tail', { head: String(cm(last.head)), ideal: ms(last.ideal, l), speed: ms(last.speed, l), speed2: sig(riseHeight(last.speed, last.g) * 100, 3, l), loss: sig(last.loss * 100, 2, l), re: String(Math.round(last.re)) })
        : '';
      const head = t(l, 'fountain-model-text-head-2', { list, lost, value: below ? t(l, 'fountain-model-text-head') : '' });
      return `${head}${tail}${t(l, 'fountain-model-answer-text')}`;
    }),
  };
};
