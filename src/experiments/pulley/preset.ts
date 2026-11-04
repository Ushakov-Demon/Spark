import { efficiency, work } from '../../domains/mechanics/formulas.js';
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, STEPS_END, stepLine, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { forceDivision, heightText, massText } from './bench.js';
import { lengthText } from './words.js';

export const preset_pulley: Preset = varied(
  {
    id: 'pulley',
    ask: msg('pulley-ask'),
    grade: 7,
    topic: WORK,
    title: msg('pulley-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pulley',
    choices: [
      ch('force', msg('pulley-choices')),
      ch('work', msg('pulley-choices-2')),
      ch('none', msg('pulley-choices-3')),
    ],
    // The works and the efficiency are the answer: chalked in once a guess is made.
    answerOnBoard: ['pw:'],
    asides: [
      msg('pulley-asides'),
    ],
    formulas: ['mechanics.pulley', 'mechanics.work', 'mechanics.efficiency'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'моделювання й конструювання: простих механізмів' }],
    expect: 'reached',
  },
  {
    // The load and the height: any of them — the force halves on the movable pulley, the rope goes twice as far.
    controls: [
      {
        id: 'mass',
        label: msg('pulley-mass-label'),
        kind: 'number',
        unit: 'kg',
        min: 0.001,
        max: 1e6,
        step: 0,
        value: 0.3,
        units: [
          { id: 'g', factor: 0.001 },
          { id: 'kg', factor: 1 },
          { id: 't', factor: 1000 },
        ],
      },
      {
        id: 'lift',
        label: msg('pulley-lift-label'),
        kind: 'number',
        unit: 'm',
        min: 0.001,
        max: 1e4,
        step: 0,
        value: 0.1,
        units: [
          { id: 'cm', factor: 0.01 },
          { id: 'm', factor: 1 },
        ],
      },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const lift = Number(v['lift']);
      return {
        question: msg('pulley-build-question', { mass: (l: Locale) => massText(mass, l), lift: (l: Locale) => heightText(lift, l) }),
        plan: (['straight', 'fixed', 'movable'] as const).map((how) => ({ kind: 'bench', command: { type: 'lab.pulley', how, mass, lift } }) as const),
      };
    },
  },
);

export const answer_pulley = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.pulley' && x.record.value !== null);
  const of = (how: string, which: number) => R.find((x) => x.command['how'] === how && x.record.inputs?.['which'] === which)?.record;
  const P = of('straight', 1)?.value ?? 0;
  const h = of('straight', 1)?.inputs?.['lift'] ?? 0.1;
  const rows = (['straight', 'fixed', 'movable'] as const).map((how) => ({ how, F: of(how, 1)?.value ?? 0, s: of(how, 2)?.value ?? 0 })).filter((x) => x.F > 0);
  const mov = rows.find((x) => x.how === 'movable');
  const eta = mov && P ? efficiency(work(P, h), work(mov.F, mov.s)) : 0;
  const correct = !mov || !P ? undefined : mov.F < 0.7 * P && mov.s > 1.5 * h && eta <= 1 ? 'force' : mov.F < 0.7 * P ? 'work' : 'none';
  const N = (x: number, l: Locale) => formatMeasured('force', x, forceDivision(x), l);
  const cm = lengthText;
  const J = (x: number, l: Locale) => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 3 }).format(x)} ${t(l, 'unit-sym-J')}`;
  const name = (how: string, l: Locale) => ({ straight: t(l, 'pulley-name-straight'), fixed: t(l, 'pulley-name-fixed'), movable: t(l, 'pulley-name-movable') })[how as 'straight'];
  return {
    ...(correct ? { correct } : {}),
    why: msg('pulley-answer-why'),
    say: both((l) => (mov && mov.F >= P ? (t(l, 'pulley-answer-say', { F: N(mov.F, l), P: N(P, l) })) : correct === 'force' && mov ? (t(l, 'pulley-answer-say-2', { F: N(mov.F, l), P: N(P, l), s: cm(mov.s, l) })) : t(l, 'pulley-answer-say-3'))),
    text: both((l) => {
      if (!rows.length || !P) return '';
      const list = rows.map((x) => (`${name(x.how, l)}: F = ${N(x.F, l)}, s = ${cm(x.s, l)}, A = F·s ≈ ${J(work(x.F, x.s), l)}`));
      return t(l, 'pulley-answer-text-4', { P: N(P, l), h: cm(h, l), P2: J(work(P, h), l), steps: list.map(stepLine).join(';') + STEPS_END, eta: mov ? t(l, 'pulley-answer-text-3', { eta: String(Math.round(eta * 100)), value: eta < 0.995 ? t(l, 'pulley-answer-text') : t(l, 'pulley-answer-text-2') }) : '' });
    }),
  };
};
