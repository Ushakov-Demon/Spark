import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MAGNETIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

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

export const answer_electromagnetic_induction = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.induct' && x.record.value !== null);
  const find = (move: string, pole = 'N', fast?: boolean) => R.find((x) => x.command['move'] === move && x.command['pole'] === pole && (fast === undefined || (Number(x.command['time']) <= 0.5) === fast))?.record;
  const still = find('still');
  const inFast = find('in', 'N', true);
  const out = find('out');
  const inSlow = find('in', 'N', false);
  const south = find('in', 'S', true);
  const coil = find('coil');
  const div = R[0]?.record.inputs?.['division'] ?? 0.002;
  const moved = [inFast, out, inSlow, south, coil].filter((x) => x && Math.abs(x.value!) >= div);
  const correct = !R.length ? undefined : still && Math.abs(still.value!) >= div ? 'inside' : moved.length ? 'motion' : 'never';
  const mA = (x: number | null | undefined, l: Locale) => `${x! > 0 ? '+' : ''}${sig((x ?? 0) * 1000, 2, l).replace('-', '−')} ${t(l, 'unit-sym-mA')}`;
  const turns = Number(R[0]?.command['turns'] ?? 200);
  const Rc = inFast?.inputs?.['resistance'] ?? 7;
  const emf = (x: number | null | undefined) => Math.abs(x ?? 0) * Rc;
  return {
    ...(correct ? { correct } : {}),
    why: msg('electromagnetic-induction-answer-why'),
    say: both((l) => (correct === 'motion' ? t(l, 'electromagnetic-induction-answer-say') : t(l, 'electromagnetic-induction-answer-say-2'))),
    text: both((l) =>
      t(l, 'electromagnetic-induction-answer-text', { turns: String(turns), Rc: sig(Rc, 2, l), value: mA(still?.value, l), value2: mA(out?.value, l), value3: mA(inFast?.value, l), value4: mA(inSlow?.value, l), value5: mA(south?.value, l), value6: mA(coil?.value, l), value7: sig(emf(inFast?.value), 2, l), value8: sig(emf(inSlow?.value), 2, l) }),
    ),
  };
};
