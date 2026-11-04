import { msg } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { type TouchCase, touchPlan, touchSeen } from './bench.js';
import { tr } from '../../knowledge/i18n.js';

export const answer_contact_forces = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.touch').map((x) => ({ c: String(x.command['case']) as TouchCase, acts: x.record.inputs?.['acts'] === 1, touch: x.record.inputs?.['touch'] === 1 }));
  const farOk = R.filter((x) => x.c !== 'lifted').every((x) => x.acts && !x.touch);
  const frictionNeedsTouch = R.some((x) => x.c === 'lifted' && !x.acts);
  return {
    ...(farOk && frictionNeedsTouch ? { correct: 'field' } : {}),
    why: msg('contact-forces-answer-why'),
    say: msg('contact-forces-answer-say'),
    text: both((l) => {
      const s = `${R.map((x) => `${tr(touchPlan(x.c), l)} — ${tr(touchSeen(x.c), l)}`).map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1);
    }),
  };
};
