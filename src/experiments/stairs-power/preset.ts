import { HUMAN_POWER_BRIEF, HUMAN_POWER_SUSTAINED, METRIC_HORSEPOWER } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_stairs_power: Preset = varied(
  {
    id: 'stairs-power',
    ask: msg('stairs-power-ask'),
    grade: 7,
    topic: WORK,
    title: msg('stairs-power-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'stairs',
    choices: [
      ch('less', msg('stairs-power-choices')),
      ch('more', msg('stairs-power-choices-2')),
      ch('same', msg('stairs-power-choices-3')),
    ],
    // The powers are the answer: chalked in once a guess is made.
    answerOnBoard: ['sN:'],
    asides: [
      msg('stairs-power-asides'),
    ],
    formulas: ['mechanics.work', 'mechanics.power', 'mechanics.potential-energy'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: … механічної роботи, коли сила діє вздовж напрямку руху; потужності' }],
    expect: 'reached',
  },
  {
    // The pupil's own measurements (an example by default): their mass, the stairs, the two times.
    controls: [
      { id: 'mass', label: msg('stairs-power-mass-label'), kind: 'number', unit: 'kg', min: 20, max: 150, step: 0, value: 50 },
      { id: 'steps', label: msg('stairs-power-steps-label'), kind: 'number', unit: '', min: 3, max: 100, step: 1, value: 18 },
      { id: 'rise', label: msg('stairs-power-rise-label'), kind: 'number', unit: 'cm', min: 10, max: 22, step: 0, value: 16 },
      { id: 'walk', label: msg('stairs-power-walk-label'), kind: 'number', unit: 's', min: 1, max: 600, step: 0, value: 12 },
      { id: 'run', label: msg('stairs-power-run-label'), kind: 'number', unit: 's', min: 1, max: 600, step: 0, value: 4 },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const steps = Number(v['steps']);
      const rise = Number(v['rise']) / 100;
      const all = { mass, steps, rise };
      return {
        question: msg('stairs-power-build-question'),
        plan: [
          { kind: 'bench', command: { type: 'lab.stairs', step: 'weigh', mass } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'measure', steps, rise } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'climb', pace: 'walk', ...all, time: Number(v['walk']) } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'climb', pace: 'run', ...all, time: Number(v['run']) } },
        ],
      };
    },
  },
);

export const answer_stairs_power = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.stairs' && x.command['step'] === 'climb' && x.record.value !== null);
  const climbs = R.map((x) => {
    const i = x.record.inputs ?? {};
    return { run: i['run'] === 1, time: x.record.value!, work: i['work'] ?? 0, power: i['power'] ?? 0, mass: i['mass'] ?? 0, height: i['height'] ?? 0 };
  });
  const walk = climbs.find((x) => !x.run);
  const dash = climbs.find((x) => x.run);
  const hp = METRIC_HORSEPOWER.value;
  const correct = !dash ? undefined : dash.power < hp ? 'less' : 'more';
  const W = (x: number, l: Locale) => `${Math.round(x)} ${t(l, 'unit-sym-W')}`;
  const J = (x: number, l: Locale) => `${Math.round(x)} ${t(l, 'unit-sym-J')}`;
  const sec = (x: number, l: Locale) => `${sig(x, 3, l)} ${t(l, 'unit-sym-s')}`;
  const hpOf = (x: number, l: Locale) => `${sig(x / hp, 2, l)} ${t(l, 'stairs-power-answer-hp-of')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('stairs-power-answer-why'),
    say: both((l) => (dash ? (t(l, 'stairs-power-answer-say', { power: W(dash.power, l), power2: hpOf(dash.power, l) })) : t(l, 'stairs-power-answer-say-2'))),
    text: both((l) => {
      if (!walk || !dash) return '';
      const k = dash.power / Math.max(1e-9, walk.power);
      const ref = t(l, 'stairs-power-text-ref', { value: W(HUMAN_POWER_SUSTAINED.value, l), value2: W(HUMAN_POWER_BRIEF.value, l), hp: W(hp, l) });
      return t(l, 'stairs-power-answer-text', { mass: sig(walk.mass, 3, l), height: sig(walk.height, 3, l), work: J(walk.work, l), time: sec(walk.time, l), power: W(walk.power, l), power2: hpOf(walk.power, l), time2: sec(dash.time, l), power3: W(dash.power, l), power4: hpOf(dash.power, l), k: sig(k, 2, l), ref });
    }),
  };
};
