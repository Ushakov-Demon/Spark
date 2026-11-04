import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, PLACE_KYIV, PLACE_NEW_YORK, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { parsePlace } from '../../scenarios/place.js';
import { defineCard } from '../types.js';

export const preset_solar_noon: Preset = varied(
  {
    id: 'solar-noon',
    ask: msg('solar-noon-ask'),
    grade: 7,
    topic: INTERACTION,
    title: msg('solar-noon-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'gnomon',
    choices: [ch('noon', msg('solar-noon-choices')), ch('later', msg('solar-noon-choices-2')), ch('earlier', msg('solar-noon-choices-3'))],
    answerOnBoard: ['gn:'],
    formulas: ['mechanics.noon-latitude'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'закономірностей руху небесних тіл і обліком часу' }],
    expect: 'reached',
  },
  {
    // The place: any town (by its name): its longitude, latitude and clock decide the noon and the shadow.
    controls: [{ id: 'place', label: msg('solar-noon-place-label'), kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK }],
    build: (v) => {
      const value = String(v['place']);
      const name = parsePlace(value)?.name ?? 'Київ';
      return {
        question: msg('solar-noon-build-question', { name }),
        plan: (['morning', 'noon', 'afternoon'] as const).map((series) => ({ kind: 'bench', command: { type: 'lab.gnomon', place: value, series } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'gnomon', setup: msg('solar-noon-setup'), presets: [preset_solar_noon] });
