import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, MOTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type SinkLiquid, sinkLiquidName } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_bubble_speed: Preset = varied(
  {
    id: 'bubble-speed',
    ask: { uk: 'Чи залежить швидкість бульбашки від її розміру?', en: 'Does a bubble’s speed depend on its size?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Бульбашка в пляшці: рівномірний рух', en: 'A bubble in a bottle: uniform motion' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'sink',
    benchSetup: { uk: 'Прозора пляшка (0,5 л) густої рідини для миття посуду з позначками, лінійка, секундомір', en: 'A clear 0.5 L bottle of thick washing-up liquid with marks, a ruler, a stopwatch' },
    choices: [ch('bigger', 'Більша бульбашка спливає швидше', 'A bigger bubble rises faster'), ch('same', 'Не залежить', 'It does not'), ch('smaller', 'Менша бульбашка спливає швидше', 'A smaller bubble rises faster')],
    choicesAt: 'end',
    answerOnBoard: ['bv:'],
    formulas: ['mechanics.speed'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'Дослідження • виявлення пропорційної залежності між величинами, що описують прямолінійний рівномірний рух', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 8, дослідження: «Знайдіть швидкість її руху. Чи залежить швидкість руху бульбашки від її розмірів?»' } }],
    expect: 'reached',
  },
  {
    // The liquid: the textbook's washing-up liquid (its viscosity an estimate) or glycerol (a table's).
    controls: [{ id: 'liquid', label: { uk: 'Рідина в пляшці', en: 'The liquid in the bottle' }, kind: 'choice', options: [ch('washing-up', 'Рідина для миття посуду', 'Washing-up liquid'), ch('glycerol', 'Гліцерин', 'Glycerol')], value: 'washing-up' }],
    build: (v) => {
      const liquid = String(v['liquid']) as 'washing-up' | 'glycerol';
      const marks = [0.03, 0.06, 0.09, 0.12];
      const what = liquid === 'glycerol' ? { uk: 'гліцерину', en: 'glycerol' } : { uk: 'густої рідини для миття посуду', en: 'thick washing-up liquid' };
      return {
        question: {
          uk: `Прозора пляшка ${what.uk}, на ній — позначки через 3 см. Перевернемо її й стежитимемо за маленькою бульбашкою повітря (≈ 2 мм): запустимо секундомір, коли вона мине нульову позначку, і засікатимемо час на позначках 3, 6, 9 і 12 см. Тоді — те саме з більшою бульбашкою (≈ 4 мм). Чи залежить швидкість бульбашки від її розміру?`,
          en: `A clear bottle of ${what.en} with marks every 3 cm. We turn it over and watch a small air bubble (≈ 2 mm): start the stopwatch as it passes the zero mark and note the time at 3, 6, 9 and 12 cm. Then the same with a bigger bubble (≈ 4 mm). Does a bubble’s speed depend on its size?`,
        },
        plan: [0.002, 0.004].map((diameter) => ({ kind: 'bench', command: { type: 'lab.sink', body: 'bubble', diameter, liquid, marks } }) as const),
      };
    },
  },
);

export const answer_bubble_speed = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.sink' && x.record.value !== null);
  const sizes = [...new Set(R.map((x) => Number(x.command['diameter'])))].sort((a, b) => a - b);
  const per = sizes.map((d) => {
    const laps = R.filter((x) => Number(x.command['diameter']) === d && x.record.quantity === 'time').map((x) => ({ s: x.record.inputs?.['mark'] ?? 0, t: x.record.value! }));
    const vs = laps.filter((x) => x.t > 0).map((x) => x.s / x.t);
    const v = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
    return { d, laps, v, spread: vs.length ? (Math.max(...vs) - Math.min(...vs)) / v : 0 };
  });
  const [small, big] = [per[0], per[per.length - 1]];
  const correct = !small || !big || small === big ? undefined : big.v > small.v * 1.05 ? 'bigger' : small.v > big.v * 1.05 ? 'smaller' : 'same';
  const cmS = (v: number, l: Locale) => `${sig(v * 100, 2, l)} ${l === 'uk' ? 'см/с' : 'cm/s'}`;
  const s = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'с' : 's'}`;
  const lapList = (p: (typeof per)[number], l: Locale) => p.laps.map((x) => `${Math.round(x.s * 100)} ${l === 'uk' ? 'см' : 'cm'} — ${s(x.t, l)}`).join(', ');
  const liquid = String(R[0]?.command['liquid'] ?? 'washing-up');
  const ratio = small && big && small.v > 0 ? big.v / small.v : 0;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'На бульбашку діють виштовхувальна сила (вгору) й опір густої рідини (униз). Поки бульбашка розганяється, опір зростає — і за мить зрівнюється з виштовхувальною силою. Далі сили зрівноважені, і бульбашка спливає з незмінною швидкістю — рівномірно: за однакові проміжки часу — однаковий шлях. Більша бульбашка витісняє набагато більше рідини (виштовхувальна сила зростає як куб розміру), а опір — лише пропорційно розміру й швидкості. Тому їй потрібна більша швидкість, щоб опір зрівнявся з виштовхувальною силою: удвічі більша бульбашка спливає приблизно вчетверо швидше.'
        : 'A bubble feels the buoyant force (up) and the thick liquid’s drag (down). While it speeds up, the drag grows — and in a moment matches the buoyant force. From then on the forces balance and the bubble rises at a steady speed — uniformly: equal paths in equal times. A bigger bubble pushes aside much more liquid (the buoyant force grows as the cube of its size), the drag only in proportion to its size and speed. So it needs more speed for the drag to match the buoyancy: a bubble twice as big rises about four times as fast.',
    ),
    say: both((l) => (correct === 'bigger' ? (l === 'uk' ? `Більша бульбашка спливала ≈ в ${sig(ratio, 2, l)} раза швидше!` : `The bigger bubble rose ≈ ${sig(ratio, 2, l)} times as fast!`) : l === 'uk' ? 'Подивімося на секундомір.' : 'Let us look at the stopwatch.')),
    text: both((l) =>
      l === 'uk'
        ? `${per.map((p) => `Бульбашка ≈ ${sig(p.d * 1000, 2, l)} мм: ${lapList(p, l)}`).join('. ')}. Удвічі довший шлях — удвічі більший час: шлях пропорційний часу, а відношення l/t на кожній позначці те саме (розкид ${sig(Math.max(...per.map((p) => p.spread)) * 100, 2, l)} % — секундомір показує лише соті частки секунди). Отже, рух рівномірний: v ≈ ${small ? cmS(small.v, l) : ''} і ${big ? cmS(big.v, l) : ''}. Більша бульбашка спливала швидше — ≈ в ${sig(ratio, 2, l)} раза.${liquid === 'washing-up' ? ' (Скільки саме — залежить від рідини: різні марки бувають у кілька разів густіші чи рідші; а от рівномірність і «більша — швидша» не залежать.)' : ''}`
        : `${per.map((p) => `A ≈ ${sig(p.d * 1000, 2, l)} mm bubble: ${lapList(p, l)}`).join('. ')}. Twice the path — twice the time: the path is proportional to the time, and l/t is the same at every mark (a spread of ${sig(Math.max(...per.map((p) => p.spread)) * 100, 2, l)} % — the stopwatch shows only hundredths of a second). So the motion is uniform: v ≈ ${small ? cmS(small.v, l) : ''} and ${big ? cmS(big.v, l) : ''}. The bigger bubble rose faster — ≈ ${sig(ratio, 2, l)} times.${liquid === 'washing-up' ? ' (How fast exactly depends on the liquid: makes are several times thicker or thinner; the uniformity and “bigger — faster” do not.)' : ''}`,
    ),
  };
};

export const preset_ball_in_liquids: Preset = varied(
  {
    id: 'ball-in-liquids',
    ask: { uk: 'У якій рідині кулька тоне найповільніше?', en: 'In which liquid does the ball sink slowest?' },
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Кулька в рідинах різної густини', en: 'A ball in liquids of different densities' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'sink',
    choices: [ch('glycerol', 'У гліцерині', 'In glycerol'), ch('sunflower-oil', 'В олії', 'In oil'), ch('water', 'У воді', 'In water')],
    choicesAt: 'end',
    answerOnBoard: ['kv:'],
    formulas: ['mechanics.speed'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … швидкості руху кульки у рідинах різної густини' }],
    expect: 'reached',
  },
  {
    // The ball's size: a smaller one goes slower in each liquid (in glycerol — as the square of its size).
    controls: [{ id: 'diameter', label: { uk: 'Кулька', en: 'The ball' }, kind: 'choice', options: [ch('1', '1 мм', '1 mm'), ch('1.5', '1,5 мм', '1.5 mm')], value: '1.5' }],
    build: (v) => {
      const diameter = Number(v['diameter']) / 1000;
      const marks = [0.05, 0.1, 0.15];
      const d = String(v['diameter']);
      return {
        question: {
          uk: `Три мірні циліндри: з гліцерином (густина 1261 кг/м³), соняшниковою олією (919 кг/м³) і водою (997 кг/м³), на кожному — позначки через 5 см. Опускатимемо в кожен сталеву кульку діаметром ${d.replace('.', ',')} мм: запустимо секундомір, коли вона мине нульову позначку, і засікатимемо час на позначках 5, 10 і 15 см. Знайдемо швидкість кульки в кожній рідині. У якій рідині кулька тоне найповільніше?`,
          en: `Three measuring cylinders: of glycerol (density 1261 kg/m³), sunflower oil (919 kg/m³) and water (997 kg/m³), each with marks every 5 cm. We drop a steel ball ${d} mm across into each: start the stopwatch as it passes the zero mark and note the time at 5, 10 and 15 cm. We find the ball’s speed in each liquid. In which liquid does it sink slowest?`,
        },
        plan: (['glycerol', 'sunflower-oil', 'water'] as const).map((liquid) => ({ kind: 'bench', command: { type: 'lab.sink', body: 'ball', diameter, liquid, marks } }) as const),
      };
    },
  },
);

export const answer_ball_in_liquids = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.sink' && x.record.value !== null);
  const liquids = ['glycerol', 'sunflower-oil', 'water'] as const;
  const per = liquids.flatMap((liquid) => {
    const laps = R.filter((x) => x.command['liquid'] === liquid).map((x) => ({ s: x.record.inputs?.['mark'] ?? 0, t: x.record.value!, rho: x.record.inputs?.['density'] ?? 0, mu: x.record.inputs?.['viscosity'] ?? 0 }));
    const last = laps[laps.length - 1];
    return last && last.t > 0 ? [{ liquid, v: last.s / last.t, t: last.t, s: last.s, rho: last.rho, mu: last.mu }] : [];
  });
  const slowest = [...per].sort((a, b) => a.v - b.v)[0];
  const correct = slowest?.liquid;
  const name = (x: string, l: Locale) => tr({ uk: sinkLiquidName(x as SinkLiquid).in.uk, en: sinkLiquidName(x as SinkLiquid).in.en }, l);
  const v = (x: number, l: Locale) => (x < 0.1 ? `${sig(x * 100, 2, l)} ${l === 'uk' ? 'см/с' : 'cm/s'}` : `${sig(x, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`);
  const water = per.find((x) => x.liquid === 'water');
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Кулька тоне рівномірно, коли її вагу врівноважують виштовхувальна сила й опір рідини. Густина рідини змінює лише виштовхувальну силу — а вона для сталевої кульки, що в 6–8 разів густіша за ці рідини, мала. Головне — в’язкість, «тягучість» рідини: що вона більша, то сильніше рідина гальмує кульку. Гліцерин у тисячу з гаком разів в’язкіший за воду, олія — у п’ятдесят. Тому в олії, найлегшій із трьох, кулька тоне повільніше, ніж у воді, а в гліцерині, найгустішому, — ледь-ледь.'
        : 'The ball sinks steadily when its weight is balanced by the buoyant force and the liquid’s drag. The liquid’s density changes only the buoyant force — and for a steel ball 6–8 times as dense as these liquids it is small. What matters is the viscosity, the liquid’s “thickness”: the higher it is, the harder the liquid brakes the ball. Glycerol is over a thousand times as viscous as water, oil some fifty. So in oil, the lightest of the three, the ball sinks slower than in water, and in glycerol, the densest, hardly at all.',
    ),
    say: both((l) => (slowest ? (l === 'uk' ? `Найповільніше — ${name(slowest.liquid, l)}: ${v(slowest.v, l)}.` : `Slowest ${name(slowest.liquid, l)}: ${v(slowest.v, l)}.`) : '')),
    text: both((l) =>
      l === 'uk'
        ? `${per.map((x, k) => `${k ? name(x.liquid, l) : name(x.liquid, l).replace(/^./, (c) => c.toUpperCase())} (густина ${Math.round(x.rho)} кг/м³) кулька пройшла ${Math.round(x.s * 100)} см за ${sig(x.t, 3, l)} с — v ≈ ${v(x.v, l)}`).join('; ')}. Швидкість не йде за густиною: олія найлегша, а кулька в ній повільніша, ніж у воді, — бо олія набагато в’язкіша.${water && water.t < 1 ? ` У воді кулька проходить ${Math.round(water.s * 100)} см менш ніж за секунду — рукою засікти такий час точно важко: запізнення пальця (0,1–0,2 с) тут суттєве.` : ''}`
        : `${per.map((x, k) => `${k ? name(x.liquid, l) : name(x.liquid, l).replace(/^./, (c) => c.toUpperCase())} (density ${Math.round(x.rho)} kg/m³) the ball went ${Math.round(x.s * 100)} cm in ${sig(x.t, 3, l)} s — v ≈ ${v(x.v, l)}`).join('; ')}. The speed does not follow the density: oil is the lightest, yet the ball is slower in it than in water — because oil is much more viscous.${water && water.t < 1 ? ` In water the ball goes ${Math.round(water.s * 100)} cm in under a second — hard to time by hand: the finger’s delay (0.1–0.2 s) matters here.` : ''}`,
    ),
  };
};
