import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MAGNETIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_electromagnetic_induction: Preset = varied(
  {
    id: 'electromagnetic-induction',
    ask: msg('electromagnetic-induction-ask'),
    grade: 9,
    topic: MAGNETIC,
    title: msg('electromagnetic-induction-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'induct',
    choices: [ch('motion', msg('electromagnetic-induction-choices')), ch('inside', msg('electromagnetic-induction-choices-2')), ch('never', msg('electromagnetic-induction-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['iE:'],
    formulas: ['electrical.induced-emf'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 5', topic: 'Тема 2. Магнітні та електромагнітні явища', match: 'same', quote: '№ 5. Дослідження явища електромагнітної індукції.' }],
    expect: 'reached',
  },
  {
    // The coil's turns: more turns — more EMF, but more wire and so more resistance too.
    controls: [{ id: 'turns', label: msg('electromagnetic-induction-turns-label'), kind: 'choice', options: [ch('100', msg('electromagnetic-induction-turns-options')), ch('200', msg('electromagnetic-induction-turns-options-2')), ch('400', msg('electromagnetic-induction-turns-options-3'))], value: '200' }],
    build: (v) => {
      const turns = Number(v['turns']);
      const fast = 0.3;
      const slow = 1.5;
      return {
        question: msg('electromagnetic-induction-build-question', { turns: String(turns) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.induct', move: 'still', pole: 'N', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'out', pole: 'N', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'N', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'N', time: slow, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'S', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'coil', pole: 'N', time: fast, turns } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'induct', setup: msg('electromagnetic-induction-setup'), presets: [preset_electromagnetic_induction] });
