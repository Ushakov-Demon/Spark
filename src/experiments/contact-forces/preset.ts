import type { Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';
import { gapText, massText, TOUCH_MAGNETS, type TouchMagnet } from './shared.js';

export const preset_contact_forces: Preset = varied(
  {
    ask: msg('contact-forces-ask'),
    id: 'contact-forces',
    grade: 7,
    topic: INTERACTION,
    title: msg('contact-forces-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'touch',
    choices: [ch('field', msg('contact-forces-choices')), ch('none', msg('contact-forces-choices-2')), ch('magnet', msg('contact-forces-choices-3'))],
    asides: [msg('contact-forces-aside-gilbert')],
    formulas: ['mechanics.weight', 'mechanics.friction'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'контактних і безконтактних сил' },
    ],
    expect: 'reached',
  },
  {
    // (From 1 cm: nearer, the ball is no longer small beside the distance. Any gap beyond, any weight.)
    controls: [
      { id: 'gap', label: msg('contact-forces-gap'), kind: 'number', unit: 'm', min: 0.01, max: 1, step: 0, value: 0.02, units: [{ id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'magnet', label: msg('contact-forces-magnet-label'), kind: 'choice', value: 'ferrite', options: TOUCH_MAGNETS.map((m) => ch(m, msg(`contact-forces-magnet-${m}`))) },
      { id: 'mass', label: msg('contact-forces-mass'), kind: 'number', unit: 'kg', min: 0.001, max: 1e6, step: 0, value: 0.3, units: [{ id: 'g', factor: 0.001 }, { id: 'kg', factor: 1 }, { id: 't', factor: 1000 }] },
    ],
    build: (v) => {
      const gap = Number(v['gap']);
      const mass = Number(v['mass']);
      const magnet = String(v['magnet']) as TouchMagnet;
      return {
        question: msg('contact-forces-question', { gap: (l: Locale) => gapText(gap, l), mass: (l: Locale) => massText(mass, l) }),
        plan: (['magnet', 'card', 'comb', 'table', 'lifted', 'fall'] as const).map((c) => ({ kind: 'bench', command: { type: 'lab.touch', case: c, gap, magnet, mass } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'touch', setup: msg('contact-forces-setup'), presets: [preset_contact_forces] });
