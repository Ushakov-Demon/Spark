import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MAGNETIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_electromagnetic_induction: Preset = varied(
  {
    id: 'electromagnetic-induction',
    ask: { uk: 'Коли в котушці виникає струм?', en: 'When does a current flow in the coil?' },
    grade: 9,
    topic: MAGNETIC,
    title: { uk: 'Магніт і котушка: електромагнітна індукція', en: 'A magnet and a coil: electromagnetic induction' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'induct',
    choices: [ch('motion', 'Коли магніт і котушка рухаються одне відносно одного', 'When the magnet and the coil move against each other'), ch('inside', 'Коли магніт лежить у котушці', 'When the magnet lies in the coil'), ch('never', 'Струму від магніту не буде', 'A magnet makes no current')],
    choicesAt: 'end',
    answerOnBoard: ['iE:'],
    formulas: ['electrical.induced-emf'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 5', topic: 'Тема 2. Магнітні та електромагнітні явища', match: 'same', quote: '№ 5. Дослідження явища електромагнітної індукції.' }],
    expect: 'reached',
  },
  {
    // The coil's turns: more turns — more EMF, but more wire and so more resistance too.
    controls: [{ id: 'turns', label: { uk: 'Витків у котушці', en: 'Turns in the coil' }, kind: 'choice', options: [ch('100', '100', '100'), ch('200', '200', '200'), ch('400', '400', '400')], value: '200' }],
    build: (v) => {
      const turns = Number(v['turns']);
      const fast = 0.3;
      const slow = 1.5;
      return {
        question: {
          uk: `Котушку на ${turns} витків з’єднаємо з міліамперметром, у якого нуль посередині: стрілка відхиляється в той бік, куди йде струм. Покладемо в котушку штабовий магніт; потім швидко витягнемо його й швидко вставимо північним полюсом, потім — повільно, а тоді швидко вставимо південним. Наостанок не рухатимемо магніт, а швидко надінемо на нього котушку. Щоразу запишемо, куди й на скільки відхилилася стрілка. Коли в котушці виникає струм?`,
          en: `We join a coil of ${turns} turns to a milliammeter with its zero in the middle: the needle swings the way the current goes. We put a bar magnet in the coil; then pull it out fast and push it in fast, north pole first, then slowly, and then push it in fast south pole first. At last we keep the magnet still and slip the coil onto it fast. Each time we note which way and how far the needle swung. When does a current flow in the coil?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.induct', move: 'still', pole: 'N', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'out', pole: 'N', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'N', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'N', time: slow, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'in', pole: 'S', time: fast, turns } },
          { kind: 'bench', command: { type: 'lab.induct', move: 'coil', pole: 'N', time: fast, turns } },
        ],
      };
    },
  },
);

export const answer_electromagnetic_induction = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.induct' && x.record.value !== null);
  const find = (move: string, pole = 'N', fast?: boolean) => R.find((x) => x.command['move'] === move && x.command['pole'] === pole && (fast === undefined || (Number(x.command['time']) <= 0.5) === fast))?.record;
  const still = find('still');
  const inFast = find('in', 'N', true);
  const out = find('out');
  const inSlow = find('in', 'N', false);
  const south = find('in', 'S', true);
  const coil = find('coil');
  const div = R[0]?.record.inputs?.['division'] ?? 0.002;
  const moved = [inFast, out, inSlow, south, coil].filter((x) => x && Math.abs(x.value!) >= div);
  const correct = !R.length ? undefined : still && Math.abs(still.value!) >= div ? 'inside' : moved.length ? 'motion' : 'never';
  const mA = (x: number | null | undefined, l: Locale) => `${x! > 0 ? '+' : ''}${sig((x ?? 0) * 1000, 2, l).replace('-', '−')} ${l === 'uk' ? 'мА' : 'mA'}`;
  const turns = Number(R[0]?.command['turns'] ?? 200);
  const Rc = inFast?.inputs?.['resistance'] ?? 7;
  const emf = (x: number | null | undefined) => Math.abs(x ?? 0) * Rc;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Струм у котушці з’являється, лише коли змінюється магнітний потік крізь її витки — тобто коли магніт і котушка рухаються одне відносно одного. Нерухомий магніт, хай навіть усередині, струму не дає. Що швидше змінюється потік, то більша ЕРС індукції — і струм. А напрям струму такий, що його власне магнітне поле заважає зміні потоку (правило Ленца): магніт входить — котушка його відштовхує, виходить — притягує. Тому вводити й виводити, північним чи південним полюсом — струм іде в різні боки. І байдуже, що рухається — магніт чи котушка: важить лише їхній рух одне відносно одного.'
        : 'A current appears in the coil only while the magnetic flux through its turns changes — that is, while the magnet and the coil move against each other. A still magnet, even inside, makes no current. The faster the flux changes, the larger the induced EMF — and the current. And the current flows so that its own field hinders the change of the flux (Lenz’s law): the magnet coming in is pushed back by the coil, going out — pulled. So in or out, north or south pole first — the current goes opposite ways. And it does not matter which moves, the magnet or the coil: only their motion against each other counts.',
    ),
    say: both((l) => (correct === 'motion' ? (l === 'uk' ? 'Струм іде, лише поки магніт рухається відносно котушки!' : 'The current flows only while the magnet moves against the coil!') : l === 'uk' ? 'Подивімося, що показав міліамперметр.' : 'Let us look at the milliammeter.')),
    text: both((l) =>
      l === 'uk'
        ? `Котушка на ${turns} витків, опір кола (котушка й міліамперметр) ≈ ${sig(Rc, 2, l)} Ом. Магніт нерухомо в котушці — ${mA(still?.value, l)}. Витягли швидко — ${mA(out?.value, l)}; вставили північним полюсом швидко — ${mA(inFast?.value, l)}, повільно — ${mA(inSlow?.value, l)}; південним швидко — ${mA(south?.value, l)}; котушку надягли на нерухомий магніт — ${mA(coil?.value, l)}. ЕРС ε = I·R: швидко ≈ ${sig(emf(inFast?.value), 2, l)} В, повільно ≈ ${sig(emf(inSlow?.value), 2, l)} В — що швидше рух, то більша. Знак струму міняється, коли магніт виводять замість вводити і коли повертають іншим полюсом.`
        : `A coil of ${turns} turns; the circuit’s resistance (the coil and the meter) ≈ ${sig(Rc, 2, l)} Ω. The magnet still in the coil — ${mA(still?.value, l)}. Pulled out fast — ${mA(out?.value, l)}; pushed in north pole first fast — ${mA(inFast?.value, l)}, slowly — ${mA(inSlow?.value, l)}; south pole first fast — ${mA(south?.value, l)}; the coil slipped onto the still magnet — ${mA(coil?.value, l)}. The EMF ε = I·R: fast ≈ ${sig(emf(inFast?.value), 2, l)} V, slowly ≈ ${sig(emf(inSlow?.value), 2, l)} V — the faster, the larger. The current changes sign when the magnet is pulled out instead of pushed in and when it is turned the other pole first.`,
    ),
  };
};
