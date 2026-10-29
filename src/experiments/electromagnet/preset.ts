import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MAGNETIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { earthField, modelYear } from '../../domains/electrical/wmm.js';
import type { Locale } from '../../knowledge/i18n.js';
import { parsePlace } from '../../scenarios/place.js';
import { sig } from '../../explain/format.js';

/** The electromagnet's examples: where the Earth's field is taken unless another city is given. */
const MAGNET_KYIV = 'Київ|50.4500|30.5200';
const MAGNET_NEW_YORK = 'New York|40.7128|-74.0060';

export const preset_electromagnet: Preset = varied(
  {
    id: 'electromagnet',
    ask: { uk: 'Що робить електромагніт сильнішим?', en: 'What makes an electromagnet stronger?' },
    grade: 9,
    topic: MAGNETIC,
    title: { uk: 'Робимо електромагніт', en: 'Making an electromagnet' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'magnet',
    choices: [ch('both', 'І більший струм, і залізне осердя', 'Both a larger current and an iron core'), ch('current', 'Лише більший струм', 'Only a larger current'), ch('core', 'Лише залізне осердя', 'Only an iron core')],
    choicesAt: 'end',
    answerOnBoard: ['mB:'],
    formulas: ['electrical.compass-field'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 9, item: 'ЛР № 4', topic: 'Тема 2. Магнітні та електромагнітні явища', match: 'same', quote: '№ 4. Виготовлення електромагніта та вивчення його магнітного поля.' }],
    expect: 'reached',
  },
  {
    // How many turns are wound on the nail: the field grows with them as with the current. Where the lab is: the
    // Earth's field that holds the needle north differs from place to place (Kyiv and New York — examples).
    controls: [
      { id: 'turns', label: { uk: 'Витків на цвяху', en: 'Turns on the nail' }, kind: 'number', unit: '', min: 50, max: 150, step: 50, value: 100 },
      { id: 'place', label: { uk: 'Місто', en: 'City' }, kind: 'place', value: MAGNET_KYIV, en: MAGNET_NEW_YORK },
    ],
    build: (v) => {
      const turns = Number(v['turns']);
      const place = parsePlace(v['place']) ?? parsePlace(MAGNET_KYIV)!;
      const example = v['place'] === MAGNET_KYIV || v['place'] === MAGNET_NEW_YORK;
      const earth = earthField(place.lat, place.lon, modelYear(new Date())).h;
      const uT = (l: 'uk' | 'en') => (earth * 1e6).toFixed(1).replace('.', l === 'uk' ? ',' : '.');
      const at = { place: place.name, earth, ...(example ? { example: true } : {}) };
      return {
        question: {
          uk: `Намотаємо на сталевий цвях ${turns} витків ізольованого дроту й увімкнемо котушку в коло з джерелом, ключем, реостатом і амперметром. Котушку покладемо віссю зі сходу на захід, а на її осі, за 15 см від середини, поставимо компас: без струму його стрілка дивиться на північ — її тримає поле Землі (${place.name}${example ? ', для прикладу' : ''}: його горизонтальна складова ≈ ${uT('uk')} мкТл). Пускатимемо струм 0,5, 1 і 1,5 А й записуватимемо, на скільки градусів відхилилася стрілка. Тоді змінимо напрям струму, а наостанок витягнемо цвях. Що робить електромагніт сильнішим?`,
          en: `We wind ${turns} turns of insulated wire on a steel nail and connect the coil into a circuit with a source, a key, a rheostat and an ammeter. The coil lies with its axis east–west, and on its axis, 15 cm from its middle, stands a compass: with no current its needle looks north — the Earth’s field holds it there (${place.name}${example ? ', for example' : ''}: its horizontal part ≈ ${uT('en')} µT). We let 0.5, 1 and 1.5 A through and write down how many degrees the needle turned. Then we reverse the current, and at last pull the nail out. What makes an electromagnet stronger?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.magnet', current: 0, turns, core: true, ...at } },
          ...[0.5, 1, 1.5].map((current) => ({ kind: 'bench', command: { type: 'lab.magnet', current, turns, core: true, ...at } }) as const),
          { kind: 'bench', command: { type: 'lab.magnet', current: 1.5, turns, core: true, reversed: true, ...at } },
          { kind: 'bench', command: { type: 'lab.magnet', current: 1.5, turns, core: false, ...at } },
        ],
      };
    },
  },
);

export const answer_electromagnet = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.magnet' && x.record.quantity === 'angle' && x.record.value !== null);
  const at = (current: number, core: boolean, reversed = false) => R.find((x) => Number(x.command['current']) === current && !!x.command['core'] === core && !!x.command['reversed'] === reversed)?.record;
  const earth = R[0]?.record.inputs?.['earth'] ?? 19.4e-6;
  const B = (deg: number) => earth * Math.tan((deg * Math.PI) / 180);
  const steps = [0.5, 1, 1.5].map((I) => ({ I, deg: at(I, true)?.value ?? 0 }));
  const back = at(1.5, true, true)?.value ?? 0;
  const bare = at(1.5, false)?.value ?? 0;
  const full = steps[2]!.deg;
  // A change counts if it is more than a compass division.
  const div = R[0]?.record.inputs?.['division'] ?? 2;
  const byCurrent = full - steps[0]!.deg > div;
  const byCore = full - bare > div;
  const correct = !R.length ? undefined : byCurrent && byCore ? 'both' : byCurrent ? 'current' : byCore ? 'core' : undefined;
  const deg = (x: number) => `${x}°`;
  const uT = (x: number, l: Locale) => `${sig(x * 1e6, 2, l)} ${l === 'uk' ? 'мкТл' : 'µT'}`;
  const A = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'А' : 'A'}`;
  const list = (l: Locale) => steps.map((x) => `${A(x.I, l)} — ${deg(x.deg)} (B ≈ ${uT(B(x.deg), l)})`).join('; ');
  const turns = Number(R[0]?.command['turns'] ?? 100);
  const place = String(R[0]?.command['place'] ?? 'Київ');
  const where = (l: Locale) => `${place}${R[0]?.command['example'] ? (l === 'uk' ? ', для прикладу' : ', for example') : ''}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Струм у дроті створює магнітне поле, і поле кожного витка додається до поля інших — тому воно пропорційне силі струму й числу витків. Але сама котушка — слабкий магніт. Залізо ж складається з крихітних «магнітиків», які в полі котушки повертаються вздовж нього й додають своє поле — у десятки разів сильніше. Звідси й сила електромагніта. Змінимо напрям струму — поле котушки, а з ним і цвяха, повернеться навпаки: північний і південний полюси поміняються місцями.'
        : 'The current in the wire makes a magnetic field, and each turn’s field adds to the others’ — so it is proportional to the current and to the number of turns. But the coil alone is a weak magnet. Iron, though, is made of tiny “magnets” that turn along the coil’s field and add their own — tens of times stronger. That is where the electromagnet’s strength comes from. Reverse the current — the coil’s field, and the nail’s with it, turns the other way: the north and south poles swap.',
    ),
    say: both((l) => (correct === 'both' ? (l === 'uk' ? `Струм утричі більший — поле втричі сильніше, а без цвяха стрілка ледь ворухнулася!` : `Three times the current — three times the field, and without the nail the needle hardly moved!`) : l === 'uk' ? 'Подивімося, що показав компас.' : 'Let us look at the compass.')),
    text: both((l) =>
      l === 'uk'
        ? `${turns} витків на цвяху. Без струму стрілка дивилася на північ. Зі струмом: ${list(l)} — поле B = B_З·tg θ (B_З ≈ ${uT(earth, l)}: ${where(l)}) зростало пропорційно силі струму, хоч кут — ні. Струм в інший бік — стрілка відхилилася на ${deg(Math.abs(back))}${back < 0 ? ', але в інший бік' : ''}: полюси електромагніта помінялися місцями. Без цвяха за того самого струму ${A(1.5, l)} стрілка ${Math.abs(bare) < div ? `майже не ворухнулася (${deg(Math.abs(bare))})` : `відхилилася лише на ${deg(Math.abs(bare))}`}: залізне осердя підсилює поле в десятки разів.`
        : `${turns} turns on the nail. With no current the needle looked north. With a current: ${list(l)} — the field B = B_E·tg θ (B_E ≈ ${uT(earth, l)}: ${where(l)}) grew in proportion to the current, though the angle did not. The current reversed — the needle turned ${deg(Math.abs(back))}${back < 0 ? ', but the other way' : ''}: the electromagnet’s poles swapped. Without the nail at the same ${A(1.5, l)} the needle ${Math.abs(bare) < div ? `hardly moved (${deg(Math.abs(bare))})` : `turned only ${deg(Math.abs(bare))}`}: the iron core strengthens the field tens of times.`,
    ),
  };
};
