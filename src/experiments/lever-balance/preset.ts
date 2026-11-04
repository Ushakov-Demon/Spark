import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, ch, INTERACTION, room, stepLine, STEPS_END, varied, WATER } from '../../scenarios/preset-kit.js';
import type { Choice, Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { type SubstanceId, SUBSTANCES } from '../../substances/catalog.js';

/** Liquids whose density the lab work finds (all fit the balance in a 100 mL cylinder). */
const LIQUIDS_FOR_DENSITY: readonly Choice[] = (['sunflower-oil', 'glycerol', 'ethanol', 'water'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));

export const preset_lever_balance: Preset = {
  id: 'lever-balance',
  grade: 7,
  topic: INTERACTION,
  title: msg('lever-balance-title'),
  question: msg('lever-balance-question'),
  params: { ...room, vessel: 'beaker', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'balance',
  plan: [
    { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'aluminium', mass: 0.0543, label: msg('lever-balance-command-label') } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, label: msg('lever-balance-command-label-2') } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: msg('lever-balance-command-label-3') } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: msg('lever-balance-command-label-4') } },
  ],
  choices: [ch('diff', msg('lever-balance-choices')), ch('total', msg('lever-balance-choices-2')), ch('glass', msg('lever-balance-choices-3'))],
  choicesAt: 'end',
  formulas: ['mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 4', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 4. Вимірювання маси тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16, лабораторна робота № 4, с. 116' } }, { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Маса тіла. Густина речовини.' }],
  expect: 'reached',
};

export const answer_lever_balance = (run: PresetRun): PresetAnswer => {
  const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.balance');
  const at = (what: string) => r.find((x) => x.command['what'] === what)?.record.value ?? null;
  const empty = at('vessel-empty');
  const full = at('vessel');
  const water = empty !== null && full !== null ? full - empty : null;
  const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
  const name = (x: (typeof r)[number], l: Locale) => ((x.command['label'] as { uk: string; en: string } | undefined)?.[l] ?? '').toLowerCase();
  return {
    ...(water !== null ? { correct: 'diff' } : {}),
    why: msg('lever-balance-answer-why'),
    say: both((l) => (water !== null ? (t(l, 'lever-balance-answer-say', { water: g(water, l) })) : '—')),
    text: both((l) =>
      t(l, 'lever-balance-answer-text', { steps: r.map((x) => `${name(x, l)}: ${x.record.value !== null ? g(x.record.value, l) : '—'}`).map(stepLine).join(';') + STEPS_END, water: water !== null ? g(water, l) : '—' }),
    ),
  };
};

export const preset_liquid_density: Preset = varied(
  {
    ask: msg('lever-balance-liquid-density-ask'),
    id: 'liquid-density',
    grade: 7,
    topic: INTERACTION,
    title: msg('lever-balance-liquid-density-title'),
    guided: true,
    bench: 'balance',
    formulas: ['mechanics.density'],
    quoteHas: 'густини',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 5', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 5. Визначення густини речовини (твердих тіл, рідин).', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 17, лабораторна робота № 5, с. 122' } }],
    expect: 'reached',
  },
  {
    controls: [
      { id: 'liquid', label: msg('lever-balance-liquid-label'), kind: 'choice', options: LIQUIDS_FOR_DENSITY, value: 'sunflower-oil' },
      { id: 'volume', label: msg('lever-balance-volume-label'), kind: 'number', unit: 'mL', min: 30, max: 60, step: 5, value: 50 },
    ],
    build: (v) => {
      const liquid = SUBSTANCES[v['liquid'] as SubstanceId];
      const volume = Number(v['volume']);
      // The liquid's name, and in the genitive (where the language needs it).
      const names = { name: (l: Locale) => liquid.name[l].toLowerCase(), gen: (l: Locale) => (liquid.genitive?.[l] ?? liquid.name[l]).toLowerCase() };
      return {
        question: msg('lever-balance-liquid-question', { volume: String(volume), ...names }),
        params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: volume / 1000, action: 'settle', substance: liquid.id as SubstanceId, startTemp: 20 },
        plan: [
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: msg('lever-balance-command-label-5') } },
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: msg('lever-balance-cylinder-label', names) } },
          { kind: 'level' },
        ],
        choices: [ch('lighter', msg('lever-balance-build-choices')), ch('same', msg('lever-balance-build-choices-2')), ch('heavier', msg('lever-balance-build-choices-3'))],
      };
    },
  },
);

export const answer_liquid_density = (run: PresetRun): PresetAnswer => {
  const r = run.readings ?? [];
  const empty = r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === 'vessel-empty')?.record.value ?? null;
  const full = r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === 'vessel')?.record.value ?? null;
  const V = r.find((x) => x.record.quantity === 'volume')?.record.value ?? null;
  const m = empty !== null && full !== null ? full - empty : null;
  const rho = m !== null && V ? m / V : null;
  const correct = rho === null ? undefined : rho < WATER * 0.97 ? 'lighter' : rho > WATER * 1.03 ? 'heavier' : 'same';
  // The liquid of this run, and its density in the tables.
  const liquid = SUBSTANCES[run.steps[0]!.params.substance];
  const table = liquid.liquid.density.value;
  const name = (l: Locale) => liquid.name[l];
  const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
  const cmp = (l: Locale) => (correct === 'lighter' ? t(l, 'lever-balance-answer-liquid-density-cmp') : correct === 'heavier' ? t(l, 'lever-balance-answer-liquid-density-cmp-2') : t(l, 'lever-balance-answer-liquid-density-cmp-3'));
  return {
    ...(correct ? { correct } : {}),
    why: msg('lever-balance-answer-liquid-density-why'),
    say: both((l) => (rho !== null ? `ρ ≈ ${sig(rho, 3, l)} ${t(l, 'unit-sym-kg-per-m3')} — ${cmp(l)}!` : '—')),
    text: both((l) =>
      rho === null
        ? '—'
        : t(l, 'lever-balance-answer-liquid-density-text', { full: g(full!, l), empty: g(empty!, l), m: g(m!, l), V: sig(V! * 1e6, 3, l), rho: sig(rho / 1000, 3, l), rho2: sig(rho, 3, l), l: name(l).toLowerCase(), l2: cmp(l), WATER: sig(WATER, 3, l), table: sig(table, 3, l) }),
    ),
  };
};
