import { riseHeight } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_fountain_model: Preset = {
  id: 'fountain-model',
  ask: { uk: 'На яку висоту б’є фонтан?', en: 'How high does the fountain go?' },
  grade: 7,
  topic: PRESSURE,
  title: { uk: 'Модель фонтана', en: 'A model of a fountain' },
  question: {
    uk: 'Пластикова пляшка без дна висить на штативі шийкою вниз. Від шийки — силіконова трубка завдовжки 1 м: униз, по столу й угору до скляного сопла над тазом. Наллємо в пляшку води (і доливатимемо, щоб рівень не мінявся) і ставитимемо її так, щоб вода в ній стояла на 5 см нижче сопла, а тоді на 10, 30 і 50 см вище. Щоразу виміряємо лінійкою, на яку висоту б’є струмінь. На яку висоту б’є фонтан?',
    en: 'A plastic bottle with its bottom cut off hangs neck down on a stand. From the neck a silicone tube 1 m long goes down, along the table and up to a glass nozzle over a basin. We pour water into the bottle (topping it up so the level stays) and set it so that the water in it stands 5 cm below the nozzle, then 10, 30 and 50 cm above. Each time we measure with a ruler how high the jet goes. How high does the fountain go?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'fountain',
  plan: [-0.05, 0.1, 0.3, 0.5].map((head) => ({ kind: 'bench', command: { type: 'lab.fountain', head } }) as const),
  choices: [
    ch('level', 'Майже до рівня води в пляшці — але трохи нижче', 'Almost to the level of the water in the bottle — but a little lower'),
    ch('above', 'Вище за рівень води в пляшці: падаючи трубкою, вода розганяється', 'Above the level of the water in the bottle: falling through the tube, the water speeds up'),
    ch('low', 'Ледь-ледь — на кілька сантиметрів: метр трубки гальмує воду', 'Barely — a few centimetres: a metre of tube holds the water back'),
  ],
  // The share of the head the jet reached is the answer: chalked in once a guess is made.
  answerOnBoard: ['fh:'],
  asides: [
    {
      uk: 'Фонтан «Змія» в уманській «Софіївці» — парку, закладеному 1796 року, — б’є на 12–16 метрів без жодного насоса: вода надходить самопливним підземним водогоном, а верх струменя лише на 1,5–2,5 метра нижчий за рівень Верхнього ставу. Голівку фонтана зробили вдесятеро вужчою за трубу водогону — як наше сопло вужче за трубку.',
      en: 'The «Snake» fountain in Sofiyivka park in Uman, laid out in 1796, shoots 12–16 metres up without any pump: the water comes along a gravity-fed underground water pipe, and the top of the jet is only 1.5–2.5 metres below the level of the Upper Pond. The fountain’s head was made ten times narrower than the pipe — as our nozzle is narrower than the tube.',
    },
  ],
  formulas: ['mechanics.torricelli', 'mechanics.rise-height', 'mechanics.potential-energy'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'конструювання: моделі фонтана' }],
  expect: 'reached',
};

export const answer_fountain_model = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.fountain' && x.record.value !== null);
  const jets = R.filter((x) => (x.record.inputs?.['head'] ?? 0) > 0).map((x) => {
    const i = x.record.inputs ?? {};
    return { head: i['head'] ?? 0, jet: x.record.value!, ideal: i['ideal'] ?? 0, speed: i['speed'] ?? 0, loss: i['loss'] ?? 0, re: i['reynolds'] ?? 0, g: i['g'] ?? 9.81 };
  });
  const below = R.some((x) => (x.record.inputs?.['head'] ?? 0) <= 0);
  const correct = !jets.length ? undefined : jets.every((x) => x.jet <= x.head && x.jet >= 0.8 * x.head) ? 'level' : jets.some((x) => x.jet > x.head) ? 'above' : 'low';
  const cm = (x: number) => Math.round(x * 100);
  const u = (l: Locale) => (l === 'uk' ? 'см' : 'cm');
  const ms = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
  const last = jets[jets.length - 1];
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Вода в пляшці стоїть вище за сопло — у неї є потенціальна енергія. Збігаючи трубкою до сопла, вона розганяється й вилітає з такою швидкістю, якої набуло б тіло, падаючи з тієї самої висоти: v = √(2gH) (закон Торрічеллі). А летячи вгору, струмінь знову міняє швидкість на висоту: піднятися він може якраз на h = v²/(2g) = H — до рівня води в пляшці, і не вище: енергії більше не взятися. Це той самий закон, що й у сполучених посудинах: вода прагне стати на одному рівні. Тому пляшка нижче сопла фонтана не дає зовсім — вода в трубці лише піднімається до рівня в пляшці.\n\nТрохи нижче за рівень струмінь б’є через тертя: вода треться в трубці (що швидше тече — то більше) і об повітря. Тому що вище пляшка, то більше сантиметрів струмінь не добирає, хоча частка від висоти лишається майже тією самою.'
        : 'The water in the bottle stands above the nozzle — it has potential energy. Running down the tube to the nozzle, it speeds up and flies out as fast as a body would after falling from the same height: v = √(2gH) (Torricelli’s law). And flying up, the jet trades its speed for height again: it can rise just h = v²/(2g) = H — to the level of the water in the bottle, and no higher: there is no more energy to be had. It is the same law as in communicating vessels: water seeks one level. So a bottle below the nozzle gives no fountain at all — the water in the tube only rises to the level in the bottle.\n\nThe jet falls a little short of the level because of friction: the water rubs in the tube (the faster it flows, the more) and on the air. So the higher the bottle, the more centimetres the jet misses, though the share of the height stays almost the same.',
    ),
    say: both((l) => (correct === 'level' && last ? (l === 'uk' ? `Струмінь ледь не дістав рівня води в пляшці: ${cm(last.jet)} см із ${cm(last.head)}!` : `The jet nearly reached the water in the bottle: ${cm(last.jet)} cm of ${cm(last.head)}!`) : l === 'uk' ? 'Подивімося, на яку висоту бив фонтан.' : 'Let us look at how high the fountain went.')),
    text: both((l) => {
      if (!jets.length) return '';
      const uk = l === 'uk';
      const list = jets.map((x) => (uk ? `H = ${cm(x.head)} см — h = ${cm(x.jet)} см` : `H = ${cm(x.head)} cm — h = ${cm(x.jet)} cm`)).map(stepLine).join(';') + STEPS_END;
      const lost = jets.map((x) => `${cm(x.head - x.jet)} ${u(l)}`).join(', ');
      const tail = last
        ? uk
          ? ` Без тертя вода з-під ${cm(last.head)} см вилітала б зі швидкістю √(2gH) ≈ ${ms(last.ideal, l)} і злетіла б на всі ${cm(last.head)} см; насправді — ${ms(last.speed, l)}, а це v²/(2g) ≈ ${sig(riseHeight(last.speed, last.g) * 100, 3, l)} см: близько ${sig(last.loss * 100, 2, l)} см висоти «з’їло» тертя в трубці (течія в ній спокійна, ламінарна: число Рейнольдса ≈ ${Math.round(last.re)}, менше за 2300).`
          : ` Without friction the water from under ${cm(last.head)} cm would leave at √(2gH) ≈ ${ms(last.ideal, l)} and rise the whole ${cm(last.head)} cm; in fact at ${ms(last.speed, l)}, which is v²/(2g) ≈ ${sig(riseHeight(last.speed, last.g) * 100, 3, l)} cm: about ${sig(last.loss * 100, 2, l)} cm of height went into the tube’s friction (the flow in it is smooth, laminar: a Reynolds number of ≈ ${Math.round(last.re)}, below 2300).`
        : '';
      const head = uk ? `${below ? 'Пляшка нижче сопла — струменя немає: вода в трубці стала на рівні води в пляшці. ' : ''}${list}. Струмінь щоразу не добирав до рівня води в пляшці: ${lost}.` : `${below ? 'The bottle below the nozzle — no jet: the water in the tube stood at the level of the water in the bottle. ' : ''}${list}. Each time the jet fell short of the water in the bottle: ${lost}.`;
      return `${head}${tail}${uk ? ' (Опір повітря тут не враховано: справжній струмінь не добирає ще трохи.)' : ' (The air’s drag is left out here: a real jet falls a little shorter still.)'}`;
    }),
  };
};
