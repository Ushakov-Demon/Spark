import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_hydrostatic_paradox: Preset = varied(
  {
    id: 'hydrostatic-paradox',
    ask: msg('hydrostatic-paradox-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('hydrostatic-paradox-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'vessels',
    choices: [ch('same', msg('hydrostatic-paradox-choices')), ch('wide', msg('hydrostatic-paradox-choices-2')), ch('narrow', msg('hydrostatic-paradox-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['vF:'],
    formulas: ['mechanics.bottom-force', 'mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Тиск рідин і газів. Закон Паскаля. Гідростатичний тиск.' }],
    expect: 'reached',
  },
  {
    // How high the water stands: the manometer follows it, the shapes do not matter.
    controls: [{ id: 'height', label: msg('hydrostatic-paradox-height-label'), kind: 'number', unit: 'cm', min: 6, max: 12, step: 2, value: 10 }],
    build: (v) => {
      const cm = Number(v['height']);
      const height = cm / 100;
      return {
        question: msg('hydrostatic-paradox-build-question', { cm: String(cm) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.vessel', step: 'bottom' } },
          ...(['straight', 'wide', 'narrow'] as const).map((shape) => ({ kind: 'bench', command: { type: 'lab.vessel', step: 'fill', shape, height } }) as const),
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'vessels', setup: msg('hydrostatic-paradox-setup'), presets: [preset_hydrostatic_paradox] });
