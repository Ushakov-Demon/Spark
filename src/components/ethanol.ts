import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

export const ETHANOL = {
  id: 'ethanol',
  kind: 'compound',
  group: 'alcohol',
  name: { uk: 'Спирт (етанол)', en: 'Alcohol (ethanol)' },
  gender: 'm',
  formula: 'C₂H₅OH',
  composition: { C: 2, H: 6, O: 1 },
  wikidata: 'Q153',
  stateAtRoom: 'liquid',
  phases: {
    solid: {
      specificHeat: estimate(2000, 'J/(kg·K)', 'solid ethanol', 1500, 2500, 'Estimate; never reached in this lab (−114 °C).'),
    },
    liquid: {
      density: sv(790, 'kg/m³', 'liquid, 20 °C', 'single-source', 0.01, [cite('wikidata', 'Q153 density', '20 °C', 790)], 'Second source not checked yet.'),
      specificHeat: sv(2570, 'J/(kg·K)', 'liquid, 25 °C', 'cross-checked', 0.06, [
        cite('wikidata', 'Q153 specific heat capacity', 'liquid, 298 K', 2570),
        cite('openstax-cp2e', 'Table 14.1, Ethanol', '25 °C', 2450),
      ]),
    },
  },
  melting: {
    point: sv(-114, '°C', '1 atm', 'cross-checked', 0.01, [cite('openstax-cp2e-latent', 'Table 14.2, Ethyl alcohol', '1 atm', -114), cite('wikidata', 'Q153 melting point', 'not stated', -114.1)]),
    latentHeat: sv(104_000, 'J/kg', 'at −114 °C', 'single-source', 0.01, [cite('openstax-cp2e-latent', 'Table 14.2, Ethyl alcohol', '1 atm', 104_000)], 'Only OpenStax checked so far.'),
  },
  boiling: {
    point: sv(78.3, '°C', '1 atm', 'cross-checked', 0.01, [cite('openstax-cp2e-latent', 'Table 14.2, Ethyl alcohol', '1 atm', 78.3), cite('wikidata', 'Q153 boiling point', '101.325 kPa', 78.29)]),
    latentHeat: sv(854_000, 'J/kg', 'at 78.3 °C', 'single-source', 0.01, [cite('openstax-cp2e-latent', 'Table 14.2, Ethyl alcohol', '1 atm', 854_000)], 'Only OpenStax checked so far.'),
  },
  vapour: {
    pressure: { kind: 'antoine', A: 8.04494, B: 1554.3, C: 222.65 },
    data: sv(760, 'mmHg', 'Antoine equation; value at 78.4 °C', 'single-source', 0.01, [cite('wikipedia-ethanol-data', 'Antoine constants; 760 mmHg at 78.4 °C', '°C, mmHg', 760)], 'The equation gives 762 mmHg at 78.4 °C.'),
  },
  inWater: { solubility: 'miscible' },
  electrical: { conducts: 'insulator' },
  hazards: { flammable: true },
  description: {
    novice: {
      uk: 'Безбарвна рідина, яка кипить уже при 78 °C, а замерзає лише при −114 °C — жодна домашня морозилка її не заморозить.',
      en: 'A colourless liquid that boils already at 78 °C and freezes only at −114 °C — no home freezer can freeze it.',
    },
    school: {
      uk: 'Питома теплоємність спирту приблизно на 40 % менша, ніж у води, а теплота пароутворення — у 2,6 раза менша. Тому спирт нагрівається і википає значно швидше.',
      en: 'Ethanol has about 40 % lower specific heat than water and a 2.6 times lower heat of vaporisation. So it heats up and boils away much faster.',
    },
  },
  safety: {
    school: {
      uk: 'Спирт легко займається, а його пара — вибухонебезпечна. Справжній спирт не гріють на відкритому вогні.',
      en: 'Alcohol catches fire easily and its vapour can explode. Real alcohol is never heated over an open flame.',
    },
  },
  media: [],
} as const satisfies Component;
