import { groundDistance } from '../../domains/mechanics/formulas.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { parsePlace } from '../../scenarios/place.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, PLACE_KYIV, PLACE_NEW_YORK, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { PLACE_BOSTON, PLACE_LVIV, scaleText } from './bench.js';
import { km } from './words.js';

export const preset_map_scale: Preset = varied(
  {
    id: 'map-scale',
    ask: { uk: 'На якій карті відстань між містами вийде точнішою?', en: 'On which map does the distance between the towns come out more precisely?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Відстань за картою: масштаб', en: 'A distance by the map: the scale' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'map',
    choices: [
      ch('large', 'На карті крупнішого масштабу (менше N): міліметр лінійки там — менше кілометрів', 'On the larger-scale map (smaller N): a millimetre of the ruler is fewer kilometres there'),
      ch('small', 'На карті дрібнішого масштабу: міста там ближче, міряти легше', 'On the smaller-scale map: the towns are closer there, easier to measure'),
      ch('same', 'Однаково: масштаб усе одно перераховує точно', 'The same: the scale converts exactly anyway'),
    ],
    asides: [
      {
        uk: '1648 року французький інженер і картограф Гійом Левассер де Боплан видав «Генеральну карту Дикого Поля, у простій мові — України» з докладно позначеними кордонами. Згодом голландець Віллем Гондіус вигравіював дві його карти — у масштабах 1 : 452 000 і 1 : 1 800 000. А 1660 року Боплан видав книжку «Опис України».',
        en: 'In 1648 the French engineer and cartographer Guillaume Le Vasseur de Beauplan published the «General Map of the Wild Fields, in common speech Ukraine», with its borders drawn in detail. Later the Dutchman Willem Hondius engraved two of his maps — at scales of 1 : 452,000 and 1 : 1,800,000. And in 1660 Beauplan published his book «Description d’Ukranie».',
      },
    ],
    formulas: ['mechanics.map-scale'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: … відстаней на планах і картах' }],
    expect: 'reached',
  },
  {
    // Any two towns (found by name, online) and any two maps.
    controls: [
      { id: 'from', label: { uk: 'Звідки', en: 'From' }, kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK },
      { id: 'to', label: { uk: 'Куди', en: 'To' }, kind: 'place', value: PLACE_LVIV, en: PLACE_BOSTON },
      { id: 'scale1', label: { uk: 'Перша карта, 1 :', en: 'The first map, 1 :' }, kind: 'number', unit: '', min: 1, max: 1e9, step: 0, value: 2_000_000 },
      { id: 'scale2', label: { uk: 'Друга карта, 1 :', en: 'The second map, 1 :' }, kind: 'number', unit: '', min: 1, max: 1e9, step: 0, value: 10_000_000 },
    ],
    build: (v) => {
      const from = String(v['from']);
      const to = String(v['to']);
      const s1 = Number(v['scale1']);
      const s2 = Number(v['scale2']);
      const a = parsePlace(from)?.name ?? '?';
      const b = parsePlace(to)?.name ?? '?';
      return {
        question: {
          uk: `Дві карти: ${scaleText(s1, true)} і ${scaleText(s2, true)}. На кожній лінійкою виміряємо відстань від ${a} до ${b} і за масштабом перерахуємо в кілометри, а тоді порівняємо зі справжньою відстанню — за координатами міст. На якій карті відстань між містами вийде точнішою?`,
          en: `Two maps: ${scaleText(s1, false)} and ${scaleText(s2, false)}. On each we measure the distance from ${a} to ${b} with a ruler and convert it to kilometres by the scale, then compare with the real distance — by the towns’ coordinates. On which map does the distance between the towns come out more precisely?`,
        },
        plan: [s1, s2].map((scale) => ({ kind: 'bench', command: { type: 'lab.map', from, to, scale } }) as const),
      };
    },
  },
);

export const answer_map_scale = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.map' && x.record.value !== null);
  const rows = R.map((x) => {
    const N = Number(x.command['scale']);
    const l = x.record.value!;
    return { N, l, L: groundDistance(l, N), pm: 0.0005 * N, truth: x.record.inputs?.['ground'] ?? 0 };
  });
  const [m1, m2] = rows;
  const correct = !m1 || !m2 ? undefined : m1.N === m2.N ? 'same' : 'large';
  const truth = m1?.truth ?? 0;
  const from = String(R[0]?.command['from'] ?? '');
  const to = String(R[0]?.command['to'] ?? '');
  const names = `${parsePlace(from)?.name ?? '?'} — ${parsePlace(to)?.name ?? '?'}`;
  const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
  const pm = (x: number, l: Locale) => `± ${new Intl.NumberFormat(l === 'uk' ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 3 }).format(x / 1000)} ${l === 'uk' ? 'км' : 'km'}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Масштаб 1 : N означає, що все на карті в N разів менше, ніж на місцевості, тож відстань L = l·N. Сам перерахунок точний — але лінійка ні: на око ми читаємо її до міліметра, тобто помиляємося на пів міліметра в той чи інший бік. На карті ця похибка теж множиться на N. На карті 1 : 2 000 000 міліметр — це 2 км, на 1 : 10 000 000 — уже 10 км. Тому що крупніший масштаб (що менше N), то точніша відстань — і то більше подробиць уміщує карта. Зате карта дрібного масштабу вміщує більше місцевості.\n\nСправжню відстань між містами рахують за їхніми широтами й довготами — як дугу на кулі-Землі. Шлях дорогою довший: дороги не йдуть по прямій.'
        : 'A scale of 1 : N means everything on the map is N times smaller than on the ground, so the distance L = l·N. The conversion itself is exact — but the ruler is not: by eye we read it to a millimetre, so we are off by half a millimetre one way or the other. On the map this error is multiplied by N too. On a 1 : 2,000,000 map a millimetre is 2 km, on 1 : 10,000,000 already 10 km. So the larger the scale (the smaller N), the more precise the distance — and the more detail the map holds. But a small-scale map holds more ground.\n\nThe real distance between towns is reckoned from their latitudes and longitudes — as an arc on the ball of the Earth. The way by road is longer: roads do not run straight.',
    ),
    say: both((l) => (m1 && m2 ? (l === 'uk' ? `Справжня відстань ${names} — ${km(truth, Math.min(m1.N, m2.N), l)}: ${m1.N < m2.N ? 'перша' : 'друга'} карта ближча до неї.` : `The real distance ${names} is ${km(truth, Math.min(m1.N, m2.N), l)}: the ${m1.N < m2.N ? 'first' : 'second'} map comes nearer.`) : '')),
    text: both((l) => {
      if (!rows.length) return '';
      const uk = l === 'uk';
      const list = rows.map((x) => (uk ? `${scaleText(x.N, true)}: на карті ${cm(x.l, l)} → ${km(x.L, x.N, l)} ${pm(x.pm, l)}` : `${scaleText(x.N, false)}: ${cm(x.l, l)} on the map → ${km(x.L, x.N, l)} ${pm(x.pm, l)}`));
      return uk
        ? `${names}:${list.map(stepLine).join(';') + STEPS_END}. Справжня відстань за координатами — ${km(truth, 1000, l)} (по поверхні Землі, середній радіус 6371 км; спотворення карти не враховано).`
        : `${names}:${list.map(stepLine).join(';') + STEPS_END}. The real distance by the coordinates is ${km(truth, 1000, l)} (over the Earth’s surface, a mean radius of 6371 km; the map’s distortions left out).`;
    }),
  };
};
