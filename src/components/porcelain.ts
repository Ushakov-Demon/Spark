import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Porcelain: what crucibles are made of — it stands red heat. */
export const PORCELAIN = {
  id: 'porcelain',
  kind: 'material',
  group: 'material',
  name: { uk: 'Порцеляна', en: 'Porcelain' },
  gender: 'f',
  madeOf: [{ part: { uk: 'випалена біла глина (каолін), кварц і польовий шпат', en: 'fired white clay (kaolin), quartz and feldspar' } }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2400, 'kg/m³', 'not stated', 'single-source', 0.05, [{ source: 'engineeringtoolbox-solids-density', locator: 'Porcelain 2.3–2.5 ×10³ kg/m³', conditions: 'not stated', range: [2300, 2500] }], 'The middle of the range.'),
      specificHeat: sv(1070, 'J/(kg·K)', 'not stated', 'single-source', 0.02, [cite('engineeringtoolbox-specific-heat-solids', 'Porcelain 1.07 kJ/(kg·K)', 'not stated', 1070)], 'Porcelains differ; only one table checked.'),
      conductivity: sv(1.5, 'W/(m·K)', 'not stated', 'single-source', 0.05, [cite('engineeringtoolbox-thermal-conductivity', 'Porcelain 1.5 W/(m·K)', 'not stated', 1.5)], 'Porcelains differ; only one table checked.'),
    },
  },
  description: {
    novice: { uk: 'Біла випалена кераміка. Не горить, не плавиться у вогні й майже не проводить теплоту — тому з неї роблять тиглі.', en: 'White fired ceramic. It does not burn or melt in a flame and hardly conducts heat — that is why crucibles are made of it.' },
    school: { uk: 'Порцеляновий тигель витримує нагрівання до ≈ 1150 °C. Теплопровідність порцеляни ≈ 1,5 Вт/(м·К) — у десятки разів менша, ніж у сталі.', en: 'A porcelain crucible stands heating up to ≈ 1150 °C. Porcelain conducts heat at ≈ 1.5 W/(m·K) — tens of times less than steel.' },
  },
  media: [],
} as const satisfies Component;
