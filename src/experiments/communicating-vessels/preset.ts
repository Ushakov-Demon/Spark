import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_communicating_vessels: Preset = {
  id: 'communicating-vessels',
  ask: msg('communicating-vessels-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('communicating-vessels-title'),
  question: msg('communicating-vessels-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'utube',
  plan: [0, 10, 20].map((poured) => ({ kind: 'bench', command: { type: 'lab.utube', poured, liquid: 'sunflower-oil' } }) as const),
  choices: [ch('oil', msg('communicating-vessels-choices')), ch('water', msg('communicating-vessels-choices-2')), ch('same', msg('communicating-vessels-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['rhoU:'],
  formulas: ['mechanics.communicating-vessels', 'mechanics.hydrostatic-pressure'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Сполучені посудини. … моделювання: сполучених посудин' }],
  expect: 'reached',
};

export const answer_communicating_vessels = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.utube' && x.record.value !== null);
  const alone = R.find((x) => x.record.inputs?.['which'] === 2)?.record;
  const pours = [...new Set(R.filter((x) => Number(x.command['poured']) > 0).map((x) => Number(x.command['poured'])))].map((ml) => ({
    ml,
    oil: R.find((x) => Number(x.command['poured']) === ml && x.record.inputs?.['which'] === 1)?.record.value ?? 0,
    water: R.find((x) => Number(x.command['poured']) === ml && x.record.inputs?.['which'] === 0)?.record.value ?? 0,
    rhoW: R[0]?.record.inputs?.['rhoWater'] ?? 997,
    rhoO: R[0]?.record.inputs?.['rhoOil'] ?? 919,
  }));
  const last = pours[pours.length - 1];
  const correct = !last ? undefined : last.oil > last.water + 0.001 ? 'oil' : last.water > last.oil + 0.001 ? 'water' : 'same';
  const rho = last && last.oil > 0 ? (last.rhoW * last.water) / last.oil : 0;
  const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
  const list = (l: Locale) => pours.map((x) => t(l, 'communicating-vessels-answer-list', { ml: String(x.ml), oil: cm(x.oil, l), water: cm(x.water, l) })).map(stepLine).join(';') + STEPS_END;
  return {
    ...(correct ? { correct } : {}),
    why: msg('communicating-vessels-answer-why'),
    say: both((l) => (correct === 'oil' ? t(l, 'communicating-vessels-answer-say') : t(l, 'communicating-vessels-answer-say-2'))),
    text: both((l) =>
      t(l, 'communicating-vessels-answer-text-2', { l: list(l), rho: sig(rho, 3, l), rhoO: sig(last?.rhoO ?? 0, 3, l), value: alone ? t(l, 'communicating-vessels-answer-text', { value: cm(alone.value ?? 0, l) }) : '' }),
    ),
  };
};
