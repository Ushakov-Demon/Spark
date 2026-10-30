import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, STEPS_END, stepLine, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type LiftGas, massText, sizeText } from './bench.js';
import { liftText } from './words.js';

const GAS_OF: Record<string, { uk: string; en: string }> = { helium: { uk: 'гелієм', en: 'helium' }, hydrogen: { uk: 'воднем', en: 'hydrogen' }, 'hot-air': { uk: 'гарячим повітрям', en: 'hot air' } };

export const preset_balloon_lift: Preset = varied(
  {
    id: 'balloon-lift',
    ask: { uk: 'Від чого залежить, чи злетить куля?', en: 'What decides whether a balloon flies?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Піднімальна сила кулі', en: 'The lifting force of a balloon' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'balloon',
    choices: [
      ch('volume', 'Від того, чи газ разом з оболонкою легший за повітря того самого об’єму: велика куля з гелієм злетить, а маленька — може й ні', 'On whether the gas with the shell is lighter than the same volume of air: a big helium balloon flies, a small one maybe not'),
      ch('gas', 'Лише від газу: будь-яка куля з гелієм злетить, хоч яка мала', 'Only on the gas: any helium balloon flies, however small'),
      ch('air', 'Куля з повітрям теж злетить, тільки слабше: повітря ж легке', 'A balloon of air flies too, only weaker: air is light'),
    ],
    // The lifting forces are the answer: chalked in once a guess is made.
    answerOnBoard: ['bf:'],
    asides: [
      {
        uk: '4 червня 1783 року в містечку Анноне брати Монгольф’є вперше привселюдно запустили кулю з гарячим повітрям: вона пролетіла близько 2 км за 10 хвилин. У вересні у Версалі в кошику під кулею полетіли баран, качка й півень — і благополучно приземлилися. А 21 листопада 1783 року Пілатр де Розьє й маркіз д’Арланд уперше вільно полетіли над Парижем: 9 км за 25 хвилин. Уже за десять днів Жак Шарль піднявся на кулі з воднем приблизно на 3 км.',
        en: 'On 4 June 1783, in the town of Annonay, the Montgolfier brothers first publicly sent up a hot-air balloon: it flew about 2 km in 10 minutes. In September at Versailles a sheep, a duck and a rooster flew in a basket under the balloon — and landed safely. And on 21 November 1783 Pilâtre de Rozier and the marquis d’Arlandes made the first free flight over Paris: 9 km in 25 minutes. Ten days later Jacques Charles rose to about 3 km in a hydrogen balloon.',
      },
    ],
    formulas: ['mechanics.lifting-force', 'mechanics.buoyant-force', 'mechanics.density'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'дії виштовхувальної й піднімальної сили' }],
    expect: 'reached',
  },
  {
    // Any balloon: its gas, its size, its shell — a party balloon or an aerostat.
    controls: [
      { id: 'gas', label: { uk: 'Газ', en: 'Gas' }, kind: 'choice', value: 'helium', options: [ch('helium', 'Гелій', 'Helium'), ch('hydrogen', 'Водень', 'Hydrogen'), ch('hot-air', 'Гаряче повітря', 'Hot air')] },
      { id: 'diameter', label: { uk: 'Діаметр кулі', en: 'The balloon’s diameter' }, kind: 'number', unit: 'м', min: 0.01, max: 100, step: 0, value: 0.3, units: [{ id: 'cm', label: { uk: 'см', en: 'cm' }, factor: 0.01 }, { id: 'm', label: { uk: 'м', en: 'm' }, factor: 1 }] },
      { id: 'shell', label: { uk: 'Маса оболонки', en: 'The shell’s mass' }, kind: 'number', unit: 'кг', min: 0.0001, max: 1e5, step: 0, value: 0.003, units: [{ id: 'g', label: { uk: 'г', en: 'g' }, factor: 0.001 }, { id: 'kg', label: { uk: 'кг', en: 'kg' }, factor: 1 }] },
      { id: 'hot', label: { uk: 'Гаряче повітря, t', en: 'Hot air, t' }, kind: 'number', unit: '°C', min: 21, max: 399, step: 0, value: 100 },
    ],
    build: (v) => {
      const gas = String(v['gas']) as LiftGas;
      const diameter = Number(v['diameter']);
      const shell = Number(v['shell']);
      const hot = Number(v['hot']);
      const g = GAS_OF[gas] ?? GAS_OF['helium']!;
      const hotUk = gas === 'hot-air' ? ` (нагрітим до ${hot} °C)` : '';
      const hotEn = gas === 'hot-air' ? ` (heated to ${hot} °C)` : '';
      return {
        question: {
          uk: `Зважимо порожню кулю (оболонка ${massText(shell, true)}), наповнимо її ${g.uk}${hotUk} до ${sizeText(diameter, true)} у діаметрі й прив’яжемо до тягарця на терезах: на скільки менше вони покажуть? Потім — таку саму кулю, удвічі меншу, і кулю, надуту просто повітрям. Від чого залежить, чи злетить куля?`,
          en: `We weigh an empty balloon (a ${massText(shell, false)} shell), fill it with ${g.en}${hotEn} to ${sizeText(diameter, false)} across and tie it to a weight on a balance: how much less will it show? Then the same balloon half as wide, and one blown up with plain air. What decides whether a balloon flies?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.balloon', step: 'shell', shell } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'size', diameter } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'lift', gas, diameter, shell, hot } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'lift', gas, diameter: diameter / 2, shell, hot } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'lift', gas: 'air', diameter, shell, hot } },
        ],
      };
    },
  },
);

export const answer_balloon_lift = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.balloon' && x.command['step'] === 'lift' && x.record.value !== null);
  const rows = R.map((x) => ({ gas: String(x.command['gas']), d: Number(x.command['diameter']), F: x.record.value!, rec: x.record }));
  const big = rows[0];
  const air = rows.find((x) => x.gas === 'air');
  const correct = !rows.length ? undefined : air && air.F >= 0 ? 'air' : 'volume';
  const name = (gas: string, l: Locale) => (l === 'uk' ? { helium: 'з гелієм', hydrogen: 'з воднем', 'hot-air': 'з гарячим повітрям', air: 'з повітрям' } : { helium: 'of helium', hydrogen: 'of hydrogen', 'hot-air': 'of hot air', air: 'of air' })[gas as 'air'];
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Повітря — теж «рідина», у якій ми живемо, і закон Архімеда діє в ньому так само: на кулю діє виштовхувальна сила, що дорівнює вазі повітря в її об’ємі, ρ_пов·g·V. Униз тягнуть вага газу всередині, ρ_г·g·V, і вага оболонки. Куля злітає, коли виштовхувальна сила більша за обидві ваги разом: F = (ρ_пов − ρ_г)·g·V − m_об·g > 0.\n\nТому важливий не лише газ, а й розмір. Гелій і водень у кілька разів легші за повітря, гаряче повітря рідшає (за сталого тиску густина газу обернено пропорційна його абсолютній температурі). Але різниця густин множиться на об’єм, а він росте з кубом діаметра, тоді як оболонка — лише з площею поверхні. Удвічі менша куля має вісім разів менший об’єм — і вагу оболонки вона може вже не подолати. А куля з повітрям із легенів газом нічого не виграє, і її тягне вниз сама оболонка.'
        : 'Air is a «fluid» too, the one we live in, and Archimedes’ law works in it just the same: a buoyant force equal to the weight of the air in the balloon’s volume, ρ_air·g·V, acts on it. Pulling down are the weight of the gas inside, ρ_gas·g·V, and the shell’s weight. The balloon flies when the buoyant force beats both weights together: F = (ρ_air − ρ_gas)·g·V − m_shell·g > 0.\n\nSo not only the gas counts, but the size too. Helium and hydrogen are several times lighter than air, hot air thins (at a constant pressure a gas’s density goes inversely as its absolute temperature). But the difference of the densities is multiplied by the volume, which grows with the cube of the diameter, while the shell grows only with its area. A balloon half as wide has eight times less volume — and may no longer beat its shell’s weight. And a balloon of air from the lungs gains nothing by its gas, and its shell alone pulls it down.',
    ),
    say: both((l) => (big ? (l === 'uk' ? `Велика куля ${name(big.gas, l)} ${big.F > 0 ? 'тягне вгору' : 'не злітає'}, а ${rows[1] && rows[1].F <= 0 ? 'удвічі менша — уже ні!' : 'удвічі менша — теж тягне.'}` : `The big balloon ${name(big.gas, l)} ${big.F > 0 ? 'pulls up' : 'does not fly'}, and ${rows[1] && rows[1].F <= 0 ? 'the one half as wide — no longer!' : 'the one half as wide pulls too.'}`) : '')),
    text: both((l) => {
      if (!rows.length) return '';
      const uk = l === 'uk';
      const list = rows.map((x) => (uk ? `${sizeText(x.d, true)} ${name(x.gas, l)}: ρ_г ≈ ${sig(x.rec.inputs?.['gasDensity'] ?? 0, 3, l)} кг/м³, ${liftText(x.rec, l)}, F ≈ ${sig(x.F, 3, l)} Н — ${x.F > 0 ? 'злітає' : 'не злітає'}` : `${sizeText(x.d, false)} ${name(x.gas, l)}: ρ_gas ≈ ${sig(x.rec.inputs?.['gasDensity'] ?? 0, 3, l)} kg/m³, ${liftText(x.rec, l)}, F ≈ ${sig(x.F, 3, l)} N — ${x.F > 0 ? 'flies' : 'does not fly'}`));
      const air = rows[0]?.rec.inputs?.['airDensity'] ?? 0;
      return uk
        ? `Повітря навколо — ${sig(air, 3, l)} кг/м³ (20 °C).${list.map(stepLine).join(';') + STEPS_END}. (Густини газів — за рівнянням стану ідеального газу; повітря з легенів вважаємо таким самим, як навколо.)`
        : `The air about is ${sig(air, 3, l)} kg/m³ (20 °C).${list.map(stepLine).join(';') + STEPS_END}. (The gases’ densities by the ideal gas law; air from the lungs taken as the air about.)`;
    }),
  };
};
