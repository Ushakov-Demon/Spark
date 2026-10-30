import { density } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_cartesian_diver: Preset = {
  id: 'cartesian-diver',
  ask: { uk: 'Що буде з водолазом у пляшці, якщо пляшку стиснути, — і чому?', en: 'What happens to the diver in the bottle when the bottle is squeezed — and why?' },
  grade: 7,
  topic: PRESSURE,
  title: { uk: 'Картезіанський водолаз: підводний човен і риба', en: 'The Cartesian diver: a submarine and a fish' },
  question: {
    uk: 'Скляна піпетка з гумовим ковпачком — «водолаз»: у ній трохи води й трохи повітря, і вона ледь плаває. Зважимо її, виміряємо мензуркою її об’єм, а тоді пустимо в пластикову пляшку, повну води, і закрутимо кришку. Стиснемо пляшку злегка, потім сильно, і відпустимо — стежачи за водолазом і за водою в його скляній трубці. Що буде з водолазом, якщо пляшку стиснути, — і чому?',
    en: 'A glass dropper with a rubber cap — the “diver”: a little water and a little air in it, and it just floats. We weigh it, take its volume with a measuring cylinder, then put it into a plastic bottle full of water and screw the cap on. We squeeze the bottle lightly, then hard, and let it go — watching the diver and the water in its glass tube. What happens to the diver when the bottle is squeezed — and why?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'diver',
  plan: [
    { kind: 'bench', command: { type: 'lab.diver', step: 'weigh' } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'volume' } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'squeeze', press: 4000 } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'squeeze', press: 15000 } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'release', press: 15000 } },
  ],
  choices: [
    ch('density', 'Пірне: у піпетку зайде вода, повітря в ній стиснеться, і середня густина водолаза стане більшою за густину води', 'It dives: water gets into the dropper, the air there is squeezed, and the diver’s mean density grows above the water’s'),
    ch('push', 'Пірне: рука тисне на воду, а вода — на водолаза згори й заштовхує його вниз', 'It dives: the hand presses on the water, and the water presses on the diver from above and pushes it down'),
    ch('nothing', 'Нічого не буде: вода не стискається, тож і стиснути пляшку не вийде', 'Nothing: water does not compress, so the bottle cannot be squeezed'),
  ],
  // (Water ≈ 4.6·10⁻¹⁰ Pa⁻¹ at 20 °C, between the source's 5.1 at 0 °C and 4.4 at 45 °C; air, slowly, 1/p₀ ≈ 9.9·10⁻⁶ Pa⁻¹: ≈ 20 000 times.)
  asides: [
    {
      uk: 'Водолаза звуть картезіанським — від Картезія, тобто Рене Декарта: кажуть, це його винахід. Але першим його описав італієць Раффаелло Маджотті, який часто листувався з Галілеєм, — 1648 року, у книжці «Renitenza certissima dell’acqua alla compressione» — «Найтвердіший опір води стисканню». Маджотті вважав воду зовсім нестисною. Тут він помилявся: стискається й вода, тільки приблизно у 20 тисяч разів менше за повітря біля поверхні Землі, — тож водолаз однаково пірнає.',
      en: 'The diver is called Cartesian — after Cartesius, that is René Descartes: it is said to be his invention. But the first to describe it was the Italian Raffaello Magiotti, often in touch with Galileo, in 1648, in a book «Renitenza certissima dell’acqua alla compressione» — «Very firm resistance of water to compression». Magiotti held water to be quite incompressible. There he was wrong: water compresses too, only some 20 thousand times less than air at the Earth’s surface — so the diver dives all the same.',
    },
  ],
  // The densities are the answer: chalked in once a guess is made.
  answerOnBoard: ['rho:'],
  formulas: ['mechanics.density', 'mechanics.buoyant-force', 'mechanics.submerged-share', 'mechanics.boyle'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'моделювання: … занурення і спливання підводного човна, риб' }],
  expect: 'reached',
};

export const answer_cartesian_diver = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.diver' && x.record.value !== null);
  const m = R.find((x) => x.command['step'] === 'weigh')?.record.value ?? 0;
  const V = R.find((x) => x.command['step'] === 'volume')?.record.value ?? 0;
  const moves = R.filter((x) => x.command['step'] === 'squeeze' || x.command['step'] === 'release').map((x) => {
    const r = x.record;
    const d = r.inputs?.['tube'] ?? 0.004;
    const dV = Math.PI * (d / 2) ** 2 * r.value!;
    return { step: String(x.command['step']), press: r.inputs?.['press'] ?? 0, extra: r.inputs?.['extra'] ?? 0, h: r.value!, dV, rho: V - dV > 0 ? density(m, V - dV) : 0, sinks: r.inputs?.['sinks'] === 1 };
  });
  const water = R.find((x) => x.record.inputs?.['water'])?.record.inputs?.['water'] ?? 997;
  const hard = moves.find((x) => x.step === 'squeeze' && x.sinks);
  const correct = !moves.length || !m || !V ? undefined : hard && hard.rho > water ? 'density' : 'nothing';
  const g = (x: number, l: Locale) => `${sig(x / 1000, 3, l)} ${l === 'uk' ? 'г/см³' : 'g/cm³'}`;
  const kPa = (x: number, l: Locale) => `${sig(x / 1000, 2, l)} ${l === 'uk' ? 'кПа' : 'kPa'}`;
  const mm = (x: number, l: Locale) => `${Math.round(x * 1000)} ${l === 'uk' ? 'мм' : 'mm'}`;
  const mL = (x: number, l: Locale, k = 2) => `${sig(x * 1e6, k, l)} ${l === 'uk' ? 'мл' : 'mL'}`;
  const rho0 = V ? density(m, V) : 0;
  const what = (x: (typeof moves)[number], l: Locale) => {
    const uk = l === 'uk';
    const act = x.step === 'release' ? (uk ? 'Відпущений на дні' : 'Let go at the bottom') : x.press < 8000 ? (uk ? 'Злегка стиснули (≈ ' + kPa(x.press, l) + ')' : 'Squeezed lightly (≈ ' + kPa(x.press, l) + ')') : uk ? 'Сильно стиснули (≈ ' + kPa(x.press, l) + ')' : 'Squeezed hard (≈ ' + kPa(x.press, l) + ')';
    return uk
      ? `${act}: вода в трубці піднялася на ${mm(x.h, l)}, тобто зайшло ${mL(x.dV, l)}; ρ = ${formatMeasured('mass', m, 0.00001, l)} / ${mL(V - x.dV, l, 3)} ≈ ${g(x.rho, l)} — ${x.sinks ? (x.step === 'release' ? 'лишився на дні' : 'більша за густину води, водолаз пірнув') : x.step === 'release' ? 'менша за густину води, водолаз сплив' : 'ще менша за густину води, водолаз плаває'}.`
      : `${act}: the water in the tube rose ${mm(x.h, l)}, so ${mL(x.dV, l)} came in; ρ = ${formatMeasured('mass', m, 0.00001, l)} / ${mL(V - x.dV, l, 3)} ≈ ${g(x.rho, l)} — ${x.sinks ? (x.step === 'release' ? 'it stayed at the bottom' : 'above the water’s, the diver dived') : x.step === 'release' ? 'below the water’s, the diver came up' : 'still below the water’s, the diver floats'}.`;
  };
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Тіло в рідині тоне, якщо його середня густина більша за густину рідини, і спливає, якщо менша. Середня густина водолаза — це його маса (скло й гума), поділена на весь об’єм, який він займає у воді: скло, гуму й повітря в піпетці. Вода всередині піпетки — не його: вона й так частина води в пляшці.\n\nСтискаючи пляшку, ми збільшуємо тиск у воді — і за законом Паскаля він передається в усі боки однаково, зокрема й у піпетку, на повітря в ній. Вода майже не стискається, а повітря — легко: його об’єм зменшується, у піпетку заходить вода, і та сама маса займає менший об’єм. Середня густина зростає; перевищить густину води — водолаз пірне. Відпустимо — повітря розшириться, витисне воду, і водолаз спливе. Зверху рука не «заштовхує» його: додатковий тиск однаковий звідусіль.\n\nТак пірнають і спливають підводні човни: у баластні цистерни впускають забортну воду — човен стає важчим за той самий об’єм води й занурюється; щоб спливти, воду з цистерн витискають стиснутим повітрям. Водолаз разом із водою в піпетці — така сама цистерна. А в риби є плавальний міхур із газом: стискаючи чи розширюючи його, вона змінює свій об’єм — і середню густину, як наш водолаз.'
        : 'A body in a liquid sinks if its mean density is greater than the liquid’s and comes up if it is less. The diver’s mean density is its mass (glass and rubber) over all the room it takes in the water: the glass, the rubber and the air in the dropper. The water inside the dropper is not its own: it is part of the water in the bottle anyway.\n\nSqueezing the bottle, we raise the pressure in the water — and by Pascal’s law it passes on in all directions alike, into the dropper as well, onto the air there. Water hardly compresses, but air does easily: its volume shrinks, water comes into the dropper, and the same mass takes less room. The mean density grows; once above the water’s, the diver dives. Let go — the air expands, pushes the water out, and the diver comes up. The hand does not “push it down” from above: the extra pressure is the same from all sides.\n\nThis is how submarines dive and surface: sea water is let into the ballast tanks — the boat gets heavier than the same volume of water and goes down; to surface, the water is blown out of the tanks with compressed air. The diver with the water in its dropper is such a tank. And a fish has a swim bladder of gas: squeezing or widening it, it changes its volume — and its mean density, like our diver.',
    ),
    say: both((l) => (correct === 'density' && hard ? (l === 'uk' ? `Стиснули — і густина водолаза ≈ ${g(hard.rho, l)} стала більшою за густину води!` : `Squeezed — and the diver’s density ≈ ${g(hard.rho, l)} rose above the water’s!`) : l === 'uk' ? 'Подивімося, що сталося з водолазом.' : 'Let us look at what the diver did.')),
    text: both((l) => {
      if (!m || !V) return '';
      const head = l === 'uk' ? `Водолаз важить ${formatMeasured('mass', m, 0.00001, l)}, його об’єм разом із повітрям — ${formatMeasured('volume', V, 1e-7, l)}: середня густина ${g(rho0, l)} — менша за густину води (${g(water, l)}), тож він плаває.` : `The diver weighs ${formatMeasured('mass', m, 0.00001, l)}, its volume with the air is ${formatMeasured('volume', V, 1e-7, l)}: a mean density of ${g(rho0, l)} — less than the water’s (${g(water, l)}), so it floats.`;
      const tail = hard
        ? l === 'uk'
          ? ` Повітря стиснулося, бо тиск у пляшці зріс; на дні на нього тисне ще й вода над ним — ${sig(moves.find((x) => x.step === 'release')?.extra ?? 0, 2, l)} Па на глибині 25 см, — але цього замало, щоб утримати водолаза внизу. (Об’єм води в трубці — за її діаметром, 4 мм; тиск руки — оцінка.)`
          : ` The air shrank because the pressure in the bottle grew; at the bottom the water above it presses as well — ${sig(moves.find((x) => x.step === 'release')?.extra ?? 0, 2, l)} Pa 25 cm down — but that is too little to hold the diver down. (The water in the tube is taken by its diameter, 4 mm; the hand’s pressure is an estimate.)`
        : '';
      return `${head} ${moves.map((x) => what(x, l)).join(' ')}${tail}`;
    }),
  };
};
