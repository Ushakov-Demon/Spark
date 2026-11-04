import { circularSpeed, escapeSpeed, gravityAt } from '../../domains/mechanics/formulas.js';
import { STANDARD_GRAVITY } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import { msg, NO_TEXT, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, ch, INTERACTION, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { earthR, mu, OUTCOME, type CannonCommand } from './bench.js';
import { degText, kmText, speedText, timeText } from './words.js';

const SPEED = [{ id: 'm-per-s', factor: 1 }, { id: 'km-per-s', factor: 1000 }];
const HEIGHT = [{ id: 'm', factor: 1 }, { id: 'km', factor: 1000 }];

export const preset_newton_cannon: Preset = varied(
  {
    id: 'newton-cannon',
    ask: msg('newton-cannon-ask'),
    grade: 7,
    topic: INTERACTION,
    title: msg('newton-cannon-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'cannon',
    choices: (['no-gravity', 'misses', 'engines'] as const).map((id) => ch(id, msg(`newton-cannon-choice-${id}`))),
    answerOnBoard: ['cn-v1', 'cn-shot:', 'cn-low:'],
    asides: [msg('newton-cannon-aside-sputnik')],
    formulas: ['mechanics.circular-speed', 'mechanics.gravity-at'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Рухи небесних тіл та штучних супутників Землі.' },
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'related', quote: 'Невагомість.' },
    ],
    expect: 'reached',
  },
  {
    // Any mountain (from the ground up), any three speeds, any angle to the horizon (0 — Newton's own sideways shot);
    // and the «what if…» — faster still.
    controls: [
      { id: 'h', label: msg('newton-cannon-h'), kind: 'number', unit: 'm', min: 0, max: 1e8, step: 0, value: 200_000, units: HEIGHT },
      { id: 'angle', label: msg('newton-cannon-angle'), kind: 'number', unit: 'deg', min: -90, max: 90, step: 0, value: 0 },
      { id: 'v1', label: msg('newton-cannon-v1'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 3000, units: SPEED },
      { id: 'v2', label: msg('newton-cannon-v2'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 6000, units: SPEED },
      { id: 'v3', label: msg('newton-cannon-v3'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 7800, units: SPEED },
      { id: 'v4', label: msg('newton-cannon-v4'), kind: 'number', unit: 'm-per-s', min: 0, max: 1e5, step: 0, value: 10_000, units: SPEED },
    ],
    build: (v) => {
      const h = Number(v['h']);
      const speeds = [Number(v['v1']), Number(v['v2']), Number(v['v3'])].sort((a, b) => a - b);
      const v4 = Number(v['v4']);
      const angle = Number(v['angle']);
      return {
        question: msg('newton-cannon-question', { level: angle === 0 ? 'yes' : 'no', angle: (l) => degText(angle, l), h: (l) => kmText(h, l), v1: (l) => speedText(speeds[0]!, l), v3: (l) => speedText(speeds[2]!, l) }),
        plan: [
          ...speeds.map((x) => ({ kind: 'bench', command: { type: 'lab.cannon', h, v: x, angle } }) as const),
          { kind: 'bench', command: { type: 'lab.cannon', h, v: v4, angle }, optional: msg('newton-cannon-optional-faster', { v: (l) => speedText(v4, l) }) },
        ],
      };
    },
  },
);

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
