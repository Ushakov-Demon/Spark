import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type WinchSpool, winchSpoolName } from './bench.js';
import { sig } from '../../explain/format.js';

export const answer_windlass = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.winch' && x.record.value !== null).map((x) => ({ spool: String(x.command['spool']), mode: String(x.command['mode']), amount: Number(x.command['amount']), v: x.record.value!, d: x.record.inputs?.['diameter'] ?? 0 }));
  const turns = R.filter((x) => x.mode === 'lower');
  // Each count against l / (π·d) and l / d: which one the turns follow (to a quarter turn).
  const byCircle = turns.length > 0 && turns.every((x) => Math.abs(x.v - x.amount / (Math.PI * x.d)) <= 0.25);
  const num = (x: number, l: Locale) => sig(x, 3, l);
  const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
  const name = (sp: string, l: Locale) => tr(winchSpoolName(sp as WinchSpool), l);
  return {
    ...(byCircle ? { correct: 'circle' } : {}),
    why: msg('windlass-answer-why'),
    say: both((l) => {
      const a = turns[0];
      return a ? (t(l, 'windlass-answer-say', { spool: name(a.spool, l).replace(/^./, (ch) => ch.toUpperCase()), v: num(a.v, l) })) : '';
    }),
    text: both((l) => {
      const parts = R.map((x) =>
        x.mode === 'lower'
          ? t(l, 'windlass-text-parts', { spool: name(x.spool, l), amount: cm(x.amount, l), v: num(x.v, l), amount2: sig(x.amount / (Math.PI * x.d), 3, l) })
          : t(l, 'windlass-text-parts-2', { spool: name(x.spool, l), amount: String(x.amount), v: cm(x.v, l), PI: cm(Math.PI * x.d * x.amount, l) }),
      );
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + t(l, 'windlass-answer-text');
    }),
  };
};
