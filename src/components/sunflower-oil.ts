import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

export const SUNFLOWER_OIL = {
  id: 'sunflower-oil',
  kind: 'material',
  group: 'oil',
  name: { uk: 'Олія соняшникова', en: 'Sunflower oil' },
  gender: 'f',
  madeOf: [{ part: { uk: 'жири (тригліцериди лінолевої та олеїнової кислот)', en: 'fats (triglycerides of linoleic and oleic acids)' } }],
  wikidata: 'Q94787',
  stateAtRoom: 'liquid',
  phases: {
    liquid: {
      viscosity: sv(0.04914, 'Pa·s', 'unrefined, 25 °C', 'single-source', 0.05, [cite('wikipedia-sunflower-oil', 'Physical properties: viscosity (25 °C), unrefined, 0.04914 kg/(m·s)', '25 °C', 0.04914)], 'Refined oils and lower temperatures differ by tens of per cent.'),
      density: sv(918.8, 'kg/m³', '25 °C', 'single-source', 0.01, [cite('wikipedia-sunflower-oil', 'Physical properties: density', '25 °C', 918.8)], 'Second source not checked yet.'),
      specificHeat: estimate(2000, 'J/(kg·K)', 'room temperature', 1800, 2300, 'Measured values exist (Rojas et al. 2013) but we could not access the numbers; typical for vegetable oils.'),
      conductivity: sv(0.168, 'W/(m·K)', '25 °C', 'single-source', 0.01, [cite('turgut-2009-oils', 'sunflower oil, hot-wire', '25 °C', 0.168)], 'One measurement study (hot-wire method). Second source not checked yet.'),
    },
  },
  decomposes: {
    point: sv(232, '°C', 'refined oil (unrefined: 107 °C)', 'single-source', 0.01, [cite('wikipedia-sunflower-oil', 'Smoke point, refined', 'refined', 232)], 'Smoke points vary between oils and sources. Second source not checked yet.'),
    into: { uk: 'дим і продукти розкладу', en: 'smoke and breakdown products' },
  },
  inWater: { solubility: 'immiscible' },
  electrical: { conducts: 'insulator' },
  description: {
    novice: {
      uk: 'Олія не кипить, як вода: якщо її довго гріти, при ≈ 232 °C (рафінована) вона починає димітися й розкладатися.',
      en: 'Oil does not boil like water: heated long enough, at ≈ 232 °C (refined) it starts to smoke and break down.',
    },
    school: {
      uk: 'За оцінкою, теплоємність олії приблизно вдвічі менша, ніж у води, тож вона нагрівається приблизно вдвічі швидше. Олія легша за воду (≈ 919 кг/м³) і проводить теплоту приблизно в 3,5 раза гірше.',
      en: 'By estimate, oil has about half the specific heat of water, so it heats about twice as fast. It is lighter than water (≈ 919 kg/m³) and conducts heat about 3.5 times worse.',
    },
  },
  safety: {
    school: {
      uk: 'Розпечена олія спричиняє сильні опіки, а вода, що потрапила в гарячу олію, розбризкує її. Палаючу олію не гасять водою.',
      en: 'Hot oil causes severe burns, and water that gets into hot oil makes it spatter. Burning oil is never put out with water.',
    },
  },
  media: [],
  modelNotes: [
    {
      uk: 'Даних про застигання олії ми не знайшли, тому в моделі вона не застигає.',
      en: 'We found no data on how sunflower oil solidifies, so in the model it does not.',
    },
  ],
} as const satisfies Component;
