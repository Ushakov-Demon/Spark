import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';
import { BULK_NAME, BULK_SUBSTANCES, type BulkSubstance } from './shared.js';

const NAMES = Object.fromEntries(BULK_SUBSTANCES.map((x) => [x, msg(BULK_NAME[x])])) as Record<BulkSubstance, { uk: string; en: string }>;

export const preset_bulk_density: Preset = varied(
  {
    id: 'bulk-density',
    ask: msg('bulk-density-ask'),
    grade: 7,
    topic: INTERACTION,
    title: msg('bulk-density-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'bulk',
    choices: [
      ch('bulk', msg('bulk-density-choice-bulk')),
      ch('gaps', msg('bulk-density-choice-gaps')),
      ch('water', msg('bulk-density-choice-water')),
    ],
    // The grains' own density is the answer: chalked in once a guess is made.
    answerOnBoard: ['bd:'],
    asides: [msg('bulk-density-asides')],
    formulas: ['mechanics.density'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Робота в групі для розв’язання проблем: як визначити густину сипких речовин?' }],
    expect: 'reached',
  },
  {
    // Any of the granular substances on the table.
    controls: [{ id: 'substance', label: msg('bulk-density-substance-label'), kind: 'choice', value: 'sodium-chloride', options: BULK_SUBSTANCES.map((s) => ch(s, NAMES[s])) }],
    build: (v) => {
      const substance = String(v['substance']) as BulkSubstance;
      const name = NAMES[substance] ?? NAMES['sodium-chloride'];
      return {
        question: msg('bulk-density-question', { substance: (l) => name[l] }),
        plan: [
          { kind: 'bench', command: { type: 'lab.bulk', step: 'pour', substance } },
          { kind: 'bench', command: { type: 'lab.bulk', step: 'fill', substance } },
          { kind: 'bench', command: { type: 'lab.bulk', step: 'shake', substance }, optional: msg('bulk-density-optional-shake') },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'bulk', setup: msg('bulk-density-setup'), presets: [preset_bulk_density] });
