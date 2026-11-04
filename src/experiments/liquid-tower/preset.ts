import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { TOWER_BODIES, TOWER_LIQUIDS, type TowerBody, towerLiquidDensity, towerLiquidIn, towerLiquidName } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_liquid_tower: Preset = {
  ask: msg('liquid-tower-ask'),
  id: 'liquid-tower',
  grade: 7,
  topic: INTERACTION,
  title: msg('liquid-tower-title'),
  question: msg('liquid-tower-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'tower',
  plan: [
    { kind: 'bench', command: { type: 'lab.tower', step: 'pour' } },
    ...(['nut', 'acrylic', 'hdpe', 'pine'] as const).map((body) => ({ kind: 'bench', command: { type: 'lab.tower', step: 'drop', body } }) as const),
  ],
  choices: [ch('bottom', msg('liquid-tower-choices')), ch('glycerol', msg('liquid-tower-choices-2')), ch('oil', msg('liquid-tower-choices-3'))],
  trick: msg('liquid-tower-trick'),
  formulas: ['mechanics.density', 'mechanics.submerged-share'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'взаємного розташуванням тіл і рідин різної густини у циліндричному посуді' },
  ],
  expect: 'reached',
};

export const answer_liquid_tower = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.tower' && x.command['step'] === 'drop' && x.record.value !== null);
  const at = (b: TowerBody) => recs.find((x) => x.command['body'] === b)?.record ?? null;
  const acr = at('acrylic');
  const lower = acr?.inputs?.['lower'];
  const correct = acr ? (lower === -1 ? 'bottom' : lower === 0 ? 'glycerol' : lower === 1 ? 'oil' : undefined) : undefined;
  const d = TOWER_LIQUIDS.map(towerLiquidDensity);
  const R = (x: number) => String(Math.round(x));
  const pc = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
  const place = (b: TowerBody, l: Locale) => {
    const r = at(b);
    if (!r) return '';
    const lw = r.inputs?.['lower'] ?? -1;
    const share = r.inputs?.['share'] ?? 0;
    const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), l);
    const inn = (k: number) => tr(towerLiquidIn(TOWER_LIQUIDS[k]!), l);
    const name = tr(TOWER_BODIES[b].name, l);
    const N = name.charAt(0).toUpperCase() + name.slice(1);
    const rho = R(r.inputs?.['density'] ?? 0);
    if (lw < 0) return t(l, 'liquid-tower-answer-place', { N, rho });
    if (r.inputs?.['top'] === 1) return t(l, 'liquid-tower-answer-place-2', { N, rho, share: pc(share, l) });
    return t(l, 'liquid-tower-answer-place-3', { N, rho, lw: nm(lw), lw2: nm(lw + 1), share: pc(share, l), lw3: inn(lw), lw4: inn(lw + 1) });
  };
  return {
    ...(correct ? { correct } : {}),
    why: msg('liquid-tower-answer-why'),
    say: msg('liquid-tower-answer-say'),
    text: both((l) => {
      const layers = t(l, 'liquid-tower-text-layers', { d: R(d[0]!), d2: R(d[1]!), d3: R(d[2]!), d4: R(d[3]!) });
      return [layers, ...(['nut', 'acrylic', 'hdpe', 'pine'] as const).map((b) => place(b, l))].filter(Boolean).join(' ');
    }),
  };
};
