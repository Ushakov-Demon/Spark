import type { Component } from './types.js';
import { NACL_SOLUTE } from './sodium-chloride.js';
import { cite, sv } from './sourced.js';

/** Cp 84.1 J/(mol·K) ÷ 0.05349 kg/mol. Dissolving it takes heat: the classic "cold pack" salt of school labs. */
export const AMMONIUM_CHLORIDE = {
  id: 'ammonium-chloride',
  kind: 'compound',
  group: 'salt',
  name: { uk: 'Амоній хлорид (нашатир)', en: 'Ammonium chloride (sal ammoniac)' },
  genitive: { uk: 'амоній хлориду', en: 'ammonium chloride' },
  gender: 'm',
  formula: 'NH₄Cl',
  composition: { N: 1, H: 4, Cl: 1 },
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(1519, 'kg/m³', 'solid', 'single-source', 0.01, [cite('wikipedia-ammonium-chloride', 'Chembox: density 1.519 g/cm³', 'solid', 1519)], 'Second source not checked yet.'),
      specificHeat: sv(1572, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.02, [cite('wikipedia-ammonium-chloride', 'Chembox: heat capacity 84.1 J/(mol·K) ÷ 0.05349 kg/mol', '—', 1572.3)], 'Second source not checked yet.'),
    },
  },
  decomposes: {
    point: sv(337.6, '°C', '1 atm', 'single-source', 0.01, [cite('wikipedia-ammonium-chloride', 'Chembox: decomposes at 337.6 °C at 1 atm', '1 atm', 337.6)], 'It does not melt: on heating it breaks into ammonia and hydrogen chloride, which join again on a cold surface — it seems to sublime.'),
    into: { uk: 'аміак і хлороводень (на холодному вони знову з’єднуються в білий наліт)', en: 'ammonia and hydrogen chloride (on a cold surface they join again as a white coating)' },
  },
  inWater: {
    solubility: sv(37.2, 'g/100 mL water', '20 °C', 'cross-checked', 0.03, [cite('wikipedia-solubility-table', 'Ammonium chloride row: 37.2 at 20 °C', '20 °C', 37.2), cite('wikipedia-ammonium-chloride', 'Chembox: 383.0 g/L at 25 °C', '25 °C', 38.3)]),
    ions: ['NH₄⁺', 'Cl⁻'],
    solubilityTable: {
      t: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      gPer100g: [29.4, 33.2, 37.2, 41.4, 45.8, 50.4, 55.3, 60.2, 65.6, 71.2, 77.3],
      data: sv(37.2, 'g/100 g water', '20 °C', 'single-source', 0.02, [cite('wikipedia-solubility-table', 'Ammonium chloride row, 0–100 °C', '20 °C', 37.2)], 'The table gives grams per 100 mL of water; for water near room temperature that is ≈ per 100 g.'),
    },
    conductivityTable: {
      w: [0, 0.005, 0.01, 0.02, 0.05, 0.1],
      kappa: [0, 1.05, 2.04, 4.03, 9.53, 18],
      data: sv(2.04, 'S/m', '1 % NH₄Cl, 20 °C', 'single-source', 0.01, [cite('crc-electrical-conductivity', 'Ammonium chloride row: 10.5, 20.4, 40.3, 95.3, 180 mS/cm at 0.5–10 %', '20 °C', 2.04)], 'One table, up to 10 %; above it the model keeps the last value.'),
    },
    enthalpyOfSolution: sv(14.78, 'kJ/mol', 'infinite dilution, 25 °C', 'single-source', 0.01, [cite('crc-enthalpy-of-solution', 'NH4Cl (c): 14.78 kJ/mol', '25 °C', 14.78)], 'At infinite dilution; the model uses it at any concentration — an approximation.'),
    electrolysis: {
      ...NACL_SOLUTE.electrolysis!,
      note: {
        uk: 'Під струмом, як і в солоній воді, на катоді виділяється водень, а на аноді — хлор: обидва з хлорид-йонів і води.',
        en: 'Under current, as in salt water, hydrogen forms at the cathode and chlorine at the anode: both from chloride ions and water.',
      },
    },
  },
  electrical: { conducts: 'ions-in-solution' },
  hazards: { irritant: true },
  description: {
    novice: {
      uk: 'Білі кристалики, схожі на сіль. Якщо розчинити їх у воді, вода помітно холоне — так працюють «холодні» пакети першої допомоги.',
      en: 'White crystals that look like salt. Dissolved in water, they make it noticeably colder — that is how first-aid cold packs work.',
    },
    school: {
      uk: 'Розчинення NH₄Cl поглинає теплоту (+14,8 кДж/моль): енергії на руйнування кристала йде більше, ніж виділяється, коли йони оточує вода. Тому розчин охолоджується. Під час кристалізації ця теплота повертається.',
      en: 'Dissolving NH₄Cl takes in heat (+14.8 kJ/mol): breaking up the crystal takes more energy than is released as water surrounds the ions. So the solution cools down. On crystallising the heat comes back.',
    },
  },
  safety: { school: { uk: 'Шкідливий, якщо проковтнути, і подразнює очі. Працюй в окулярах. Під час нагрівання виділяє подразливі гази.', en: 'Harmful if swallowed and irritates the eyes. Wear goggles. When heated it gives off irritating gases.' } },
  media: [],
} as const satisfies Component;
