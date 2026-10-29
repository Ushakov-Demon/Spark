import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { BEAUFORT, beaufortOf, WIND_TRACK } from './bench.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_wind_speed: Preset = {
  ask: { uk: 'Як швидко рухається повітря, коли шелестить листя?', en: 'How fast does the air move when leaves rustle?' },
  id: 'wind-speed',
  grade: 7,
  topic: MOTION,
  title: { uk: 'Вимірюємо швидкість вітру мильними бульбашками', en: 'Measuring the wind’s speed with soap bubbles' },
  question: {
    uk: 'Мильна бульбашка така легка, що летить разом із повітрям: її швидкість — це швидкість вітру. На подвір’ї рулеткою відміряємо 6 м уздовж вітру й ставимо дві позначки. Три дні з різним вітром: видуваємо бульбашку біля першої позначки й засікаємо, коли вона мине другу, — і порівнюємо швидкість із прикметами вітру за шкалою Бофорта. Як швидко рухається повітря, коли шелестить листя?',
    en: 'A soap bubble is so light that it flies with the air: its speed is the wind’s. In the yard we measure 6 m along the wind with a tape measure and set two marks. Three days with different winds: we blow a bubble at the first mark and time it to the second — and compare the speed with the wind’s signs on the Beaufort scale. How fast does the air move when leaves rustle?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'wind',
  plan: ([1, 2, 3] as const).map((day) => ({ kind: 'bench', command: { type: 'lab.wind', day } }) as const),
  choices: [ch('walk', '2–3 метри за секунду', '2–3 metres a second'), ch('slow', 'Близько пів метра за секунду', 'About half a metre a second'), ch('fast', 'Близько 10 метрів за секунду', 'About 10 metres a second')],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: середньої швидкості тіл, що здійснюють рівномірний і нерівномірний рухи; швидкості руху повітря' }],
  expect: 'reached',
};

export const answer_wind_speed = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.wind' && x.record.value !== null).map((x) => ({ day: Number(x.command['day']) as 1 | 2 | 3, t: x.record.value!, l: x.record.inputs?.['track'] ?? WIND_TRACK }));
  const v = (x: { t: number; l: number }) => x.l / x.t;
  const ms = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
  const leaves = R.find((x) => x.day === 2);
  return {
    ...(leaves && v(leaves) >= 2 && v(leaves) <= 3 ? { correct: 'walk' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Повітря невидиме, тож стежимо за чимось, що рухається разом із ним. Мильна бульбашка — тонка плівка з повітрям усередині, вона майже нічого не важить, і вітер одразу несе її зі своєю швидкістю. Тоді v = l / t: 6 м поділити на час між позначками. Швидкість вітру вимірюють і метеорологи — анемометрами, а моряки здавна оцінювали її за прикметами: шкала Бофорта (1805 р.) зіставляє кожну силу вітру з тим, що він робить. Коли шелестить листя й вітер відчуваєш обличчям, це 2 бали — від 1,6 до 3,4 м/с. Засікати час рукою — похибка близько 0,2 с, тож для сильнішого вітру краще брати довшу відстань і пускати кілька бульбашок: вітер ще й поривчастий.'
        : 'Air cannot be seen, so we watch something that moves with it. A soap bubble is a thin film with air inside; it weighs next to nothing, and the wind at once carries it at its own speed. Then v = l / t: 6 m divided by the time between the marks. Meteorologists measure the wind’s speed too — with anemometers — and sailors long judged it by its signs: the Beaufort scale (1805) matches each force of wind with what it does. When leaves rustle and the wind is felt on the face, that is force 2 — 1.6 to 3.4 m/s. Timing by hand has an error of about 0.2 s, so for a stronger wind a longer distance is better, and several bubbles: the wind comes in gusts, too.',
    ),
    say: both((l) => (leaves ? (l === 'uk' ? `Шелестить листя — повітря рухається зі швидкістю ${ms(v(leaves), l)}: 2 бали, «легкий» вітер.` : `Leaves rustle — the air moves at ${ms(v(leaves), l)}: force 2, a light breeze.`) : '')),
    text: both((l) => {
      const uk = l === 'uk';
      const parts = R.map((x) => {
        const b = BEAUFORT[x.day];
        const f = beaufortOf(v(x));
        return uk ? `${b.signs.uk}: 6 м за ${formatMeasured('time', x.t, 0.01, l)}, v ≈ ${ms(v(x), l)} — ${f} ${f === 1 ? 'бал' : 'бали'}, «${tr(BEAUFORT[f as 1 | 2 | 3]?.name ?? b.name, l)}»` : `${b.signs.en}: 6 m in ${formatMeasured('time', x.t, 0.01, l)}, v ≈ ${ms(v(x), l)} — force ${f}, a ${tr(BEAUFORT[f as 1 | 2 | 3]?.name ?? b.name, l)}`;
      });
      const s = `${parts.join('; ')}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Сила вітру за швидкістю збіглася з прикметами (шкала Бофорта).' : ' The wind’s force by its speed matched its signs (the Beaufort scale).');
    }),
  };
};
