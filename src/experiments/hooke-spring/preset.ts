import { msg, t } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { defineCard } from '../types.js';
import { heaviestWeight, massText, STRETCH_WEIGHTS } from './shared.js';

export const preset_hooke_spring: Preset = varied(
  {
    id: 'hooke-spring',
    grade: 7,
    topic: INTERACTION,
    title: msg('hooke-spring-title'),
    guided: true,
    bench: 'spring',
    choices: [ch('proportional', msg('hooke-spring-choices')), ch('faster', msg('hooke-spring-choices-2')), ch('slower', msg('hooke-spring-choices-3'))],
    asides: [msg('hooke-spring-aside-balance-spring')],
    formulas: ['mechanics.hooke', 'mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження • інерції; пружних властивостей тіл' }, { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 6', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 6. Дослідження пружних властивостей тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 24, лабораторна робота № 6, с. 172' } }, { program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 1', match: 'same', quote: 'Investigate the relationship between force and extension for a spring.' }],
    expect: 'reached',
  },
  {
    controls: [
      { id: 'spring', label: msg('hooke-spring-controls-label'), kind: 'choice', options: [ch('25', msg('hooke-spring-controls-options')), ch('15', msg('hooke-spring-controls-options-2'))], value: '25' },
      // One weight, the same each time: from what the ruler still tells, up to what all of them stretch the spring to its longest.
      { id: 'mass', label: msg('hooke-spring-mass'), kind: 'number', unit: 'kg', min: 0.01, max: heaviestWeight(25), maxBy: (v) => heaviestWeight(Number(v['spring'])), step: 0, value: 0.1, units: [{ id: 'g', factor: 0.001 }, { id: 'kg', factor: 1 }] },
    ],
    build: (v) => {
      const stiffness = Number(v['spring']);
      const mass = Number(v['mass']);
      return {
        question: msg('hooke-spring-build-question', { value: (l: Locale) => stiffness === 25 ? t(l, 'hooke-spring-question-uk') : t(l, 'hooke-spring-question-uk-2'), mass: (l: Locale) => massText(mass, l) }),
        params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
        plan: Array.from({ length: STRETCH_WEIGHTS + 1 }, (_, weights) => ({ kind: 'bench', command: { type: 'lab.stretch', weights, stiffness, mass } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'spring', setup: msg('hooke-spring-setup'), presets: [preset_hooke_spring] });
