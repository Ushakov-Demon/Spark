import { defineFormula, type CurriculumRef, type FormulaSpec } from '../../knowledge/types.js';
import {
  celsius,
  heatCapacity,
  heatTransferCoeff,
  joules,
  kilograms,
  meters,
  seconds,
  specificHeat,
  squareMeters,
  thermalConductance,
  thermalConductivity,
  watts,
} from '../../core/units.js';
import * as f from './formulas.js';

/**
 * Human-facing catalog of the thermal formulas.
 *
 * - `law` links to THERMAL_LAWS; `argSymbols` name the positional arguments
 *   of `compute`, so a trace record can be shown as "Q = … where c = …, m = …".
 * - Units: 'K' = absolute temperature, 'ΔK' = temperature difference
 *   (shown as °C to students, without the 273.15 shift).
 * - `curriculum` quotes the programme documents verbatim (see CURRICULA).
 * - Example answers were computed independently and are re-checked by tests.
 *   Texts are original (`spark`) and await review by a physics teacher.
 */

// Ukraine — quotes checked against the programme PDFs on 2026-10-11.
const UA_HEAT_QUANTITY: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Нагрівання. Кількість теплоти. Питома теплоємність. Розрахунок кількості теплоти при нагріванні/охолодженні тіла.' },
  { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Кількість теплоти. Розрахунок кількості теплоти при нагріванні/охолодженні тіла.' },
];
const UA_HEAT_TRANSFER: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 8, depth: 'qualitative', quote: 'Види передавання тепла: теплопровідність, конвекція, теплове випромінювання.' },
  { program: 'ua-2017', grade: 8, depth: 'qualitative', quote: 'Види теплообміну.' },
];

export const THERMAL_FORMULAS: readonly FormulaSpec[] = [
  defineFormula({
    id: 'thermal.heat-for-temperature-change',
    law: 'specific-heat',
    title: { uk: 'Кількість теплоти під час нагрівання й охолодження', en: 'Heat for a temperature change' },
    latex: 'Q = c \\cdot m \\cdot \\Delta T',
    plain: 'Q = c · m · ΔT',
    argSymbols: ['m', 'c', 'ΔT'],
    resultSymbol: 'Q',
    variables: {
      Q: {
        name: { uk: 'кількість теплоти', en: 'heat' },
        unit: 'J',
        meaning: { school: { uk: 'скільки енергії тіло отримало (Q > 0) або віддало (Q < 0)', en: 'energy the body received (Q > 0) or gave away (Q < 0)' } },
      },
      c: {
        name: { uk: 'питома теплоємність', en: 'specific heat capacity' },
        unit: 'J/(kg·K)',
        meaning: { school: { uk: 'скільки джоулів потрібно, щоб нагріти 1 кг цієї речовини на 1 °C', en: 'joules needed to warm 1 kg of this substance by 1 °C' } },
      },
      m: { name: { uk: 'маса', en: 'mass' }, unit: 'kg' },
      ΔT: {
        name: { uk: 'зміна температури', en: 'temperature change' },
        unit: 'ΔK',
        meaning: { school: { uk: 'на скільки градусів тіло нагрілося (або охололо, якщо менше нуля)', en: 'how many degrees the body warmed (or cooled, if negative)' } },
      },
    },
    curriculum: UA_HEAT_QUANTITY,
    explanation: {
      novice: {
        uk: 'Що більше води і що сильніше її треба нагріти, то більше енергії потрібно. Вода «вимоглива»: їй потрібно приблизно в 10 разів більше енергії, ніж такій самій масі міді.',
        en: 'The more water and the more you want to heat it, the more energy it takes. Water is «demanding»: it needs about 10 times more energy than the same mass of copper.',
      },
      school: {
        uk: 'Щоб нагріти тіло, йому треба передати енергію. Що більша маса і що сильніше нагріваємо, то більше енергії потрібно. Воді на 1 кг і 1 °C потрібно близько 4200 Дж, міді — лише близько 400 Дж.',
        en: 'To heat a body you have to give it energy. The larger the mass and the bigger the warming, the more energy is needed. Water needs about 4200 J per kg per °C, copper only about 400 J.',
      },
      expert: {
        uk: 'Зв’язок внутрішньої енергії та температури тіла за сталої c; у моделі — перерахунок ΔU → ΔT на кожному кроці.',
        en: 'Relation between internal energy and temperature at constant c; in the model — the ΔU → ΔT conversion at every step.',
      },
    },
    compute: f.heatForTemperatureChange,
    examples: [{ args: [kilograms(0.5), specificHeat(897), 60], expected: 26_910, note: 'Нагріти алюмінієву каструлю 0,5 кг на 60 °C' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.latent-heat',
    law: 'latent-heat',
    title: { uk: 'Теплота плавлення / пароутворення', en: 'Latent heat of melting / vaporisation' },
    latex: 'Q = \\lambda \\cdot m',
    plain: 'Q = λ · m',
    argSymbols: ['m', 'λ'],
    resultSymbol: 'Q',
    variables: {
      Q: { name: { uk: 'кількість теплоти', en: 'heat' }, unit: 'J' },
      m: { name: { uk: 'маса, що розплавилась (застигла) чи випарувалась', en: 'mass that melted (froze) or boiled away' }, unit: 'kg' },
      λ: {
        name: { uk: 'питома теплота плавлення або пароутворення', en: 'specific latent heat of fusion or vaporisation' },
        unit: 'J/kg',
        meaning: { school: { uk: 'скільки джоулів потрібно, щоб перетворити 1 кг речовини без зміни температури', en: 'joules needed to change the phase of 1 kg without changing its temperature' } },
      },
    },
    curriculum: [
      { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Розрахунок кількості теплоти при пароутворенні /конденсації.' },
      { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Плавлення. Тверднення Розрахунок кількості теплоти при плавленні/твердненні тіл.' },
      { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Розрахунок кількості теплоти при плавленні/твердненні тіл.' },
      { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Розрахунок кількості теплоти при пароутворенні/конденсації.' },
    ],
    explanation: {
      novice: {
        uk: 'Щоб розтопити лід чи випарувати воду, потрібно багато енергії, хоча термометр при цьому показує те саме.',
        en: 'Melting ice or boiling water away takes a lot of energy, even though the thermometer shows the same number.',
      },
      school: {
        uk: 'Щоб розплавити 1 кг льоду, потрібно ≈ 334 кДж — стільки ж, скільки, щоб нагріти 1 кг води майже на 80 °C. А щоб випарувати 1 кг води — ≈ 2256 кДж, у кілька разів більше.',
        en: 'Melting 1 kg of ice takes ≈ 334 kJ — as much as warming 1 kg of water by almost 80 °C. Boiling away 1 kg of water takes ≈ 2256 kJ, several times more.',
      },
    },
    compute: f.latentHeat,
    examples: [{ args: [kilograms(0.5), 334_000], expected: 167_000, note: 'Розплавити 0,5 кг льоду' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.evaporation-rate',
    law: 'evaporation',
    title: { uk: 'Швидкість випаровування', en: 'Evaporation rate' },
    latex: '\\dot m = h_m \\cdot A \\cdot (\\rho_s - \\rho_\\infty)',
    plain: 'ṁ = h_m · A · (ρ_s − ρ_∞)',
    argSymbols: ['h_m', 'A', 'ρ_s', 'ρ_∞'],
    resultSymbol: 'ṁ',
    variables: {
      'ṁ': { name: { uk: 'маса, що випаровується за секунду', en: 'mass evaporating per second' }, unit: 'kg/s' },
      'h_m': { name: { uk: 'коефіцієнт масовіддачі', en: 'mass transfer coefficient' }, unit: 'm/s' },
      A: { name: { uk: 'площа відкритої поверхні рідини', en: 'open liquid surface area' }, unit: 'm²' },
      'ρ_s': { name: { uk: 'густина насиченої пари над рідиною', en: 'saturated vapour density above the liquid' }, unit: 'kg/m³' },
      'ρ_∞': { name: { uk: 'густина пари в повітрі (або під кришкою)', en: 'vapour density in the air (or under the lid)' }, unit: 'kg/m³' },
    },
    curriculum: [{ program: 'ua-2017', grade: 8, depth: 'qualitative', quote: 'Пароутворення і конденсація.' }],
    beyondCurriculum: { uk: 'У 8 класі випаровування вивчають якісно; формула — поза програмою.', en: 'Evaporation is taught qualitatively; the formula is beyond the curriculum.' },
    explanation: {
      novice: { uk: 'Гаряча вода «парує» — і разом із парою йде багато енергії.', en: 'Hot water steams — and a lot of energy leaves with the steam.' },
      school: {
        uk: 'Що гарячіша рідина і що більша її відкрита поверхня, то більше пари відлітає щосекунди. Кожен кілограм пари уносить ≈ 2,3 МДж — тому кришка так прискорює закипання.',
        en: 'The hotter the liquid and the larger its open surface, the more vapour leaves every second. Each kilogram of vapour carries ≈ 2.3 MJ — which is why a lid speeds up boiling so much.',
      },
    },
    compute: f.evaporationRate,
    examples: [{ args: [0.01, squareMeters(0.05), 0.42, 0.01], expected: 0.000205, note: 'Каструля з водою ≈ 90 °C у кімнаті' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.heat-capacity',
    law: 'specific-heat',
    title: { uk: 'Теплоємність тіла', en: 'Heat capacity of a body' },
    latex: 'C = c \\cdot m',
    plain: 'C = c · m',
    argSymbols: ['m', 'c'],
    resultSymbol: 'C',
    variables: {
      C: { name: { uk: 'теплоємність тіла', en: 'heat capacity of the body' }, unit: 'J/K' },
      c: { name: { uk: 'питома теплоємність', en: 'specific heat capacity' }, unit: 'J/(kg·K)' },
      m: { name: { uk: 'маса', en: 'mass' }, unit: 'kg' },
    },
    curriculum: [{ program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'теплоємність, питома теплоємність' }],
    explanation: {
      novice: { uk: 'Відро води нагріти важче, ніж склянку, хоча речовина та сама.', en: 'A bucket of water is harder to heat than a glass, though the substance is the same.' },
      school: {
        uk: 'Скільки джоулів потрібно, щоб нагріти саме це тіло на 1 °C. Відро води нагріти «важче», ніж склянку, хоча речовина та сама.',
        en: 'How many joules it takes to warm this particular body by 1 °C. A bucket of water is «harder» to heat than a glass, though the substance is the same.',
      },
    },
    compute: f.heatCapacityOf,
    examples: [{ args: [kilograms(2), specificHeat(4181)], expected: 8362, note: '2 кг води' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.equilibrium-temperature',
    law: 'heat-balance',
    title: { uk: 'Температура суміші (рівняння теплового балансу)', en: 'Temperature of a mixture (heat balance)' },
    latex: '\\theta = \\dfrac{\\sum c_i m_i t_i}{\\sum c_i m_i}',
    plain: 'θ = (c₁m₁t₁ + c₂m₂t₂ + …) / (c₁m₁ + c₂m₂ + …)',
    argSymbols: ['bodies'],
    resultSymbol: 'θ',
    variables: {
      θ: { name: { uk: 'температура суміші', en: 'mixture temperature' }, unit: 'K' },
      bodies: { name: { uk: 'тіла, що змішуються (маса, теплоємність, температура)', en: 'bodies being mixed (mass, heat capacity, temperature)' }, unit: '' },
    },
    curriculum: [
      { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Тепловий баланс.' },
      { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Рівняння теплового балансу.' },
      { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Вивчення теплового балансу за умов змішування води різної температури.' },
    ],
    explanation: {
      novice: {
        uk: 'Змішали гарячу і холодну воду — вийшла тепла. Що більше було гарячої, то тепліший результат.',
        en: 'Mix hot and cold water and you get warm water. The more hot water there was, the warmer the result.',
      },
      school: {
        uk: 'Гарячі тіла віддають рівно стільки теплоти, скільки отримують холодні. Тому кінцева температура — «середнє», де кожне тіло важить стільки, яка його теплоємність.',
        en: 'Hot bodies give away exactly the heat the cold ones receive. So the final temperature is an «average» in which each body counts as much as its heat capacity.',
      },
    },
    compute: f.equilibriumTemperature,
    examples: [
      {
        args: [
          [
            { mass: kilograms(0.5), specificHeat: specificHeat(385), temperature: celsius(100) },
            { mass: kilograms(0.2), specificHeat: specificHeat(4181), temperature: celsius(20) },
          ],
        ],
        expected: 308.1203509283562,
        note: 'Мідний циліндр 0,5 кг за 100 °C у 0,2 кг води за 20 °C → ≈ 35 °C',
      },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.conduction-conductance',
    law: 'fourier-conduction',
    title: { uk: 'Теплова провідність стрижня або стінки', en: 'Conductance of a rod or wall' },
    latex: 'G = \\dfrac{k \\cdot A}{L}',
    plain: 'G = k · A / L',
    argSymbols: ['k', 'A', 'L'],
    resultSymbol: 'G',
    variables: {
      G: {
        name: { uk: 'теплова провідність', en: 'thermal conductance' },
        unit: 'W/K',
        meaning: { school: { uk: 'скільки ват теплоти проходить на кожен градус різниці температур', en: 'watts of heat passing per degree of temperature difference' } },
      },
      k: { name: { uk: 'теплопровідність матеріалу', en: 'thermal conductivity of the material' }, unit: 'W/(m·K)' },
      A: { name: { uk: 'площа перерізу', en: 'cross-section area' }, unit: 'm²' },
      L: { name: { uk: 'довжина (товщина)', en: 'length (thickness)' }, unit: 'm' },
    },
    curriculum: UA_HEAT_TRANSFER,
    beyondCurriculum: { uk: 'У школі теплопровідність вивчають якісно; формула — поза базовим курсом.', en: 'Schools treat conduction qualitatively; the formula is beyond the basic course.' },
    explanation: {
      novice: {
        uk: 'Металева ложка в гарячому чаї швидко нагрівається, а дерев’яна — ні: метал добре проводить теплоту.',
        en: 'A metal spoon in hot tea heats up quickly, a wooden one does not: metal conducts heat well.',
      },
      school: {
        uk: 'Теплота легше проходить крізь товстий і короткий стрижень, ніж крізь тонкий і довгий. Мідь проводить теплоту в сотні разів краще за скло.',
        en: 'Heat passes more easily through a thick, short rod than a thin, long one. Copper conducts heat hundreds of times better than glass.',
      },
    },
    compute: f.conductionConductance,
    examples: [{ args: [thermalConductivity(401), squareMeters(1e-4), meters(0.1)], expected: 0.401, note: 'Мідний стрижень 1 см² × 10 см' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.convection-conductance',
    law: 'newton-cooling',
    title: { uk: 'Тепловіддача поверхні повітрю або воді', en: 'Convective conductance' },
    latex: 'G = h \\cdot A',
    plain: 'G = h · A',
    argSymbols: ['h', 'A'],
    resultSymbol: 'G',
    variables: {
      G: {
        name: { uk: 'теплова провідність', en: 'thermal conductance' },
        unit: 'W/K',
        meaning: { school: { uk: 'скільки ват теплоти йде на кожен градус різниці температур', en: 'watts of heat leaving per degree of temperature difference' } },
      },
      h: {
        name: { uk: 'коефіцієнт тепловіддачі', en: 'heat transfer coefficient' },
        unit: 'W/(m²·K)',
        meaning: {
          school: {
            uk: 'наскільки добре повітря чи вода «забирає» теплоту з кожного квадратного метра; на вітрі більше',
            en: 'how well air or water «takes» heat from each square metre; larger in the wind',
          },
        },
      },
      A: { name: { uk: 'площа поверхні', en: 'surface area' }, unit: 'm²' },
    },
    curriculum: UA_HEAT_TRANSFER,
    beyondCurriculum: { uk: 'У школі конвекцію вивчають якісно; формула — поза базовим курсом.', en: 'Schools treat convection qualitatively; the formula is beyond the basic course.' },
    explanation: {
      novice: {
        uk: 'Що більша поверхня, то швидше тіло холоне. На вітрі холонемо швидше, бо рухоме повітря забирає теплоту краще.',
        en: 'The larger the surface, the faster a body cools. We cool faster in the wind because moving air carries heat away better.',
      },
      school: {
        uk: 'Що більша поверхня, то швидше тіло віддає теплоту повітрю. Рухоме повітря (вітер) забирає теплоту краще, ніж нерухоме.',
        en: 'The larger the surface, the faster a body gives heat to the air. Moving air (wind) takes heat better than still air.',
      },
    },
    compute: f.convectionConductance,
    examples: [{ args: [heatTransferCoeff(10), squareMeters(0.5)], expected: 5, note: 'Поверхня 0,5 м² у нерухомому повітрі' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.series-conductance',
    law: 'linear-heat-transfer',
    title: { uk: 'Теплота проходить шари один за одним', en: 'Heat passing layers in series' },
    latex: '\\dfrac{1}{G} = \\dfrac{1}{G_1} + \\dfrac{1}{G_2}',
    plain: '1/G = 1/G₁ + 1/G₂',
    argSymbols: ['G₁', 'G₂'],
    resultSymbol: 'G',
    variables: {
      G: { name: { uk: 'загальна теплова провідність', en: 'total conductance' }, unit: 'W/K' },
      'G₁': { name: { uk: 'провідність стінки посуду', en: 'conductance of the vessel wall' }, unit: 'W/K' },
      'G₂': { name: { uk: 'провідність тепловіддачі воді', en: 'conductance of the transfer to water' }, unit: 'W/K' },
    },
    curriculum: [],
    beyondCurriculum: {
      uk: 'Поза програмою; має пряму аналогію з послідовним з’єднанням резисторів (8 клас).',
      en: 'Beyond the curriculum; a direct analogy of resistors in series.',
    },
    explanation: {
      novice: {
        uk: 'Теплоті доводиться пройти дві «перешкоди» одна за одною: стінку посуду і шар води біля неї. Найважча перешкода сильніше за все гальмує нагрівання.',
        en: 'Heat must pass two «obstacles» one after another: the vessel wall and the water layer next to it. The hardest obstacle slows heating the most.',
      },
      school: {
        uk: 'Як резистори, з’єднані послідовно: опори теплопередачі додаються. Тонка металева стінка майже нічого не додає, а скляна — помітно.',
        en: 'Like resistors in series: thermal resistances add up. A thin metal wall adds almost nothing, a glass wall adds noticeably.',
      },
    },
    compute: f.seriesConductance,
    examples: [{ args: [thermalConductance(2), thermalConductance(2)], expected: 1, note: 'Два однакові шари по 2 Вт/К → 1 Вт/К' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.heat-flow',
    law: 'linear-heat-transfer',
    title: { uk: 'Потік теплоти між тілами', en: 'Heat flow between bodies' },
    latex: 'P = G \\cdot (T_1 - T_2)',
    plain: 'P = G · (t₁ − t₂)',
    argSymbols: ['G', 't₁', 't₂'],
    resultSymbol: 'P',
    variables: {
      P: {
        name: { uk: 'потужність потоку теплоти', en: 'heat flow rate' },
        unit: 'W',
        meaning: { school: { uk: 'скільки джоулів теплоти переходить за одну секунду', en: 'joules of heat passing every second' } },
      },
      G: { name: { uk: 'теплова провідність зв’язку', en: 'conductance of the link' }, unit: 'W/K' },
      't₁': { name: { uk: 'температура першого тіла', en: 'temperature of the first body' }, unit: 'K' },
      't₂': { name: { uk: 'температура другого тіла', en: 'temperature of the second body' }, unit: 'K' },
    },
    curriculum: [
      { program: 'ua-nus-2023-holovko', grade: 8, depth: 'qualitative', quote: 'Види передавання тепла: теплопровідність, конвекція, теплове випромінювання.' },
    ],
    beyondCurriculum: { uk: 'Ідея «від гарячого до холодного» є у 8 класі; кількісна формула — поза базовим курсом.', en: 'The idea «from hot to cold» is taught; the quantitative formula is beyond the basic course.' },
    explanation: {
      novice: {
        uk: 'Теплота тече від гарячого до холодного — як вода тече згори вниз. Що більший «перепад», то сильніший потік.',
        en: 'Heat flows from hot to cold — like water flows downhill. The bigger the «drop», the stronger the flow.',
      },
      school: {
        uk: 'Теплота тече від гарячого до холодного, і тим швидше, чим більша різниця температур. Якщо P < 0 — теплота тече у зворотний бік.',
        en: 'Heat flows from hot to cold, and faster for a bigger temperature difference. If P < 0, heat flows the other way.',
      },
    },
    compute: f.heatFlow,
    examples: [{ args: [thermalConductance(5), celsius(80), celsius(20)], expected: 300, note: 'Різниця 60 °C крізь 5 Вт/К' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.energy-from-power',
    law: 'power',
    title: { uk: 'Енергія від нагрівача', en: 'Energy from a heater' },
    latex: 'E = P \\cdot t',
    plain: 'E = P · t',
    argSymbols: ['P', 't'],
    resultSymbol: 'E',
    variables: {
      E: { name: { uk: 'виділена енергія', en: 'energy delivered' }, unit: 'J' },
      P: { name: { uk: 'потужність нагрівача', en: 'heater power' }, unit: 'W' },
      t: { name: { uk: 'час роботи', en: 'operating time' }, unit: 's' },
    },
    curriculum: [
      { program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Механічна робота. Потужність.' },
      { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Робота й потужність електричного струму. Закон Джоуля–Ленца.' },
      { program: 'ua-2017', grade: 7, depth: 'quantitative', quote: 'Механічна робота. Потужність.' },
      { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Робота й потужність електричного струму. Закон Джоуля—Ленца.' },
    ],
    explanation: {
      novice: {
        uk: 'Поки нагрівач увімкнений, він щосекунди додає воді певну порцію енергії. Розмір цієї порції — і є потужність.',
        en: 'While the heater is on, every second it adds a fixed portion of energy. The size of that portion is the power.',
      },
      school: { uk: 'Нагрівач потужністю 2000 Вт щосекунди виділяє 2000 Дж теплоти.', en: 'A 2000 W heater releases 2000 J of heat every second.' },
    },
    compute: f.energyFromPower,
    examples: [{ args: [watts(2000), seconds(60)], expected: 120_000, note: 'Чайник 2 кВт за хвилину' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.energy-balance',
    law: 'energy-conservation',
    title: { uk: 'Баланс енергії тіла', en: 'Energy balance of a body' },
    latex: '\\Delta U = Q_{in} - Q_{out}',
    plain: 'ΔU = Q_in − Q_out',
    argSymbols: ['Q_in', 'Q_out'],
    resultSymbol: 'ΔU',
    variables: {
      ΔU: { name: { uk: 'зміна внутрішньої енергії', en: 'change of internal energy' }, unit: 'J' },
      Q_in: { name: { uk: 'отримана теплота', en: 'heat received' }, unit: 'J' },
      Q_out: { name: { uk: 'віддана теплота', en: 'heat given away' }, unit: 'J' },
    },
    curriculum: [
      { program: 'ua-nus-2023-holovko', grade: 8, depth: 'qualitative', quote: 'Внутрішня енергія та способи її зміни.' },
      { program: 'ua-2017', grade: 8, depth: 'qualitative', quote: 'Внутрішня енергія. Способи зміни внутрішньої енергії тіла.' },
    ],
    explanation: {
      novice: {
        uk: 'Скільки теплоти прийшло, мінус скільки пішло, — стільки й залишилося в тілі.',
        en: 'Heat that came in, minus heat that went out, is what stayed in the body.',
      },
      school: {
        uk: 'Як із банківським рахунком: скільки надійшло мінус скільки витратили — на стільки змінився залишок.',
        en: 'Like a bank account: money in minus money out is how much the balance changed.',
      },
    },
    compute: f.energyBalance,
    examples: [{ args: [joules(5000), joules(1200)], expected: 3800, note: 'Отримало 5 кДж, віддало 1,2 кДж' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.time-constant',
    law: 'newton-cooling',
    title: { uk: 'Стала часу охолодження', en: 'Cooling time constant' },
    latex: '\\tau = \\dfrac{C}{G}',
    plain: 'τ = C / G',
    argSymbols: ['C', 'G'],
    resultSymbol: 'τ',
    variables: {
      τ: { name: { uk: 'стала часу', en: 'time constant' }, unit: 's' },
      C: { name: { uk: 'теплоємність тіла', en: 'heat capacity of the body' }, unit: 'J/K' },
      G: { name: { uk: 'теплова провідність', en: 'thermal conductance' }, unit: 'W/K' },
    },
    curriculum: [],
    beyondCurriculum: { uk: 'Поза шкільною програмою.', en: 'Beyond the school curriculum.' },
    explanation: {
      school: {
        uk: 'За час τ різниця з кімнатною температурою зменшується приблизно в 2,7 раза. Велике тіло з поганою тепловіддачею (термос) холоне довго.',
        en: 'In time τ the difference from room temperature shrinks about 2.7 times. A large body with poor heat transfer (a thermos) cools slowly.',
      },
    },
    compute: f.timeConstant,
    examples: [{ args: [heatCapacity(8362), thermalConductance(5)], expected: 1672.4, note: '2 кг води, G = 5 Вт/К → ≈ 28 хвилин' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.newton-cooling',
    law: 'newton-cooling',
    title: { uk: 'Крива охолодження', en: "Newton's cooling curve" },
    latex: 'T(t) = T_{env} + (T_0 - T_{env}) \\cdot e^{-t/\\tau}',
    plain: 'T(t) = T_env + (T₀ − T_env) · e^(−t/τ)',
    argSymbols: ['T₀', 'T_env', 'τ', 't'],
    resultSymbol: 'T(t)',
    variables: {
      'T(t)': { name: { uk: 'температура в момент t', en: 'temperature at time t' }, unit: 'K' },
      'T₀': { name: { uk: 'початкова температура', en: 'initial temperature' }, unit: 'K' },
      T_env: { name: { uk: 'температура середовища', en: 'temperature of the surroundings' }, unit: 'K' },
      τ: { name: { uk: 'стала часу', en: 'time constant' }, unit: 's' },
      t: { name: { uk: 'час', en: 'time' }, unit: 's' },
    },
    curriculum: [],
    beyondCurriculum: { uk: 'Поза шкільною програмою; теоретична крива поруч із графіком симуляції.', en: 'Beyond the school curriculum; shown as the theory curve next to the simulation.' },
    explanation: {
      school: {
        uk: 'Гарячий чай спершу холоне швидко, а потім дедалі повільніше, плавно наближаючись до кімнатної температури.',
        en: 'Hot tea cools quickly at first, then ever more slowly, smoothly approaching room temperature.',
      },
    },
    compute: f.newtonCooling,
    examples: [
      { args: [celsius(90), celsius(20), seconds(600), seconds(600)], expected: 318.9015608820009, note: 'Чай 90 °C у кімнаті 20 °C, через одну τ → ≈ 45,8 °C' },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
];
