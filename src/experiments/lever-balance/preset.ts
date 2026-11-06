import { msg } from '../../knowledge/messages.js';
import { ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Choice, Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { type SubstanceId, SUBSTANCES } from '../../substances/catalog.js';
import { defineCard } from '../types.js';

/** Liquids whose density the lab work finds (all fit the balance in a 100 mL cylinder). */
const LIQUIDS_FOR_DENSITY: readonly Choice[] = (['sunflower-oil', 'glycerol', 'ethanol'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));

export const preset_lever_balance: Preset = {
  id: 'lever-balance',
  grade: 7,
  topic: INTERACTION,
  title: msg('lever-balance-title'),
  question: msg('lever-balance-question'),
  params: { ...room, vessel: 'beaker', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'balance',
  plan: [
    { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'aluminium', mass: 0.0543, label: msg('lever-balance-command-label') } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, label: msg('lever-balance-command-label-2') } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: msg('lever-balance-command-label-3') } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: msg('lever-balance-command-label-4') } },
  ],
  choices: [ch('diff', msg('lever-balance-choices')), ch('total', msg('lever-balance-choices-2')), ch('glass', msg('lever-balance-choices-3'))],
  choicesAt: 'end',
  asides: [msg('lever-balance-aside-grand-k')],
  formulas: ['mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 4', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 4. Вимірювання маси тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16, лабораторна робота № 4, с. 116' } }, { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Маса тіла. Густина речовини.' }],
  expect: 'reached',
};

export const preset_liquid_density: Preset = varied(
  {
    id: 'liquid-density',
    grade: 7,
    topic: INTERACTION,
    title: msg('lever-balance-liquid-density-title'),
    guided: true,
    bench: 'balance',
    asides: [msg('lever-balance-aside-hypatia')],
    formulas: ['mechanics.density'],
    quoteHas: 'густини',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 5', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 5. Визначення густини речовини (твердих тіл, рідин).', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 17, лабораторна робота № 5, с. 122' } }],
    expect: 'reached',
  },
  {
    controls: [
      { id: 'liquid', label: msg('lever-balance-liquid-label'), kind: 'choice', options: LIQUIDS_FOR_DENSITY, value: 'sunflower-oil' },
      { id: 'volume', label: msg('lever-balance-volume-label'), kind: 'number', unit: 'mL', min: 30, max: 60, step: 5, value: 50 },
    ],
    build: (v) => {
      const liquid = SUBSTANCES[v['liquid'] as SubstanceId];
      const volume = Number(v['volume']);
      // The liquid's name, and in the genitive (where the language needs it).
      const names = { name: (l: Locale) => liquid.name[l].toLowerCase(), gen: (l: Locale) => (liquid.genitive?.[l] ?? liquid.name[l]).toLowerCase() };
      return {
        ask: msg('lever-balance-liquid-density-ask', names),
        question: msg('lever-balance-liquid-question', { volume: String(volume), ...names }),
        params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: volume / 1000, action: 'settle', substance: liquid.id as SubstanceId, startTemp: 20 },
        plan: [
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: msg('lever-balance-command-label-5') } },
          // Water first, the same volume of it: what the liquid is compared with is measured too.
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', substance: 'water', volume: volume * 1e-6, label: msg('lever-balance-water-label') } },
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', volume: volume * 1e-6, label: msg('lever-balance-cylinder-label', names) } },
        ],
        // (What the question asks: which of the two is heavier. `heavier` — the liquid.)
        choices: [ch('heavier', liquid.name), ch('same', msg('lever-balance-choice-same')), ch('lighter', msg('lever-balance-choice-water'))],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'balance', setup: msg('lever-balance-setup'), presets: [preset_lever_balance, preset_liquid_density] });
