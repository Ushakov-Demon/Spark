import { efficiency, work } from '../../domains/mechanics/formulas.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, STEPS_END, stepLine, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { forceDivision, heightText, massText } from './bench.js';
import { lengthText } from './words.js';

export const preset_pulley: Preset = varied(
  {
    id: 'pulley',
    ask: { uk: 'Що дає рухомий блок — і чи дає він виграш у роботі?', en: 'What does a movable pulley give — and does it give a gain in work?' },
    grade: 7,
    topic: WORK,
    title: { uk: 'Нерухомий і рухомий блоки', en: 'A fixed and a movable pulley' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pulley',
    choices: [
      ch('force', 'Майже вдвічі меншу силу — але мотузку тягнути вдвічі довше, тож у роботі виграшу немає', 'Almost half the force — but the rope goes twice as far, so there is no gain in work'),
      ch('work', 'Удвічі меншу силу — і вдвічі менше роботи', 'Half the force — and half the work'),
      ch('none', 'Нічого: блок лише змінює напрям сили', 'Nothing: a pulley only turns the force'),
    ],
    // The works and the efficiency are the answer: chalked in once a guess is made.
    answerOnBoard: ['pw:'],
    asides: [
      {
        uk: 'Блоки знали ще в Єгипті майже чотири тисячі років тому — за XII династії. А грецький історик Плутарх розповідав про Архімеда: той, щоб показати силу механіки, сам, складеними блоками, підтягнув до себе повністю навантажене судно — «наче воно ковзало водою». Складені блоки — поліспаст — і досі піднімають вантажі на будівельних кранах.',
        en: 'Pulleys were known in Egypt almost four thousand years ago — under the Twelfth Dynasty. And the Greek historian Plutarch told of Archimedes: to show the power of mechanics, he single-handedly, with compound pulleys, drew a fully laden ship towards him «as if it were gliding through water». Compound pulleys — the block and tackle — still lift loads on building cranes.',
      },
    ],
    formulas: ['mechanics.pulley', 'mechanics.work', 'mechanics.efficiency'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'моделювання й конструювання: простих механізмів' }],
    expect: 'reached',
  },
  {
    // The load and the height: any of them — the force halves on the movable pulley, the rope goes twice as far.
    controls: [
      {
        id: 'mass',
        label: { uk: 'Маса вантажу', en: 'The load’s mass' },
        kind: 'number',
        unit: 'кг',
        min: 0.001,
        max: 1e6,
        step: 0,
        value: 0.3,
        units: [
          { id: 'g', label: { uk: 'г', en: 'g' }, factor: 0.001 },
          { id: 'kg', label: { uk: 'кг', en: 'kg' }, factor: 1 },
          { id: 't', label: { uk: 'т', en: 't' }, factor: 1000 },
        ],
      },
      {
        id: 'lift',
        label: { uk: 'Підняти на', en: 'Lift by' },
        kind: 'number',
        unit: 'м',
        min: 0.001,
        max: 1e4,
        step: 0,
        value: 0.1,
        units: [
          { id: 'cm', label: { uk: 'см', en: 'cm' }, factor: 0.01 },
          { id: 'm', label: { uk: 'м', en: 'm' }, factor: 1 },
        ],
      },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const lift = Number(v['lift']);
      return {
        question: {
          uk: `Вантаж масою ${massText(mass, true)} піднімаємо на ${heightText(lift, true)} динамометром: спершу просто вгору, потім через нерухомий блок, а тоді на рухомому блоці (один кінець мотузки закріплений угорі, другий тягнемо вгору). Щоразу читаємо силу на динамометрі й міряємо, на скільки протягли мотузку. Що дає рухомий блок — і чи дає він виграш у роботі?`,
          en: `A load of ${massText(mass, false)} we lift ${heightText(lift, false)} with a dynamometer: first straight up, then over a fixed pulley, and then on a movable pulley (one end of the rope fixed above, the other pulled up). Each time we read the force on the dynamometer and measure how far the rope went. What does a movable pulley give — and does it give a gain in work?`,
        },
        plan: (['straight', 'fixed', 'movable'] as const).map((how) => ({ kind: 'bench', command: { type: 'lab.pulley', how, mass, lift } }) as const),
      };
    },
  },
);

export const answer_pulley = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.pulley' && x.record.value !== null);
  const of = (how: string, which: number) => R.find((x) => x.command['how'] === how && x.record.inputs?.['which'] === which)?.record;
  const P = of('straight', 1)?.value ?? 0;
  const h = of('straight', 1)?.inputs?.['lift'] ?? 0.1;
  const rows = (['straight', 'fixed', 'movable'] as const).map((how) => ({ how, F: of(how, 1)?.value ?? 0, s: of(how, 2)?.value ?? 0 })).filter((x) => x.F > 0);
  const mov = rows.find((x) => x.how === 'movable');
  const eta = mov && P ? efficiency(work(P, h), work(mov.F, mov.s)) : 0;
  const correct = !mov || !P ? undefined : mov.F < 0.7 * P && mov.s > 1.5 * h && eta <= 1 ? 'force' : mov.F < 0.7 * P ? 'work' : 'none';
  const N = (x: number, l: Locale) => formatMeasured('force', x, forceDivision(x), l);
  const cm = lengthText;
  const J = (x: number, l: Locale) => `${new Intl.NumberFormat(l === 'uk' ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 3 }).format(x)} ${l === 'uk' ? 'Дж' : 'J'}`;
  const name = (how: string, l: Locale) => (l === 'uk' ? { straight: 'просто вгору', fixed: 'нерухомий блок', movable: 'рухомий блок' } : { straight: 'straight up', fixed: 'fixed pulley', movable: 'movable pulley' })[how as 'straight'];
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Нерухомий блок лише змінює напрям сили: мотузка через нього тягне вантаж тією самою силою, з якою тягнемо ми, — зате тягнути вниз зручніше, ніж піднімати. Рухомий блок вантаж тримають дві ділянки однієї мотузки, і кожна натягнута однаково, — тож кожна тягне лише половину ваги: F = (P + P_б)/2. Але, щоб вантаж піднявся на 10 см, кожна з двох ділянок має вкоротитися на 10 см — мотузку доводиться протягти на 20.\n\nВиграли в силі — програли в шляху, і робота F·s виходить не меншою за корисну P·h: це «золоте правило» механіки, жоден простий механізм не дає виграшу в роботі. Навіть трохи більше: разом із вантажем ми піднімаємо й сам рухомий блок, а ще долаємо тертя в його осі, — тому ККД рухомого блока менший за 100 %.'
        : 'A fixed pulley only turns the force: the rope over it pulls the load as hard as we pull — but pulling down is handier than lifting. A movable pulley holds the load on two sections of one rope, each pulled equally — so each takes only half the weight: F = (P + P_b)/2. But for the load to rise 10 cm, each of the two sections must shorten by 10 cm — the rope has to go 20.\n\nWe gained in force and lost in distance, and the work F·s comes out no less than the useful P·h: this is the «golden rule» of mechanics, no simple machine gives a gain in work. Even a little more: with the load we lift the movable pulley itself, and overcome the friction in its axle — so a movable pulley’s efficiency is below 100 %.',
    ),
    say: both((l) => (mov && mov.F >= P ? (l === 'uk' ? `Рухомий блок важчий за вантаж — і тягнути довелося більше, ніж просто вгору: ${N(mov.F, l)} проти ${N(P, l)}!` : `The movable pulley is heavier than the load — and it took more than straight up: ${N(mov.F, l)} against ${N(P, l)}!`) : correct === 'force' && mov ? (l === 'uk' ? `Сила — лише ${N(mov.F, l)} замість ${N(P, l)}, але мотузку тягнули ${cm(mov.s, l)}!` : `The force — only ${N(mov.F, l)} instead of ${N(P, l)}, but the rope went ${cm(mov.s, l)}!`) : l === 'uk' ? 'Порівняймо сили й роботу.' : 'Let us compare the forces and the work.')),
    text: both((l) => {
      if (!rows.length || !P) return '';
      const uk = l === 'uk';
      const list = rows.map((x) => (uk ? `${name(x.how, l)}: F = ${N(x.F, l)}, s = ${cm(x.s, l)}, A = F·s ≈ ${J(work(x.F, x.s), l)}` : `${name(x.how, l)}: F = ${N(x.F, l)}, s = ${cm(x.s, l)}, A = F·s ≈ ${J(work(x.F, x.s), l)}`));
      return uk
        ? `Вантаж важить ${N(P, l)}, піднімаємо його на ${cm(h, l)}: корисна робота P·h ≈ ${J(work(P, h), l)}.${list.map(stepLine).join(';') + STEPS_END}.${mov ? ` На рухомому блоці сила вдвічі менша, ніж (P + P_б), але шлях удвічі довший; ККД ≈ ${Math.round(eta * 100)} %${eta < 0.995 ? ' — решта пішла на підйом самого блока' : ' — сам блок проти такого вантажу майже нічого не важить'}.` : ''} (Тертя в осях не враховано.)`
        : `The load weighs ${N(P, l)}, we lift it ${cm(h, l)}: the useful work P·h ≈ ${J(work(P, h), l)}.${list.map(stepLine).join(';') + STEPS_END}.${mov ? ` On the movable pulley the force is half of (P + P_b), but the distance twice as long; efficiency ≈ ${Math.round(eta * 100)} %${eta < 0.995 ? ' — the rest went into lifting the pulley itself' : ' — beside such a load the pulley itself weighs next to nothing'}.` : ''} (Friction in the axles is left out.)`;
    }),
  };
};
