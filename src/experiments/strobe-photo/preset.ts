import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_strobe_photo: Preset = {
  ask: msg('strobe-photo-ask'),
  id: 'strobe-photo',
  grade: 7,
  topic: MOTION,
  title: msg('strobe-photo-title'),
  question: msg('strobe-photo-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'strobe',
  plan: (['table', 'groove'] as const).map((photo) => ({ kind: 'bench', command: { type: 'lab.strobe', photo } }) as const),
  choices: [ch('gaps', msg('strobe-photo-choices')), ch('size', msg('strobe-photo-choices-2')), ch('cant', msg('strobe-photo-choices-3'))],
  answerOnBoard: ['sv:'],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: … відстаней на планах і картах та стробоскопічних фотографіях' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'strobe', setup: msg('strobe-photo-setup'), presets: [preset_strobe_photo] });
