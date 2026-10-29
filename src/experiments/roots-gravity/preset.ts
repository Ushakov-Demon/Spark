import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

/** The root knows which way is down: the question, the steps, the stories — and the answer from the photos. */
export const preset: Preset = {
  ask: { uk: 'Банку з паростками поклали на бік. Куди повернуть корінці?', en: 'A jar of seedlings is laid on its side. Which way will the roots turn?' },
  id: 'roots-gravity',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Корінь знає, де низ', en: 'The root knows which way is down' },
  question: {
    uk: 'Зерна кукурудзи проросли в скляній банці за вологим паперовим рушником, корінці ростуть прямо вниз. Покладемо банку на бік — корінці ляжуть горизонтально. Що з ними буде за дві години?',
    en: 'Maize grains have sprouted in a glass jar behind a wet paper towel, the roots growing straight down. We lay the jar on its side — the roots lie level. What becomes of them in two hours?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'gravi',
  plan: (['upright', 'side', 'clino'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.gravi', step } }) as const),
  choices: [ch('down', 'Загнуться вниз', 'They bend down'), ch('straight', 'Ростимуть далі вбік, як лежать', 'They go on growing sideways, as they lie'), ch('up', 'Повернуть угору, до світла', 'They turn up, to the light')],
  answerOnBoard: ['gr:'],
  asides: [
    {
      uk: 'А 1806 року англієць Томас Ендрю Найт обдурив паростки. Він прив’язав пророслі боби до обода колеса, яке крутила вода, — понад 150 обертів за хвилину. Корінці повернули від осі назовні, а стебельця за кілька днів зійшлися вістрями в центрі колеса: для рослин обертання стало замість тяжіння.',
      en: 'And in 1806 the Englishman Thomas Andrew Knight fooled the seedlings. He tied sprouted beans to the rim of a wheel turned by water — over 150 turns a minute. The roots turned outwards from the axle, and in a few days the shoots met tip to tip in the centre of the wheel: for the plants, the spinning stood in for gravity.',
    },
    {
      uk: 'Чарлз Дарвін разом із сином Френсісом 1880 року видав книжку «Здатність рослин до руху». Вони з’ясували, що тяжіння відчуває саме кінчик кореня, і написали: кінчик кореня діє, як мозок якоїсь нижчої тварини.',
      en: 'In 1880 Charles Darwin with his son Francis published «The Power of Movement in Plants». They found that it is the very tip of the root that feels gravity, and wrote that the tip of the radicle «acts like the brain of one of the lower animals».',
    },
    {
      uk: 'А що буде з корінцями там, де низу немає взагалі? 2012 року вчені вирощували рослинки резухи на Міжнародній космічній станції й фотографували їх кожні 6 годин. Корінці і в невагомості не росли абияк: їх напрямок задавало світло — вони росли від нього.',
      en: 'And what becomes of roots where there is no down at all? In 2012 scientists grew thale cress on the International Space Station and photographed it every 6 hours. Even weightless, the roots did not grow anyhow: light set their direction — they grew away from it.',
    },
  ],
  formulas: ['mechanics.density', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'впливу земного тяжіння на організми' }],
  expect: 'reached',
};

export const answer = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.gravi' && x.record.value !== null);
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const side = of('side');
  const clino = of('clino');
  const end = side.at(-1)?.value ?? null;
  const correct = end === null ? undefined : end >= 45 ? 'down' : end <= -45 ? 'up' : 'straight';
  const deg = (x: number) => `${x}°`;
  const first = side.find((r) => (r.value ?? 0) > 0);
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Корінь росте до Землі, а стебло — від неї: так на рослини діє тяжіння. А відчуває його кінчик кореня. У його клітинах є крохмальні зернятка, важчі за решту вмісту клітини. Вони осідають донизу, як пісок у банці з водою. Коли корінь кладуть на бік, зернятка сповзають до нової нижньої стінки. Тоді верхній бік кореня росте швидше за нижній — і корінь загинається вниз.\n\nНа клиностаті банка весь час повертається, і низ для зерняток обходить коло. Осісти кудись одне вони не встигають — наче в невагомості, тож корінь не загинається. Клиностат придумав німецький ботанік Юліус Сакс 1879 року.'
        : 'A root grows towards the Earth and a stem away from it: that is how gravity acts on plants. And it is the root tip that feels it. Its cells hold grains of starch, heavier than the rest of the cell’s contents. They settle to the bottom, like sand in a jar of water. When the root is laid on its side, the grains slide to the new lower wall. Then the root’s upper side grows faster than its lower side — and the root bends down.\n\nOn the clinostat the jar keeps turning, and «down» goes round for the grains. They never have time to settle anywhere — as if weightless, so the root does not bend. The clinostat was invented by the German botanist Julius Sachs in 1879.',
    ),
    say: both((l) => (end === null ? '' : l === 'uk' ? `За дві години корінці загнулися вниз на ${deg(end)}. Корінь знає, де низ!` : `In two hours the roots bent down by ${deg(end)}. The root knows which way is down!`)),
    text: both((l) => {
      const uk = l === 'uk';
      const parts: string[] = [];
      if (side.length) parts.push(uk ? `Банка на боці, кінчик кореня — від горизонталі вниз: ${side.map((r) => `${r.inputs?.['time']} хв — ${deg(r.value!)}`).join(', ')}.` : `The jar on its side, the root tip down from the level: ${side.map((r) => `${r.inputs?.['time']} min — ${deg(r.value!)}`).join(', ')}.`);
      if (first) parts.push(uk ? `Перші пів години корінь лежить, як лежав, — а тоді загинається, і за дві години дивиться прямо вниз.` : `For the first half hour the root lies as it lay — then it bends, and in two hours it points straight down.`);
      if (clino.length) parts.push(uk ? `На клиностаті за ті самі дві години — ${deg(Math.max(...clino.map((r) => r.value!)))}: корінь не загнувся.` : `On the clinostat over the same two hours — ${deg(Math.max(...clino.map((r) => r.value!)))}: the root did not bend.`);
      return parts.join(' ');
    }),
  };
};
