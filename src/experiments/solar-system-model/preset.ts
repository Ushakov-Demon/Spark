import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { sig } from '../../explain/format.js';
import { modelScale, planetIds } from './bench.js';

export const preset_solar_system_model: Preset = {
  ask: { uk: 'Якщо Сонце — м’яч завбільшки 20 см, то де й якою буде Земля?', en: 'If the Sun is a 20 cm ball, where is the Earth and how big?' },
  id: 'solar-system-model',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Модель Сонячної системи', en: 'A model of the Solar System' },
  question: {
    uk: 'Зробимо модель Сонячної системи, де все — у тому самому масштабі: і розміри, і відстані. Сонце — м’яч діаметром 20 см на шкільному стадіоні. Розміри й відстані планет беремо з таблиці NASA. Де ж ляже Земля і якою вона буде?',
    en: 'Let us make a model of the Solar System with everything at one scale: the sizes and the distances. The Sun is a 20 cm ball on the school field. The planets’ sizes and distances come from NASA’s table. Where will the Earth lie, and how big will it be?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'planets',
  plan: (['ball', 'inner', 'outer', 'kepler', 'voyager'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.planets', step } }) as const),
  choices: [ch('ball', 'Кулька діаметром 2 см за 2 м від м’яча', 'A 2 cm ball 2 m from the Sun-ball'), ch('grain', 'Крупинка діаметром 2 мм за 20 м', 'A 2 mm grain 20 m away'), ch('near', 'Крупинка діаметром 2 мм за 2 м', 'A 2 mm grain 2 m away')],
  answerOnBoard: ['pe:'],
  formulas: ['mechanics.kepler-third'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'моделювання: руху планет' }],
  expect: 'reached',
};

export const answer_solar_system_model = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.planets' && x.record.value !== null);
  const ids = planetIds();
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const earth = of('inner').find((r) => ids[r.inputs?.['planet'] ?? -1] === 'earth');
  const L = earth?.value ?? null;
  const d = earth?.inputs?.['size'] ?? 0;
  const correct = L === null ? undefined : L > 10 ? 'grain' : d > 0.01 ? 'ball' : 'near';
  const kep = of('kepler').map((r) => r.value!);
  const neptune = of('outer').find((r) => ids[r.inputs?.['planet'] ?? -1] === 'neptune');
  const voyager = of('voyager')[0];
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'На малюнках у підручниках планети намальовано поруч і великими — інакше їх і не видно було б. Насправді Сонячна система майже порожня: Сонце в сто разів більше за Землю, а Земля від нього — за сотню його поперечників. Тому в чесній моделі Земля — крупинка за двадцять метрів від м’яча, а Нептун — аж за пів кілометра.\n\nА рухаються планети за точним правилом. Що далі планета від Сонця, то довшу орбіту вона проходить — і то повільніше, бо Сонце притягує її слабше. Разом це дає третій закон Кеплера: T²/a³ однакове для всіх планет. Кеплер знайшов його 1619 року, перебираючи спостереження, а пояснив закон всесвітнього тяжіння.'
        : 'In textbook pictures the planets are drawn side by side and big — or they would not show at all. In truth the Solar System is nearly empty: the Sun is a hundred times bigger than the Earth, and the Earth is a hundred of its diameters away. So in an honest model the Earth is a grain twenty metres from the ball, and Neptune half a kilometre off.\n\nAnd the planets move by an exact rule. The further a planet is from the Sun, the longer its orbit — and the slower it goes, as the Sun pulls it more weakly. Together that gives Kepler’s third law: T²/a³ is the same for all the planets. Kepler found it in 1619, sifting through observations; the law of gravitation explained it.',
    ),
    say: both((l) => (l === 'uk' ? 'Ось ми. Ця крихітна блакитна цятка — Земля.' : 'That’s here. That tiny pale blue dot is the Earth.')),
    text: both((l) => {
      if (L === null) return '';
      const uk = l === 'uk';
      const parts = [uk ? `Масштаб — 1 : ${sig(1 / modelScale() / 1e9, 2, l)} млрд. Земля — крупинка ${sig(d * 1000, 2, l)} мм за ${sig(L, 3, l)} м від м’яча — трохи менша за пшоняне зернятко (2,1–2,3 мм).` : `The scale is 1 : ${sig(1 / modelScale() / 1e9, 2, l)} bn. The Earth is a ${sig(d * 1000, 2, l)} mm grain ${sig(L, 3, l)} m from the ball — a little smaller than a millet grain (2.1–2.3 mm).`];
      if (neptune) parts.push(uk ? `Нептун — за ${sig(neptune.value!, 3, l)} м.` : `Neptune — ${sig(neptune.value!, 3, l)} m away.`);
      const f2 = (x: number) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
      if (kep.length) parts.push(uk ? `T²/a³ для всіх восьми планет — від ${f2(Math.min(...kep))} до ${f2(Math.max(...kep))}: майже однакове, як і каже третій закон Кеплера, хоча відстані планет різняться в 78 разів.` : `T²/a³ for all eight planets — from ${f2(Math.min(...kep))} to ${f2(Math.max(...kep))}: nearly the same, as Kepler’s third law says, though the planets’ distances differ 78 times.`);
      if (voyager) parts.push(uk ? `«Вояджер-1» 14 лютого 1990 року був у моделі за ${sig(voyager.value!, 3, l)} м. Звідти Земля — та сама крупинка в 1,8 мм; на знімку, який він зробив, вона займає 0,12 пікселя. Карл Саган, з чиєї ідеї зроблено знімок, сказав про цю цятку: «Це тут. Це дім. Це ми».` : `Voyager 1 on 14 February 1990 was ${sig(voyager.value!, 3, l)} m off in the model. From there the Earth is the same 1.8 mm grain; on the picture it took, it fills 0.12 of a pixel. Carl Sagan, whose idea the picture was, said of the dot: “That’s here. That’s home. That’s us.”`);
      return parts.join(' ');
    }),
  };
};
