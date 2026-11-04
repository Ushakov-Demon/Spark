import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_liquid_tower: Preset = {
  ask: msg('liquid-tower-ask'),
  id: 'liquid-tower',
  grade: 7,
  topic: INTERACTION,
  title: msg('liquid-tower-title'),
  question: msg('liquid-tower-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'tower',
  plan: [
    { kind: 'bench', command: { type: 'lab.tower', step: 'pour' } },
    ...(['nut', 'acrylic', 'hdpe', 'pine'] as const).map((body) => ({ kind: 'bench', command: { type: 'lab.tower', step: 'drop', body } }) as const),
  ],
  choices: [ch('bottom', msg('liquid-tower-choices')), ch('glycerol', msg('liquid-tower-choices-2')), ch('oil', msg('liquid-tower-choices-3'))],
  trick: msg('liquid-tower-trick'),
  formulas: ['mechanics.density', 'mechanics.submerged-share'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'взаємного розташуванням тіл і рідин різної густини у циліндричному посуді' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'tower', setup: msg('liquid-tower-setup'), presets: [preset_liquid_tower] });
