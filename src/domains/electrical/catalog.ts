import { msg } from '../../knowledge/messages.js';
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
    title: msg('formula-electrical-resistance-temperature'),
    latex: 'R = R_0\\,(1 + \\alpha\\,\\Delta t)',
    plain: 'R = R₀·(1 + α·Δt)',
    argSymbols: ['R₀', 'α', 'Δt'],
    resultSymbol: 'R',
    variables: {
      R: { name: msg('formula-electrical-resistance-temperature-r-name'), unit: 'Ω' },
      'R₀': { name: msg('formula-electrical-resistance-temperature-r-name-2'), unit: 'Ω' },
      α: { name: msg('formula-electrical-resistance-temperature-variables-name'), unit: '1/K', meaning: { school: msg('formula-electrical-resistance-temperature-meaning-school') } },
      Δt: { name: msg('formula-electrical-resistance-temperature-t-name'), unit: '°C' },
    },
    curriculum: UA_TEMPERATURE,
    explanation: {
      novice: msg('formula-electrical-resistance-temperature-explanation-novice'),
      school: msg('formula-electrical-resistance-temperature-explanation-school'),
    },
    compute: f.resistanceAtTemperature,
    examples: [{ args: [10, 0.00393, 60], expected: 12.358, note: 'a 10 Ω copper coil warmed from 20 to 80 °C' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.cell-resistance',
    law: 'resistance',
    title: msg('formula-electrical-cell-resistance'),
    latex: 'R = \\frac{K}{\\kappa}, \\quad K = \\frac{L}{S}',
    plain: 'R = K / κ, K = L / S',
    argSymbols: ['K', 'κ'],
    resultSymbol: 'R',
    variables: {
      R: { name: msg('formula-electrical-cell-resistance-r-name'), unit: 'Ω' },
      K: {
        name: msg('formula-electrical-cell-resistance-k-name'),
        unit: '1/m',
        meaning: { school: msg('formula-electrical-cell-resistance-meaning-school') },
      },
      κ: {
        name: msg('formula-electrical-cell-resistance-variables-name'),
        unit: 'S/m',
        meaning: { school: msg('formula-electrical-cell-resistance-meaning-school-2') },
      },
    },
    curriculum: UA_RESISTANCE,
    explanation: {
      novice: msg('formula-electrical-cell-resistance-explanation-novice'),
      school: msg('formula-electrical-cell-resistance-explanation-school'),
      expert: msg('formula-electrical-cell-resistance-explanation-expert'),
    },
    compute: f.cellResistance,
    examples: [{ args: [30, 5], expected: 6, note: 'Пластини 2×5 см на відстані 3 см у морській воді (κ ≈ 5 См/м)' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.cell-current',
    law: 'ohm',
    title: msg('formula-electrical-cell-current'),
    latex: 'I = \\frac{U - U_р}{R + r}',
    plain: 'I = (U − Uр) / (R + r)',
    argSymbols: ['U', 'Uр', 'R', 'r'],
    resultSymbol: 'I',
    variables: {
      I: { name: msg('formula-electrical-cell-current-i-name'), unit: 'A' },
      U: { name: msg('formula-electrical-cell-current-u-name'), unit: 'V' },
      Uр: {
        name: msg('formula-electrical-cell-current-u-name-2'),
        unit: 'V',
        meaning: { school: msg('formula-electrical-cell-current-meaning-school') },
      },
      R: { name: msg('formula-electrical-cell-current-r-name'), unit: 'Ω' },
      r: { name: msg('formula-electrical-cell-current-r-name-2'), unit: 'Ω' },
    },
    curriculum: UA_OHM,
    explanation: {
      novice: msg('formula-electrical-cell-current-explanation-novice'),
      school: msg('formula-electrical-cell-current-explanation-school'),
      expert: msg('formula-electrical-cell-current-explanation-expert'),
    },
    compute: f.cellCurrentOhm,
    examples: [{ args: [12, 2.19, 6, 0], expected: 1.635, note: '12 В на морську воду між пластинами (R = 6 Ом)' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.joule-power',
    law: 'joule-lenz',
    title: msg('formula-electrical-joule-power'),
    latex: 'P = I^2 \\cdot R',
    plain: 'P = I² · R',
    argSymbols: ['I', 'R'],
    resultSymbol: 'P',
    variables: {
      P: { name: msg('formula-electrical-joule-power-p-name'), unit: 'W' },
      I: { name: msg('formula-electrical-cell-current-i-name'), unit: 'A' },
      R: { name: msg('formula-electrical-cell-resistance-r-name'), unit: 'Ω' },
    },
    curriculum: UA_JOULE,
    explanation: {
      novice: msg('formula-electrical-joule-power-explanation-novice'),
      school: msg('formula-electrical-joule-power-explanation-school'),
    },
    compute: f.joulePower,
    examples: [{ args: [1.635, 6], expected: 16.03935, note: 'Струм 1,635 А через морську воду з опором 6 Ом' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.faraday-moles',
    law: 'faraday-electrolysis',
    title: msg('formula-electrical-faraday-moles'),
    latex: 'n = \\frac{q}{z \\cdot F}',
    plain: 'n = q / (z · F)',
    argSymbols: ['q', 'z'],
    resultSymbol: 'n',
    variables: {
      n: { name: msg('formula-electrical-faraday-moles-n-name'), unit: 'mol' },
      q: { name: msg('formula-electrical-faraday-moles-q-name'), unit: 'C' },
      z: {
        name: msg('formula-electrical-faraday-moles-z-name'),
        unit: '',
        meaning: { school: msg('formula-electrical-faraday-moles-meaning-school') },
      },
      F: { name: msg('formula-electrical-faraday-moles-f-name'), unit: 'C/mol', meaning: { school: msg('formula-electrical-faraday-moles-meaning-school-2') } },
    },
    curriculum: UA_FARADAY,
    explanation: {
      novice: msg('formula-electrical-faraday-moles-explanation-novice'),
      school: msg('formula-electrical-faraday-moles-explanation-school'),
    },
    compute: f.faradayMoles,
    examples: [{ args: [96_485.33212, 2], expected: 0.5, note: 'Заряд одного моля електронів дає пів моля водню' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.ohm-resistance',
    law: 'ohm',
    title: msg('formula-electrical-ohm-resistance'),
    latex: 'R = \\dfrac{U}{I}',
    plain: 'R = U / I',
    argSymbols: ['U', 'I'],
    resultSymbol: 'R',
    variables: {
      R: { name: msg('formula-electrical-ohm-resistance-r-name'), unit: 'Ω' },
      U: { name: msg('formula-electrical-ohm-resistance-u-name'), unit: 'V', meaning: { school: msg('formula-electrical-ohm-resistance-meaning-school') } },
      I: { name: msg('formula-electrical-ohm-resistance-i-name'), unit: 'A', meaning: { school: msg('formula-electrical-ohm-resistance-meaning-school-2') } },
    },
    curriculum: UA_OHM,
    explanation: {
      novice: msg('formula-electrical-ohm-resistance-explanation-novice'),
      school: msg('formula-electrical-ohm-resistance-explanation-school'),
    },
    compute: f.resistanceFromReadings,
    examples: [{ args: [3, 0.6], expected: 5, note: '3 V and 0.6 A' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.series-voltage',
    law: 'series',
    title: msg('formula-electrical-series-voltage'),
    latex: 'U = U_1 + U_2',
    plain: 'U = U₁ + U₂',
    argSymbols: ['U₁', 'U₂'],
    resultSymbol: 'U',
    variables: {
      U: { name: msg('formula-electrical-series-voltage-u-name'), unit: 'V' },
      'U₁': { name: msg('formula-electrical-series-voltage-u-name-2'), unit: 'V' },
      'U₂': { name: msg('formula-electrical-series-voltage-u-name-3'), unit: 'V' },
    },
    curriculum: UA_CONNECTIONS,
    explanation: {
      novice: msg('formula-electrical-series-voltage-explanation-novice'),
      school: msg('formula-electrical-series-voltage-explanation-school'),
    },
    compute: f.seriesVoltage,
    examples: [{ args: [1.4, 2.6], expected: 4, note: '1.4 V and 2.6 V' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.parallel-current',
    law: 'parallel',
    title: msg('formula-electrical-parallel-current'),
    latex: 'I = I_1 + I_2',
    plain: 'I = I₁ + I₂',
    argSymbols: ['I₁', 'I₂'],
    resultSymbol: 'I',
    variables: {
      I: { name: msg('formula-electrical-parallel-current-i-name'), unit: 'A' },
      'I₁': { name: msg('formula-electrical-parallel-current-i-name-2'), unit: 'A' },
      'I₂': { name: msg('formula-electrical-parallel-current-i-name-3'), unit: 'A' },
    },
    curriculum: UA_CONNECTIONS,
    explanation: {
      novice: msg('formula-electrical-parallel-current-explanation-novice'),
      school: msg('formula-electrical-parallel-current-explanation-school'),
    },
    compute: f.parallelCurrent,
    examples: [{ args: [0.95, 0.5], expected: 1.45, note: '0.95 A and 0.5 A' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.power',
    law: 'electric-power',
    title: msg('formula-electrical-power'),
    latex: 'P = U \\cdot I',
    plain: 'P = U · I',
    argSymbols: ['U', 'I'],
    resultSymbol: 'P',
    variables: {
      P: { name: msg('formula-electrical-power-p-name'), unit: 'W' },
      U: { name: msg('formula-electrical-power-u-name'), unit: 'V' },
      I: { name: msg('formula-electrical-power-i-name'), unit: 'A' },
    },
    curriculum: UA_POWER,
    explanation: {
      novice: msg('formula-electrical-power-explanation-novice'),
      school: msg('formula-electrical-power-explanation-school'),
    },
    compute: f.electricPower,
    examples: [{ args: [3, 0.6], expected: 1.8, note: '3 V and 0.6 A' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.compass-field',
    law: 'electromagnet',
    title: msg('formula-electrical-compass-field'),
    latex: 'B = B_{\\text{З}}\\,\\operatorname{tg}\\theta',
    plain: 'B = B_З·tg θ',
    argSymbols: ['B_З', 'θ'],
    resultSymbol: 'B',
    variables: {
      B: { name: msg('formula-electrical-compass-field-b-name'), unit: 'T' },
      'B_З': { name: msg('formula-electrical-compass-field-b-name-2'), unit: 'T' },
      'θ': { name: msg('formula-electrical-compass-field-variables-name'), unit: '°' },
    },
    curriculum: UA_ELECTROMAGNET,
    explanation: {
      novice: msg('formula-electrical-compass-field-explanation-novice'),
      school: msg('formula-electrical-compass-field-explanation-school'),
    },
    compute: f.fieldFromCompass,
    examples: [{ args: [19.4e-6, 32], expected: 12.123e-6, note: 'the needle turned 32° in Kyiv' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'electrical.induced-emf',
    law: 'electromagnetic-induction',
    title: msg('formula-electrical-induced-emf'),
    latex: '\\varepsilon = -N\\,\\dfrac{\\Delta\\Phi}{\\Delta t} = I\\,(R_\\text{к} + R_\\text{A})',
    plain: 'ε = −N·ΔΦ/Δt = I·(R_к + R_A)',
    argSymbols: ['I', 'R'],
    resultSymbol: 'ε',
    variables: {
      'ε': { name: msg('formula-electrical-induced-emf-variables-name'), unit: 'V' },
      I: { name: msg('formula-electrical-induced-emf-i-name'), unit: 'A' },
      R: { name: msg('formula-electrical-induced-emf-r-name'), unit: 'Ω' },
    },
    curriculum: UA_INDUCTION,
    explanation: {
      novice: msg('formula-electrical-induced-emf-explanation-novice'),
      school: msg('formula-electrical-induced-emf-explanation-school'),
    },
    compute: f.emfFromCurrent,
    examples: [{ args: [0.024, 7.1], expected: 0.1704, note: '24 mA through a 6 Ω coil and a 1 Ω meter' }],
    textSource: 'spark',
    reviewed: false,
  }),
];
