import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, ch, PRESSURE, room, stepLine, STEPS_END, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_depth_pressure: Preset = varied(
  {
    id: 'depth-pressure',
    ask: { uk: 'Як тиск рідини залежить від глибини?', en: 'How does a liquid’s pressure depend on the depth?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Як тиск рідини залежить від глибини?', en: 'How does the pressure of a liquid depend on the depth?' },
    guided: true,
    bench: 'depth',
    choices: [ch('proportional', 'Зростає пропорційно глибині: удвічі глибше — удвічі більший тиск', 'It grows in proportion: twice as deep — twice the pressure'), ch('same', 'Не залежить від глибини', 'It does not depend on the depth'), ch('slower', 'Зростає, але все повільніше', 'It grows, but ever more slowly')],
    choicesAt: 'end',
    answerOnBoard: ['rhoD:'],
    formulas: ['mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Дослідження: … зміни тиску в рідині з глибиною; … вимірювання й визначення: атмосферного й гідростатичного тиску' }],
    expect: 'reached',
  },
  {
    // Liquids of different densities: the manometer's water tells them apart (salt water deeper, oil less).
    controls: [{ id: 'liquid', label: { uk: 'Рідина в стакані', en: 'Liquid in the beaker' }, kind: 'choice', options: [ch('water', 'Вода', 'Water'), ch('salt-water-20', 'Солона вода (20 %)', 'Salt water (20 %)'), ch('sunflower-oil', 'Соняшникова олія', 'Sunflower oil')], value: 'water' }],
    build: (v) => {
      const liquid = String(v['liquid']) as 'water' | 'salt-water-20' | 'sunflower-oil';
      const name = { water: { uk: 'водою', en: 'water' }, 'salt-water-20': { uk: 'солоною водою', en: 'salt water' }, 'sunflower-oil': { uk: 'соняшниковою олією', en: 'sunflower oil' } }[liquid];
      return {
        question: {
          uk: `У стакані з ${name.uk} (рідини — на 12 см) опускатимемо воронку, затягнуту гумовою плівкою; трубка від неї йде до U-подібного манометра з водою. Записуватимемо, на скільки різняться рівні води в манометрі, коли плівка на глибині 3, 6 і 9 см, а наостанок на 9 см повернемо її вбік. Як тиск рідини залежить від глибини?`,
          en: `Into a beaker of ${name.en} (12 cm of it) we lower a funnel covered with a rubber film; a tube leads from it to a U-tube manometer with water. We write down how far apart the water levels in the manometer are with the film 3, 6 and 9 cm deep, and at last turn it sideways at 9 cm. How does the liquid’s pressure depend on the depth?`,
        },
        params: { ...room, vessel: 'beaker', size: 1, material: 'glass', liters: 0.9, action: 'settle', substance: liquid, startTemp: 20 },
        plan: [
          ...[0.03, 0.06, 0.09].map((depth) => ({ kind: 'bench', command: { type: 'lab.depth', depth } }) as const),
          { kind: 'bench', command: { type: 'lab.depth', depth: 0.09, sideways: true } },
        ],
      };
    },
  },
);

export const answer_depth_pressure = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.depth' && x.record.value !== null).map((x) => ({ h: Number(x.command['depth']), side: !!x.command['sideways'], dh: x.record.value!, rhoM: x.record.inputs?.['rhoManometer'] ?? 1000, rhoL: x.record.inputs?.['rhoLiquid'] ?? 1000, g: x.record.inputs?.['g'] ?? 9.81 }));
  const down = rows.filter((x) => !x.side);
  const side = rows.find((x) => x.side);
  const p = (x: (typeof rows)[number]) => x.rhoM * x.g * x.dh;
  // Proportional: p / h the same at every depth, within the manometer's millimetre (half of it, relative to Δh).
  const k = down.map((x) => p(x) / x.h);
  const mean = k.reduce((a, b) => a + b, 0) / Math.max(1, k.length);
  const err = down.length ? Math.max(...down.map((x) => 0.0005 / x.dh)) : 0;
  const spread = k.length ? Math.max(...k.map((x) => Math.abs(x / mean - 1))) : 0;
  const first = down[0];
  const last = down[down.length - 1];
  const correct = down.length < 2 ? undefined : spread <= err + 0.01 ? 'proportional' : last && first && p(last) > p(first) ? 'slower' : 'same';
  const rho = first ? mean / first.g : 0;
  const table = first?.rhoL ?? 0;
  const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const Pa = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'Па' : 'Pa'}`;
  const list = (l: Locale) => down.map((x) => `${cm(x.h, l)} — Δh = ${cm(x.dh, l)}, p ≈ ${Pa(p(x), l)}`).map(stepLine).join(';') + STEPS_END;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Рідина важка: кожен її шар тисне на шари під собою вагою всього, що над ним. На глибині h на кожен квадратний метр давить стовп рідини висотою h і масою ρ·h, тобто вагою ρ·g·h — тому тиск росте рівно пропорційно глибині. А частинки рідини легко зсуваються одна відносно одної й передають цей тиск в усі боки однаково (закон Паскаля): плівка, повернута вбік, відчуває той самий тиск.'
        : 'A liquid is heavy: each layer presses on the layers below with the weight of all that is above it. At a depth h each square metre carries a column of liquid h high with a mass ρ·h, that is, a weight ρ·g·h — so the pressure grows exactly in proportion to the depth. And the bits of a liquid slide past each other easily and pass that pressure on in all directions alike (Pascal’s law): the film turned sideways feels the same pressure.',
    ),
    say: both((l) => (correct === 'proportional' ? (l === 'uk' ? 'Удвічі глибше — удвічі більший тиск!' : 'Twice as deep — twice the pressure!') : l === 'uk' ? 'Подивімося на манометр.' : 'Let us look at the manometer.')),
    text: both((l) =>
      l === 'uk'
        ? `${list(l)}. Тиск, який показує манометр (p = ρ_води·g·Δh), зростав пропорційно глибині: p / h скрізь ≈ ${sig(mean, 3, l)} Па/м. Звідси й густина рідини ρ = p / (g·h) ≈ ${sig(rho, 3, l)} кг/м³ (у таблиці — ${sig(table, 3, l)} кг/м³).${side ? ` Плівка, повернута вбік на ${cm(side.h, l)}, дала ті самі Δh = ${cm(side.dh, l)}: на одній глибині тиск однаковий в усі боки.` : ''}`
        : `${list(l)}. The pressure the manometer shows (p = ρ_water·g·Δh) grew in proportion to the depth: p / h ≈ ${sig(mean, 3, l)} Pa/m everywhere. From it the liquid’s density ρ = p / (g·h) ≈ ${sig(rho, 3, l)} kg/m³ (the table gives ${sig(table, 3, l)} kg/m³).${side ? ` The film turned sideways at ${cm(side.h, l)} gave the same Δh = ${cm(side.dh, l)}: at one depth the pressure is the same in all directions.` : ''}`,
    ),
  };
};
