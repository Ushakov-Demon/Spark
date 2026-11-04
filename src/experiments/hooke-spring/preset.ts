import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_hooke_spring: Preset = varied(
  {
    id: 'hooke-spring',
    grade: 7,
    topic: INTERACTION,
    title: msg('hooke-spring-title'),
    guided: true,
    bench: 'spring',
    choices: [ch('proportional', msg('hooke-spring-choices')), ch('faster', msg('hooke-spring-choices-2')), ch('slower', msg('hooke-spring-choices-3'))],
    formulas: ['mechanics.hooke', 'mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження • інерції; пружних властивостей тіл' }, { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 6', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 6. Дослідження пружних властивостей тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 24, лабораторна робота № 6, с. 172' } }, { program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 1', match: 'same', quote: 'Investigate the relationship between force and extension for a spring.' }],
    expect: 'reached',
  },
  {
    // Only the springs that four 100 g weights stretch within the 40 cm ruler.
    controls: [{ id: 'spring', label: msg('hooke-spring-controls-label'), kind: 'choice', options: [ch('25', msg('hooke-spring-controls-options')), ch('15', msg('hooke-spring-controls-options-2'))], value: '25' }],
    build: (v) => {
      const stiffness = Number(v['spring']);
      return {
        question: msg('hooke-spring-build-question', { value: (l: Locale) => stiffness === 25 ? t(l, 'hooke-spring-question-uk') : t(l, 'hooke-spring-question-uk-2') }),
        params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
        plan: [0, 1, 2, 3, 4].map((weights) => ({ kind: 'bench', command: { type: 'lab.stretch', weights, stiffness } }) as const),
      };
    },
  },
);

export const answer_hooke_spring = (run: PresetRun): PresetAnswer => {
  const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.stretch' && x.record.value !== null);
  const l0 = r.find((x) => x.command['weights'] === 0)?.record.value ?? null;
  const rows = r.filter((x) => Number(x.command['weights']) > 0).map((x) => ({ n: Number(x.command['weights']), F: x.record.inputs?.['F'] ?? 0, x: x.record.value! - (l0 ?? 0) }));
  const ks = rows.map((x) => x.F / x.x);
  const kMean = ks.reduce((a, b) => a + b, 0) / Math.max(1, ks.length);
  const spread = ks.length ? (Math.max(...ks) - Math.min(...ks)) / kMean : 0;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const ratio = first && last ? last.x / first.x / (last.F / first.F) : 1;
  const correct = l0 === null || rows.length < 2 ? undefined : Math.abs(ratio - 1) < 0.08 ? 'proportional' : ratio > 1 ? 'faster' : 'slower';
  const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('hooke-spring-answer-why'),
    say: both((l) => t(l, 'hooke-spring-answer-say', { kMean: sig(kMean, 2, l) })),
    text: both((l) =>
      t(l, 'hooke-spring-answer-text-2', { kMean: sig(kMean, 2, l), spread: sig(spread * 100, 2, l), l0: l0 !== null ? cm(l0, l) : 'l₀', steps: rows.map((x) => t(l, 'hooke-spring-answer-text', { n: String(x.n), x: cm(x.x, l) })).map(stepLine).join(';') + STEPS_END }),
    ),
  };
};
