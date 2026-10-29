import { defineFormula, type CurriculumRef, type FormulaSpec } from '../../knowledge/types.js';
import * as f from './formulas.js';

/**
 * Human-facing catalog of the electrical formulas (see thermal/catalog.ts for the rules).
 * Curriculum quotes checked against the programme PDFs on 2026-10-12.
 */
const UA_RESISTANCE: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Залежність опору провідника від його довжини, площі перерізу та матеріалу.' },
  { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Електричний опір. Залежність опору провідника від його довжини, площі перерізу та матеріалу.' },
];
const UA_TEMPERATURE: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-kreminskyi', grade: 9, depth: 'quantitative', quote: 'Електричний струм у металах. Залежність електричного опору металу від температури, температурний коефіцієнт опору.' },
];
const UA_OHM: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Закон Ома для ділянки кола.' },
  { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Закон Ома для ділянки кола.' },
];
const UA_CONNECTIONS: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Послідовне й паралельне з’єднання провідників та джерел струму.' }];
const UA_POWER: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Робота й потужність електричного струму.' }];
const UA_JOULE: readonly CurriculumRef[] = [
  { program: 'ua-nus-2023-holovko', grade: 8, depth: 'quantitative', quote: 'Робота й потужність електричного струму. Закон Джоуля–Ленца.' },
  { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Робота й потужність електричного струму. Закон Джоуля—Ленца.' },
];
const UA_FARADAY: readonly CurriculumRef[] = [
  { program: 'ua-2017', grade: 8, depth: 'quantitative', quote: 'Природа електричного струму в розчинах і розплавах електролітах. Закон Фарадея для електролізу.' },
  { program: 'ua-nus-2023-holovko', grade: 8, depth: 'qualitative', quote: 'Природа електричного струму в різних середовищах.' },
];

const UA_INDUCTION: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-kreminskyi', grade: 9, depth: 'quantitative', quote: 'Явище електромагнітної індукції.' }];
const UA_ELECTROMAGNET: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-kreminskyi', grade: 9, depth: 'quantitative', quote: 'Магнітне поле провідника зі струмом. … Індукція магнітного поля. … Електромагніти.' }];

export const ELECTRICAL_FORMULAS: readonly FormulaSpec[] = [
  defineFormula({
    id: 'electrical.resistance-temperature',
    law: 'resistance',
    title: { uk: 'Залежність опору металу від температури', en: 'How a metal’s resistance depends on temperature' },
    latex: 'R = R_0\\,(1 + \\alpha\\,\\Delta t)',
    plain: 'R = R₀·(1 + α·Δt)',
    argSymbols: ['R₀', 'α', 'Δt'],
    resultSymbol: 'R',
    variables: {
      R: { name: { uk: 'опір провідника після нагрівання', en: 'resistance of the conductor when warmed' }, unit: 'Ω' },
      'R₀': { name: { uk: 'опір за початкової температури', en: 'resistance at the starting temperature' }, unit: 'Ω' },
      α: { name: { uk: 'температурний коефіцієнт опору', en: 'temperature coefficient of resistance' }, unit: '1/K', meaning: { school: { uk: 'на яку частку зростає опір, коли провідник нагрівається на 1 °C; для міді ≈ 0,0039', en: 'by what share the resistance grows when the conductor warms by 1 °C; for copper ≈ 0.0039' } } },
      Δt: { name: { uk: 'на скільки нагрівся провідник', en: 'how much the conductor warmed' }, unit: '°C' },
    },
    curriculum: UA_TEMPERATURE,
    explanation: {
      novice: { uk: 'Що гарячіший метал, то сильніше він «заважає» струму: його опір росте.', en: 'The hotter a metal, the more it “gets in the way” of a current: its resistance grows.' },
      school: {
        uk: 'Опір металевого провідника зростає з температурою: R = R₀·(1 + α·Δt). Звідси температурний коефіцієнт α = (R − R₀) / (R₀·Δt) — на яку частку зростає опір на кожен градус.',
        en: 'The resistance of a metal conductor grows with temperature: R = R₀·(1 + α·Δt). Hence the temperature coefficient α = (R − R₀) / (R₀·Δt) — by what share the resistance grows per degree.',
      },
    },
    compute: f.resistanceAtTemperature,
    examples: [{ args: [10, 0.00393, 60], expected: 12.358, note: 'a 10 Ω copper coil warmed from 20 to 80 °C' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.cell-resistance',
    law: 'resistance',
    title: { uk: 'Опір рідини між електродами', en: 'Resistance of the liquid between the electrodes' },
    latex: 'R = \\frac{K}{\\kappa}, \\quad K = \\frac{L}{S}',
    plain: 'R = K / κ, K = L / S',
    argSymbols: ['K', 'κ'],
    resultSymbol: 'R',
    variables: {
      R: { name: { uk: 'опір', en: 'resistance' }, unit: 'Ω' },
      K: {
        name: { uk: 'стала комірки', en: 'cell constant' },
        unit: '1/m',
        meaning: { school: { uk: 'відстань між електродами L, поділена на їхню площу S: що далі пластини й що вони менші, то більший опір', en: 'the gap L between the electrodes divided by their area S: the farther apart and the smaller the plates, the larger the resistance' } },
      },
      κ: {
        name: { uk: 'питома електропровідність рідини', en: 'electrical conductivity of the liquid' },
        unit: 'S/m',
        meaning: { school: { uk: 'наскільки добре рідина проводить струм; залежить від того, скільки в ній йонів, і від температури', en: 'how well the liquid conducts; depends on how many ions it holds and on the temperature' } },
      },
    },
    curriculum: UA_RESISTANCE,
    explanation: {
      novice: {
        uk: 'Чиста вода майже не пропускає струм, а солона — добре: розчинена сіль дає заряджені частинки, які й переносять струм.',
        en: 'Pure water hardly lets current through, salt water does it well: dissolved salt gives charged particles that carry the current.',
      },
      school: {
        uk: 'Це та сама формула опору провідника R = ρ·L/S, тільки для рідини: ρ = 1/κ. Що довший шлях струму і що менша площа електродів, то більший опір.',
        en: 'It is the same conductor formula R = ρ·L/S, only for a liquid: ρ = 1/κ. The longer the path and the smaller the electrodes, the larger the resistance.',
      },
      expert: {
        uk: 'Модель плоского конденсатора без крайових ефектів; κ — з таблиці за складом рідини з лінійною температурною поправкою.',
        en: 'Parallel-plate model without fringe effects; κ from a table by composition with a linear temperature correction.',
      },
    },
    compute: f.cellResistance,
    examples: [{ args: [30, 5], expected: 6, note: 'Пластини 2×5 см на відстані 3 см у морській воді (κ ≈ 5 См/м)' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.cell-current',
    law: 'ohm',
    title: { uk: 'Сила струму в рідині (закон Ома)', en: 'Current through the liquid (Ohm’s law)' },
    latex: 'I = \\frac{U - U_р}{R + r}',
    plain: 'I = (U − Uр) / (R + r)',
    argSymbols: ['U', 'Uр', 'R', 'r'],
    resultSymbol: 'I',
    variables: {
      I: { name: { uk: 'сила струму', en: 'current' }, unit: 'A' },
      U: { name: { uk: 'напруга джерела', en: 'source voltage' }, unit: 'V' },
      Uр: {
        name: { uk: 'напруга розкладу', en: 'decomposition voltage' },
        unit: 'V',
        meaning: { school: { uk: 'мінімальна напруга, з якої струм починає розкладати рідину; нижче неї струму майже немає', en: 'the least voltage at which the current starts to split the liquid; below it there is almost no current' } },
      },
      R: { name: { uk: 'опір рідини', en: 'resistance of the liquid' }, unit: 'Ω' },
      r: { name: { uk: 'внутрішній опір джерела', en: 'internal resistance of the source' }, unit: 'Ω' },
    },
    curriculum: UA_OHM,
    explanation: {
      novice: {
        uk: 'Що більша напруга і що менший опір, то більший струм.',
        en: 'The higher the voltage and the lower the resistance, the larger the current.',
      },
      school: {
        uk: 'Закон Ома: I = U/R. У рідині частина напруги йде на те, щоб розкласти її на електродах (Uр), а ще частина «губиться» всередині батарейки (r). Тому струм рахуємо від того, що лишилося.',
        en: 'Ohm’s law: I = U/R. In a liquid part of the voltage goes into splitting it at the electrodes (U_d) and part is “lost” inside the battery (r), so the current is counted from what is left.',
      },
      expert: {
        uk: 'Uр — термодинамічний мінімум зі стандартних потенціалів; перенапруги на електродах не враховано, тож модель трохи завищує струм за малих напруг.',
        en: 'U_d is the thermodynamic minimum from standard potentials; electrode overpotentials are ignored, so the model somewhat overestimates the current at low voltages.',
      },
    },
    compute: f.cellCurrentOhm,
    examples: [{ args: [12, 2.19, 6, 0], expected: 1.635, note: '12 В на морську воду між пластинами (R = 6 Ом)' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.joule-power',
    law: 'joule-lenz',
    title: { uk: 'Теплова потужність струму (закон Джоуля–Ленца)', en: 'Heating power of a current (Joule–Lenz law)' },
    latex: 'P = I^2 \\cdot R',
    plain: 'P = I² · R',
    argSymbols: ['I', 'R'],
    resultSymbol: 'P',
    variables: {
      P: { name: { uk: 'теплова потужність', en: 'heating power' }, unit: 'W' },
      I: { name: { uk: 'сила струму', en: 'current' }, unit: 'A' },
      R: { name: { uk: 'опір', en: 'resistance' }, unit: 'Ω' },
    },
    curriculum: UA_JOULE,
    explanation: {
      novice: {
        uk: 'Струм нагріває все, крізь що проходить. Удвічі більший струм гріє вчетверо сильніше.',
        en: 'A current heats whatever it passes through. Twice the current heats four times as much.',
      },
      school: {
        uk: 'Закон Джоуля–Ленца: за час t виділяється теплота Q = I²·R·t. Саме так працюють кип’ятильники й електроплити.',
        en: 'The Joule–Lenz law: in time t the heat Q = I²·R·t is released. That is how immersion heaters and electric hobs work.',
      },
    },
    compute: f.joulePower,
    examples: [{ args: [1.635, 6], expected: 16.03935, note: 'Струм 1,635 А через морську воду з опором 6 Ом' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.faraday-moles',
    law: 'faraday-electrolysis',
    title: { uk: 'Скільки газу виділяє струм (закон Фарадея)', en: 'How much gas a current releases (Faraday’s law)' },
    latex: 'n = \\frac{q}{z \\cdot F}',
    plain: 'n = q / (z · F)',
    argSymbols: ['q', 'z'],
    resultSymbol: 'n',
    variables: {
      n: { name: { uk: 'кількість речовини газу', en: 'amount of gas' }, unit: 'mol' },
      q: { name: { uk: 'заряд, що пройшов через рідину', en: 'charge passed through the liquid' }, unit: 'C' },
      z: {
        name: { uk: 'кількість електронів на молекулу', en: 'electrons per molecule' },
        unit: '',
        meaning: { school: { uk: 'скільки електронів потрібно на одну молекулу газу: для водню й хлору — 2, для кисню — 4', en: 'electrons needed per gas molecule: 2 for hydrogen and chlorine, 4 for oxygen' } },
      },
      F: { name: { uk: 'стала Фарадея', en: 'Faraday constant' }, unit: 'C/mol', meaning: { school: { uk: '96 485 Кл — заряд одного моля електронів', en: '96 485 C — the charge of one mole of electrons' } } },
    },
    curriculum: UA_FARADAY,
    explanation: {
      novice: {
        uk: 'Що більше заряду пройшло крізь рідину, то більше газу виділилося на електродах.',
        en: 'The more charge passes through the liquid, the more gas forms at the electrodes.',
      },
      school: {
        uk: 'Закон Фарадея: маса речовини, що виділилася на електроді, пропорційна заряду q = I·t. Один моль водню потребує 2 моль електронів, тобто 2 × 96 485 Кл.',
        en: 'Faraday’s law: the mass released at an electrode is proportional to the charge q = I·t. One mole of hydrogen needs 2 moles of electrons, that is 2 × 96 485 C.',
      },
    },
    compute: f.faradayMoles,
    examples: [{ args: [96_485.33212, 2], expected: 0.5, note: 'Заряд одного моля електронів дає пів моля водню' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.ohm-resistance',
    law: 'ohm',
    title: { uk: 'Опір провідника (закон Ома для ділянки кола)', en: 'Resistance of a conductor (Ohm’s law for part of a circuit)' },
    latex: 'R = \\dfrac{U}{I}',
    plain: 'R = U / I',
    argSymbols: ['U', 'I'],
    resultSymbol: 'R',
    variables: {
      R: { name: { uk: 'опір провідника', en: 'resistance of the conductor' }, unit: 'Ω' },
      U: { name: { uk: 'напруга на провіднику', en: 'voltage across the conductor' }, unit: 'V', meaning: { school: { uk: 'її показує вольтметр, під’єднаний паралельно до провідника', en: 'shown by a voltmeter connected in parallel with the conductor' } } },
      I: { name: { uk: 'сила струму в провіднику', en: 'current in the conductor' }, unit: 'A', meaning: { school: { uk: 'її показує амперметр, увімкнений послідовно', en: 'shown by an ammeter connected in series' } } },
    },
    curriculum: UA_OHM,
    explanation: {
      novice: { uk: 'Поділи напругу на силу струму — і дізнаєшся, як сильно провідник «заважає» струму.', en: 'Divide the voltage by the current — and you know how much the conductor “holds back” the current.' },
      school: { uk: 'Закон Ома для ділянки кола: I = U / R, отже R = U / I. Для металевого провідника за сталої температури опір не залежить від напруги: удвічі більша напруга — удвічі більший струм.', en: 'Ohm’s law for part of a circuit: I = U / R, so R = U / I. For a metal conductor at a steady temperature the resistance does not depend on the voltage: twice the voltage, twice the current.' },
    },
    compute: f.resistanceFromReadings,
    examples: [{ args: [3, 0.6], expected: 5, note: '3 V and 0.6 A' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.series-voltage',
    law: 'series',
    title: { uk: 'Напруга за послідовного з’єднання', en: 'Voltage in series' },
    latex: 'U = U_1 + U_2',
    plain: 'U = U₁ + U₂',
    argSymbols: ['U₁', 'U₂'],
    resultSymbol: 'U',
    variables: {
      U: { name: { uk: 'загальна напруга', en: 'total voltage' }, unit: 'V' },
      'U₁': { name: { uk: 'напруга на першому провіднику', en: 'voltage across the first conductor' }, unit: 'V' },
      'U₂': { name: { uk: 'напруга на другому провіднику', en: 'voltage across the second conductor' }, unit: 'V' },
    },
    curriculum: UA_CONNECTIONS,
    explanation: {
      novice: { uk: 'Напруга джерела ділиться між провідниками, що стоять один за одним.', en: 'The source’s voltage is shared by conductors one after another.' },
      school: { uk: 'Струм у послідовному колі той самий, тож U₁ = I·R₁, U₂ = I·R₂: на більшому опорі — більша напруга, а разом — уся напруга: U = U₁ + U₂.', en: 'The current in a series circuit is the same, so U₁ = I·R₁, U₂ = I·R₂: more voltage across the larger resistance, and together the whole: U = U₁ + U₂.' },
    },
    compute: f.seriesVoltage,
    examples: [{ args: [1.4, 2.6], expected: 4, note: '1.4 V and 2.6 V' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.parallel-current',
    law: 'parallel',
    title: { uk: 'Сила струму за паралельного з’єднання', en: 'Current in parallel' },
    latex: 'I = I_1 + I_2',
    plain: 'I = I₁ + I₂',
    argSymbols: ['I₁', 'I₂'],
    resultSymbol: 'I',
    variables: {
      I: { name: { uk: 'сила струму в нерозгалуженій частині', en: 'current in the main line' }, unit: 'A' },
      'I₁': { name: { uk: 'струм у першій гілці', en: 'current in the first branch' }, unit: 'A' },
      'I₂': { name: { uk: 'струм у другій гілці', en: 'current in the second branch' }, unit: 'A' },
    },
    curriculum: UA_CONNECTIONS,
    explanation: {
      novice: { uk: 'Струм розгалужується, як вода в розвилці труб, і знову сходиться.', en: 'The current splits like water at a fork of pipes, and meets again.' },
      school: { uk: 'Напруга на гілках та сама, тож I₁ = U/R₁, I₂ = U/R₂: у гілці з меншим опором — більший струм, а разом — увесь струм: I = I₁ + I₂.', en: 'The voltage across the branches is the same, so I₁ = U/R₁, I₂ = U/R₂: more current in the branch of smaller resistance, and together the whole: I = I₁ + I₂.' },
    },
    compute: f.parallelCurrent,
    examples: [{ args: [0.95, 0.5], expected: 1.45, note: '0.95 A and 0.5 A' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.power',
    law: 'electric-power',
    title: { uk: 'Потужність споживача', en: 'Power of a consumer' },
    latex: 'P = U \\cdot I',
    plain: 'P = U · I',
    argSymbols: ['U', 'I'],
    resultSymbol: 'P',
    variables: {
      P: { name: { uk: 'потужність', en: 'power' }, unit: 'W' },
      U: { name: { uk: 'напруга на споживачі', en: 'voltage across the consumer' }, unit: 'V' },
      I: { name: { uk: 'сила струму в споживачі', en: 'current in the consumer' }, unit: 'A' },
    },
    curriculum: UA_POWER,
    explanation: {
      novice: { uk: 'Помнож покази вольтметра на покази амперметра — дізнаєшся, скільки ватів бере прилад.', en: 'Multiply the voltmeter by the ammeter — and you know how many watts the device takes.' },
      school: { uk: 'P = U·I. Для резистора I = U/R, тож P = U²/R: удвічі більша напруга — учетверо більша потужність.', en: 'P = U·I. For a resistor I = U/R, so P = U²/R: twice the voltage — four times the power.' },
    },
    compute: f.electricPower,
    examples: [{ args: [3, 0.6], expected: 1.8, note: '3 V and 0.6 A' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.compass-field',
    law: 'electromagnet',
    title: { uk: 'Поле за відхиленням компаса', en: 'A field from a compass’s turn' },
    latex: 'B = B_{\\text{З}}\\,\\operatorname{tg}\\theta',
    plain: 'B = B_З·tg θ',
    argSymbols: ['B_З', 'θ'],
    resultSymbol: 'B',
    variables: {
      B: { name: { uk: 'індукція поля електромагніта біля компаса', en: 'the electromagnet’s field at the compass' }, unit: 'T' },
      'B_З': { name: { uk: 'горизонтальна складова поля Землі', en: 'the horizontal part of the Earth’s field' }, unit: 'T' },
      'θ': { name: { uk: 'кут, на який повернулася стрілка', en: 'the angle the needle turned' }, unit: '°' },
    },
    curriculum: UA_ELECTROMAGNET,
    explanation: {
      novice: { uk: 'Земля тягне стрілку на північ, електромагніт — убік. Що сильніший електромагніт, то більше стрілка відхиляється.', en: 'The Earth pulls the needle north, the electromagnet sideways. The stronger the electromagnet, the farther the needle turns.' },
      school: {
        uk: 'Поле електромагніта B спрямоване впоперек горизонтальної складової поля Землі B_З; стрілка стає вздовж їхньої суми, тож tg θ = B / B_З. Поле Землі в Києві ≈ 19 мкТл (модель WMM-2025).',
        en: 'The electromagnet’s field B is across the Earth’s horizontal field B_E; the needle lines up with their sum, so tg θ = B / B_E. The Earth’s field in Kyiv ≈ 19 µT (the WMM-2025 model).',
      },
    },
    compute: f.fieldFromCompass,
    examples: [{ args: [19.4e-6, 32], expected: 12.123e-6, note: 'the needle turned 32° in Kyiv' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.induced-emf',
    law: 'electromagnetic-induction',
    title: { uk: 'ЕРС індукції', en: 'The induced EMF' },
    latex: '\\varepsilon = -N\\,\\dfrac{\\Delta\\Phi}{\\Delta t} = I\\,(R_\\text{к} + R_\\text{A})',
    plain: 'ε = −N·ΔΦ/Δt = I·(R_к + R_A)',
    argSymbols: ['I', 'R'],
    resultSymbol: 'ε',
    variables: {
      'ε': { name: { uk: 'ЕРС індукції', en: 'the induced EMF' }, unit: 'V' },
      I: { name: { uk: 'індукційний струм', en: 'the induced current' }, unit: 'A' },
      R: { name: { uk: 'опір кола: котушки й міліамперметра', en: 'the circuit’s resistance: the coil’s and the milliammeter’s' }, unit: 'Ω' },
    },
    curriculum: UA_INDUCTION,
    explanation: {
      novice: { uk: 'Що швидше рухаєш магніт, то сильніший струм у котушці.', en: 'The faster you move the magnet, the stronger the current in the coil.' },
      school: {
        uk: 'ЕРС індукції пропорційна швидкості зміни магнітного потоку й числу витків: ε = −N·ΔΦ/Δt. Струм, який вона жене колом, I = ε / R, — тож з показів міліамперметра ЕРС знаходять як ε = I·R.',
        en: 'The induced EMF is proportional to how fast the flux changes and to the number of turns: ε = −N·ΔΦ/Δt. The current it drives round the circuit is I = ε / R — so from the milliammeter the EMF is ε = I·R.',
      },
    },
    compute: f.emfFromCurrent,
    examples: [{ args: [0.024, 7.1], expected: 0.1704, note: '24 mA through a 6 Ω coil and a 1 Ω meter' }],
    textSource: 'spark',
    reviewed: false,
  }),
];
