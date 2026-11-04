import { msg } from '../../knowledge/messages.js';
import { parsePlace } from '../../scenarios/place.js';
import { beaker, MOTION, PLACE_KYIV, PLACE_NEW_YORK, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { PLACE_BOSTON, PLACE_LVIV, scaleText } from './shared.js';
import { defineCard } from '../types.js';

export const preset_map_scale: Preset = varied(
  {
    id: 'map-scale',
    ask: msg('map-scale-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('map-scale-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'map',
    choices: (['large', 'small', 'same'] as const).map((id) => ({ id, label: msg(`map-scale-choice-${id}`) })),
    asides: [msg('map-scale-aside-beauplan')],
    formulas: ['mechanics.map-scale'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: … відстаней на планах і картах' }],
    expect: 'reached',
  },
  {
    // Any two towns (found by name, online) and any two maps.
    controls: [
      { id: 'from', label: msg('map-scale-from'), kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK },
      { id: 'to', label: msg('map-scale-to'), kind: 'place', value: PLACE_LVIV, en: PLACE_BOSTON },
      { id: 'scale1', label: msg('map-scale-scale1'), kind: 'number', unit: '', min: 1, max: 1e9, step: 0, value: 2_000_000 },
      { id: 'scale2', label: msg('map-scale-scale2'), kind: 'number', unit: '', min: 1, max: 1e9, step: 0, value: 10_000_000 },
    ],
    build: (v) => {
      const from = String(v['from']);
      const to = String(v['to']);
      const s1 = Number(v['scale1']);
      const s2 = Number(v['scale2']);
      return {
        question: msg('map-scale-question', { scale1: (l) => scaleText(s1, l), scale2: (l) => scaleText(s2, l), from: parsePlace(from)?.name ?? '?', to: parsePlace(to)?.name ?? '?' }),
        plan: [s1, s2].map((scale) => ({ kind: 'bench', command: { type: 'lab.map', from, to, scale } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'map', setup: msg('map-scale-setup'), presets: [preset_map_scale] });
