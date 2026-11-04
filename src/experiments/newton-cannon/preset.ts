import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { degText, kmText, speedText } from './shared.js';
import { defineCard } from '../types.js';

const SPEED = [{ id: 'm-per-s', factor: 1 }, { id: 'km-per-s', factor: 1000 }];
const HEIGHT = [{ id: 'm', factor: 1 }, { id: 'km', factor: 1000 }];

export const preset_newton_cannon: Preset = varied(
  {
    id: 'newton-cannon',
    ask: msg('newton-cannon-ask'),
    grade: 7,
    topic: INTERACTION,
    title: msg('newton-cannon-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'cannon',
    choices: (['no-gravity', 'misses', 'engines'] as const).map((id) => ch(id, msg(`newton-cannon-choice-${id}`))),
    answerOnBoard: ['cn-v1', 'cn-shot:', 'cn-low:'],
    asides: [msg('newton-cannon-aside-sputnik')],
    formulas: ['mechanics.circular-speed', 'mechanics.gravity-at'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Рухи небесних тіл та штучних супутників Землі.' },
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'related', quote: 'Невагомість.' },
    ],
    expect: 'reached',
  },
  {
    // Any mountain (from the ground up), any three speeds, any angle to the horizon (0 — Newton's own sideways shot);
    // and the «what if…» — faster still.
    controls: [
      { id: 'h', label: msg('newton-cannon-h'), kind: 'number', unit: 'm', min: 0, max: 1e8, step: 0, value: 200_000, units: HEIGHT },
      { id: 'angle', label: msg('newton-cannon-angle'), kind: 'number', unit: 'deg', min: -90, max: 90, step: 0, value: 0 },
      { id: 'v1', label: msg('newton-cannon-v1'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 3000, units: SPEED },
      { id: 'v2', label: msg('newton-cannon-v2'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 6000, units: SPEED },
      { id: 'v3', label: msg('newton-cannon-v3'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 7800, units: SPEED },
      { id: 'v4', label: msg('newton-cannon-v4'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 10_000, units: SPEED },
    ],
    build: (v) => {
      const h = Number(v['h']);
      const speeds = [Number(v['v1']), Number(v['v2']), Number(v['v3'])].sort((a, b) => a - b);
      const v4 = Number(v['v4']);
      const angle = Number(v['angle']);
      return {
        question: msg('newton-cannon-question', { level: angle === 0 ? 'yes' : 'no', angle: (l) => degText(angle, l), h: (l) => kmText(h, l), v1: (l) => speedText(speeds[0]!, l), v3: (l) => speedText(speeds[2]!, l) }),
        plan: [
          ...speeds.map((x) => ({ kind: 'bench', command: { type: 'lab.cannon', h, v: x, angle } }) as const),
          { kind: 'bench', command: { type: 'lab.cannon', h, v: v4, angle }, optional: msg('newton-cannon-optional-faster', { v: (l) => speedText(v4, l) }) },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'cannon', setup: msg('newton-cannon-setup'), presets: [preset_newton_cannon] });
