import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import { type TouchCase, touchForce } from './bench.js';

export const answer_contact_forces = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.touch').map((x) => ({ c: String(x.command['case']) as TouchCase, record: x.record, acts: x.record.inputs?.['acts'] === 1, touch: x.record.inputs?.['touch'] === 1 }));
  const far = R.filter((x) => x.c !== 'lifted' && x.c !== 'table');
  const farOk = far.length > 0 && far.every((x) => x.acts && !x.touch);
  const frictionNeedsTouch = R.some((x) => x.c === 'table' && x.acts && x.touch) && R.some((x) => x.c === 'lifted' && !x.acts);
  const force = (c: TouchCase) => (l: 'uk' | 'en') => {
    const r = R.find((x) => x.c === c);
    return r ? touchForce(c, r.record, l) : '—';
  };
  return {
    ...(farOk && frictionNeedsTouch ? { correct: 'field' } : {}),
    why: msg('contact-forces-answer-why'),
    say: msg('contact-forces-answer-say'),
    text: both((l) => t(l, 'contact-forces-answer-text', { magnet: force('magnet')(l), card: force('card')(l), comb: force('comb')(l), fall: force('fall')(l), table: force('table')(l), lifted: force('lifted')(l) })),
  };
};
