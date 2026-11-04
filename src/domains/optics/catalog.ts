import { msg } from '../../knowledge/messages.js';
import { defineFormula, type CurriculumRef, type FormulaSpec } from '../../knowledge/types.js';
import * as f from './formulas.js';

/**
 * Human-facing catalog of the photometry formulas (see thermal/catalog.ts for the rules).
 * Curriculum quote checked against the programme PDF on 2026-11-04 (grade 7, the introduction).
 */
const UA_MEASURING: readonly CurriculumRef[] = [{ program: 'ua-nus-2023-holovko', grade: 7, depth: 'quantitative', quote: 'вимірювання фізичних величин (маси, розмірів малих тіл, площ, відстаней, об’ємів, температури, освітленості)' }];

export const OPTICS_FORMULAS: readonly FormulaSpec[] = [
  defineFormula({
    id: 'optics.illuminance',
    law: 'illuminance',
    title: msg('formula-optics-illuminance'),
    latex: 'E = \\dfrac{\\Phi}{S}',
    plain: 'E = Φ / S',
    argSymbols: ['Φ', 'S'],
    resultSymbol: 'E',
    variables: {
      E: { name: msg('formula-optics-illuminance-e-name'), unit: 'lx' },
      Φ: { name: msg('formula-optics-illuminance-phi-name'), unit: 'lm' },
      S: { name: msg('formula-optics-illuminance-s-name'), unit: 'm²' },
    },
    curriculum: UA_MEASURING,
    explanation: {
      novice: msg('formula-optics-illuminance-explanation-novice'),
      school: msg('formula-optics-illuminance-explanation-school'),
    },
    compute: f.illuminance,
    examples: [{ args: [800, 0.5], expected: 1600, note: 'a 800 lm lamp’s whole light on half a square metre' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'optics.isotropic-intensity',
    law: 'luminous-intensity',
    title: msg('formula-optics-isotropic-intensity'),
    latex: 'I = \\dfrac{\\Phi}{4\\pi}',
    plain: 'I = Φ / 4π',
    argSymbols: ['Φ'],
    resultSymbol: 'I',
    variables: {
      I: { name: msg('formula-optics-isotropic-intensity-i-name'), unit: 'cd' },
      Φ: { name: msg('formula-optics-isotropic-intensity-phi-name'), unit: 'lm' },
    },
    curriculum: [],
    beyondCurriculum: msg('formula-optics-isotropic-intensity-beyond-curriculum'),
    explanation: {
      novice: msg('formula-optics-isotropic-intensity-explanation-novice'),
      school: msg('formula-optics-isotropic-intensity-explanation-school'),
    },
    compute: f.isotropicIntensity,
    examples: [{ args: [800], expected: 63.66197723675813, note: 'a lamp «like 60 W»' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'optics.point-illuminance',
    law: 'inverse-square-light',
    title: msg('formula-optics-point-illuminance'),
    latex: 'E = \\dfrac{I \\cos\\alpha}{r^2}',
    plain: 'E = I · cos α / r²',
    argSymbols: ['I', 'r', 'α'],
    resultSymbol: 'E',
    variables: {
      E: { name: msg('formula-optics-point-illuminance-e-name'), unit: 'lx' },
      I: { name: msg('formula-optics-point-illuminance-i-name'), unit: 'cd' },
      r: { name: msg('formula-optics-point-illuminance-r-name'), unit: 'm' },
      α: { name: msg('formula-optics-point-illuminance-alpha-name'), unit: 'rad' },
    },
    curriculum: [],
    beyondCurriculum: msg('formula-optics-point-illuminance-beyond-curriculum'),
    explanation: {
      novice: msg('formula-optics-point-illuminance-explanation-novice'),
      school: msg('formula-optics-point-illuminance-explanation-school'),
    },
    compute: f.pointIlluminance,
    examples: [
      { args: [63.66197723675813, 0.3, 0], expected: 707.355302630646, note: 'that lamp 30 cm above the sensor' },
      { args: [63.66197723675813, 0.3, 1.0471975511965976], expected: 353.67765131532303, note: 'the sensor tilted by 60°' },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'optics.luminous-flux',
    law: 'luminous-efficacy',
    title: msg('formula-optics-luminous-flux'),
    latex: '\\Phi = \\eta \\cdot P',
    plain: 'Φ = η · P',
    argSymbols: ['η', 'P'],
    resultSymbol: 'Φ',
    variables: {
      Φ: { name: msg('formula-optics-luminous-flux-phi-name'), unit: 'lm' },
      η: { name: msg('formula-optics-luminous-flux-eta-name'), unit: 'lm/W' },
      P: { name: msg('formula-optics-luminous-flux-p-name'), unit: 'W' },
    },
    curriculum: [],
    beyondCurriculum: msg('formula-optics-luminous-flux-beyond-curriculum'),
    explanation: {
      novice: msg('formula-optics-luminous-flux-explanation-novice'),
      school: msg('formula-optics-luminous-flux-explanation-school'),
    },
    compute: f.luminousFlux,
    examples: [{ args: [102, 8], expected: 816, note: 'an 8 W LED lamp' }],
    textSource: 'spark',
    reviewed: false,
  }),
];
