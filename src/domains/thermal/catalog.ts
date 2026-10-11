import { defineFormula, type FormulaSpec } from '../../knowledge/types.js';
import {
  celsius,
  heatCapacity,
  heatTransferCoeff,
  kilograms,
  meters,
  seconds,
  specificHeat,
  squareMeters,
  thermalConductance,
  thermalConductivity,
} from '../../core/units.js';
import * as f from './formulas.js';

/**
 * Human-facing catalog of the thermal formulas.
 *
 * Example answers were computed independently of the engine (by hand / a
 * separate script) and are re-checked by tests/knowledge. Texts are original
 * (source "spark") and still need a physics teacher's review (`reviewed: false`).
 */
export const THERMAL_FORMULAS: readonly FormulaSpec[] = [
  defineFormula({
    id: 'thermal.heat-for-temperature-change',
    title: { ru: 'Количество теплоты при нагревании и охлаждении', en: 'Heat for a temperature change' },
    latex: 'Q = c \\cdot m \\cdot \\Delta T',
    variables: {
      Q: { name: { ru: 'количество теплоты' }, unit: 'J' },
      c: { name: { ru: 'удельная теплоёмкость вещества' }, unit: 'J/(kg·K)' },
      m: { name: { ru: 'масса тела' }, unit: 'kg' },
      ΔT: { name: { ru: 'изменение температуры' }, unit: 'K' },
    },
    grade: 8,
    curriculum: 'Физика 8 класс: «Количество теплоты. Удельная теплоёмкость»',
    explanation: {
      ru: 'Чтобы нагреть тело, ему нужно передать энергию. Чем больше масса и чем сильнее хотим нагреть, тем больше энергии нужно. Удельная теплоёмкость показывает, сколько джоулей нужно, чтобы нагреть 1 кг вещества на 1 градус: воде — около 4200 Дж, меди — всего около 400 Дж.',
    },
    compute: f.heatForTemperatureChange,
    examples: [
      { args: [kilograms(0.5), specificHeat(897), 60], expected: 26_910, note: 'Нагреть алюминиевую кастрюлю 0,5 кг на 60 °C' },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.heat-capacity',
    title: { ru: 'Теплоёмкость тела', en: 'Heat capacity of a body' },
    latex: 'C = c \\cdot m',
    variables: {
      C: { name: { ru: 'теплоёмкость тела' }, unit: 'J/K' },
      c: { name: { ru: 'удельная теплоёмкость вещества' }, unit: 'J/(kg·K)' },
      m: { name: { ru: 'масса тела' }, unit: 'kg' },
    },
    grade: 8,
    curriculum: 'Следует из Q = cmΔT (8 класс); отдельной величиной вводится в старших классах',
    explanation: {
      ru: 'Сколько джоулей нужно, чтобы нагреть именно это тело на 1 градус. Ведро воды «тяжелее» нагреть, чем стакан, хотя вещество одно и то же.',
    },
    compute: f.heatCapacityOf,
    examples: [{ args: [kilograms(2), specificHeat(4181)], expected: 8362, note: '2 кг воды' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.equilibrium-temperature',
    title: { ru: 'Уравнение теплового баланса', en: 'Heat balance equation' },
    latex: '\\theta = \\dfrac{\\sum c_i m_i t_i}{\\sum c_i m_i}',
    variables: {
      θ: { name: { ru: 'установившаяся температура' }, unit: 'K' },
      c_i: { name: { ru: 'удельная теплоёмкость i-го тела' }, unit: 'J/(kg·K)' },
      m_i: { name: { ru: 'масса i-го тела' }, unit: 'kg' },
      t_i: { name: { ru: 'начальная температура i-го тела' }, unit: 'K' },
    },
    grade: 8,
    curriculum: 'Физика 8 класс: «Уравнение теплового баланса», лабораторная работа с калориметром',
    explanation: {
      ru: 'Если тела обмениваются теплом только друг с другом, сколько тепла отдали горячие, столько же получили холодные. Поэтому общая температура — это «среднее», где каждое тело весит столько, какова его теплоёмкость.',
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
        note: 'Медный цилиндр 0,5 кг при 100 °C в 0,2 кг воды при 20 °C → ≈ 35 °C',
      },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.conduction-conductance',
    title: { ru: 'Теплопроводность стержня (закон Фурье)', en: "Conductance of a rod (Fourier's law)" },
    latex: 'G = \\dfrac{k \\cdot A}{L}',
    variables: {
      G: { name: { ru: 'тепловая проводимость' }, unit: 'W/K' },
      k: { name: { ru: 'теплопроводность материала' }, unit: 'W/(m·K)' },
      A: { name: { ru: 'площадь сечения' }, unit: 'm²' },
      L: { name: { ru: 'длина' }, unit: 'm' },
    },
    grade: null,
    curriculum: 'Теплопроводность в 8 классе — только качественно; формула вне базовой программы',
    explanation: {
      ru: 'Тепло легче проходит через толстый и короткий стержень, чем через тонкий и длинный. Медь проводит тепло в сотни раз лучше стекла — поэтому металлическая ложка в горячем чае быстро нагревается.',
    },
    compute: f.conductionConductance,
    examples: [
      { args: [thermalConductivity(401), squareMeters(1e-4), meters(0.1)], expected: 0.401, note: 'Медный стержень 1 см² × 10 см' },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.convection-conductance',
    title: { ru: 'Теплоотдача поверхности (конвекция)', en: 'Convective conductance' },
    latex: 'G = h \\cdot A',
    variables: {
      G: { name: { ru: 'тепловая проводимость' }, unit: 'W/K' },
      h: { name: { ru: 'коэффициент теплоотдачи' }, unit: 'W/(m²·K)' },
      A: { name: { ru: 'площадь поверхности' }, unit: 'm²' },
    },
    grade: null,
    curriculum: 'Конвекция в 8 классе — только качественно; формула вне базовой программы',
    explanation: {
      ru: 'Чем больше поверхность, тем быстрее тело отдаёт тепло воздуху или воде. На ветру остываем быстрее, потому что движущийся воздух уносит тепло лучше неподвижного.',
    },
    compute: f.convectionConductance,
    examples: [{ args: [heatTransferCoeff(10), squareMeters(0.5)], expected: 5, note: 'Поверхность 0,5 м² в неподвижном воздухе' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.heat-flow',
    title: { ru: 'Тепловой поток', en: 'Heat flow' },
    latex: 'P = G \\cdot (T_a - T_b)',
    variables: {
      P: { name: { ru: 'мощность теплового потока' }, unit: 'W' },
      G: { name: { ru: 'тепловая проводимость' }, unit: 'W/K' },
      T_a: { name: { ru: 'температура первого тела' }, unit: 'K' },
      T_b: { name: { ru: 'температура второго тела' }, unit: 'K' },
    },
    grade: null,
    curriculum: 'Вне базовой программы; качественно — «тепло переходит от горячего к холодному» (8 класс)',
    explanation: {
      ru: 'Тепло всегда течёт от горячего к холодному, и тем быстрее, чем больше разница температур. Когда температуры сравнялись, поток прекращается.',
    },
    compute: f.heatFlow,
    examples: [
      { args: [thermalConductance(5), celsius(80), celsius(20)], expected: 300, note: 'Разница 60 °C через 5 Вт/К' },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.time-constant',
    title: { ru: 'Постоянная времени остывания', en: 'Cooling time constant' },
    latex: '\\tau = \\dfrac{C}{G}',
    variables: {
      τ: { name: { ru: 'постоянная времени' }, unit: 's' },
      C: { name: { ru: 'теплоёмкость тела' }, unit: 'J/K' },
      G: { name: { ru: 'тепловая проводимость' }, unit: 'W/K' },
    },
    grade: null,
    curriculum: 'Вне школьной программы (физика вузовского курса)',
    explanation: {
      ru: 'Показывает, за сколько секунд тело заметно остывает: за время τ разница с комнатной температурой уменьшается примерно в 2,7 раза. Большое тело с плохой теплоотдачей (термос) остывает долго.',
    },
    compute: f.timeConstant,
    examples: [{ args: [heatCapacity(8362), thermalConductance(5)], expected: 1672.4, note: '2 кг воды, G = 5 Вт/К → ≈ 28 минут' }],
    textSource: 'spark',
    reviewed: false,
  }),
  defineFormula({
    id: 'thermal.newton-cooling',
    title: { ru: 'Закон остывания Ньютона', en: "Newton's law of cooling" },
    latex: 'T(t) = T_{env} + (T_0 - T_{env}) \\cdot e^{-t/\\tau}',
    variables: {
      'T(t)': { name: { ru: 'температура в момент t' }, unit: 'K' },
      T_0: { name: { ru: 'начальная температура' }, unit: 'K' },
      T_env: { name: { ru: 'температура окружения' }, unit: 'K' },
      τ: { name: { ru: 'постоянная времени' }, unit: 's' },
      t: { name: { ru: 'время' }, unit: 's' },
    },
    grade: null,
    curriculum: 'Вне школьной программы; удобна как «теоретическая кривая» рядом с графиком симуляции',
    explanation: {
      ru: 'Горячий чай сначала остывает быстро, а потом всё медленнее: чем меньше разница с комнатой, тем слабее поток тепла. Получается плавная кривая, которая приближается к комнатной температуре.',
    },
    compute: f.newtonCooling,
    examples: [
      {
        args: [celsius(90), celsius(20), seconds(600), seconds(600)],
        expected: 318.9015608820009,
        note: 'Чай 90 °C в комнате 20 °C, через одну τ → ≈ 45,8 °C',
      },
    ],
    textSource: 'spark',
    reviewed: false,
  }),
];
