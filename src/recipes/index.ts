import { sv } from '../components/sourced.js';
import type { Recipe } from './types.js';

export * from './types.js';

/** Average salinity of seawater, used for the "sea water" recipe (as if all salt were NaCl). */
export const SEAWATER_SALINITY = sv(0.035, '', 'ocean average', 'single-source', 0.05, [{ source: 'wikipedia-seawater', locator: 'Lead: salinity ≈ 3.5 %', conditions: 'average', value: 0.035 }], 'About 86 % of sea salt is Na⁺ and Cl⁻; the model treats all of it as NaCl.');

const brine = (w: number) => [
  { component: 'water', fraction: 1 - w },
  { component: 'sodium-chloride', fraction: w },
] as const;

const LIST = {
  'sea-water': {
    id: 'sea-water',
    name: { uk: 'Морська вода', en: 'Sea water' },
    gender: 'f',
    parts: brine(SEAWATER_SALINITY.value),
    basis: SEAWATER_SALINITY,
    description: {
      novice: {
        uk: 'Вода з розчиненою сіллю — приблизно 35 г солі на кожен кілограм. Її можна «зробити» самому: дистильована вода + кухонна сіль. А якщо випарити воду — сіль залишиться.',
        en: 'Water with salt dissolved in it — about 35 g per kilogram. You can "make" it yourself: distilled water + table salt. Boil the water away and the salt stays behind.',
      },
      school: {
        uk: 'Солоність океану в середньому 3,5 %. Сіль знижує тиск пари води, тому морська вода кипить трохи вище за 100 °C і замерзає близько −2 °C, причому поступово: спершу вимерзає прісний лід, а розсіл, що лишається, стає солонішим.',
        en: 'Ocean salinity averages 3.5 %. Salt lowers the vapour pressure of water, so sea water boils a little above 100 °C and freezes at about −2 °C — gradually: fresh ice freezes out first and the remaining brine gets saltier.',
      },
    },
    notes: [
      {
        uk: 'Справжня морська сіль — це не лише NaCl (≈ 86 % іонів Na⁺ і Cl⁻, решта — магній, сульфати тощо). У моделі вся сіль вважається кухонною.',
        en: 'Real sea salt is not only NaCl (≈ 86 % Na⁺ and Cl⁻ ions, the rest magnesium, sulfates, etc.). The model treats all of it as table salt.',
      },
    ],
  },
  'salt-water-10': {
    id: 'salt-water-10',
    name: { uk: 'Соляний розчин 10 %', en: 'Salt water 10 %' },
    gender: 'm',
    parts: brine(0.1),
    description: {
      novice: {
        uk: 'Вода, у якій розчинено кухонну сіль (10 г солі на 100 г розчину). Солона вода замерзає при нижчій температурі, ніж прісна, — тому дороги взимку посипають сіллю.',
        en: 'Water with table salt dissolved in it (10 g of salt per 100 g of solution). Salt water freezes at a lower temperature than fresh water — that is why roads are salted in winter.',
      },
      school: {
        uk: 'Розчин NaCl 10 % починає замерзати приблизно при −6,6 °C. Що більше солі, то нижча температура замерзання — аж до −21,1 °C при 23,3 % солі: нижче цієї температури розсіл замерзає повністю.',
        en: 'A 10 % NaCl solution starts to freeze at about −6.6 °C. The more salt, the lower the freezing point — down to −21.1 °C at 23.3 % salt: below that the brine freezes completely.',
      },
    },
  },
  'salt-water-20': {
    id: 'salt-water-20',
    name: { uk: 'Соляний розчин 20 %', en: 'Salt water 20 %' },
    gender: 'm',
    parts: brine(0.2),
    description: {
      novice: {
        uk: 'Дуже солона вода (20 г солі на 100 г розчину). Починає замерзати лише приблизно при −16 °C, а повністю замерзає тільки нижче −21 °C — звичайна морозилка (−18 °C) заморозить лише частину.',
        en: 'Very salty water (20 g of salt per 100 g of solution). It starts to freeze only at about −16 °C and freezes completely only below −21 °C — an ordinary −18 °C freezer freezes just part of it.',
      },
      school: {
        uk: 'Розчин NaCl 20 % починає замерзати приблизно при −16,4 °C. Що більше льоду вимерзло, то солоніший розсіл і то холодніше треба, аж до −21,1 °C.',
        en: 'A 20 % NaCl solution starts to freeze at about −16.4 °C. The more ice has frozen out, the saltier the brine and the colder it takes, down to −21.1 °C.',
      },
    },
  },
} as const satisfies Record<string, Recipe>;

export type RecipeId = keyof typeof LIST;
export const RECIPES: Readonly<Record<RecipeId, Recipe>> = LIST;
