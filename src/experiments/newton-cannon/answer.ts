import { circularSpeed, escapeSpeed, gravityAt } from '../../domains/mechanics/formulas.js';
import { STANDARD_GRAVITY } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { earthR, mu, OUTCOME, type CannonCommand } from './bench.js';
import { degText, kmText, speedText, timeText } from './words.js';

export const answer_newton_cannon = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.cannon');
  const cmd = (x: (typeof R)[number]) => x.command as unknown as CannonCommand;
  const first = R[0];
  const h = first ? cmd(first).h : 0;
  const r0 = earthR() + h;
  const g = gravityAt(mu(), r0);
  const why = msg('newton-cannon-why', {
    h: (l) => kmText(h, l),
    g: (l) => sig(g, 3, l),
    g0: (l) => sig(STANDARD_GRAVITY.value, 3, l),
    share: (l) => sig((100 * g) / STANDARD_GRAVITY.value, 2, l),
    v1: (l) => speedText(circularSpeed(mu(), r0), l),
    v2: (l) => speedText(escapeSpeed(mu(), r0), l),
  });
  if (!first) return { why, say: NO_TEXT, text: NO_TEXT };
  // Not sideways: no longer Newton's own shot — the conclusion is the laws and the reckoning, not «slower, nearer».
  const angle = cmd(first).angle ?? 0;
  const tilted = angle !== 0;
  const went = (o: number) => R.filter((x) => x.record.inputs?.['outcome'] === o);
  const landed = went(OUTCOME.lands);
  const round = went(OUTCOME.orbits);
  // The slowest shot that went round, and the fastest that came down.
  const slowestRound = round.reduce<(typeof R)[number] | undefined>((a, b) => (!a || cmd(b).v < cmd(a).v ? b : a), undefined);
  const fastestDown = landed.reduce<(typeof R)[number] | undefined>((a, b) => (!a || cmd(b).v > cmd(a).v ? b : a), undefined);
  const whyTilted = msg('newton-cannon-why-tilted', { angle: (l) => degText(angle, l), h: (l) => kmText(h, l), g: (l) => sig(g, 3, l), v2: (l) => speedText(escapeSpeed(mu(), r0), l), R: (l) => kmText(earthR(), l) });
  const sayTilted = msg('newton-cannon-say-tilted', { angle: (l) => degText(angle, l), round: slowestRound ? 'yes' : 'no', vRound: (l) => (slowestRound ? speedText(cmd(slowestRound).v, l) : ''), v2: (l) => speedText(escapeSpeed(mu(), r0), l) });
  return {
    // Whatever the speeds tried, a satellite is held by its speed, not by the lack of gravity or by engines.
    correct: 'misses',
    why: tilted ? whyTilted : why,
    say: tilted ? sayTilted : msg('newton-cannon-say', {
      round: slowestRound ? 'yes' : 'no',
      down: fastestDown ? 'yes' : 'no',
      vRound: (l) => (slowestRound ? speedText(cmd(slowestRound).v, l) : ''),
      vDown: (l) => (fastestDown ? speedText(cmd(fastestDown).v, l) : ''),
      range: (l) => (fastestDown && fastestDown.record.value !== null ? kmText(fastestDown.record.value, l) : ''),
      v1: (l) => speedText(circularSpeed(mu(), r0), l),
    }),
    text: msg('newton-cannon-text', {
      rows: (l) =>
        R.map((x) => {
          const o = x.record.inputs?.['outcome'];
          return t(l, 'newton-cannon-row', { v: speedText(cmd(x).v, l), outcome: o === OUTCOME.lands ? 'lands' : o === OUTCOME.orbits ? 'orbits' : 'escapes', range: o === OUTCOME.lands && x.record.value !== null ? kmText(x.record.value, l) : '', period: o === OUTCOME.orbits && x.record.value !== null ? timeText(x.record.value, l) : '' });
        })
          .map(stepLine)
          .join(';') + STEPS_END,
      h: (l) => kmText(h, l),
    }),
  };
};
