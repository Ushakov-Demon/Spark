import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, ch, PRESSURE, room, stepLine, STEPS_END, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_depth_pressure: Preset = varied(
  {
    id: 'depth-pressure',
    ask: msg('depth-pressure-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('depth-pressure-title'),
    guided: true,
    bench: 'depth',
    choices: [ch('proportional', msg('depth-pressure-choices')), ch('same', msg('depth-pressure-choices-2')), ch('slower', msg('depth-pressure-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['rhoD:'],
    formulas: ['mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Дослідження: … зміни тиску в рідині з глибиною; … вимірювання й визначення: атмосферного й гідростатичного тиску' }],
    expect: 'reached',
  },
  {
    // Liquids of different densities: the manometer's water tells them apart (salt water deeper, oil less).
    controls: [{ id: 'liquid', label: msg('depth-pressure-liquid-label'), kind: 'choice', options: [ch('water', msg('depth-pressure-liquid-options')), ch('salt-water-20', msg('depth-pressure-liquid-options-2')), ch('sunflower-oil', msg('depth-pressure-liquid-options-3'))], value: 'water' }],
    build: (v) => {
      const liquid = String(v['liquid']) as 'water' | 'salt-water-20' | 'sunflower-oil';
      const name = { water: msg('depth-pressure-name-water'), 'salt-water-20': msg('depth-pressure-name-salt-water-20'), 'sunflower-oil': msg('depth-pressure-name-sunflower-oil') }[liquid];
      return {
        question: msg('depth-pressure-build-question', { name: (l: Locale) => name[l] }),
        params: { ...room, vessel: 'beaker', size: 1, material: 'glass', liters: 0.9, action: 'settle', substance: liquid, startTemp: 20 },
        plan: [
          ...[0.03, 0.06, 0.09].map((depth) => ({ kind: 'bench', command: { type: 'lab.depth', depth } }) as const),
          { kind: 'bench', command: { type: 'lab.depth', depth: 0.09, sideways: true } },
        ],
      };
    },
  },
);

export const answer_depth_pressure = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.depth' && x.record.value !== null).map((x) => ({ h: Number(x.command['depth']), side: !!x.command['sideways'], dh: x.record.value!, rhoM: x.record.inputs?.['rhoManometer'] ?? 1000, rhoL: x.record.inputs?.['rhoLiquid'] ?? 1000, g: x.record.inputs?.['g'] ?? 9.81 }));
  const down = rows.filter((x) => !x.side);
  const side = rows.find((x) => x.side);
  const p = (x: (typeof rows)[number]) => x.rhoM * x.g * x.dh;
  // Proportional: p / h the same at every depth, within the manometer's millimetre (half of it, relative to Δh).
  const k = down.map((x) => p(x) / x.h);
  const mean = k.reduce((a, b) => a + b, 0) / Math.max(1, k.length);
  const err = down.length ? Math.max(...down.map((x) => 0.0005 / x.dh)) : 0;
  const spread = k.length ? Math.max(...k.map((x) => Math.abs(x / mean - 1))) : 0;
  const first = down[0];
  const last = down[down.length - 1];
  const correct = down.length < 2 ? undefined : spread <= err + 0.01 ? 'proportional' : last && first && p(last) > p(first) ? 'slower' : 'same';
  const rho = first ? mean / first.g : 0;
  const table = first?.rhoL ?? 0;
  const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
  const Pa = (x: number, l: Locale) => `${sig(x, 3, l)} ${t(l, 'unit-sym-Pa')}`;
  const list = (l: Locale) => down.map((x) => `${cm(x.h, l)} — Δh = ${cm(x.dh, l)}, p ≈ ${Pa(p(x), l)}`).map(stepLine).join(';') + STEPS_END;
  return {
    ...(correct ? { correct } : {}),
    why: msg('depth-pressure-answer-why'),
    say: both((l) => (correct === 'proportional' ? t(l, 'depth-pressure-answer-say') : t(l, 'depth-pressure-answer-say-2'))),
    text: both((l) =>
      t(l, 'depth-pressure-answer-text-2', { l: list(l), mean: sig(mean, 3, l), rho: sig(rho, 3, l), table: sig(table, 3, l), h: side ? t(l, 'depth-pressure-answer-text', { h: cm(side.h, l), dh: cm(side.dh, l) }) : '' }),
    ),
  };
};
