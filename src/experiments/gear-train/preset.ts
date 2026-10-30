import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, STEPS_END, stepLine, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_gear_train: Preset = {
  id: 'gear-train',
  ask: { uk: 'Як зубчаста передача змінює швидкість і напрям обертання?', en: 'How does a gear train change the speed and the direction of turning?' },
  grade: 7,
  topic: WORK,
  title: { uk: 'Зубчаста передача: швидше, повільніше, у який бік', en: 'A gear train: faster, slower, which way' },
  question: {
    uk: 'Шестірні конструктора на штифтах дошки: порахуємо в них зубці. Зчепимо шестірню на 24 зубці з шестірнею на 8 і повернемо ведучу ручкою на один оберт; потім 8 → 40 — на п’ять обертів; а тоді поставимо між 24 і 8 ще шестірню на 40. Щоразу за крейдяною рискою порахуємо оберти останньої шестірні й подивимося, у який бік вона крутиться. Як зубчаста передача змінює швидкість і напрям обертання?',
    en: 'Gears of a construction set on the pins of a board: we count their teeth. We mesh a 24-tooth gear with an 8-tooth one and turn the driver one turn by its handle; then 8 → 40, five turns; and then we put a 40-tooth gear between the 24 and the 8. Each time we count the last gear’s turns by its chalk mark and see which way it turns. How does a gear train change the speed and the direction of turning?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'gears',
  plan: [
    { kind: 'bench', command: { type: 'lab.gears', step: 'count' } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [24, 8], turns: 1 } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [8, 40], turns: 5 } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [24, 40, 8], turns: 1 } },
  ],
  choices: [
    ch('teeth', 'Мала шестірня крутиться швидше — у стільки разів, у скільки в неї менше зубців; кожна пара міняє напрям', 'A small gear turns faster — as many times as it has fewer teeth; each pair reverses the direction'),
    ch('same', 'Швидкість та сама — зубці ж зчеплені; і напрям той самий', 'The speed is the same — the teeth are meshed; and so is the direction'),
    ch('big', 'Велика шестірня крутиться швидше — вона ж більша', 'The big gear turns faster — it is bigger'),
  ],
  // The ratios and the directions are the answer: chalked in once a guess is made.
  answerOnBoard: ['gr:'],
  asides: [
    {
      uk: 'Зубчасті передачі на дві тисячі років старші за годинники з маятником. 1901 року біля грецького острова Антикітера з дна моря підняли уламки судна, а серед них — бронзовий механізм II століття до нашої ери з щонайменше 30 шестірнями (сучасні знімки нарахували близько 35). Крутячи ручку, ним показували, де на небі Сонце й Місяць, на десятиліття наперед передбачали затемнення і навіть стежили за чотирирічним циклом ігор. Його називають найдавнішим відомим аналоговим комп’ютером.',
      en: 'Gear trains are two thousand years older than pendulum clocks. In 1901, off the Greek island of Antikythera, the wreck of a ship was raised from the sea floor, and among it a bronze mechanism of the 2nd century BC with at least 30 gears (modern scans count about 35). Turning its crank, one could show where the Sun and the Moon stood in the sky, predict eclipses decades ahead and even follow the four-year cycle of the games. It is called the oldest known analogue computer.',
    },
  ],
  formulas: ['mechanics.gear-ratio'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'зміни швидкості й напряму руху ведучої частини механізму, що містить зубчасту передачу' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'моделювання й конструювання: простих механізмів; зубчастих передач' },
  ],
  expect: 'reached',
};

export const answer_gear_train = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.gears' && x.command['step'] === 'turn' && x.record.value !== null);
  const rows = R.map((x) => {
    const i = x.record.inputs ?? {};
    return { train: (x.command['train'] as number[]) ?? [], n1: i['driver'] ?? 1, n2: x.record.value!, z1: i['first'] ?? 0, z2: i['last'] ?? 0, same: i['same'] === 1 };
  });
  const fits = rows.every((x) => Math.abs(x.n2 / x.n1 - x.z1 / x.z2) < 0.05);
  const pairsReverse = rows.filter((x) => x.train.length === 2).every((x) => !x.same);
  const correct = !rows.length ? undefined : fits && pairsReverse ? 'teeth' : 'same';
  const way = (same: boolean, l: Locale) => (l === 'uk' ? (same ? 'у той самий бік' : 'у протилежний') : same ? 'the same way' : 'the other way');
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Зубці зчеплених шестірень входять один між одного, тож повз точку, де шестірні стикаються, за той самий час проходить однаково зубців обох. Шестірня на 24 зубці за оберт проводить 24 зубці — а шестірні на 8 зубців для цього треба обернутися тричі: n₁·z₁ = n₂·z₂, тобто n₂ = n₁·z₁/z₂. Від великої шестірні до малої передача прискорює обертання, від малої до великої — сповільнює.\n\nА напрям? Зубці в точці дотику рухаються разом — отже, самі шестірні крутяться назустріч одна одній: кожна пара міняє напрям. Проміжна шестірня між ними відношення обертів не змінює (рахуються лише перша й остання), зате ще раз повертає напрям — тож остання знову крутиться в той самий бік, що й ведуча. Так годинники, велосипеди й міксери міняють швидкість і напрям обертання.'
        : 'The teeth of meshing gears go in between each other, so in the same time as many teeth of both pass the point where the gears touch. A 24-tooth gear passes 24 teeth in a turn — and an 8-tooth gear has to turn three times for that: n₁·z₁ = n₂·z₂, so n₂ = n₁·z₁/z₂. From a big gear to a small one the train speeds the turning up, from a small to a big one it slows it down.\n\nAnd the direction? At the point of contact the teeth move together — so the gears themselves turn towards each other: each pair reverses the direction. An intermediate gear between them does not change the ratio of the turns (only the first and the last count), but it reverses the direction once more — so the last one again turns the way the driver does. That is how clocks, bicycles and mixers change the speed and the direction of turning.',
    ),
    say: both((l) => (correct === 'teeth' ? (l === 'uk' ? 'Оберти — обернено до зубців, а кожна пара міняє напрям!' : 'The turns go inversely as the teeth, and each pair reverses the direction!') : l === 'uk' ? 'Подивімося, як крутилися шестірні.' : 'Let us look at how the gears turned.')),
    text: both((l) => {
      if (!rows.length) return '';
      const uk = l === 'uk';
      const list = rows.map((x) => (uk ? `${x.train.join(' → ')}: ведуча — ${sig(x.n1, 3, l)} об., остання — ${sig(x.n2, 3, l)} об. (${x.z1}/${x.z2} = ${sig(x.z1 / x.z2, 3, l)}), ${way(x.same, l)}` : `${x.train.join(' → ')}: the driver — ${sig(x.n1, 3, l)} turns, the last — ${sig(x.n2, 3, l)} turns (${x.z1}/${x.z2} = ${sig(x.z1 / x.z2, 3, l)}), ${way(x.same, l)}`));
      return uk
        ? `Оберти останньої шестірні щоразу дорівнювали обертам ведучої, помноженим на відношення зубців першої й останньої:${list.map(stepLine).join(';') + STEPS_END}. З проміжною шестірнею на 40 відношення лишилося 24/8 = 3, а напрям повернувся.`
        : `The last gear’s turns each time equalled the driver’s times the ratio of the first and the last gear’s teeth:${list.map(stepLine).join(';') + STEPS_END}. With the 40-tooth gear in between the ratio stayed 24/8 = 3, and the direction came back.`;
    }),
  };
};
