import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, ELECTRIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset, PresetControl, PresetValues } from '../../scenarios/presets.js';
import { AMMETER, LAB_RESISTOR, SET_RESISTORS, VOLTMETER } from './bench.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

/**
 * The circuit lab works' conditions: a resistor from the set and the source's steps. The resistor goes by its
 * number where its resistance is what the work finds. Every set of steps stays within the instruments with
 * every resistor: at most 6 V / 3.1 Ω ≈ 1.9 A (the ammeter takes 2 A), 6 V on the voltmeter (it takes 6 V);
 * each doubles a voltage of the set, for the power's «twice the voltage».
 */
const CIRCUIT_RESISTOR = (unknown: boolean): PresetControl => ({
  id: 'resistor',
  label: unknown ? { uk: 'Резистор (опір невідомий — його й знайдемо)', en: 'Resistor (its resistance unknown — that is what we find)' } : { uk: 'Резистор із набору', en: 'Resistor from the set' },
  kind: 'choice',
  options: SET_RESISTORS.map((r, k) => (unknown ? ch(String(r.value), `№ ${k + 1}`, `No. ${k + 1}`) : ch(String(r.value), `${r.value} Ом`, `${r.value} Ω`))),
  value: String(LAB_RESISTOR.value),
});
const VOLT_SETS = [[1.5, 3, 4.5], [1, 2, 3, 4], [2, 4, 6]] as const;
const CIRCUIT_VOLTS: PresetControl = {
  id: 'volts',
  label: { uk: 'Напруга джерела', en: 'Source voltage' },
  kind: 'choice',
  options: VOLT_SETS.map((set) => ch(set.join('-'), `${set.map((x) => String(x).replace('.', ',')).join(' · ')} В`, `${set.join(' · ')} V`)),
  value: '1.5-3-4.5',
};
const voltsOf = (v: PresetValues): number[] => String(v['volts']).split('-').map(Number);
/** «1,5, 3 і 4,5 В» / «1.5, 3 and 4.5 V». */
const voltsText = (volts: readonly number[], l: 'uk' | 'en') => {
  const n = volts.map((x) => (l === 'uk' ? String(x).replace('.', ',') : String(x)));
  return `${n.slice(0, -1).join(', ')} ${l === 'uk' ? 'і' : 'and'} ${n[n.length - 1]} ${l === 'uk' ? 'В' : 'V'}`;
};

export const preset_conductor_resistance: Preset = varied(
  {
    id: 'conductor-resistance',
    ask: { uk: 'Чи зміниться опір провідника, якщо збільшити напругу на ньому?', en: 'Will the conductor’s resistance change if the voltage across it is raised?' },
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Вимірюємо опір провідника', en: 'Measuring the resistance of a conductor' },
    question: {
      uk: 'Зберемо коло: джерело струму, ключ, резистор і амперметр — послідовно, а вольтметр — паралельно до резистора. Ставитимемо на джерелі 1,5, 3 і 4,5 В і щоразу записуватимемо покази амперметра й вольтметра, а тоді знайдемо опір R = U / I. Чи зміниться опір провідника, якщо збільшити напругу на ньому?',
      en: 'We build a circuit: a source, a key, a resistor and an ammeter in series, and a voltmeter across the resistor. We set the source to 1.5, 3 and 4.5 V, write down the ammeter and the voltmeter each time, and find the resistance R = U / I. Will the conductor’s resistance change if the voltage across it is raised?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'circuit',
    plan: [1.5, 3, 4.5].map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: LAB_RESISTOR.value } }) as const),
    choices: [ch('same', 'Ні — опір лишиться тим самим, зросте струм', 'No — the resistance stays, the current grows'), ch('grows', 'Так, зросте разом із напругою', 'Yes, it grows with the voltage'), ch('falls', 'Так, зменшиться', 'Yes, it falls')],
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
        question: {
          uk: `Зберемо коло: джерело струму, ключ, резистор і амперметр — послідовно, а вольтметр — паралельно до резистора. Ставитимемо на джерелі ${voltsText(volts, 'uk')} і щоразу записуватимемо покази амперметра й вольтметра, а тоді знайдемо опір R = U / I. Чи зміниться опір провідника, якщо збільшити напругу на ньому?`,
          en: `We build a circuit: a source, a key, a resistor and an ammeter in series, and a voltmeter across the resistor. We set the source to ${voltsText(volts, 'en')}, write down the ammeter and the voltmeter each time, and find the resistance R = U / I. Will the conductor’s resistance change if the voltage across it is raised?`,
        },
        plan: volts.map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: Number(v['resistor']) } }) as const),
      };
    },
  },
);

export const answer_conductor_resistance = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? [])
    .filter((x) => x.command.type === 'lab.circuit')
    .reduce<{ I?: number; U?: number }[]>((acc, x, k, all) => (x.record.quantity === 'current' ? [...acc, { I: x.record.value ?? 0, U: all[k + 1]?.record.value ?? 0 }] : acc), [])
    .filter((x) => (x.I ?? 0) > 0) as { I: number; U: number }[];
  const R = rows.map((x) => x.U / x.I);
  const mean = R.reduce((a, b) => a + b, 0) / Math.max(1, R.length);
  // The same, if the first and the last R differ by no more than the instruments allow: half a division of each,
  // relative to its reading (at a small current the ammeter's 0.05 A is a large share).
  const err = (x: { I: number; U: number }) => AMMETER.division.value / 2 / x.I + VOLTMETER.division.value / 2 / x.U;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const apart = first && last ? Math.abs(R[R.length - 1]! - R[0]!) - (R[0]! * err(first) + R[R.length - 1]! * err(last)) : 0;
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  return {
    ...(rows.length >= 2 ? { correct: apart <= 0 ? 'same' : R[R.length - 1]! > R[0]! ? 'grows' : 'falls' } : {}),
    why: both((l) => (l === 'uk' ? 'Напруга — це те, що змушує заряджені частинки (у металі — електрони) рухатися впорядковано; опір — те, наскільки провідник цьому заважає: електрони раз у раз натрапляють на коливні йони кристалічної ґратки й гальмуються. Удвічі більша напруга вдвічі сильніше підганяє електрони — і вони рухаються вдвічі швидше, тож струм удвічі більший; а «перешкоди» в провіднику ті самі. Тому відношення U / I не змінюється — це і є опір, властивість самого провідника: він залежить від матеріалу, довжини й товщини дроту, а не від приладів і не від напруги. Так буває, поки провідник не нагрівається: у нагрітому металі йони коливаються сильніше, і опір зростає (це видно в нитки лампи).' : 'The voltage is what makes charged particles (electrons, in a metal) move in an orderly way; the resistance is how much the conductor hinders that: the electrons keep running into the vibrating ions of the crystal lattice and are slowed. Twice the voltage drives the electrons twice as hard — they drift twice as fast, so the current is twice as large; the “obstacles” in the conductor are the same. So the ratio U / I stays — that is the resistance, a property of the conductor itself: it depends on the material, the length and the thickness of the wire, not on the instruments or the voltage. This holds while the conductor does not warm up: in a hot metal the ions vibrate harder, and the resistance grows (as in a lamp’s filament).')),
    say: both((l) => (l === 'uk' ? `R ≈ ${sig(mean, 2, l)} Ом — за будь-якої напруги!` : `R ≈ ${sig(mean, 2, l)} Ω — at any voltage!`)),
    text: both((l) => {
      const list = rows.map((x, k) => `I = ${A(x.I, l)}, U = ${V(x.U, l)} → R ≈ ${sig(R[k]!, 2, l)} ${l === 'uk' ? 'Ом' : 'Ω'}`).join('; ');
      return l === 'uk'
        ? `${list}. Напруга зростала — зростав і струм, і в стільки ж разів: опір R = U / I лишався майже тим самим, ≈ ${sig(mean, 2, l)} Ом. Розкид — від цін поділок: амперметр показує струм з точністю до 0,05 А, вольтметр — напругу до 0,2 В, тож що більші покази, то точніше R. Струм у провіднику прямо пропорційний напрузі на ньому — це закон Ома для ділянки кола: I = U / R.`
        : `${list}. As the voltage rose, so did the current, and by as many times: the resistance R = U / I stayed about the same, ≈ ${sig(mean, 2, l)} Ω. The spread comes from the divisions: the ammeter reads the current to 0.05 A, the voltmeter the voltage to 0.2 V, so the larger the readings, the more precise R. The current in a conductor is proportional to the voltage across it — Ohm’s law for part of a circuit: I = U / R.`;
    }),
  };
};

export const preset_consumer_power: Preset = varied(
  {
    id: 'consumer-power',
    ask: { uk: 'У скільки разів зросте потужність, якщо напругу на резисторі збільшити вдвічі?', en: 'How many times does the power grow if the voltage across the resistor is doubled?' },
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Вимірюємо потужність споживача', en: 'Measuring the power of a consumer' },
    question: {
      uk: 'У колі — джерело струму, ключ, резистор (споживач), амперметр і вольтметр. Ставитимемо на джерелі 1,5, 3 і 4,5 В, щоразу записуватимемо покази приладів і знаходитимемо потужність P = U · I. У скільки разів зросте потужність, якщо напругу на резисторі збільшити вдвічі?',
      en: 'The circuit has a source, a key, a resistor (the consumer), an ammeter and a voltmeter. We set the source to 1.5, 3 and 4.5 V, write down the instruments each time and find the power P = U · I. How many times does the power grow if the voltage across the resistor is doubled?',
    },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'circuit',
    plan: [1.5, 3, 4.5].map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: LAB_RESISTOR.value, power: true } }) as const),
    choices: [ch('four', 'Учетверо', 'Four times'), ch('two', 'Удвічі', 'Twice'), ch('same', 'Не зміниться', 'It stays the same')],
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
        question: {
          uk: `У колі — джерело струму, ключ, резистор (споживач), амперметр і вольтметр. Ставитимемо на джерелі ${voltsText(volts, 'uk')}, щоразу записуватимемо покази приладів і знаходитимемо потужність P = U · I. У скільки разів зросте потужність, якщо напругу на резисторі збільшити вдвічі?`,
          en: `The circuit has a source, a key, a resistor (the consumer), an ammeter and a voltmeter. We set the source to ${voltsText(volts, 'en')}, write down the instruments each time and find the power P = U · I. How many times does the power grow if the voltage across the resistor is doubled?`,
        },
        plan: volts.map((source) => ({ kind: 'bench', command: { type: 'lab.circuit', source, resistor: Number(v['resistor']), power: true } }) as const),
      };
    },
  },
);

export const answer_consumer_power = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? [])
    .filter((x) => x.command.type === 'lab.circuit')
    .reduce<{ I: number; U: number }[]>((acc, x, k, all) => (x.record.quantity === 'current' ? [...acc, { I: x.record.value ?? 0, U: all[k + 1]?.record.value ?? 0 }] : acc), [])
    .filter((x) => x.I > 0);
  const P = rows.map((x) => x.U * x.I);
  const ratio = P.length >= 2 ? P[1]! / P[0]! : 0;
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  const W = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'Вт' : 'W'}`;
  return {
    ...(P.length >= 2 ? { correct: ratio > 3 ? 'four' : ratio > 1.4 ? 'two' : 'same' } : {}),
    why: both((l) => (l === 'uk' ? 'Потужність — це добуток двох величин: напруги й сили струму. А сила струму в резисторі сама пропорційна напрузі (закон Ома: I = U/R). Тож, подвоївши напругу, ми подвоюємо обидва множники: удвічі більша напруга «штовхає» удвічі більший струм — і потужність зростає в 2 · 2 = 4 рази: P = U²/R. Тому лампочка, розрахована на 220 В, у мережі зі 110 В світить ледь-ледь — її потужність учетверо менша, — а прилад, увімкнений на подвійну напругу, швидко перегріється.' : 'Power is the product of two quantities: the voltage and the current. And the current in a resistor is itself proportional to the voltage (Ohm’s law: I = U/R). So, doubling the voltage, we double both factors: twice the voltage drives twice the current — and the power grows 2 · 2 = 4 times: P = U²/R. That is why a bulb made for 220 V glows barely at 110 V — a quarter of its power — and a device put on twice its voltage soon overheats.')),
    say: both((l) => (l === 'uk' ? `Удвічі більша напруга — у ${sig(ratio, 2, l)} раза більша потужність!` : `Twice the voltage — ${sig(ratio, 2, l)} times the power!`)),
    text: both((l) => {
      const list = rows.map((x, k) => `U = ${V(x.U, l)}, I = ${A(x.I, l)} → P ≈ ${W(P[k]!, l)}`).join('; ');
      return l === 'uk'
        ? `${list}. Напруга зросла вдвічі — потужність зросла в ${sig(ratio, 2, l)} раза, тобто майже вчетверо (розбіжність — від цін поділок приладів); утричі — у ${sig(P.length >= 3 ? P[2]! / P[0]! : 0, 2, l)} раза, майже вдев’ятеро. Потужність резистора пропорційна квадрату напруги: P = U · I = U² / R.`
        : `${list}. The voltage doubled — the power grew ${sig(ratio, 2, l)} times, almost four times (the difference comes from the instruments’ divisions); tripled — ${sig(P.length >= 3 ? P[2]! / P[0]! : 0, 2, l)} times, almost nine. A resistor’s power is proportional to the square of the voltage: P = U · I = U² / R.`;
    }),
  };
};
