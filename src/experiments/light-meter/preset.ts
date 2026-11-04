import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTRO, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { lampFlux } from './shared.js';
import type { LampKind } from '../../equipment/lamps.js';
import { degText, fluxText, wattText } from './shared.js';
import { defineCard } from '../types.js';

/** Where the lamp stands for the three looks, unless it is dragged elsewhere: 30, 60 and 90 cm. */
const HEIGHTS = [0.3, 0.6, 0.9];

export const preset_light_meter: Preset = varied(
  {
    id: 'light-meter',
    ask: msg('light-meter-ask'),
    grade: 7,
    topic: INTRO,
    title: msg('light-meter-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'luxmeter',
    choices: (['linear', 'square', 'same'] as const).map((id) => ch(id, msg(`light-meter-choice-${id}`))),
    answerOnBoard: ['lm-at:', 'lm-ratio:'],
    asides: [msg('light-meter-aside-bouguer')],
    formulas: ['optics.illuminance'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (маси, розмірів малих тіл, площ, відстаней, об’ємів, температури, освітленості)' },
      { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.' },
    ],
    expect: 'reached',
  },
  {
    // Any lamp of any power; the heights — where the lamp is dragged (30, 60, 90 cm if it is not); and the «what
    // if…» — the meter tilted.
    controls: [
      { id: 'lamp', label: msg('light-meter-lamp'), kind: 'choice', value: 'led', options: (['led', 'incandescent'] as const).map((id) => ch(id, msg(`light-meter-lamp-${id}`))) },
      { id: 'power', label: msg('light-meter-power'), kind: 'number', unit: 'W', min: 0.1, max: 1e5, step: 0, value: 8 },
      { id: 'tilt', label: msg('light-meter-tilt'), kind: 'number', unit: 'deg', min: 0, max: 89, step: 0, value: 60 },
    ],
    build: (v) => {
      const lamp = String(v['lamp']) as LampKind;
      const power = Number(v['power']);
      const flux = lampFlux(lamp, power);
      const r = HEIGHTS;
      const tilt = Number(v['tilt']);
      return {
        question: msg('light-meter-question', { lamp, power: (l) => wattText(power, l), flux: (l) => fluxText(flux, l) }),
        plan: [
          ...r.map((x) => ({ kind: 'bench', command: { type: 'lab.luxmeter', lamp, power, r: x } }) as const),
          // The «what if…»: the lamp back at the first height, the meter tilted.
          { kind: 'bench', command: { type: 'lab.luxmeter', lamp, power, r: r[0]!, tilt }, optional: msg('light-meter-optional-tilt', { tilt: (l) => degText(tilt, l) }) },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'luxmeter', setup: msg('light-meter-setup'), presets: [preset_light_meter] });
