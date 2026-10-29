import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MEDIA, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_diode_black_box: Preset = {
  id: 'diode-black-box',
  ask: { uk: 'Що сховано в «чорній скриньці»?', en: 'What is hidden in the “black box”?' },
  grade: 9,
  topic: MEDIA,
  title: { uk: 'Що в «чорній скриньці»?', en: 'What is in the “black box”?' },
  question: {
    uk: 'Перед нами закрита скринька з двома клемами, A і B. Увімкнемо її в коло з джерелом, ключем, захисним резистором на 100 Ом і мультиметром-міліамперметром. Ставитимемо на джерелі 1, 2 і 3 В і записуватимемо силу струму, а тоді перевернемо скриньку — поміняємо клеми місцями — і повторимо. З напруги й струму знайдемо опір кола R = U / I. Що всередині скриньки?',
    en: 'Here is a closed box with two terminals, A and B. We connect it into a circuit with a source, a key, a 100 Ω protective resistor and a multimeter as a milliammeter. We set the source to 1, 2 and 3 V and write down the current, then turn the box round — swap its terminals — and do the same again. From the voltage and the current we find the circuit’s resistance R = U / I. What is inside the box?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'box',
  plan: [false, true].flatMap((reversed) => [1, 2, 3].map((source) => ({ kind: 'bench', command: { type: 'lab.box', source, reversed } }) as const)),
  choices: [ch('resistor', 'Резистор', 'A resistor'), ch('diode', 'Напівпровідниковий діод', 'A semiconductor diode'), ch('open', 'Нічого — коло розірване', 'Nothing — the circuit is broken')],
  choicesAt: 'end',
  answerOnBoard: ['boxR:'],
  formulas: ['electrical.ohm-resistance'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 2', topic: 'Тема 1. Електричний струм у різних середовищах', match: 'same', quote: '№ 2. Дослідження електричного опору кола з напівпровідниковим діодом (дослідження «чорної скриньки»).' }],
  expect: 'reached',
};

export const answer_diode_black_box = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.box' && x.record.value !== null).map((x) => ({ U: Number(x.command['source']), back: !!x.command['reversed'], I: x.record.value!, div: x.record.inputs?.['division'] ?? 0.0001 }));
  const there = rows.filter((x) => !x.back);
  const back = rows.filter((x) => x.back);
  // Lets the current through only one way: some current one way, none (below a division) the other — a diode.
  const flows = (list: typeof rows) => list.length > 0 && list.some((x) => x.I >= x.div);
  const oneWay = flows(there) !== flows(back);
  const twoWays = flows(there) && flows(back);
  const correct = !rows.length ? undefined : oneWay ? 'diode' : twoWays ? 'resistor' : 'open';
  const mA = (x: number, l: Locale) => `${(x * 1000).toFixed(1).replace('.', l === 'uk' ? ',' : '.')} ${l === 'uk' ? 'мА' : 'mA'}`;
  const Om = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'Ом' : 'Ω'}`;
  // How much more current at the highest voltage than at the lowest, the way it flows (a resistor: as much as the voltage).
  const fwd = (flows(there) ? there : back).filter((x) => x.I >= x.div);
  const lo = fwd[0];
  const hi = fwd[fwd.length - 1];
  const ratio = lo && hi && lo !== hi ? hi.I / lo.I : 0;
  const times = lo && hi && lo !== hi ? hi.U / lo.U : 0;
  const list = (xs: typeof rows, l: Locale) => xs.map((x) => `${x.U} ${l === 'uk' ? 'В' : 'V'} — ${mA(x.I, l)}${x.I >= x.div ? ` (R ≈ ${Om(x.U / x.I, l)})` : ''}`).join(', ');
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Діод — кристал напівпровідника, дві частини якого проводять по-різному: в одній струм несуть електрони, в іншій — «дірки» (місця, де електрона бракує). На межі між ними утворюється тонкий шар без вільних зарядів. Під’єднаний одним боком, діод цей шар звужує — заряди проходять, опір малий; іншим боком — розширює, і струму майже немає. Резистор так не вміє: йому байдуже, куди тече струм.'
        : 'A diode is a crystal of a semiconductor whose two parts conduct differently: in one the current is carried by electrons, in the other by “holes” (places where an electron is missing). At the boundary a thin layer forms with no free charges. Connected one way, the diode narrows that layer — charges get through, the resistance is small; the other way it widens it, and there is next to no current. A resistor cannot do that: it does not care which way the current goes.',
    ),
    say: both((l) => (correct === 'diode' ? (l === 'uk' ? 'В один бік струм іде, в інший — ні: там діод!' : 'One way the current flows, the other way not: it is a diode!') : l === 'uk' ? 'Подивімося, що показали прилади.' : 'Let us look at what the instruments showed.')),
    text: both((l) =>
      l === 'uk'
        ? `Скринька як стоїть: ${list(there, l)}. Перевернута: ${list(back, l)}. В один бік опір кола невеликий і ще й зменшується з напругою (з ${hi?.U ?? 0} В струм більший не в ${sig(times, 2, l)} раза, а в ${sig(ratio, 2, l)}, ніж з ${lo?.U ?? 0} В); в інший — міліамперметр показує нуль: опір величезний. Однаково в обидва боки пропускав би струм резистор, ніде не пропускало б розірване коло. Так поводиться лише напівпровідниковий діод.`
        : `The box as it stands: ${list(there, l)}. Turned round: ${list(back, l)}. One way the circuit’s resistance is small and even falls with the voltage (at ${hi?.U ?? 0} V the current is not ${sig(times, 2, l)} but ${sig(ratio, 2, l)} times that at ${lo?.U ?? 0} V); the other way the milliammeter shows zero: a huge resistance. A resistor would let the current through both ways alike, a broken circuit neither way. Only a semiconductor diode behaves so.`,
    ),
  };
};
