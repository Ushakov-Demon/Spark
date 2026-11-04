import { COMPONENTS } from '../../components/index.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { sig } from '../../explain/format.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, ch, INTRO, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { bulb, GLASS_WATER } from './bench.js';
import { degC, reading, timeText } from './words.js';

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

export const answer_read_thermometer = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.thermometer' && x.record.value !== null);
  const dips = R.filter((x) => x.command['step'] === 'dip');
  const still = dips.filter((x) => !x.command['stir']);
  const stirred = dips.find((x) => x.command['stir']);
  const first = still[0];
  if (!first) return { why: msg('read-thermometer-why'), say: NO_TEXT, text: NO_TEXT };
  const water = Number(first.command['water']);
  const roomT = Number(first.command['room']);
  const div = first.record.inputs?.['division'] ?? 1;
  const deg = (x: (typeof R)[number]) => Math.round(((x.record.value ?? 0) - ZERO_CELSIUS_IN_KELVIN) / div) * div;
  // All the readings the same — the water's: no waiting was needed (it was short, or there was nothing to reach).
  const same = still.every((x) => deg(x) === deg(first)) && Math.abs(deg(first) - water) <= div / 2;
  const correct = same ? (Number(first.command['t']) <= 3 ? 'at-once' : 'any') : 'wait';
  const { tau, C } = bulb();
  // How long to wait: till the bulb's excess is within half a division; and how little the water gave away for it.
  const gap = Math.abs(water - roomT);
  const wait = gap > div / 2 ? tau * Math.log(gap / (div / 2)) : 0;
  const water1 = GLASS_WATER.value * COMPONENTS.water.phases.liquid!.specificHeat!.value;
  const lost = (C * gap) / water1;
  const reached = still.find((x) => Math.abs(deg(x) - water) <= div / 2);
  return {
    correct,
    why: msg('read-thermometer-why', { tau: (l) => timeText(tau, l, 2), wait: (l) => timeText(wait, l, 2), stirTau: (l) => timeText(bulb(true).tau, l, 2), lost: (l) => degC(lost, l, 3), C: (l) => sig(C, 2, l) }),
    say: msg('read-thermometer-say', { water: (l) => degC(water, l), first: (l) => reading(first.record, l), t1: (l) => timeText(Number(first.command['t']), l), reached: reached ? 'yes' : 'no', t: (l) => (reached ? timeText(Number(reached.command['t']), l) : '') }),
    text: msg('read-thermometer-text', {
      rows: (l) =>
        [...still, ...(stirred ? [stirred] : [])].map((x) => t(l, 'read-thermometer-row', { t: timeText(Number(x.command['t']), l), T: reading(x.record, l), stir: x.command['stir'] ? 'yes' : 'no' })).map(stepLine).join(';') + STEPS_END,
      water: (l) => degC(water, l),
    }),
  };
};
