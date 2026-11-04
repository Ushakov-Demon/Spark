import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTRO, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { degC, timeText } from './shared.js';
import { defineCard } from '../types.js';

const SECONDS = [{ id: 's', factor: 1 }, { id: 'min', factor: 60 }];

export const preset_read_thermometer: Preset = varied(
  {
    id: 'read-thermometer',
    ask: msg('read-thermometer-ask'),
    grade: 7,
    topic: INTRO,
    title: msg('read-thermometer-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'thermometer',
    choices: (['wait', 'at-once', 'any'] as const).map((id) => ch(id, msg(`read-thermometer-choice-${id}`))),
    answerOnBoard: ['rt-dip:'],
    asides: [msg('read-thermometer-aside-celsius')],
    formulas: ['mechanics.scale-division'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (маси, розмірів малих тіл, площ, відстаней, об’ємів, температури, освітленості)' },
      { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.' },
    ],
    expect: 'reached',
  },
  {
    // Any water, any room, any three moments to look; and the «what if…» — the water stirred.
    controls: [
      { id: 'water', label: msg('read-thermometer-water'), kind: 'number', unit: 'degC', min: 1, max: 99, step: 0, value: 45 },
      { id: 'room', label: msg('read-thermometer-room'), kind: 'number', unit: 'degC', min: 1, max: 60, step: 0, value: 22 },
      { id: 't1', label: msg('read-thermometer-t1'), kind: 'number', unit: 's', min: 0, max: 3600, step: 0, value: 3, units: SECONDS },
      { id: 't2', label: msg('read-thermometer-t2'), kind: 'number', unit: 's', min: 0, max: 3600, step: 0, value: 15, units: SECONDS },
      { id: 't3', label: msg('read-thermometer-t3'), kind: 'number', unit: 's', min: 0, max: 3600, step: 0, value: 60, units: SECONDS },
    ],
    build: (v) => {
      const water = Number(v['water']);
      const roomT = Number(v['room']);
      // The moments in order: the column is looked at as time goes on.
      const times = [Number(v['t1']), Number(v['t2']), Number(v['t3'])].sort((a, b) => a - b);
      return {
        question: msg('read-thermometer-question', { water: (l) => degC(water, l), t1: (l) => timeText(times[0]!, l), t3: (l) => timeText(times[2]!, l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.thermometer', step: 'scale', room: roomT } },
          ...times.map((tt) => ({ kind: 'bench', command: { type: 'lab.thermometer', step: 'dip', room: roomT, water, t: tt } }) as const),
          // The «what if…»: another such thermometer into the same water, the water stirred, read at the first moment.
          { kind: 'bench', command: { type: 'lab.thermometer', step: 'dip', room: roomT, water, t: times[0]!, stir: true }, optional: msg('read-thermometer-optional-stir') },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'thermometer', setup: msg('read-thermometer-setup'), presets: [preset_read_thermometer] });
