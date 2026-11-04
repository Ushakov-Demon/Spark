import { kineticEnergy, potentialEnergy } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, stepLine, STEPS_END, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_rolling_energy: Preset = {
  id: 'rolling-energy',
  ask: msg('rolling-energy-ask'),
  grade: 7,
  topic: WORK,
  title: msg('rolling-energy-title'),
  question: msg('rolling-energy-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'energy',
  plan: [{ kind: 'bench', command: { type: 'lab.energy', step: 'weigh' } }, ...[0.05, 0.1, 0.2].map((height) => ({ kind: 'bench', command: { type: 'lab.energy', step: 'roll', height } }) as const)],
  choices: [
    ch('all', msg('rolling-energy-choices')),
    ch('most', msg('rolling-energy-choices-2')),
    ch('tiny', msg('rolling-energy-choices-3')),
  ],
  // The share is the answer: chalked in once a guess is made.
  answerOnBoard: ['er:'],
  asides: [
    msg('rolling-energy-asides'),
  ],
  formulas: ['mechanics.kinetic-energy', 'mechanics.potential-energy', 'mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: кінетичної та потенціальної енергії тіл' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'виявлення зміни і перетворення механічної енергії' },
  ],
  expect: 'reached',
};

export const answer_rolling_energy = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.energy' && x.record.value !== null);
  const m = R.find((x) => x.command['step'] === 'weigh')?.record.value ?? 0;
  const rolls = R.filter((x) => x.record.inputs?.['which'] === 2).map((x) => {
    const i = x.record.inputs ?? {};
    const h = R.find((y) => y.record.inputs?.['which'] === 1 && y.record.inputs?.['height'] === i['height'])?.record.value ?? i['height'] ?? 0;
    const v = (i['path'] ?? 0.5) / x.record.value!;
    const Ek = kineticEnergy(m, v);
    const Ep = potentialEnergy(m, i['g'] ?? 9.81, h);
    return { h, v, Ek, Ep, share: Ep > 0 ? Ek / Ep : 0, frames: i['frames'] ?? 0 };
  });
  const mean = rolls.length ? rolls.reduce((a, b) => a + b.share, 0) / rolls.length : 0;
  const correct = !rolls.length || !m ? undefined : mean > 0.92 ? 'all' : mean > 0.5 ? 'most' : 'tiny';
  const mJ = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${t(l, 'unit-sym-mJ')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('rolling-energy-answer-why'),
    say: both((l) => (correct === 'most' ? (t(l, 'rolling-energy-answer-say', { mean: String(Math.round(mean * 100)) })) : t(l, 'rolling-energy-answer-say-2'))),
    text: both((l) => {
      if (!rolls.length || !m) return '';
      const list = rolls.map((x) => t(l, 'rolling-energy-text-list', { h: String(Math.round(x.h * 100)), frames: String(x.frames), v: sig(x.v, 3, l), Ek: mJ(x.Ek, l), Ep: mJ(x.Ep, l), share: sig(x.share, 2, l) })).map(stepLine).join(';') + STEPS_END;
      return t(l, 'rolling-energy-answer-text', { m: sig(m * 1000, 3, l), list, mean: sig(mean, 2, l) });
    }),
  };
};
