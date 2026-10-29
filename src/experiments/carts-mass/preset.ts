import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';

const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);

export const preset_carts_mass: Preset = {
  ask: { uk: 'Як порівняти маси двох візків, не зважуючи їх?', en: 'How can two carts’ masses be compared without weighing them?' },
  id: 'carts-mass',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Маса — міра інертності й тяжіння: візки', en: 'Mass as the measure of inertia and gravity: carts' },
  question: {
    uk: 'Два легкі візки по 100 г стоять на столі, між ними стиснута пружина, зв’язана ниткою. Перепалюємо нитку — пружина розштовхує візки, а ми за кадрами відео міряємо, хто скільки проїхав за 0,5 с. Спершу візки однакові, потім на другий ставимо один, а тоді два тягарці по 100 г. Наостанок вішаємо обидва візки на динамометр. Як порівняти маси двох візків, не зважуючи їх?',
    en: 'Two light 100 g carts stand on the table with a squeezed spring between them, tied by a thread. We burn the thread — the spring pushes the carts apart, and by the video’s frames we measure how far each went in 0.5 s. First the carts are alike, then one and then two 100 g weights go on the second. At last both carts hang on a dynamometer. How can two carts’ masses be compared without weighing them?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'carts',
  plan: [
    ...[0, 1, 2].map((weights) => ({ kind: 'bench', command: { type: 'lab.carts', mode: 'push', weights } }) as const),
    { kind: 'bench', command: { type: 'lab.carts', mode: 'weigh', weights: 2, cart: 1 } },
    { kind: 'bench', command: { type: 'lab.carts', mode: 'weigh', weights: 2, cart: 2 } },
  ],
  choices: [ch('speeds', 'За швидкостями після поштовху: у скільки разів візок повільніший, у стільки разів його маса більша', 'By the speeds after the push: as many times slower a cart is, so many times greater its mass'), ch('same', 'Ніяк: одна пружина штовхає обидва візки однаково, тож вони поїдуть однаково', 'No way: one spring pushes both carts alike, so they go alike'), ch('faster', 'Важчий візок поїде швидше — він сильніше розганяється', 'The heavier cart goes faster — it gathers more speed')],
  answerOnBoard: ['cr:'],
  formulas: ['mechanics.speed', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'залежності між масою тіла та його інертними та гравітаційними властивостями; … між масою і силою тяжіння' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: 'Явище інерції. Інертність і маса тіла', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16 «Інертність тіла. Маса»: візки зі стиснутими пружинами, m₂ / m₁ = v₁ / v₂' } },
  ],
  expect: 'reached',
};

export const answer_carts_mass = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.carts' && x.record.value !== null);
  const pushes = [0, 1, 2].map((w) => recs.filter((x) => x.command['mode'] === 'push' && Number(x.command['weights']) === w).map((x) => x.record.value!)).filter((x) => x.length === 2) as [number, number][];
  const P = (cart: number) => recs.find((x) => x.command['mode'] === 'weigh' && Number(x.command['cart']) === cart)?.record.value ?? null;
  const P1 = P(1);
  const P2 = P(2);
  const cm = (x: number, l: Locale) => `${sig(x * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const ratio = (x: number, l: Locale) => sig(x, 2, l);
  // «у 3 рази», but «у 2,9 раза».
  const times = (x: number, l: Locale) => (l === 'uk' ? `у ${ratio(x, l)} ${/[,.]/.test(ratio(x, l)) ? 'раза' : 'рази'}` : `${ratio(x, l)} times`);
  const slower = pushes.length === 3 && pushes.every(([a, b], w) => Math.abs(a / b - (1 + w)) < 0.1);
  return {
    ...(slower ? { correct: 'speeds' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Пружина діє на обидва візки однаково, але важчий візок інертніший — він повільніше набирає швидкість, тож розганяється менше. Тому в скільки разів його швидкість менша, у стільки разів його маса більша: m₂ / m₁ = v₁ / v₂. Візки рушили одночасно й їхали однаковий час, тож відношення шляхів — це відношення швидкостей. Так масу можна виміряти без терезів — за інертністю. А динамометр показує, що й сила тяжіння в стільки ж разів більша: P = m·g. Тож маса — міра і інертності тіла, і його притягання до Землі. Тертя коліс за ці 0,5 с не враховано.'
        : 'The spring acts on both carts alike, but the heavier cart is more inert — it gathers speed more slowly, so it ends up slower. So as many times smaller its speed, so many times greater its mass: m₂ / m₁ = v₁ / v₂. The carts set off together and went for the same time, so the ratio of the paths is the ratio of the speeds. This way mass can be measured without scales — by inertia. And the dynamometer shows that the force of gravity is as many times greater too: P = m·g. So mass measures both a body’s inertia and its pull to the Earth. The wheels’ friction over these 0.5 s is left out.',
    ),
    say: both((l) => {
      const last = pushes[2];
      return last && P1 !== null && P2 !== null ? (l === 'uk' ? `Візок утричі важчий проїхав ${times(last[0] / last[1], l)} менше — і сила тяжіння на нього ${times(P2 / P1, l)} більша.` : `The cart three times heavier went ${times(last[0] / last[1], l)} less — and gravity on it is ${times(P2 / P1, l)} greater.`) : '';
    }),
    text: both((l) => {
      const uk = l === 'uk';
      const parts = pushes.map(([a, b], w) => (uk ? `${w === 0 ? 'однакові візки' : `візок 2 + ${w === 1 ? 'один тягарець' : 'два тягарці'}`}: ${cm(a, l)} і ${cm(b, l)}, l₁ / l₂ ≈ ${ratio(a / b, l)}` : `${w === 0 ? 'alike carts' : `cart 2 + ${w === 1 ? 'one weight' : 'two weights'}`}: ${cm(a, l)} and ${cm(b, l)}, l₁ / l₂ ≈ ${ratio(a / b, l)}`));
      const weigh = P1 !== null && P2 !== null ? (uk ? `; на динамометрі: візок 1 — ${N(P1, l)}, візок 2 з двома тягарцями — ${N(P2, l)}, ${times(P2 / P1, l)} більше` : `; on the dynamometer: cart 1 — ${N(P1, l)}, cart 2 with two weights — ${N(P2, l)}, ${times(P2 / P1, l)} more`) : '';
      const s = `${parts.join('; ')}${weigh}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' (2,9 Н, а не 3,0 — бо динамометр показує до десятих: 2,94 Н.)' : ' (2.9 N, not 3.0 — the dynamometer reads to tenths: 2.94 N.)');
    }),
  };
};
