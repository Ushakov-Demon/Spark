import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, ELECTRIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

export const preset_series_circuit: Preset = varied(
  {
    id: 'series-circuit',
    ask: { uk: 'Як пов’язані напруги на резисторах із загальною напругою?', en: 'How do the voltages across the resistors relate to the total?' },
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Послідовне з’єднання провідників', en: 'Conductors in series' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pair',
    choices: [ch('sum', 'Загальна напруга — сума напруг на резисторах', 'The total is the sum of the voltages across the resistors'), ch('equal', 'На кожному резисторі — уся напруга джерела', 'Each resistor gets the source’s whole voltage'), ch('half', 'Напруга ділиться навпіл, хоч які резистори', 'It splits in half, whatever the resistors')],
    choicesAt: 'end',
    answerOnBoard: ['sum:'],
    formulas: ['electrical.series-voltage', 'electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 7', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 7. Дослідження електричного кола з послідовним з’єднанням провідників.' }],
    expect: 'reached',
  },
  {
    // In series 6.1 Ω in all: 6 V drive ≈ 1 A (the ammeter takes 2 A), the voltmeter across both reads up to 6 V.
    controls: [{ id: 'source', label: { uk: 'Напруга джерела', en: 'Source voltage' }, kind: 'choice', options: [ch('2', '2 В', '2 V'), ch('4', '4 В', '4 V'), ch('6', '6 В', '6 V')], value: '4' }],
    build: (v) => {
      const source = Number(v['source']);
      return {
        question: {
          uk: `З’єднаємо два резистори (2 і 4 Ом) послідовно — один за одним — з амперметром і джерелом на ${source} В. Виміряємо силу струму й напругу на першому резисторі, на другому і на обох разом. Як пов’язані напруги на резисторах із загальною напругою?`,
          en: `We connect two resistors (2 and 4 Ω) in series — one after the other — with an ammeter and a ${source} V source. We measure the current and the voltage across the first resistor, the second and both together. How do the voltages across the resistors relate to the total?`,
        },
        plan: (['r1', 'r2', 'both'] as const).map((at) => ({ kind: 'bench', command: { type: 'lab.pair', source, connection: 'series', at } }) as const),
      };
    },
  },
);

export const answer_series_circuit = (run: PresetRun): PresetAnswer => {
  return pairAnswer(run, 'series');
};

export const preset_parallel_circuit: Preset = varied(
  {
    id: 'parallel-circuit',
    ask: { uk: 'Як пов’язані струми в гілках із загальним струмом?', en: 'How do the branch currents relate to the total current?' },
    grade: 8,
    topic: ELECTRIC,
    title: { uk: 'Паралельне з’єднання провідників', en: 'Conductors in parallel' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pair',
    choices: [ch('sum', 'Загальний струм — сума струмів у гілках', 'The total is the sum of the branch currents'), ch('equal', 'У кожній гілці — увесь струм', 'Each branch carries the whole current'), ch('half', 'Струм ділиться навпіл, хоч які резистори', 'It splits in half, whatever the resistors')],
    choicesAt: 'end',
    answerOnBoard: ['sum:'],
    formulas: ['electrical.parallel-current', 'electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 8', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 8. Дослідження електричного кола з паралельним з’єднанням провідників.' }],
    expect: 'reached',
  },
  {
    // In parallel ≈ 1.33 Ω: before the fork 2.5 V drive ≈ 1.7 A, 3 V would be past the ammeter's 2 A.
    controls: [{ id: 'source', label: { uk: 'Напруга джерела', en: 'Source voltage' }, kind: 'choice', options: [ch('1', '1 В', '1 V'), ch('1.5', '1,5 В', '1.5 V'), ch('2', '2 В', '2 V'), ch('2.5', '2,5 В', '2.5 V')], value: '2' }],
    build: (v) => {
      const source = Number(v['source']);
      const uk = String(source).replace('.', ',');
      return {
        question: {
          uk: `З’єднаємо ті самі резистори (2 і 4 Ом) паралельно — кожен своєю гілкою — і під’єднаємо до джерела на ${uk} В. Виміряємо струм у гілці з першим резистором, у гілці з другим і до розгалуження, а щоразу — й напругу. Як пов’язані струми в гілках із загальним струмом?`,
          en: `We connect the same resistors (2 and 4 Ω) in parallel — each on its own branch — to a ${source} V source. We measure the current in the branch of the first resistor, of the second and before the fork, and the voltage each time. How do the branch currents relate to the total current?`,
        },
        plan: (['r1', 'r2', 'both'] as const).map((at) => ({ kind: 'bench', command: { type: 'lab.pair', source, connection: 'parallel', at } }) as const),
      };
    },
  },
);

export const answer_parallel_circuit = (run: PresetRun): PresetAnswer => {
  return pairAnswer(run, 'parallel');
};

/** The two connections answered alike: the readings at each place, the sum that holds, why. */
function pairAnswer(run: PresetRun, connection: 'series' | 'parallel'): PresetAnswer {
  const at = (where: string) => {
    const rs = (run.readings ?? []).filter((x) => x.command.type === 'lab.pair' && x.command['at'] === where).map((x) => x.record);
    const I = rs.find((x) => x.quantity === 'current')?.value;
    const U = rs.find((x) => x.quantity === 'voltage')?.value;
    return I != null && U != null ? { I, U } : null;
  };
  const [r1, r2, all] = [at('r1'), at('r2'), at('both')];
  const series = connection === 'series';
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  // Within the instruments' divisions (two readings rounded each): the sum holds.
  const ok = !!(r1 && r2 && all);
  const sum = ok ? (series ? r1!.U + r2!.U : r1!.I + r2!.I) : 0;
  const total = ok ? (series ? all!.U : all!.I) : 0;
  const tol = series ? 0.3 : 0.12;
  const each = ok ? (series ? Math.abs(r1!.U - total) < tol && Math.abs(r2!.U - total) < tol : Math.abs(r1!.I - total) < tol && Math.abs(r2!.I - total) < tol) : false;
  const halves = ok ? (series ? Math.abs(r1!.U - r2!.U) < tol : Math.abs(r1!.I - r2!.I) < tol) : false;
  const correct = ok ? (Math.abs(sum - total) <= tol ? 'sum' : each ? 'equal' : halves ? 'half' : undefined) : undefined;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      series
        ? l === 'uk'
          ? 'У послідовному колі в струму одна дорога: скільки зарядів пройшло через перший резистор, стільки ж пройде й через другий — інакше вони десь накопичувалися б. Тому струм всюди однаковий. А напруга — це робота, яку джерело виконує, переносячи заряд по колу; цю роботу заряд «витрачає» по дорозі: частину на першому резисторі, решту — на другому. Отже, U = U₁ + U₂. За законом Ома U₁ = I·R₁, U₂ = I·R₂: на вдвічі більшому опорі — удвічі більша напруга. Так ялинкова гірлянда з лампочок, увімкнених одна за одною, ділить між ними напругу мережі — і якщо одна перегорить, згасає вся.'
          : 'In a series circuit the current has one road: as many charges pass through the first resistor as through the second — otherwise they would pile up somewhere. So the current is the same everywhere. The voltage is the work the source does carrying charge round the circuit; the charge “spends” that work on the way: part across the first resistor, the rest across the second. So U = U₁ + U₂. By Ohm’s law U₁ = I·R₁, U₂ = I·R₂: twice the resistance, twice the voltage. That is how a string of tree lights wired one after another shares the mains voltage — and if one burns out, all go dark.'
        : l === 'uk'
          ? 'У паралельному колі обидва резистори під’єднані до тих самих двох точок, тож напруга на них однакова — це напруга між цими точками. Струм, дійшовши до розгалуження, ділиться: заряди не зникають і не з’являються, тож скільки ввійшло у вузол, стільки й вийшло: I = I₁ + I₂. У гілці з меншим опором струм більший (I = U/R): удвічі менший опір — удвічі більший струм. Кожна нова гілка додає ще одну дорогу для струму, тож загальний опір менший за найменший опір гілки. Так увімкнено прилади в квартирі: кожен має напругу мережі й працює незалежно від інших.'
          : 'In a parallel circuit both resistors are joined to the same two points, so the voltage across them is the same — the voltage between those points. The current, reaching the fork, splits: charges neither vanish nor appear, so as much flows into the junction as out: I = I₁ + I₂. The branch of smaller resistance carries more current (I = U/R): half the resistance, twice the current. Each new branch adds another road for the current, so the total resistance is less than the smallest branch’s. That is how appliances at home are wired: each gets the mains voltage and works independently of the others.',
    ),
    say: both((l) => (l === 'uk' ? (series ? 'Напруги склалися — струм той самий!' : 'Струми склалися — напруга та сама!') : series ? 'The voltages add up — the current is the same!' : 'The currents add up — the voltage is the same!')),
    text: both((l) => {
      if (!ok) return l === 'uk' ? 'Дослід ще не завершено.' : 'The experiment is not finished yet.';
      return series
        ? l === 'uk'
          ? `Струм у колі всюди однаковий — ${A(all!.I, l)}. Напруга на резисторі 2 Ом — ${V(r1!.U, l)}, на резисторі 4 Ом — ${V(r2!.U, l)}, на обох разом — ${V(all!.U, l)}. Сума U₁ + U₂ = ${V(r1!.U + r2!.U, l)} — та сама загальна напруга (розбіжність — у межах ціни поділки вольтметра, 0,2 В). На більшому опорі напруга більша: у скільки разів більший опір, у стільки ж разів більша напруга.`
          : `The current is the same everywhere — ${A(all!.I, l)}. The voltage across the 2 Ω resistor is ${V(r1!.U, l)}, across the 4 Ω one ${V(r2!.U, l)}, across both ${V(all!.U, l)}. The sum U₁ + U₂ = ${V(r1!.U + r2!.U, l)} — the same total voltage (any difference is within the voltmeter’s 0.2 V division). The larger resistance gets the larger voltage: as many times more resistance, as many times more voltage.`
        : l === 'uk'
          ? `Напруга на обох гілках однакова — ${V(r1!.U, l)} (коли амперметр стоїть до розгалуження, вольтметр показує трохи менше — ${V(all!.U, l)}: частину напруги «забирає» сам амперметр). Струм у гілці з резистором 2 Ом — ${A(r1!.I, l)}, з резистором 4 Ом — ${A(r2!.I, l)}, до розгалуження — ${A(all!.I, l)}. Сума I₁ + I₂ = ${A(r1!.I + r2!.I, l)} — майже той самий загальний струм: невелика розбіжність — від ціни поділки амперметра (0,05 А) і від того, що він сам має невеликий опір і, ввімкнений у гілку, трохи зменшує в ній струм. У гілці з удвічі меншим опором струм удвічі більший.`
          : `The voltage across both branches is the same — ${V(r1!.U, l)} (with the ammeter before the fork the voltmeter reads a little less — ${V(all!.U, l)}: the ammeter itself “takes” part of the voltage). The current in the branch of the 2 Ω resistor is ${A(r1!.I, l)}, of the 4 Ω one ${A(r2!.I, l)}, before the fork ${A(all!.I, l)}. The sum I₁ + I₂ = ${A(r1!.I + r2!.I, l)} — almost the same total: the small difference comes from the ammeter’s 0.05 A division and from its own small resistance, which, put in a branch, lowers the current in it a little. The branch of half the resistance carries twice the current.`;
    }),
  };
}
