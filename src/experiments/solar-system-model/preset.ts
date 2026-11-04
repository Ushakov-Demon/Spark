import { NUMBER_LOCALE } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { sig } from '../../explain/format.js';
import { modelScale, planetIds } from './bench.js';

export const preset_solar_system_model: Preset = {
  ask: msg('solar-system-model-ask'),
  id: 'solar-system-model',
  grade: 7,
  topic: INTERACTION,
  title: msg('solar-system-model-title'),
  question: msg('solar-system-model-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'planets',
  plan: (['ball', 'inner', 'outer', 'kepler', 'voyager'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.planets', step } }) as const),
  choices: [ch('ball', msg('solar-system-model-choices')), ch('grain', msg('solar-system-model-choices-2')), ch('near', msg('solar-system-model-choices-3'))],
  answerOnBoard: ['pe:'],
  formulas: ['mechanics.kepler-third'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'моделювання: руху планет' }],
  expect: 'reached',
};

export const answer_solar_system_model = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.planets' && x.record.value !== null);
  const ids = planetIds();
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const earth = of('inner').find((r) => ids[r.inputs?.['planet'] ?? -1] === 'earth');
  const L = earth?.value ?? null;
  const d = earth?.inputs?.['size'] ?? 0;
  const correct = L === null ? undefined : L > 10 ? 'grain' : d > 0.01 ? 'ball' : 'near';
  const kep = of('kepler').map((r) => r.value!);
  const neptune = of('outer').find((r) => ids[r.inputs?.['planet'] ?? -1] === 'neptune');
  const voyager = of('voyager')[0];
  return {
    ...(correct ? { correct } : {}),
    why: msg('solar-system-model-answer-why'),
    say: msg('solar-system-model-answer-say'),
    text: both((l) => {
      if (L === null) return '';
      const parts = [t(l, 'solar-system-model-text-parts', { value: sig(1 / modelScale() / 1e9, 2, l), d: sig(d * 1000, 2, l), L: sig(L, 3, l) })];
      if (neptune) parts.push(t(l, 'solar-system-model-answer-text', { value: sig(neptune.value!, 3, l) }));
      const f2 = (x: number) => new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
      if (kep.length) parts.push(t(l, 'solar-system-model-answer-text-2', { value: f2(Math.min(...kep)), value2: f2(Math.max(...kep)) }));
      if (voyager) parts.push(t(l, 'solar-system-model-answer-text-3', { value: sig(voyager.value!, 3, l) }));
      return parts.join(' ');
    }),
  };
};
