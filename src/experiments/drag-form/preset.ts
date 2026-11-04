import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_drag_form: Preset = {
  ask: msg('drag-form-ask'),
  id: 'drag-form',
  grade: 7,
  topic: INTERACTION,
  title: msg('drag-form-title'),
  question: msg('drag-form-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'drag',
  plan: [
    ...(['ball', 'cube', 'plate'] as const).map((shape) => ({ kind: 'bench', command: { type: 'lab.drag', shape, medium: 'water' } }) as const),
    { kind: 'bench', command: { type: 'lab.drag', shape: 'ball', medium: 'air' } },
  ],
  choices: [ch('plate', msg('drag-form-choices')), ch('ball', msg('drag-form-choices-2')), ch('same', msg('drag-form-choices-3'))],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'між формою тіла, густиною середовища і силою опору середовища' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'drag', setup: msg('drag-form-setup'), presets: [preset_drag_form] });
