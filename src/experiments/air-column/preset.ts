import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, PLACE_KYIV, PLACE_NEW_YORK, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { parsePlace } from '../../scenarios/place.js';
import { defineCard } from '../types.js';

export const preset_air_column: Preset = varied(
  {
    ask: msg('air-column-ask'),
    id: 'air-column',
    grade: 7,
    topic: INTERACTION,
    title: msg('air-column-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'air',
    choices: [ch('nothing', msg('air-column-choices')), ch('car', msg('air-column-choices-2')), ch('tonnes', msg('air-column-choices-3'))],
    answerOnBoard: ['am:'],
    asides: [msg('air-column-aside-everest')],
    formulas: ['mechanics.pressure', 'mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'впливу земного тяжіння на організми, газову оболонку Землі' }],
    expect: 'reached',
  },
  {
    // The town: its height above the sea sets the readings (the higher the town, the less air above it).
    controls: [{ id: 'place', label: msg('air-column-place-label'), kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK }],
    build: (v) => {
      const value = String(v['place']);
      const name = parsePlace(value)?.name ?? 'Київ';
      return {
        question: msg('air-column-build-question', { name }),
        plan: (['ground', 'ninth', 'airship', 'high'] as const).map((where) => ({ kind: 'bench', command: { type: 'lab.air', place: value, where } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'air', setup: msg('air-column-setup'), presets: [preset_air_column] });
