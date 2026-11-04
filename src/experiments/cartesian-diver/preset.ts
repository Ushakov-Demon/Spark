import { density } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_cartesian_diver: Preset = {
  id: 'cartesian-diver',
  ask: msg('cartesian-diver-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('cartesian-diver-title'),
  question: msg('cartesian-diver-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'diver',
  plan: [
    { kind: 'bench', command: { type: 'lab.diver', step: 'weigh' } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'volume' } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'squeeze', press: 4000 } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'squeeze', press: 15000 } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'release', press: 15000 } },
  ],
  choices: [
    ch('density', msg('cartesian-diver-choices')),
    ch('push', msg('cartesian-diver-choices-2')),
    ch('nothing', msg('cartesian-diver-choices-3')),
  ],
  // (Water ≈ 4.6·10⁻¹⁰ Pa⁻¹ at 20 °C, between the source's 5.1 at 0 °C and 4.4 at 45 °C; air, slowly, 1/p₀ ≈ 9.9·10⁻⁶ Pa⁻¹: ≈ 20 000 times.)
  asides: [
    msg('cartesian-diver-asides'),
  ],
  // The densities are the answer: chalked in once a guess is made.
  answerOnBoard: ['rho:'],
  formulas: ['mechanics.density', 'mechanics.buoyant-force', 'mechanics.submerged-share', 'mechanics.boyle'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'моделювання: … занурення і спливання підводного човна, риб' }],
  expect: 'reached',
};

export const answer_cartesian_diver = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.diver' && x.record.value !== null);
  const m = R.find((x) => x.command['step'] === 'weigh')?.record.value ?? 0;
  const V = R.find((x) => x.command['step'] === 'volume')?.record.value ?? 0;
  const moves = R.filter((x) => x.command['step'] === 'squeeze' || x.command['step'] === 'release').map((x) => {
    const r = x.record;
    const d = r.inputs?.['tube'] ?? 0.004;
    const dV = Math.PI * (d / 2) ** 2 * r.value!;
    return { step: String(x.command['step']), press: r.inputs?.['press'] ?? 0, extra: r.inputs?.['extra'] ?? 0, h: r.value!, dV, rho: V - dV > 0 ? density(m, V - dV) : 0, sinks: r.inputs?.['sinks'] === 1 };
  });
  const water = R.find((x) => x.record.inputs?.['water'])?.record.inputs?.['water'] ?? 997;
  const hard = moves.find((x) => x.step === 'squeeze' && x.sinks);
  const correct = !moves.length || !m || !V ? undefined : hard && hard.rho > water ? 'density' : 'nothing';
  const g = (x: number, l: Locale) => `${sig(x / 1000, 3, l)} ${t(l, 'unit-sym-g-per-cm3')}`;
  const kPa = (x: number, l: Locale) => `${sig(x / 1000, 2, l)} ${t(l, 'unit-sym-kPa')}`;
  const mm = (x: number, l: Locale) => `${Math.round(x * 1000)} ${t(l, 'unit-sym-mm')}`;
  const mL = (x: number, l: Locale, k = 2) => `${sig(x * 1e6, k, l)} ${t(l, 'unit-sym-mL')}`;
  const rho0 = V ? density(m, V) : 0;
  const what = (x: (typeof moves)[number], l: Locale) => {
    const act = x.step === 'release' ? t(l, 'cartesian-diver-what-act') : x.press < 8000 ? (t(l, 'cartesian-diver-what-act-2') + kPa(x.press, l) + ')') : t(l, 'cartesian-diver-what-act-3') + kPa(x.press, l) + ')';
    return t(l, 'cartesian-diver-answer-what-5', { act, h: mm(x.h, l), dV: mL(x.dV, l), value: formatMeasured('mass', m, 0.00001, l), V: mL(V - x.dV, l, 3), rho: g(x.rho, l), value2: x.sinks ? (x.step === 'release' ? t(l, 'cartesian-diver-answer-what') : t(l, 'cartesian-diver-answer-what-2')) : x.step === 'release' ? t(l, 'cartesian-diver-answer-what-3') : t(l, 'cartesian-diver-answer-what-4') });
  };
  return {
    ...(correct ? { correct } : {}),
    why: msg('cartesian-diver-answer-why'),
    say: both((l) => (correct === 'density' && hard ? (t(l, 'cartesian-diver-answer-say', { rho: g(hard.rho, l) })) : t(l, 'cartesian-diver-answer-say-2'))),
    text: both((l) => {
      if (!m || !V) return '';
      const head = t(l, 'cartesian-diver-text-head', { value: formatMeasured('mass', m, 0.00001, l), value2: formatMeasured('volume', V, 1e-7, l), rho0: g(rho0, l), water: g(water, l) });
      const tail = hard
        ? t(l, 'cartesian-diver-text-tail', { extra: sig(moves.find((x) => x.step === 'release')?.extra ?? 0, 2, l) })
        : '';
      return `${head} ${moves.map((x) => what(x, l)).join(' ')}${tail}`;
    }),
  };
};
