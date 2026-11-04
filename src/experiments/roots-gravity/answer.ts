import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';

export const answer = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.gravi' && x.record.value !== null);
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const side = of('side');
  const clino = of('clino');
  const end = side.at(-1)?.value ?? null;
  const correct = end === null ? undefined : end >= 45 ? 'down' : end <= -45 ? 'up' : 'straight';
  const deg = (x: number) => `${x}°`;
  const first = side.find((r) => (r.value ?? 0) > 0);
  return {
    ...(correct ? { correct } : {}),
    why: msg('roots-gravity-answer-why'),
    say: both((l) => (end === null ? '' : t(l, 'roots-gravity-answer-say', { end: deg(end) }))),
    text: both((l) => {
      const parts: string[] = [];
      if (side.length) parts.push(t(l, 'roots-gravity-answer-text-2', { value: side.map((r) => t(l, 'roots-gravity-answer-text', { time: r.inputs?.['time'], value: deg(r.value!) })).join(', ') }));
      if (first) parts.push(t(l, 'roots-gravity-answer-text-3'));
      if (clino.length) parts.push(t(l, 'roots-gravity-answer-text-4', { value: deg(Math.max(...clino.map((r) => r.value!))) }));
      return parts.join(' ');
    }),
  };
};
