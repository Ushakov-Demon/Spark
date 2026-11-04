import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MEDIA, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_diode_black_box: Preset = {
  id: 'diode-black-box',
  ask: msg('diode-black-box-ask'),
  grade: 9,
  topic: MEDIA,
  title: msg('diode-black-box-title'),
  question: msg('diode-black-box-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'box',
  plan: [false, true].flatMap((reversed) => [1, 2, 3].map((source) => ({ kind: 'bench', command: { type: 'lab.box', source, reversed } }) as const)),
  choices: [ch('resistor', msg('diode-black-box-choices')), ch('diode', msg('diode-black-box-choices-2')), ch('open', msg('diode-black-box-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['boxR:'],
  formulas: ['electrical.ohm-resistance'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 2', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'same', quote: '№ 2. Дослідження електричного опору кола з напівпровідниковим діодом (дослідження «чорної скриньки»).' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'box', setup: msg('diode-black-box-setup'), presets: [preset_diode_black_box] });
