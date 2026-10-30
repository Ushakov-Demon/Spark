import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { SNAIL_TIME, type SnailSurface, snailSurfaceName } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_snail_speed: Preset = {
  ask: { uk: 'Де равлик повзе найповільніше?', en: 'Where does the snail crawl slowest?' },
  id: 'snail-speed',
  grade: 7,
  topic: MOTION,
  title: { uk: 'Рух тварин: як швидко повзе равлик', en: 'How animals move: how fast a snail crawls' },
  question: {
    uk: 'Садовий равлик повзе поруч із лінійкою, а ми знімаємо його на телефон 30 секунд — так роблять і дослідники. Потім за відео дізнаємося, скільки міліметрів він проповз. Чотири поверхні: горизонтальний пластиковий аркуш, той самий аркуш вертикально (равлик повзе вгору), мокрий аркуш і шорсткий наждачний папір. Де равлик повзе найповільніше?',
    en: 'A garden snail crawls beside a ruler, and we film it on a phone for 30 seconds — as researchers do. Then the video tells how many millimetres it went. Four surfaces: a horizontal plastic sheet, the same sheet upright (the snail crawls up), the sheet wet, and rough sandpaper. Where does the snail crawl slowest?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'snail',
  plan: (['flat', 'wall', 'wet', 'sandpaper'] as const).map((surface) => ({ kind: 'bench', command: { type: 'lab.snail', surface } }) as const),
  choices: [ch('sandpaper', 'На шорсткому наждачному папері', 'On rough sandpaper'), ch('wall', 'Угору по вертикальній стінці', 'Up the vertical wall'), ch('wet', 'По мокрому аркушу', 'On the wet sheet')],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'related', quote: 'моделювання: відносності руху; реальних природних рухів; рухів тварин і рослин' }],
  expect: 'reached',
};

export const answer_snail_speed = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.snail' && x.record.value !== null).map((x) => ({ surface: String(x.command['surface']) as SnailSurface, l: x.record.value!, t: x.record.inputs?.['time'] ?? SNAIL_TIME }));
  const slowest = [...R].sort((a, b) => a.l - b.l)[0];
  const mm = (x: number) => Math.round(x * 1000);
  const v = (x: { l: number; t: number }, l: Locale) => `${sig((x.l * 1000) / x.t, 2, l)} ${l === 'uk' ? 'мм/с' : 'mm/s'}`;
  return {
    ...(slowest ? { correct: slowest.surface === 'sandpaper' ? 'sandpaper' : slowest.surface } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Равлик повзе на одній «нозі»: м’язи в ній по черзі скорочуються, і вздовж підошви біжать хвилі. Під підошвою — тонкий шар слизу, і ці хвилі, відштовхуючись через нього від поверхні, штовхають равлика вперед. Слиз незвичайний: у спокої тримає, як клей, а під натиском тече, як рідина. На шорсткому наждаку равлик повзе майже вдвічі повільніше: дослідники припускають, що шорсткість заважає слизу триматися й равлику доводиться виділяти його більше. Угору по стінці він ще й тримає власну вагу, тож трохи повільніший; на мокрому вода, ймовірно, розріджує слиз. Це середні значення для 87 равликів із дослідження: окремі равлики повзуть швидше чи повільніше. 1,5 мм/с — це близько 5 метрів за годину.'
        : 'A snail crawls on a single «foot»: its muscles contract in turn, and waves run along the sole. Under the sole is a thin layer of mucus, and the waves, pushing off the surface through it, move the snail forward. The mucus is unusual: at rest it holds like glue, under stress it flows like a liquid. On rough sandpaper the snail crawls almost half as fast: the researchers suggest the roughness keeps the mucus from holding, and the snail has to make more of it. Up a wall it also holds its own weight, so it is a little slower; on a wet sheet water likely thins the mucus. These are the means of 87 snails in the study: single snails crawl faster or slower. 1.5 mm/s is about 5 metres an hour.',
    ),
    say: both((l) => (slowest ? (l === 'uk' ? `Найповільніше — ${tr(snailSurfaceName(slowest.surface), l)}: ${mm(slowest.l)} мм за 30 с, ${v(slowest, l)}.` : `Slowest — ${tr(snailSurfaceName(slowest.surface), l)}: ${mm(slowest.l)} mm in 30 s, ${v(slowest, l)}.`) : '')),
    text: both((l) => {
      const s = `${R.map((x) => `${tr(snailSurfaceName(x.surface), l)} — ${mm(x.l)} ${l === 'uk' ? 'мм за 30 с' : 'mm in 30 s'}, ${v(x, l)}`).map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (l === 'uk' ? ' Середні з дослідження Pembury Smith і Ruxton (2021).' : ' The means from Pembury Smith and Ruxton’s study (2021).');
    }),
  };
};
