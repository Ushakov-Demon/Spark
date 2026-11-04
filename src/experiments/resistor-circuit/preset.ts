import { localized, msg, t } from '../../knowledge/messages.js';
import { beaker, ch, ELECTRIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset, PresetControl, PresetValues } from '../../scenarios/presets.js';
import { LAB_RESISTOR, SET_RESISTORS } from './shared.js';
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { defineCard } from '../types.js';

/**
 * The circuit lab works' conditions: a resistor from the set and the source's steps. The resistor goes by its
 * number where its resistance is what the work finds. Every set of steps stays within the instruments with
 * every resistor: at most 6 V / 3.1 Ω ≈ 1.9 A (the ammeter takes 2 A), 6 V on the voltmeter (it takes 6 V);
 * each doubles a voltage of the set, for the power's «twice the voltage».
 */
const CIRCUIT_RESISTOR = (unknown: boolean): PresetControl => ({
  id: 'resistor',
  label: unknown ? msg('resistor-circuit-label') : msg('resistor-circuit-label-2'),
  kind: 'choice',
  options: SET_RESISTORS.map((r, k) => (unknown ? ch(String(r.value), `№ ${k + 1}`, `No. ${k + 1}`) : ch(String(r.value), `${r.value} Ом`, `${r.value} Ω`))),
  value: String(LAB_RESISTOR.value),
});
/** A voltage's number, with the language's decimal mark. */
const num = (x: number, l: Locale) => new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 3 }).format(x);
const VOLT_SETS = [[1.5, 3, 4.5], [1, 2, 3, 4], [2, 4, 6]] as const;
const CIRCUIT_VOLTS: PresetControl = {
  id: 'volts',
  label: msg('resistor-circuit-volts-label'),
  kind: 'choice',
  options: VOLT_SETS.map((set) => ch(set.join('-'), localized((l) => `${set.map((x) => num(x, l)).join(' · ')} ${t(l, 'unit-sym-V')}`))),
  value: '1.5-3-4.5',
};
const voltsOf = (v: PresetValues): number[] => String(v['volts']).split('-').map(Number);
/** «1,5, 3 і 4,5 В» / «1.5, 3 and 4.5 V». */
const voltsText = (volts: readonly number[], l: Locale) => {
  const n = volts.map((x) => num(x, l));
  return `${n.slice(0, -1).join(', ')} ${t(l, 'resistor-circuit-volts-text')} ${n[n.length - 1]} ${t(l, 'unit-sym-V')}`;
};

export const preset_conductor_resistance: Preset = varied(
  {
    id: 'conductor-resistance',
    ask: msg('resistor-circuit-conductor-resistance-ask'),
    grade: 8,
    topic: ELECTRIC,
    title: msg('resistor-circuit-conductor-resistance-title'),
    question: msg('resistor-circuit-conductor-resistance-question'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'circuit',
    plan: [1.5, 3, 4.5].map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: LAB_RESISTOR.value } }) as const),
    choices: [ch('same', msg('resistor-circuit-conductor-resistance-choices')), ch('grows', msg('resistor-circuit-conductor-resistance-choices-2')), ch('falls', msg('resistor-circuit-conductor-resistance-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['R:'],
    formulas: ['electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 6', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 6. Вимірювання опору провідника за допомогою амперметра й вольтметра.' }],
    expect: 'reached',
  },
  {
    controls: [CIRCUIT_RESISTOR(true), CIRCUIT_VOLTS],
    build: (v) => {
      const volts = voltsOf(v);
      return {
        question: msg('resistor-circuit-build-question', { volts: (l: Locale) => voltsText(volts, l) }),
        plan: volts.map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: Number(v['resistor']) } }) as const),
      };
    },
  },
);

export const preset_consumer_power: Preset = varied(
  {
    id: 'consumer-power',
    ask: msg('resistor-circuit-consumer-power-ask'),
    grade: 8,
    topic: ELECTRIC,
    title: msg('resistor-circuit-consumer-power-title'),
    question: msg('resistor-circuit-consumer-power-question'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'circuit',
    plan: [1.5, 3, 4.5].map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: LAB_RESISTOR.value, power: true } }) as const),
    choices: [ch('four', msg('resistor-circuit-consumer-power-choices')), ch('two', msg('resistor-circuit-consumer-power-choices-2')), ch('same', msg('resistor-circuit-consumer-power-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['P:'],
    formulas: ['electrical.power', 'electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 9', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 9. Вимірювання потужності споживача електроенергії.' }],
    expect: 'reached',
  },
  {
    controls: [CIRCUIT_RESISTOR(false), CIRCUIT_VOLTS],
    build: (v) => {
      const volts = voltsOf(v);
      return {
        question: msg('resistor-circuit-build-question-2', { volts: (l: Locale) => voltsText(volts, l) }),
        plan: volts.map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: Number(v['resistor']), power: true } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'circuit', setup: msg('resistor-circuit-setup'), presets: [preset_conductor_resistance, preset_consumer_power] });
