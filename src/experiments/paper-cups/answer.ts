import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { N } from './words.js';

/** From the run: did the cups hold standing, and lying on their sides — what each cup bore against what it bears. */
export const answer_paper_cups = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? [])
    .filter((x) => x.command.type === 'lab.cups' && x.command['step'] === 'stand' && x.record.value !== null)
    .map((x) => ({ way: String(x.command['way']), at: String(x.command['at']), holds: x.record.value === 1, inp: x.record.inputs ?? {} }));
  const up = rows.find((x) => x.way === 'upright' && x.at === 'middle');
  const side = rows.find((x) => x.way === 'side');
  const correct = !up ? undefined : up.holds ? 'upright' : side?.holds ? 'side' : 'none';
  return {
    ...(correct ? { correct } : {}),
    why: msg('paper-cups-answer-why'),
    say: both((l) => (up ? t(l, 'paper-cups-answer-say', { up: up.holds ? 'yes' : 'no', side: side?.holds ? 'yes' : 'no' }) : '')),
    text: both((l) => {
      if (!rows.length) return '';
      const list = rows.map((x) => t(l, 'paper-cups-answer-row', { way: x.way, at: x.at, most: N(x.inp['most'] ?? 0, l), bears: N(x.inp['bears'] ?? 0, l), holds: x.holds ? 'yes' : 'no' }));
      return t(l, 'paper-cups-answer-text', { P: N(up?.inp['weight'] ?? 0, l), steps: list.map(stepLine).join(';') + STEPS_END });
    }),
  };
};
