import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTRO, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_small_bodies: Preset = {
  ask: msg('small-bodies-ask'),
  id: 'small-bodies',
  grade: 7,
  topic: INTRO,
  title: msg('small-bodies-title'),
  question: msg('small-bodies-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'rows',
  plan: [
    { kind: 'bench', command: { type: 'lab.rows', body: 'pea', count: 1 } },
    { kind: 'bench', command: { type: 'lab.rows', body: 'pea', count: 15 } },
    { kind: 'bench', command: { type: 'lab.rows', body: 'millet', count: 40 } },
    { kind: 'bench', command: { type: 'lab.rows', body: 'thread', count: 30 } },
  ],
  choices: [ch('row', msg('small-bodies-choices')), ch('one', msg('small-bodies-choices-2')), ch('cant', msg('small-bodies-choices-3'))],
  asides: [msg('small-bodies-aside-gascoigne')],
  formulas: ['mechanics.row-size'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Вступ', match: 'same', quote: 'вимірювання фізичних величин (маси, розмірів малих тіл, площ, відстаней, об’ємів, температури, освітленості)' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 1. Методи пізнання природи. Фізика як природнича наука', match: 'related', quote: 'Фізичні величини та їх вимірювання.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'розділ 1, експериментальна робота «Вимірювання розмірів малих тіл методом рядів», с. 36' } },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'rows', setup: msg('small-bodies-setup'), presets: [preset_small_bodies] });
