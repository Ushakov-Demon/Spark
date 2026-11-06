import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_contact_forces: Preset = {
  ask: msg('contact-forces-ask'),
  id: 'contact-forces',
  grade: 7,
  topic: INTERACTION,
  title: msg('contact-forces-title'),
  question: msg('contact-forces-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'touch',
  plan: (['magnet', 'card', 'comb', 'lifted', 'fall'] as const).map((c) => ({ kind: 'bench', command: { type: 'lab.touch', case: c } }) as const),
  choices: [ch('field', msg('contact-forces-choices')), ch('none', msg('contact-forces-choices-2')), ch('magnet', msg('contact-forces-choices-3'))],
  asides: [msg('contact-forces-aside-gilbert')],
  formulas: ['mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'контактних і безконтактних сил' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'touch', setup: msg('contact-forces-setup'), presets: [preset_contact_forces] });
