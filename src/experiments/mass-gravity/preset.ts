import type { Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';
import { blockName, blockOf, massText, MG_BLOCKS, type MgBlock } from './shared.js';

const MASS_UNITS = [
  { id: 'g', factor: 0.001 },
  { id: 'kg', factor: 1 },
  { id: 't', factor: 1000 },
];

export const preset_mass_gravity: Preset = varied(
  {
    id: 'mass-gravity',
    ask: msg('mass-gravity-ask'),
    grade: 7,
    topic: INTERACTION,
    title: msg('mass-gravity-title'),
    guided: true,
    bench: 'mg',
    choices: (['proportional', 'slower', 'same'] as const).map((id) => ch(id, msg(`mass-gravity-choice-${id}`))),
    answerOnBoard: ['mg-ratio:'],
    asides: [msg('mass-gravity-aside-newton'), msg('mass-gravity-aside-poles')],
    formulas: ['mechanics.gravity-force'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження … між масою і силою тяжіння' },
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Зв’язок сили тяжіння і маси.' },
    ],
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    expect: 'reached',
  },
  {
    // Any first mass (the instrument suits it), each next twice as much; and the «what if…» — a block of another substance, as heavy as the third body.
    controls: [
      { id: 'mass', label: msg('mass-gravity-mass'), kind: 'number', unit: 'kg', min: 0.001, max: 1e6, step: 0, value: 0.1, units: MASS_UNITS },
      { id: 'block', label: msg('mass-gravity-block-label'), kind: 'choice', value: 'wood', options: MG_BLOCKS.map((b) => ch(b, blockName(b))) },
    ],
    build: (v) => {
      const first = Number(v['mass']);
      const masses = [first, 2 * first, 4 * first];
      const block = String(v['block']) as MgBlock;
      const m = (x: number) => (l: Locale) => massText(x, l);
      return {
        question: msg('mass-gravity-question', { m1: m(masses[0]!), m2: m(masses[1]!), m3: m(masses[2]!) }),
        plan: [
          ...masses.map((mass) => ({ kind: 'bench', command: { type: 'lab.mg', mass, body: 'weights' } }) as const),
          { kind: 'bench', command: { type: 'lab.mg', mass: masses[2]!, body: block }, optional: msg('mass-gravity-optional', { block, of: (l: Locale) => blockOf(block)[l].toLowerCase(), mass: m(masses[2]!) }) },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'mg', setup: msg('mass-gravity-setup'), presets: [preset_mass_gravity] });
