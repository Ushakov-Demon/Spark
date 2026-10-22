import { defineFormula, type CurriculumRef, type FormulaSpec } from '../../knowledge/types.js';
import * as f from './formulas.js';

/**
 * Human-facing catalog of the mechanics formulas (see thermal/catalog.ts for the rules).
 * Curriculum quotes checked against the programme PDFs on 2026-10-20 (grade 7 in both).
 */
const UA_DENSITY: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Густина речовини.' },
  { program: 'ua-2017', grade: 7, depth: 'quantitative', quote: 'Маса тіла. Густина речовини.' },
  { program: 'ua-2017', grade: 7, depth: 'quantitative', quote: 'Визначення густини речовини (твердих тіл і рідин).' },
];
const UA_WEIGHT: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Вага тіла.' },
  { program: 'ua-2017', grade: 7, depth: 'quantitative', quote: 'Сила тяжіння. Вага тіла.' },
];
const UA_ARCHIMEDES: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Закон Архімеда.' },
  { program: 'ua-2017', grade: 7, depth: 'quantitative', quote: 'Виштовхувальна сила в рідинах і газах. Закон Архімеда.' },
];
const UA_FLOATING: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 7, depth: 'qualitative', quote: 'Умови плавання у воді.' },
  { program: 'ua-2017', grade: 7, depth: 'qualitative', quote: 'З’ясування умов плавання тіла.' },
];

const UA_HOOKE: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Закон Гука.' }];
const UA_FRICTION: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Коефіцієнт тертя ковзання.' }];
const UA_PRESSURE: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'Тиск твердих тіл на поверхню.' }];

export const MECHANICS_FORMULAS: readonly FormulaSpec[] = [
  defineFormula({
    id: 'mechanics.density',
    law: 'density',
    title: { uk: 'Густина речовини', en: 'Density' },
    latex: '\\rho = \\dfrac{m}{V}',
    plain: 'ρ = m / V',
    argSymbols: ['m', 'V'],
    resultSymbol: 'ρ',
    variables: {
      ρ: { name: { uk: 'густина', en: 'density' }, unit: 'kg/m³' },
      m: { name: { uk: 'маса тіла', en: 'mass of the body' }, unit: 'kg' },
      V: { name: { uk: 'об’єм тіла', en: 'volume of the body' }, unit: 'm³', meaning: { school: { uk: 'для тіла неправильної форми — на скільки піднялася вода в мензурці', en: 'for an odd-shaped body — how much the water rose in the measuring cylinder' } } },
    },
    curriculum: UA_DENSITY,
    explanation: {
      novice: { uk: 'Зважуємо тіло й дізнаємося, скільки місця воно займає. Ділимо одне на друге — і знаємо, з чого воно може бути зроблене.', en: 'Weigh the body and find how much room it takes. Divide one by the other — and you know what it may be made of.' },
      school: { uk: 'Масу знаходимо терезами, об’єм тіла неправильної форми — мензуркою: на скільки піднялася вода, такий і об’єм тіла. ρ = m/V; за таблицею густин можна впізнати речовину.', en: 'The mass comes from the scales, the volume of an odd-shaped body from a measuring cylinder: the rise of the water is the volume of the body. ρ = m/V; a table of densities then tells the substance.' },
    },
    compute: f.density,
    examples: [{ args: [0.157, 0.00002], expected: 7850, note: '157 g in 20 mL — steel or iron' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'mechanics.weight',
    law: 'weight',
    title: { uk: 'Вага тіла', en: 'Weight' },
    latex: 'P = m \\cdot g',
    plain: 'P = m · g',
    argSymbols: ['m', 'g'],
    resultSymbol: 'P',
    variables: {
      P: { name: { uk: 'вага', en: 'weight' }, unit: 'N' },
      m: { name: { uk: 'маса', en: 'mass' }, unit: 'kg' },
      g: { name: { uk: 'прискорення вільного падіння', en: 'gravitational acceleration' }, unit: 'N/kg' },
    },
    curriculum: UA_WEIGHT,
    explanation: {
      novice: { uk: 'Що більша маса, то сильніше тіло тягне динамометр донизу.', en: 'The larger the mass, the harder the body pulls the dynamometer down.' },
      school: { uk: 'Тіло масою 1 кг, що спочиває, тягне підвіс із силою ≈ 9,8 Н: P = m·g.', en: 'A 1 kg body at rest pulls on its hook with ≈ 9.8 N: P = m·g.' },
    },
    compute: f.weight,
    examples: [{ args: [0.1, 9.80665], expected: 0.980665, note: '100 g on a dynamometer' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'mechanics.buoyant-force',
    law: 'archimedes',
    title: { uk: 'Виштовхувальна (архімедова) сила', en: 'Buoyant force' },
    latex: 'F_A = \\rho_{р} \\cdot g \\cdot V_{зан}',
    plain: 'F_A = ρ_рідини · g · V_зануреної частини',
    argSymbols: ['ρ', 'g', 'V'],
    resultSymbol: 'F_A',
    variables: {
      F_A: { name: { uk: 'архімедова сила', en: 'buoyant force' }, unit: 'N' },
      ρ: { name: { uk: 'густина рідини', en: 'density of the liquid' }, unit: 'kg/m³' },
      g: { name: { uk: 'прискорення вільного падіння', en: 'gravitational acceleration' }, unit: 'N/kg' },
      V: { name: { uk: 'об’єм зануреної частини тіла', en: 'volume of the submerged part' }, unit: 'm³' },
    },
    curriculum: UA_ARCHIMEDES,
    explanation: {
      novice: { uk: 'У воді тіло стає «легшим»: вода підштовхує його вгору. Що густіша рідина, то сильніше.', en: 'In water a body gets “lighter”: the water pushes it up. The denser the liquid, the stronger.' },
      school: { uk: 'Динамометр у воді показує менше, ніж у повітрі: P′ = P − F_A. Сила F_A дорівнює вазі води в об’ємі зануреної частини тіла.', en: 'In water a dynamometer reads less than in air: P′ = P − F_A. F_A equals the weight of the water in the volume of the submerged part.' },
    },
    compute: f.buoyantForce,
    examples: [{ args: [1000, 9.80665, 0.00002], expected: 0.196133, note: '20 mL fully in water' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'mechanics.submerged-share',
    law: 'archimedes',
    title: { uk: 'Умова плавання: яка частина тіла під водою', en: 'Floating: the share of the body under the surface' },
    latex: '\\dfrac{V_{зан}}{V} = \\dfrac{\\rho_{т}}{\\rho_{р}}',
    plain: 'V_зан / V = ρ_тіла / ρ_рідини (якщо ρ_тіла < ρ_рідини; інакше тіло тоне)',
    argSymbols: ['ρ_т', 'ρ_р'],
    resultSymbol: 'частка',
    variables: {
      частка: { name: { uk: 'частка тіла під водою', en: 'share under the surface' }, unit: '' },
      ρ_т: { name: { uk: 'густина тіла', en: 'density of the body' }, unit: 'kg/m³' },
      ρ_р: { name: { uk: 'густина рідини', en: 'density of the liquid' }, unit: 'kg/m³' },
    },
    curriculum: UA_FLOATING,
    explanation: {
      novice: { uk: 'Що легше тіло порівняно з водою, то більша його частина стирчить над водою. Важче за воду — тоне.', en: 'The lighter a body is compared with water, the more of it sticks out. Denser than water — it sinks.' },
      school: { uk: 'Тіло плаває, коли архімедова сила зрівнюється з його вагою: ρ_р·g·V_зан = ρ_т·g·V, звідси V_зан/V = ρ_т/ρ_р. Лід (917 кг/м³) у воді занурений приблизно на 9/10.', en: 'A body floats when the buoyant force equals its weight: ρ_l·g·V_sub = ρ_b·g·V, hence V_sub/V = ρ_b/ρ_l. Ice (917 kg/m³) sits about 9/10 under water.' },
    },
    compute: f.submergedShare,
    examples: [{ args: [917, 1000], expected: 0.917, note: 'ice in water' }, { args: [7850, 1000], expected: 1, note: 'steel sinks' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'mechanics.hooke',
    law: 'hooke',
    title: { uk: 'Сила пружності (закон Гука)', en: 'Elastic force (Hooke’s law)' },
    latex: 'F_{пруж} = k \\cdot x',
    plain: 'F = k · x',
    argSymbols: ['k', 'x'],
    resultSymbol: 'F',
    variables: {
      F: { name: { uk: 'сила пружності', en: 'elastic force' }, unit: 'N' },
      k: { name: { uk: 'жорсткість', en: 'stiffness' }, unit: 'N/m' },
      x: { name: { uk: 'видовження', en: 'extension' }, unit: 'm', meaning: { school: { uk: 'на скільки тіло розтягнулося: x = l − l₀', en: 'how far the body stretched: x = l − l₀' } } },
    },
    curriculum: UA_HOOKE,
    explanation: {
      novice: { uk: 'Що сильніше тягнеш пружину, то довшою вона стає — і тягне назад так само сильно.', en: 'The harder you pull a spring, the longer it gets — and it pulls back just as hard.' },
      school: { uk: 'Поки деформація пружна, видовження пропорційне силі: удвічі більший вантаж — удвічі більше видовження. Відношення F/x — жорсткість k.', en: 'While the deformation is elastic, the extension is proportional to the force: twice the load, twice the extension. The ratio F/x is the stiffness k.' },
    },
    compute: f.elasticForce,
    examples: [{ args: [25, 0.04], expected: 1, note: 'a 25 N/m spring stretched by 4 cm' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'mechanics.friction',
    law: 'friction',
    title: { uk: 'Сила тертя ковзання', en: 'Sliding friction' },
    latex: 'F_{тер} = \\mu \\cdot N',
    plain: 'F = μ · N',
    argSymbols: ['μ', 'N'],
    resultSymbol: 'F',
    variables: {
      F: { name: { uk: 'сила тертя ковзання', en: 'sliding friction' }, unit: 'N' },
      μ: { name: { uk: 'коефіцієнт тертя ковзання', en: 'coefficient of sliding friction' }, unit: '' },
      N: { name: { uk: 'сила нормальної реакції опори', en: 'normal force' }, unit: 'N', meaning: { school: { uk: 'на горизонтальній опорі дорівнює вазі тіла', en: 'on a horizontal support it equals the weight of the body' } } },
    },
    curriculum: UA_FRICTION,
    explanation: {
      novice: { uk: 'Що важчий брусок, то важче тягти його по дошці.', en: 'The heavier the block, the harder it is to pull along the board.' },
      school: { uk: 'Коли брусок рівномірно тягнуть динамометром, той показує силу тертя. Вона пропорційна силі, з якою брусок тисне на опору: F = μ·N. Коефіцієнт μ залежить від матеріалів і обробки поверхонь.', en: 'When the block is pulled at a steady speed, the dynamometer shows the friction. It is proportional to how hard the block presses on its support: F = μ·N. The coefficient μ depends on the materials and the finish of the surfaces.' },
    },
    compute: f.slidingFriction,
    examples: [{ args: [0.25, 2], expected: 0.5, note: 'wood on wood, 2 N of load' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'mechanics.pressure',
    law: 'pressure',
    title: { uk: 'Тиск', en: 'Pressure' },
    latex: 'p = \\dfrac{F}{S}',
    plain: 'p = F / S',
    argSymbols: ['F', 'S'],
    resultSymbol: 'p',
    variables: {
      p: { name: { uk: 'тиск', en: 'pressure' }, unit: 'Pa' },
      F: { name: { uk: 'сила тиску', en: 'force' }, unit: 'N', meaning: { school: { uk: 'для тіла на горизонтальній опорі — його вага', en: 'for a body on a horizontal support — its weight' } } },
      S: { name: { uk: 'площа опори', en: 'area of support' }, unit: 'm²' },
    },
    curriculum: UA_PRESSURE,
    explanation: {
      novice: { uk: 'Та сама вага на меншій площі тисне сильніше — тому гострий ніж ріже, а лижі не провалюються.', en: 'The same weight on a smaller area presses harder — that is why a sharp knife cuts and skis do not sink.' },
      school: { uk: 'Тиск — сила, що припадає на кожен квадратний метр опори: p = F/S. Брусок, поставлений на меншу грань, тисне сильніше, хоча його вага та сама.', en: 'Pressure is the force on each square metre of support: p = F/S. A block stood on its smaller face presses harder, though its weight is the same.' },
    },
    compute: f.pressure,
    examples: [{ args: [1.4, 0.0072], expected: 194.44444444444446, note: 'a 1.4 N block on a 12 × 6 cm face' }],
    textSource: 'spark',
    reviewed: false,
  }),
];
