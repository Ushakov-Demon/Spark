import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, PLACE_KYIV, PLACE_NEW_YORK, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { airPlace, AIRSHIP, type AirWhere } from './bench.js';
import type { Locale } from '../../knowledge/i18n.js';
import { parsePlace } from '../../scenarios/place.js';
import { sig } from '../../explain/format.js';

export const preset_air_column: Preset = varied(
  {
    ask: { uk: 'Скільки важить повітря над кожним квадратним метром землі?', en: 'How much does the air above each square metre of ground weigh?' },
    id: 'air-column',
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Земля тримає повітря: тиск угорі й унизу', en: 'The Earth holds the air: the pressure up and down' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'air',
    choices: [ch('nothing', 'Майже нічого: повітря ж легке', 'Next to nothing: air is light'), ch('car', 'Близько тонни', 'About a tonne'), ch('tonnes', 'Близько 10 тонн', 'About 10 tonnes')],
    answerOnBoard: ['am:'],
    formulas: ['mechanics.pressure', 'mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'впливу земного тяжіння на організми, газову оболонку Землі' }],
    expect: 'reached',
  },
  {
    // The town: its height above the sea sets the readings (the higher the town, the less air above it).
    controls: [{ id: 'place', label: { uk: 'Місто', en: 'City' }, kind: 'place', value: PLACE_KYIV, en: PLACE_NEW_YORK }],
    build: (v) => {
      const value = String(v['place']);
      const name = parsePlace(value)?.name ?? 'Київ';
      return {
        question: {
          uk: `Чому повітря не розлітається в космос? Його тягне до себе Земля — і кожен шар повітря тисне на ті, що під ним. Візьмемо смартфон із барометром: подивимося тиск на 1-му поверсі багатоповерхівки (${name}), потім на 9-му, а тоді — з дирижабля над містом. Скільки ж важить стовп повітря над кожним квадратним метром землі?`,
          en: `Why does the air not fly off into space? The Earth pulls it — and each layer of air presses on the ones beneath. We take a smartphone with a barometer: read the pressure on the ground floor of a block of flats (${name}), then on the ninth floor, and then from an airship over the town. How much does the column of air above each square metre of ground weigh?`,
        },
        plan: (['ground', 'ninth', 'airship', 'high'] as const).map((where) => ({ kind: 'bench', command: { type: 'lab.air', place: value, where } }) as const),
      };
    },
  },
);

export const answer_air_column = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.air' && x.record.value !== null);
  const at = (w: AirWhere) => recs.find((x) => x.command['where'] === w)?.record ?? null;
  const town = airPlace(String(recs[0]?.command['place'] ?? ''));
  const p1 = at('ground');
  const p2 = at('ninth');
  const p3 = at('airship');
  const p4 = at('high');
  const g = p1?.inputs?.['g'] ?? 9.80665;
  const m = p1 ? p1.value! / g : null;
  const correct = m === null ? undefined : m > 5000 ? 'tonnes' : m > 300 ? 'car' : 'nothing';
  const hPa = (x: number, l: Locale) => `${sig(x / 100, 6, l)} ${l === 'uk' ? 'гПа' : 'hPa'}`;
  const rho = p1 && p2 ? (p1.value! - p2.value!) / (g * ((p2.inputs?.['height'] ?? 0) - (p1.inputs?.['height'] ?? 0))) : null;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? `Повітря — це речовина, і Земля притягує її, як і все інше. Якби не тяжіння, гази розлетілися б у космос; а так повітря лежить на Землі шаром, і кожен шар тисне на ті, що під ним, своєю вагою. Тому тиск повітря біля землі — це вага всього стовпа повітря над кожним квадратним метром: p = m·g / S. Що вище піднятися, то менше повітря лишається над головою — і то менший тиск; у місті високо в горах його менше вже на землі. Повітря внизу стиснуте вагою верхніх шарів, тому воно й густіше. Ми не відчуваємо цих тонн, бо повітря тисне на нас з усіх боків однаково, і так само тиснуть зсередини гази й рідини нашого тіла. А раз повітря має вагу, на тіла в ньому діє архімедова сила — вона й тримає дирижабль: гелій у його оболонці легший за повітря, яке він витісняє. (Звідси й жарт, від якого пішла назва гурту Led Zeppelin: «злетить, як свинцевий дирижабль» — свинець набагато густіший за повітря.)\n\nТиск тут розраховано для стандартної атмосфери — дня з «середньою» погодою; у справжній день барометр покаже на кілька гектопаскалів більше або менше, але різниця між висотами майже не зміниться. Висоту поверху (2,8 м) взято як оцінку: від неї залежить і обчислена густина.`
        : `Air is matter, and the Earth pulls it as it pulls everything. Without gravity the gases would fly off into space; as it is, the air lies on the Earth in a layer, and each layer presses with its weight on the ones beneath. So the air's pressure near the ground is the weight of the whole column of air above each square metre: p = m·g / S. The higher you go, the less air is left above — and the lower the pressure; a town high in the mountains has less of it on the ground already. The air below is squeezed by the weight of the layers above, so it is denser. We do not feel these tonnes because the air presses on us equally from every side, and the gases and liquids of our body press back from within. And since air has weight, bodies in it feel a buoyant force — that is what holds an airship up: the helium in its envelope is lighter than the air it pushes aside. (Hence the joke that named the band Led Zeppelin: “it would go over like a lead balloon” — lead is far denser than air.)\n\nThe pressure here is the standard atmosphere's — a day of "average" weather; on a real day the barometer shows a few hectopascals more or less, but the difference between heights hardly changes. The storey's height (2.8 m) is an estimate: the density worked out depends on it.`,
    ),
    say: both((l) => (m === null ? '' : l === 'uk' ? `Над кожним квадратним метром — ≈ ${sig(m / 1000, 2, l)} т повітря!` : `Above each square metre — ≈ ${sig(m / 1000, 2, l)} t of air!`)),
    text: both((l) => {
      if (!p1) return '';
      const uk = l === 'uk';
      const parts: string[] = [uk ? `${town.name}, ${Math.round(town.elevation ?? 0)} м над морем. На 1-му поверсі барометр показав ${hPa(p1.value!, l)} = ${sig(p1.value!, 5, l)} Па. Це вага повітря над кожним квадратним метром: m = p·S / g ≈ ${sig(m!, 3, l)} кг.` : `${town.name}, ${Math.round(town.elevation ?? 0)} m above the sea. On the ground floor the barometer showed ${hPa(p1.value!, l)} = ${sig(p1.value!, 5, l)} Pa. That is the weight of the air above each square metre: m = p·S / g ≈ ${sig(m!, 3, l)} kg.`];
      if (p2 && rho !== null) {
        const dp = p1.value! - p2.value!;
        const dh = (p2.inputs?.['height'] ?? 0) - (p1.inputs?.['height'] ?? 0);
        parts.push(uk ? `На 9-му поверсі, на ${sig(dh, 3, l)} м вище, — ${hPa(p2.value!, l)}: менше на ${sig(dp / 100, 3, l)} гПа. Стільки важить шар повітря завтовшки ${sig(dh, 3, l)} м, тож його густина ρ = Δp / (g·Δh) ≈ ${sig(rho, 3, l)} кг/м³ — кубометр повітря важить близько кілограма.` : `On the ninth floor, ${sig(dh, 3, l)} m higher, — ${hPa(p2.value!, l)}: ${sig(dp / 100, 3, l)} hPa less. That is the weight of a ${sig(dh, 3, l)} m layer of air, so its density ρ = Δp / (g·Δh) ≈ ${sig(rho, 3, l)} kg/m³ — a cubic metre of air weighs about a kilogram.`);
      }
      if (p3) parts.push(uk ? `З дирижабля на 300 м — ${hPa(p3.value!, l)}.` : `From the airship at 300 m — ${hPa(p3.value!, l)}.`);
      if (p4) parts.push(uk ? `На 2 км — ${hPa(p4.value!, l)}: ${sig(((p1.value! - p4.value!) / p1.value!) * 100, 2, l)} % повітря над містом лишилося внизу.` : `At 2 km — ${hPa(p4.value!, l)}: ${sig(((p1.value! - p4.value!) / p1.value!) * 100, 2, l)} % of the air above the town is left below.`);
      if (rho !== null) parts.push(uk ? `Дирижабль на зразок Zeppelin NT витісняє ${sig(AIRSHIP.volume.value, 4, l)} м³ повітря — за нашою густиною це ≈ ${sig((AIRSHIP.volume.value * rho) / 1000, 2, l)} т; така й архімедова сила, що його тримає.` : `An airship like the Zeppelin NT pushes aside ${sig(AIRSHIP.volume.value, 4, l)} m³ of air — by our density ≈ ${sig((AIRSHIP.volume.value * rho) / 1000, 2, l)} t; such is the buoyant force that holds it.`);
      return parts.join(' ');
    }),
  };
};
