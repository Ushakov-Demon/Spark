import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room, times, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { MOTION_SETUP, PENDULUM_BALLS, ROLL_PATH, THREAD_LENGTH } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_average_speed: Preset = varied(
  {
    id: 'average-speed',
    ask: { uk: 'Де середня швидкість кульки більша: на всьому шляху чи на першій половині?', en: 'Where is the ball’s average speed greater: on the whole path or on its first half?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Середня швидкість кульки на жолобі', en: 'The average speed of a ball in a groove' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'motion',
  benchSetup: MOTION_SETUP.incline,
    choices: [ch('whole', 'На всьому шляху', 'On the whole path'), ch('half', 'На першій половині', 'On the first half'), ch('same', 'Однакова', 'The same')],
    choicesAt: 'end',
    answerOnBoard: ['roll:'],
    formulas: ['mechanics.average-speed'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 1', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 1. Визначення середньої швидкості руху тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 1, с. 75' } }],
    expect: 'reached',
  },
  {
    // «At a small angle»: the upper end of the 1.2 m groove raised 5, 10 or 15 cm.
    controls: [{ id: 'raise', label: { uk: 'Верхній кінець жолоба', en: 'Upper end of the groove' }, kind: 'choice', options: [ch('5', '5 см', '5 cm'), ch('10', '10 см', '10 cm'), ch('15', '15 см', '15 cm')], value: '10' }],
    build: (v) => {
      const cm = Number(v['raise']);
      const raise = cm / 100;
      return {
        question: {
          uk: `Жолоб закріпили на штативі під невеликим кутом — верхній кінець піднято на ${cm} см, на ньому — позначка крейдою, а внизу — металевий циліндр, що зупиняє кульку. Виміряємо шлях і час, за який кулька скотиться від позначки до циліндра, а потім — лише першу половину шляху. Де середня швидкість кульки більша: на всьому шляху чи на першій половині?`,
          en: `A groove is fixed on a stand at a small angle — its upper end raised ${cm} cm, with a chalk mark on it and a metal cylinder at the bottom to stop the ball. We measure the path and the time the ball takes from the mark to the cylinder, then the first half of the path only. Where is the ball’s average speed greater: on the whole path or on its first half?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.tape', what: 'path', length: ROLL_PATH } },
          { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH, raise } },
          { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH / 2, raise } },
        ],
      };
    },
  },
);

export const answer_average_speed = (run: PresetRun): PresetAnswer => {
  const R = run.readings ?? [];
  const l = R.find((x) => x.command.type === 'lab.tape')?.record.value ?? null;
  const rolls = R.filter((x) => x.command.type === 'lab.roll' && x.record.value !== null);
  const whole = rolls.find((x) => Number(x.command['path']) >= (l ?? 1) - 1e-9)?.record.value ?? null;
  const half = rolls.find((x) => Number(x.command['path']) < (l ?? 1) - 1e-9)?.record.value ?? null;
  const ok = l !== null && whole !== null && half !== null;
  const v1 = ok ? l! / whole! : 0;
  const v2 = ok ? l! / 2 / half! : 0;
  const correct = ok ? (v1 > v2 * 1.03 ? 'whole' : v2 > v1 * 1.03 ? 'half' : 'same') : undefined;
  const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  const v = (x: number, l: Locale) => `${sig(x, 2, l)} ${l === 'uk' ? 'м/с' : 'm/s'}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Кулька весь час розганяється: її тягне вниз уздовж жолоба частина сили тяжіння. На початку вона котиться повільно, наприкінці — швидко. Перша половина шляху — повільна частина, тому її середня швидкість менша; на всьому шляху до неї додається швидка друга половина. Під час розгону з місця шлях росте як квадрат часу (l = a·t²/2), тож половину шляху кулька проходить не за половину часу, а за ≈ 71 % (1/√2) — і середня швидкість на всьому шляху в √2 ≈ 1,4 раза більша. Тому, називаючи середню швидкість, завжди кажуть, на якій ділянці." : "The ball keeps speeding up: part of gravity pulls it down along the groove. It rolls slowly at first and fast at the end. The first half of the path is the slow part, so its average speed is lower; over the whole path the fast second half adds in. Speeding up from rest, the path grows as the square of the time (l = a·t²/2), so the ball covers half the path not in half the time but in ≈ 71 % of it (1/√2) — and the average speed over the whole path is √2 ≈ 1.4 times greater. That is why an average speed always comes with the stretch it is for.")),
    say: both((l) => (l === 'uk' ? 'Кулька розганяється — тому й середня швидкість різна!' : 'The ball speeds up — so the average speed differs!')),
    text: both((lc) =>
      lc === 'uk'
        ? `Увесь шлях l = ${ok ? formatMeasured('length', l!, 0.001, lc) : '—'} кулька пройшла за ${ok ? s(whole!, lc) : '—'}: v = l/t ≈ ${v(v1, lc)}. Першу половину — за ${ok ? s(half!, lc) : '—'}: v ≈ ${v(v2, lc)}. Кулька весь час розганяється, тож другу половину шляху вона проходить швидше за першу, і середня швидкість на всьому шляху більша — тут ${times(v1 / Math.max(v2, 1e-9), lc)}. Тому середня швидкість завжди стосується певної ділянки шляху. Секундомір тут показує точно; вручну людина вмикає й зупиняє його із запізненням ≈ 0,1–0,2 с — тому дослід у підручнику повторюють тричі й беруть середній час.`
        : `The ball covered the whole path l = ${ok ? formatMeasured('length', l!, 0.001, lc) : '—'} in ${ok ? s(whole!, lc) : '—'}: v = l/t ≈ ${v(v1, lc)}. The first half — in ${ok ? s(half!, lc) : '—'}: v ≈ ${v(v2, lc)}. The ball keeps speeding up, so it covers the second half faster than the first, and the average speed on the whole path is greater — here ${sig(v1 / Math.max(v2, 1e-9), 2, lc)} times. So an average speed always belongs to a stretch of the path. The stopwatch here reads exactly; by hand one starts and stops it ≈ 0.1–0.2 s late — that is why the textbook repeats the run three times and takes the mean time.`,
    ),
  };
};

export const preset_rotation_period: Preset = varied(
  {
    id: 'rotation-period',
    ask: { uk: 'Як зміниться період обертання, якщо вкоротити нитку, а коло лишити те саме?', en: 'How does the period change if the thread is shortened and the circle stays the same?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Період обертання тіла на нитці', en: 'The period of a body turning on a thread' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'motion',
  benchSetup: MOTION_SETUP.circle,
    choices: [ch('shorter', 'Стане меншим — тіло обертатиметься частіше', 'It gets shorter — the body turns more often'), ch('longer', 'Стане більшим', 'It gets longer'), ch('same', 'Не зміниться — коло ж те саме', 'It stays — the circle is the same')],
    choicesAt: 'end',
    formulas: ['mechanics.period'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 2', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 2. Визначення періоду обертання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 2, с. 87' } }],
    expect: 'reached',
  },
  {
    // More turns timed — the same slip of the stopwatch shared among more of them: a truer period.
    controls: [{ id: 'turns', label: { uk: 'Скільки обертів рахувати', en: 'Turns to count' }, kind: 'choice', options: [ch('10', '10', '10'), ch('20', '20', '20')], value: '10' }],
    build: (v) => {
      const turns = Number(v['turns']);
      return {
        question: {
          uk: `Тримаючи нитку за петлю над центром кола радіусом 15 см, розкрутимо тіло так, щоб воно йшло по колу, і виміряємо час ${turns} обертів. З нього знайдемо період, обертову частоту й швидкість тіла. А потім вкоротимо нитку, а коло лишимо те саме. Як зміниться період обертання?`,
          en: `Holding the thread by its loop over the centre of a 15 cm circle, we swing the body round it and time ${turns} turns. From that we find the period, the frequency and the body’s speed. Then we shorten the thread and keep the circle. How does the period change?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.whirl', thread: THREAD_LENGTH.value, turns } },
          { kind: 'bench', command: { type: 'lab.whirl', thread: 0.3, turns } },
        ],
      };
    },
  },
);

export const answer_rotation_period = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.whirl' && x.record.value !== null).map((x) => ({ L: Number(x.command['thread']), N: Number(x.command['turns']), t: x.record.value!, R: x.record.inputs?.['radius'] ?? 0.15 }));
  const [a, b] = rows;
  const Ta = a ? a.t / a.N : 0;
  const Tb = b ? b.t / b.N : 0;
  const correct = a && b ? (Tb < Ta * 0.97 ? 'shorter' : Tb > Ta * 1.03 ? 'longer' : 'same') : undefined;
  const cm = (m: number, l: Locale) => formatMeasured('length', m, 0.01, l);
  const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Тіло йде по колу, бо нитка, нахилена до вертикалі, тягне його не лише вгору, а й до центру кола. Коло те саме, але коротка нитка нахилена сильніше, тож до центру тягне більша частка сили — і тіло мусить обходити коло швидше, щоб ця сила якраз утримувала його на колі. Виходить T = 2π·√(h/g), де h — висота руки над площиною кола: коротша нитка — нижче рука над колом — менший період. Це той самий закон, що й у нитяного маятника, — бо це теж маятник, тільки він не гойдається, а обертається." : "The body goes round because the slanting thread pulls it not only up but also towards the centre. The circle is the same, but a short thread slants more, so a bigger share of the pull points to the centre — and the body has to go round faster for that pull to keep it just on the circle. It comes out T = 2π·√(h/g), h being the hand’s height above the circle: a shorter thread — the hand lower over the circle — a shorter period. It is the same law as for a thread pendulum — because it is a pendulum too, only it turns instead of swinging.")),
    say: both((l) => (l === 'uk' ? 'Коротша нитка — частіше оберти!' : 'A shorter thread — quicker turns!')),
    text: both((l) =>
      l === 'uk'
        ? `${a ? `Із ниткою ${cm(a.L, l)} ${a.N} обертів тривали ${s(a.t, l)}: T = t/N ≈ ${formatMeasured('time', Ta, 0.01, l)}, n = N/t ≈ ${sig(1 / Ta, 2, l)} об/с, швидкість тіла v = 2πR/T ≈ ${sig((2 * Math.PI * a.R) / Ta, 2, l)} м/с. ` : ''}${b ? `Із ниткою ${cm(b.L, l)} — ${s(b.t, l)}: T ≈ ${formatMeasured('time', Tb, 0.01, l)}. ` : ''}Коло те саме, але коротша нитка стоїть похиліше, і тіло, щоб іти по колу, має обертатися частіше: період залежить від довжини нитки (для тіла на нитці T = 2π·√(h/g), де h — висота руки над площиною кола). Тому період міряють за багатьма обертами: один оберт триває близько секунди, а рука вмикає секундомір із запізненням ≈ 0,1–0,2 с.`
        : `${a ? `With a ${cm(a.L, l)} thread ${a.N} turns took ${s(a.t, l)}: T = t/N ≈ ${formatMeasured('time', Ta, 0.01, l)}, n = N/t ≈ ${sig(1 / Ta, 2, l)} rev/s, the body’s speed v = 2πR/T ≈ ${sig((2 * Math.PI * a.R) / Ta, 2, l)} m/s. ` : ''}${b ? `With a ${cm(b.L, l)} thread — ${s(b.t, l)}: T ≈ ${formatMeasured('time', Tb, 0.01, l)}. ` : ''}The circle is the same, but a shorter thread slants more, and to go round the circle the body has to turn more often: the period depends on the thread (for a body on a thread T = 2π·√(h/g), h being the hand’s height above the circle). That is why the period is timed over many turns: one turn takes about a second, and a hand starts the stopwatch ≈ 0.1–0.2 s late.`,
    ),
  };
};

export const preset_pendulum: Preset = varied(
  {
    id: 'pendulum',
    ask: { uk: 'Від чого залежить період коливань маятника: від амплітуди, маси кульки чи довжини нитки?', en: 'What does a pendulum’s period depend on: the amplitude, the ball’s mass or the length?' },
    grade: 7,
    topic: MOTION,
    title: { uk: 'Коливання нитяного маятника', en: 'The swings of a thread pendulum' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'motion',
  benchSetup: MOTION_SETUP.pendulum,
    choices: [ch('length', 'Лише від довжини нитки', 'Only on the length'), ch('amplitude', 'Від амплітуди: що ширше розмах, то довше', 'On the amplitude: the wider, the longer'), ch('mass', 'Від маси: важча кулька гойдається повільніше', 'On the mass: a heavier ball swings slower')],
    choicesAt: 'end',
    answerOnBoard: ['Tp:'],
    formulas: ['mechanics.pendulum', 'mechanics.period'],
    programs: [
      { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 3', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 3. Дослідження коливань нитяного маятника.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 3, с. 99' } },
      { program: 'ua-nus-2023-holovko', grade: 9, match: 'same', quote: 'коливань математичного маятника' },
    ],
    expect: 'reached',
  },
  {
    // More swings timed — the same slip of the stopwatch shared among more of them: a truer period.
    controls: [{ id: 'count', label: { uk: 'Скільки коливань рахувати', en: 'Swings to count' }, kind: 'choice', options: [ch('10', '10', '10'), ch('20', '20', '20'), ch('30', '30', '30')], value: '20' }],
    build: (v) => {
      const count = Number(v['count']);
      return {
        question: {
          uk: `Підвісимо до кільця штатива кульку на нитці завдовжки 1 м. Виміряємо час ${count} коливань, відхиливши кульку на 2,5 см, потім — на 5,5 см. Тоді замінимо кульку важчою, а наостанок вкоротимо нитку до 25 см. Від чого залежить період коливань маятника?`,
          en: `We hang a ball on a 1 m thread from the stand’s ring. We time ${count} swings with the ball pulled 2.5 cm aside, then 5.5 cm. Then we put on a heavier ball, and at last shorten the thread to 25 cm. What does the pendulum’s period depend on?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.tape', what: 'length', length: 1 } },
          { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.light, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.055, mass: PENDULUM_BALLS.light, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.heavy, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: 0.25, amplitude: 0.025, mass: PENDULUM_BALLS.light, count } },
        ],
      };
    },
  },
);

export const answer_pendulum = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.swing' && x.record.value !== null).map((x) => ({ L: Number(x.command['length']), A: Number(x.command['amplitude']), m: Number(x.command['mass']), T: x.record.value! / Number(x.command['count']) }));
  const [base, wide, heavy, short] = rows;
  const close = (x?: { T: number }, y?: { T: number }) => !!x && !!y && Math.abs(x.T - y.T) / y.T < 0.02;
  const ok = !!base && !!wide && !!heavy && !!short;
  const correct = ok ? (close(wide, base) && close(heavy, base) && !close(short, base) ? 'length' : !close(wide, base) ? 'amplitude' : 'mass') : undefined;
  const sT = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Чому маса не важить? Важчу кульку Земля тягне сильніше, але й розігнати її важче — у стільки ж разів: і сила тяжіння, і інертність пропорційні масі, тож рухається важка кулька так само, як легка (як і падають вони однаково, якщо не заважає повітря). Чому майже не важить амплітуда? За ширшого розмаху кульці далі йти, але й сила, що повертає її до середини, більша — вона пропорційна відхиленню, тож кулька й рухається швидше; при малих кутах ці два ефекти точно компенсують один одного. А довжина важить: на довшій нитці та сама сила тяжіння повертає кульку повільніше — повертальна сила пропорційна відхиленню, поділеному на довжину. Звідси T = 2π·√(l/g): учетверо довша нитка — удвічі довший період." : "Why does the mass not matter? The Earth pulls a heavier ball harder, but it is also harder to speed up — by just as much: both gravity and inertia are proportional to the mass, so a heavy ball moves like a light one (just as they fall alike when the air does not get in the way). Why does the amplitude hardly matter? With a wider swing the ball has farther to go, but the force bringing it back to the middle is larger too — proportional to how far it is out — so it also moves faster; at small angles the two cancel exactly. But the length matters: on a longer thread the same gravity brings the ball back more slowly — the restoring force is proportional to the displacement over the length. Hence T = 2π·√(l/g): a thread four times longer — twice the period.")),
    say: both((l) => (l === 'uk' ? 'Лише довжина нитки задає ритм маятника!' : 'Only the length sets a pendulum’s rhythm!')),
    text: both((l) =>
      l === 'uk'
        ? ok
          ? `Маятник 1 м: відхилення 2,5 см — T ≈ ${sT(base!.T, l)}, 5,5 см — T ≈ ${sT(wide!.T, l)}, важча кулька — T ≈ ${sT(heavy!.T, l)}: період той самий. Маятник 25 см — T ≈ ${sT(short!.T, l)}: учетверо коротша нитка — удвічі менший період. Період малих коливань не залежить ні від амплітуди, ні від маси, а лише від довжини: T = 2π·√(l/g) ≈ ${sT(2 * Math.PI * Math.sqrt(1 / G), l)} для 1 м. (За ширшого розмаху період зростає на тисячні частки — секундомір у руці цього не помітить.) Тож маятник завдовжки 4 м гойдався б із періодом ≈ 4 с — удвічі довше, ніж метровий, хай якою була б його кулька.`
          : 'Дослід ще не завершено.'
        : ok
          ? `A 1 m pendulum: 2.5 cm aside — T ≈ ${sT(base!.T, l)}, 5.5 cm — T ≈ ${sT(wide!.T, l)}, a heavier ball — T ≈ ${sT(heavy!.T, l)}: the same period. A 25 cm pendulum — T ≈ ${sT(short!.T, l)}: a thread four times shorter — half the period. The period of small swings depends on neither the amplitude nor the mass, only on the length: T = 2π·√(l/g) ≈ ${sT(2 * Math.PI * Math.sqrt(1 / G), l)} for 1 m. (A wider swing lengthens it by thousandths — a stopwatch in a hand will not notice.) So a 4 m pendulum would swing with a period of ≈ 4 s — twice as long as a metre one, whatever its ball.`
          : 'The experiment is not finished yet.',
    ),
  };
};
