import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_lever_moments = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.lever' && x.record.value !== null).map((x) => ({ F1: x.record.inputs?.['F1'] ?? 0, l1: x.record.inputs?.['l1'] ?? 0, F2: x.record.value!, l2: x.record.inputs?.['l2'] ?? 0, dyn: x.record.instrument === 'dynamometer', balanced: x.record.inputs?.['balanced'] === 1 }));
  const M = (F: number, l: number) => F * l;
  // Within what the dynamometer tells (half its 0.1 N division at that arm): the moments are equal.
  const equal = rows.every((x) => Math.abs(M(x.F1, x.l1) - M(x.F2, x.l2)) <= 0.05 * x.l2 + 1e-9);
  const forcesDiffer = rows.some((x) => Math.abs(x.F1 - x.F2) > 0.1);
  const armsDiffer = rows.some((x) => Math.abs(x.l1 - x.l2) > 1e-6);
  const correct = rows.length ? (equal ? 'moments' : !forcesDiffer ? 'forces' : !armsDiffer ? 'arms' : undefined) : undefined;
  const N = (x: number, l: Locale) => formatMeasured('force', x, 0.01, l);
  const cm = (x: number) => Math.round(x * 100);
  return {
    ...(correct ? { correct } : {}),
    why: msg('lever-moments-answer-why'),
    say: msg('lever-moments-answer-say'),
    text: both((l) => {
      const list = rows.map((x) => t(l, 'lever-moments-text-list-3', { F1: N(x.F1, l), l1: String(cm(x.l1)), l2: String(cm(x.l2)), F12: sig(M(x.F1, x.l1), 3, l), F2: sig(M(x.F2, x.l2), 3, l), value: x.dyn ? t(l, 'lever-moments-text-list', { value: formatMeasured('force', x.F2, 0.1, l) }) : t(l, 'lever-moments-text-list-2', { F2: N(x.F2, l) }) })).map(stepLine).join(';') + STEPS_END;
      return t(l, 'lever-moments-answer-text', { list });
    }),
  };
};
