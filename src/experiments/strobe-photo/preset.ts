import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale } from '../../knowledge/i18n.js';
import { STROBE_INTERVAL, STROBE_SCALE } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_strobe_photo: Preset = {
  ask: { uk: 'Як за стробоскопічним фото дізнатися, як рухалася кулька?', en: 'How can a stroboscopic photo tell how the ball moved?' },
  id: 'strobe-photo',
  grade: 7,
  topic: MOTION,
  title: { uk: 'Стробоскопічне фото: відстані й швидкість', en: 'A stroboscopic photo: distances and speed' },
  question: {
    uk: 'Кульку з лабораторної роботи № 1 сфотографували в темряві під стробоскопом: він спалахує 4 рази на секунду, і кожен спалах лишає на фото зображення кульки. Фото в масштабі 1 : 5 — у п’ять разів менше за натуру. Перше фото — кулька котиться по столу, скотившись із жолоба; друге — вона скочується жолобом без початкової швидкості. Прикладаємо лінійку й вимірюємо проміжки між зображеннями. Як за стробоскопічним фото дізнатися, як рухалася кулька?',
    en: 'The ball of lab work 1 was photographed in the dark under a stroboscope: it flashes four times a second, and each flash leaves an image of the ball on the photo. The photo is 1 : 5 — five times smaller than life. The first photo: the ball rolls along the table, down from the groove; the second: it rolls down the groove from rest. We put a ruler to it and measure the gaps between the images. How can a stroboscopic photo tell how the ball moved?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'strobe',
  plan: (['table', 'groove'] as const).map((photo) => ({ kind: 'bench', command: { type: 'lab.strobe', photo } }) as const),
  choices: [ch('gaps', 'За проміжками між зображеннями: рівні — рух рівномірний; а відстань у натурі, поділена на час між спалахами, — це швидкість', 'By the gaps between the images: equal ones — uniform motion; and the real distance over the time between flashes is the speed'), ch('size', 'За розміром зображень: що більші, то швидше рухалася кулька', 'By the images’ size: the bigger, the faster the ball moved'), ch('cant', 'Ніяк: на фото немає часу, потрібен секундомір', 'No way: a photo has no time, a stopwatch is needed')],
  answerOnBoard: ['sv:'],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: … відстаней на планах і картах та стробоскопічних фотографіях' }],
  expect: 'reached',
};

export const answer_strobe_photo = (run: PresetRun): PresetAnswer => {
  const gaps = (photo: string) => (run.readings ?? []).filter((x) => x.command.type === 'lab.strobe' && x.command['photo'] === photo && x.record.value !== null).map((x) => x.record.value!);
  const table = gaps('table');
  const groove = gaps('groove');
  const mm = (x: number) => Math.round(x * 1000);
  const real = (x: number, l: Locale) => `${sig(x * STROBE_SCALE * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const ms = (x: number, l: Locale) => `${sig((x * STROBE_SCALE) / STROBE_INTERVAL, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
  const equal = table.length > 1 && table.every((x) => Math.abs(x - table[0]!) < 0.0015);
  const growing = groove.length > 1 && groove.every((x, i) => i === 0 || x > groove[i - 1]!);
  return {
    ...(equal && growing ? { correct: 'gaps' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Стробоскоп спалахує через рівні проміжки часу — тут кожні 0,25 с, — і фото зберігає, де була кулька в кожну з цих миттєвостей. Тож проміжок між сусідніми зображеннями — це шлях за 0,25 с. Фото зменшене в 5 разів: виміряне лінійкою множимо на 5 — і маємо відстань у натурі; поділивши її на 0,25 с, — швидкість. На столі проміжки рівні: кулька рухалася рівномірно. На жолобі вони ростуть — приблизно як 1 : 3 : 5 : 7, — кулька розганялася, і її середня швидкість на кожному проміжку більша за попередню. Так само вимірюють відстані на картах і планах: масштаб 1 : 100 000 означає, що 1 см на карті — це 1 км на місцевості.'
        : 'The stroboscope flashes at equal intervals — here every 0.25 s — and the photo keeps where the ball was at each of those instants. So the gap between neighbouring images is the path in 0.25 s. The photo is 5 times smaller: what the ruler gives times 5 is the real distance; divided by 0.25 s — the speed. On the table the gaps are equal: the ball moved uniformly. In the groove they grow — about as 1 : 3 : 5 : 7 — the ball was speeding up, its average speed on each gap greater than on the one before. Distances on maps and plans are measured the same way: a scale of 1 : 100 000 means 1 cm on the map is 1 km on the ground.',
    ),
    say: both((l) => (table.length ? (l === 'uk' ? `На столі проміжки рівні — по ${mm(table[0]!)} мм на фото, ${real(table[0]!, l)} у натурі за 0,25 с: ${ms(table[0]!, l)}.` : `On the table the gaps are equal — ${mm(table[0]!)} mm on the photo each, ${real(table[0]!, l)} in life in 0.25 s: ${ms(table[0]!, l)}.`) : '')),
    text: both((l) => {
      const uk = l === 'uk';
      const list = (g: number[]) => g.map((x) => `${mm(x)}`).join(', ') + (uk ? ' мм' : ' mm');
      return uk
        ? `На столі: ${list(table)} на фото — у натурі по ${real(table[0] ?? 0, l)} за 0,25 с, v ≈ ${ms(table[0] ?? 0, l)}, рух рівномірний. На жолобі: ${list(groove)} — у натурі ${groove.map((x) => real(x, l)).join(', ')}, середня швидкість на проміжках ${groove.map((x) => ms(x, l)).join(', ')}: кулька розганялася.`
        : `On the table: ${list(table)} on the photo — ${real(table[0] ?? 0, l)} in life each in 0.25 s, v ≈ ${ms(table[0] ?? 0, l)}, uniform motion. In the groove: ${list(groove)} — in life ${groove.map((x) => real(x, l)).join(', ')}, the average speed on the gaps ${groove.map((x) => ms(x, l)).join(', ')}: the ball was speeding up.`;
    }),
  };
};
