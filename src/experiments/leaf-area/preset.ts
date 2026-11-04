import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTRO, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { formName, LEAF_FORMS, type LeafForm } from './shared.js';
import { sideText } from './shared.js';
import { defineCard } from '../types.js';

const FORMS = Object.keys(LEAF_FORMS) as LeafForm[];

export const preset_leaf_area: Preset = varied(
  {
    id: 'leaf-area',
    ask: msg('leaf-area-ask'),
    grade: 7,
    topic: INTRO,
    title: msg('leaf-area-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'area',
    choices: (['fine', 'coarse', 'same'] as const).map((id) => ch(id, msg(`leaf-area-choice-${id}`))),
    asides: [msg('leaf-area-aside-rhind')],
    formulas: ['mechanics.rectangle-area', 'mechanics.palette-area'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (… площ …) за допомогою вимірювальних приладів' },
      { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.' },
    ],
    expect: 'reached',
  },
  {
    // Any card, any leaf (its form and length), any two palettes.
    controls: [
      { id: 'a', label: msg('leaf-area-card-a'), kind: 'number', unit: 'm', min: 0.001, max: 1, step: 0, value: 0.06, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'b', label: msg('leaf-area-card-b'), kind: 'number', unit: 'm', min: 0.001, max: 1, step: 0, value: 0.04, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'form', label: msg('leaf-area-form'), kind: 'choice', value: 'ovate', options: FORMS.map((f) => ch(f, formName(f))) },
      { id: 'length', label: msg('leaf-area-length'), kind: 'number', unit: 'm', min: 0.01, max: 1, step: 0, value: 0.1, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'side1', label: msg('leaf-area-side1'), kind: 'number', unit: 'm', min: 0.0005, max: 0.05, step: 0, value: 0.01, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }] },
      { id: 'side2', label: msg('leaf-area-side2'), kind: 'number', unit: 'm', min: 0.0005, max: 0.05, step: 0, value: 0.005, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }] },
    ],
    build: (v) => {
      const form = (FORMS as string[]).includes(String(v['form'])) ? (String(v['form']) as LeafForm) : 'ovate';
      const length = Number(v['length']);
      const sides = [Number(v['side1']), Number(v['side2'])];
      return {
        question: msg('leaf-area-question', { side1: (l) => sideText(sides[0]!, l), side2: (l) => sideText(sides[1]!, l), form: (l) => formName(form)[l] }),
        plan: [
          { kind: 'bench', command: { type: 'lab.area', step: 'card', a: Number(v['a']), b: Number(v['b']) } },
          ...sides.map((side) => ({ kind: 'bench', command: { type: 'lab.area', step: 'palette', form, length, side } }) as const),
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'area', setup: msg('leaf-area-setup'), presets: [preset_leaf_area] });
