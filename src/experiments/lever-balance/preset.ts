import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, ch, INTERACTION, room, varied, WATER } from '../../scenarios/preset-kit.js';
import type { Choice, Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { type SubstanceId, SUBSTANCES } from '../../substances/catalog.js';

/** Liquids whose density the lab work finds (all fit the balance in a 100 mL cylinder). */
const LIQUIDS_FOR_DENSITY: readonly Choice[] = (['sunflower-oil', 'glycerol', 'ethanol', 'water'] as const).map((id) => ({ id, label: SUBSTANCES[id].name }));

export const preset_lever_balance: Preset = {
  id: 'lever-balance',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Зважуємо на важільних терезах', en: 'Weighing on a lever balance' },
  question: {
    uk: 'Зважимо на важільних терезах алюмінієвий циліндр, дерев’яний брусок, порожню склянку й склянку з водою. Тіло кладемо на ліву шальку, а на праву пінцетом — важки з набору, від більших до менших, поки терези не зрівноважаться. Скільки води в склянці?',
    en: 'On a lever balance we weigh an aluminium cylinder, a wooden block, an empty glass and the glass with water. The load goes on the left pan, and on the right — weights from the set with tweezers, from larger to smaller, until the balance is level. How much water is in the glass?',
  },
  params: { ...room, vessel: 'beaker', size: 0.1, material: 'glass', liters: 0.05, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'balance',
  plan: [
    { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'aluminium', mass: 0.0543, label: { uk: 'Алюмінієвий циліндр', en: 'Aluminium cylinder' } } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'body', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, label: { uk: 'Дерев’яний брусок', en: 'Wooden block' } } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: { uk: 'Порожня склянка', en: 'Empty glass' } } },
    { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: { uk: 'Склянка з водою', en: 'Glass with water' } } },
  ],
  choices: [ch('diff', 'Різниця зважувань: склянка з водою мінус порожня склянка', 'The difference of weighings: the glass with water minus the empty glass'), ch('total', 'Стільки, скільки показали терези зі склянкою з водою', 'As much as the balance showed with the glass of water'), ch('glass', 'Стільки, скільки важить порожня склянка', 'As much as the empty glass weighs')],
  choicesAt: 'end',
  formulas: ['mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 4', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 4. Вимірювання маси тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16, лабораторна робота № 4, с. 116' } }, { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Маса тіла. Густина речовини.' }],
  expect: 'reached',
};

export const answer_lever_balance = (run: PresetRun): PresetAnswer => {
  const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.balance');
  const at = (what: string) => r.find((x) => x.command['what'] === what)?.record.value ?? null;
  const empty = at('vessel-empty');
  const full = at('vessel');
  const water = empty !== null && full !== null ? full - empty : null;
  const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
  const name = (x: (typeof r)[number], l: Locale) => ((x.command['label'] as { uk: string; en: string } | undefined)?.[l] ?? '').toLowerCase();
  return {
    ...(water !== null ? { correct: 'diff' } : {}),
    why: both((l) => (l === 'uk' ? "Важільні терези — рівноплечий важіль: шальки висять на однакових відстанях від осі. Тому коромисло стоїть рівно, коли однакові сили з обох боків, тобто однакові маси — Земля тягне кожен грам однаково. Терези порівнюють маси, а не ваги: на Місяці вони показали б те саме, бо там і тіло, і важки стали б легшими однаково." : "A lever balance is a lever with equal arms: the pans hang at equal distances from the axis. So the beam is level when the forces on both sides are equal, that is, the masses are — the Earth pulls each gram alike. The balance compares masses, not weights: on the Moon it would show the same, as the body and the weights would both get lighter alike.")),
    say: both((l) => (water !== null ? (l === 'uk' ? `У склянці ${g(water, l)} води!` : `The glass holds ${g(water, l)} of water!`) : '—')),
    text: both((l) =>
      l === 'uk'
        ? `${r.map((x) => `${name(x, l)}: ${x.record.value !== null ? g(x.record.value, l) : '—'}`).join('; ')}. Масу води знаходимо як різницю двох зважувань: m = m₂ − m₁ = ${water !== null ? g(water, l) : '—'}. Найменший важок у наборі — 10 мг, тож саме з такою точністю зважено кожне тіло. Але точність маси води гірша: у різниці двох зважувань похибки додаються. Тіла кладуть на ліву шальку, важки — на праву, пінцетом, від більших до менших; брудне й вологе на шальки не кладуть, а рідину зважують лише в посудині.`
        : `${r.map((x) => `${name(x, l)}: ${x.record.value !== null ? g(x.record.value, l) : '—'}`).join('; ')}. The water’s mass is the difference of two weighings: m = m₂ − m₁ = ${water !== null ? g(water, l) : '—'}. The smallest weight of the set is 10 mg, so that is how precisely each body was weighed. The water’s mass is less precise: in a difference of two weighings the errors add up. Loads go on the left pan, weights on the right, with tweezers, from larger to smaller; nothing dirty or wet goes on the pans, and a liquid is weighed only in a vessel.`,
    ),
  };
};

export const preset_liquid_density: Preset = varied(
  {
    ask: { uk: 'Рідина легша чи важча за воду, якщо порівняти однакові об’єми?', en: 'Is the liquid lighter or heavier than water, for equal volumes?' },
    id: 'liquid-density',
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Яка густина рідини?', en: 'What is the density of a liquid?' },
    guided: true,
    bench: 'balance',
    formulas: ['mechanics.density'],
    quoteHas: 'густини',
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 5', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 5. Визначення густини речовини (твердих тіл, рідин).', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 17, лабораторна робота № 5, с. 122' } }],
    expect: 'reached',
  },
  {
    controls: [
      { id: 'liquid', label: { uk: 'Рідина', en: 'Liquid' }, kind: 'choice', options: LIQUIDS_FOR_DENSITY, value: 'sunflower-oil' },
      { id: 'volume', label: { uk: 'Скільки налити', en: 'How much to pour' }, kind: 'number', unit: 'мл', min: 30, max: 60, step: 5, value: 50 },
    ],
    build: (v) => {
      const liquid = SUBSTANCES[v['liquid'] as SubstanceId];
      const volume = Number(v['volume']);
      const name = (l: 'uk' | 'en') => liquid.name[l].toLowerCase();
      const gen = (l: 'uk' | 'en') => (liquid.genitive?.[l] ?? liquid.name[l]).toLowerCase();
      return {
        question: {
          uk: `Зважимо порожню мензурку на важільних терезах, наллємо в неї ≈ ${volume} мл: ${name('uk')}, зважимо ще раз і подивимося на поділки, скільки рідини налили. Вона легша чи важча за воду, якщо порівняти однакові об’єми?`,
          en: `We weigh an empty measuring cylinder on a lever balance, pour ≈ ${volume} mL of ${gen('en')} into it, weigh it again and read on the marks how much we poured. For equal volumes, is it lighter or heavier than water?`,
        },
        params: { ...room, vessel: 'cylinder', size: 0.1, material: 'glass', liters: volume / 1000, action: 'settle', substance: liquid.id as SubstanceId, startTemp: 20 },
        plan: [
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel-empty', label: { uk: 'Порожня мензурка', en: 'Empty cylinder' } } },
          { kind: 'bench', command: { type: 'lab.balance', what: 'vessel', label: { uk: `Мензурка: ${name('uk')}`, en: `Cylinder with ${gen('en')}` } } },
          { kind: 'level' },
        ],
        choices: [ch('lighter', 'Легша', 'Lighter'), ch('same', 'Однакова', 'The same'), ch('heavier', 'Важча', 'Heavier')],
      };
    },
  },
);

export const answer_liquid_density = (run: PresetRun): PresetAnswer => {
  const r = run.readings ?? [];
  const empty = r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === 'vessel-empty')?.record.value ?? null;
  const full = r.find((x) => x.command.type === 'lab.balance' && x.command['what'] === 'vessel')?.record.value ?? null;
  const V = r.find((x) => x.record.quantity === 'volume')?.record.value ?? null;
  const m = empty !== null && full !== null ? full - empty : null;
  const rho = m !== null && V ? m / V : null;
  const correct = rho === null ? undefined : rho < WATER * 0.97 ? 'lighter' : rho > WATER * 1.03 ? 'heavier' : 'same';
  // The liquid of this run, and its density in the tables.
  const liquid = SUBSTANCES[run.steps[0]!.params.substance];
  const table = liquid.liquid.density.value;
  const name = (l: Locale) => liquid.name[l];
  const g = (kg: number, l: Locale) => formatMeasured('mass', kg, 0.00001, l);
  const cmp = (l: Locale) => (correct === 'lighter' ? (l === 'uk' ? 'легша за воду' : 'lighter than water') : correct === 'heavier' ? (l === 'uk' ? 'важча за воду' : 'heavier than water') : l === 'uk' ? 'майже як вода' : 'about as dense as water');
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Густина — маса в одиниці об’єму: ρ = m/V. Масу рідини дають два зважування — маса мензурки при цьому скорочується (m = m₂ − m₁), об’єм — поділки. Різні рідини вміщують у тому самому об’ємі різну масу: частинки олії чи спирту легші й упаковані вільніше, ніж у воді, гліцерину — щільніше. Рідина, легша за воду, на ній плаває: олія збирається зверху." : "Density is the mass per unit volume: ρ = m/V. Two weighings give the liquid’s mass — the cylinder’s own mass cancels (m = m₂ − m₁) — and the marks give the volume. Different liquids pack a different mass into the same volume: the particles of oil or alcohol are lighter and packed more loosely than water’s, glycerol’s more tightly. A liquid lighter than water floats on it: oil gathers on top.")),
    say: both((l) => (rho !== null ? `ρ ≈ ${sig(rho, 3, l)} ${l === 'uk' ? 'кг/м³' : 'kg/m³'} — ${cmp(l)}!` : '—')),
    text: both((l) =>
      rho === null
        ? '—'
        : l === 'uk'
          ? `Маса рідини — різниця зважувань: m = ${g(full!, l)} − ${g(empty!, l)} = ${g(m!, l)}. Об’єм — за поділками мензурки: V = ${sig(V! * 1e6, 3, l)} см³. Густина ρ = m/V ≈ ${sig(rho / 1000, 3, l)} г/см³ = ${sig(rho, 3, l)} кг/м³ (${name(l).toLowerCase()} — ${cmp(l)}, у води ${sig(WATER, 3, l)} кг/м³). У таблиці — ${sig(table, 3, l)} кг/м³. Найменш точне тут — об’єм: мензурка показує його лише з точністю до поділки. Рідина, легша за воду і нерозчинна в ній, плаває на воді шаром; важча — опускається на дно.`
          : `The liquid’s mass is the difference of the weighings: m = ${g(full!, l)} − ${g(empty!, l)} = ${g(m!, l)}. Its volume comes from the cylinder’s marks: V = ${sig(V! * 1e6, 3, l)} cm³. The density ρ = m/V ≈ ${sig(rho / 1000, 3, l)} g/cm³ = ${sig(rho, 3, l)} kg/m³ (${name(l).toLowerCase()} is ${cmp(l)}; water has ${sig(WATER, 3, l)} kg/m³). The table gives ${sig(table, 3, l)} kg/m³. The least precise thing here is the volume: the cylinder shows it only to a division. A liquid lighter than water that does not mix with it floats on it as a layer; a heavier one sinks.`,
    ),
  };
};
