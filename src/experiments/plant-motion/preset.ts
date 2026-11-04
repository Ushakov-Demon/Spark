import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { SNAIL_PATH, SNAIL_TIME } from '../snail-speed/shared.js';
import { HOUR } from './shared.js';
import { mmPerS, spanText } from './shared.js';
import { defineCard } from '../types.js';

const HOURS = [{ id: 'min', factor: 1 / 60 }, { id: 'h', factor: 1 }, { id: 'day', factor: 24 }];
/** The snail by which the shoot is measured: on a flat plastic sheet (the snail-speed experiment). */
export const snailSpeed = () => SNAIL_PATH.flat.value / SNAIL_TIME;

export const preset_plant_motion: Preset = varied(
  {
    id: 'plant-motion',
    ask: msg('plant-motion-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('plant-motion-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'plant',
    choices: (['snail', 'bamboo', 'same'] as const).map((id) => ch(id, msg(`plant-motion-choice-${id}`))),
    answerOnBoard: ['pm-shoot:', 'pm-trap:'],
    asides: [msg('plant-motion-aside-darwin')],
    formulas: ['mechanics.average-speed'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'моделювання: відносності руху; реальних природних рухів; рухів тварин і рослин' }],
    expect: 'reached',
  },
  {
    // Any two moments for the photos after the first, in minutes, hours or days — up to 23 days, when the shoot reaches
    // the tallest moso's 28 m (0,5 m + 1,19 m a day); any slow-motion camera.
    controls: [
      { id: 't1', label: msg('plant-motion-t1'), kind: 'number', unit: 'h', min: 0, max: 552, step: 0, value: 6, units: HOURS },
      { id: 't2', label: msg('plant-motion-t2'), kind: 'number', unit: 'h', min: 0, max: 552, step: 0, value: 24, units: HOURS },
      { id: 'fps', label: msg('plant-motion-fps'), kind: 'number', unit: '', min: 10, max: 1e6, step: 0, value: 240 },
    ],
    build: (v) => {
      const times = [Number(v['t1']), Number(v['t2'])].sort((a, b) => a - b).map((h) => h * HOUR);
      const fps = Number(v['fps']);
      return {
        question: msg('plant-motion-question', { t1: (l) => spanText(times[0]!, l), t2: (l) => spanText(times[1]!, l), snail: (l) => mmPerS(snailSpeed(), l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.plant', step: 'shoot', t: 0 } },
          ...times.map((tt) => ({ kind: 'bench', command: { type: 'lab.plant', step: 'shoot', t: tt } }) as const),
          // The «what if…»: the quickest plant movement there is, filmed in slow motion.
          { kind: 'bench', command: { type: 'lab.plant', step: 'trap', fps }, optional: msg('plant-motion-optional-trap') },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'plant', setup: msg('plant-motion-setup'), presets: [preset_plant_motion] });
