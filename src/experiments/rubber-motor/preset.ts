import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { BAND_STRETCH, RUBBER_TURNS, turnsText } from './bench.js';

export const preset_rubber_motor: Preset = {
  ask: { uk: 'Удвічі більше обертів гумки — у скільки разів далі проїде машинка?', en: 'Twice the turns of the band — how many times further does the car go?' },
  id: 'rubber-motor',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Машинка на гумовому двигуні', en: 'A car on a rubber-band motor' },
  question: {
    uk: 'Змайструємо машинку з гумовим двигуном: гумка зачеплена за передню вісь і намотується на задню. Закрутимо її на 3 оберти, відпустимо й поміряємо, скільки проїде. А тоді — на 6 обертів, удвічі більше. У скільки разів далі проїде машинка?',
    en: 'We make a car with a rubber-band motor: the band is hooked to the front axle and winds round the back one. We wind it 3 turns, let go and measure how far it goes. Then 6 turns — twice as many. How many times further will the car go?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'rubber',
  plan: [{ kind: 'bench', command: { type: 'lab.rubber', step: 'band' } }, ...RUBBER_TURNS.map((turns) => ({ kind: 'bench', command: { type: 'lab.rubber', step: 'run', turns } }) as const)],
  choices: [ch('twice', 'Удвічі: удвічі більше обертів — удвічі далі', 'Twice: twice the turns, twice as far'), ch('four', 'Учетверо', 'Four times'), ch('same', 'Так само: гумка та сама', 'The same: it is the same band')],
  trick: { uk: 'Більшість думає, що вдвічі більше обертів — це вдвічі далі.', en: 'Most people think twice the turns means twice as far.' },
  answerOnBoard: ['rr:'],
  formulas: ['mechanics.hooke'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез; динамометра; механізму на «гумовому двигуні»' }],
  expect: 'reached',
};

export const answer_rubber_motor = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.rubber' && x.record.value !== null);
  const band = recs.find((x) => x.command['step'] === 'band')?.record;
  const runs = recs.filter((x) => x.command['step'] === 'run').map((x) => ({ n: Number(x.command['turns']), s: x.record.value! }));
  const at = (n: number) => runs.find((r) => r.n === n)?.s;
  const s3 = at(3);
  const s6 = at(6);
  const ratio = s3 && s6 ? s6 / s3 : null;
  const correct = ratio === null ? undefined : ratio > 3 ? 'four' : ratio > 1.4 ? 'twice' : 'same';
  const m = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'м' : 'm'}`;
  // «у 4 рази», «у 8,9 раза», «у 5 разів».
  const times = (x: number, l: Locale) => {
    const v = sig(x, 2, l);
    if (l !== 'uk') return `${v} times`;
    const k = Number(v.replace(',', '.'));
    return `у ${v} ${!Number.isInteger(k) ? 'раза' : k % 10 >= 2 && k % 10 <= 4 && (k % 100 < 12 || k % 100 > 14) ? 'рази' : 'разів'}`;
  };
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Кожен оберт намотує на олівець ще шматок гумки. Удвічі більше обертів — гумка розтягнута вдвічі більше, тож і тягне вдвічі сильніше (закон Гука). А тягне вона, поки не розмотається, — теж удвічі довшу дорогу. Удвічі сильніше та ще й удвічі довше — учетверо далі; утричі більше обертів — уподев’ятеро. Справжня гумка віддає трохи менше, ніж у моделі, але правило видно й так.\n\nГумовий двигун — один із найстаріших. 1871 року француз Альфонс Пено запустив у паризькому саду Тюїльрі модель літака з закрученою гумкою — «планофор»: вона пролетіла 40 м за 11 секунд. А 1878 року батько приніс синам, Вілбуру й Орвілу Райтам, іграшковий гелікоптер за винаходом Пено — з паперу, бамбука й корка, гвинт крутила гумка. Брати гралися ним, поки не зламали, а тоді змайстрували власний. Згодом вони казали: з цієї іграшки й почалося їхнє захоплення польотами.'
        : 'Each turn winds another piece of band onto the pencil. Twice the turns — the band is stretched twice as far, so it pulls twice as hard (Hooke’s law). And it pulls until it unwinds — over a way twice as long too. Twice as hard and twice as long — four times as far; three times the turns — nine times. A real band gives back a little less than the model, but the rule shows all the same.\n\nThe rubber motor is one of the oldest. In 1871 the Frenchman Alphonse Pénaud flew a model aeroplane driven by a twisted rubber band — the “Planophore” — in the Tuileries Gardens in Paris: it went 40 m in 11 seconds. And in 1878 their father brought his sons, Wilbur and Orville Wright, a toy helicopter after Pénaud’s invention — of paper, bamboo and cork, its rotor turned by a rubber band. The brothers played with it until it broke, then built their own. Later they said that toy was where their passion for flying began.',
    ),
    say: both((l) => (ratio === null ? '' : l === 'uk' ? `Удвічі більше обертів — ${times(ratio, l)} далі!` : `Twice the turns — ${times(ratio, l)} as far!`)),
    text: both((l) => {
      const uk = l === 'uk';
      const parts: string[] = [];
      if (band) parts.push(uk ? `Гумка, розтягнута на ${sig(BAND_STRETCH * 100, 2, l)} см, тягне з силою ${sig(band.value!, 2, l)} Н: її жорсткість k = F/x ≈ ${sig(band.value! / BAND_STRETCH, 2, l)} Н/м.` : `The band stretched ${sig(BAND_STRETCH * 100, 2, l)} cm pulls with ${sig(band.value!, 2, l)} N: its stiffness k = F/x ≈ ${sig(band.value! / BAND_STRETCH, 2, l)} N/m.`);
      if (runs.length) parts.push(uk ? `Машинка проїхала: ${runs.map((r) => `${turnsText(r.n, true)} — ${m(r.s, l)}`).join(', ')}.` : `The car went: ${runs.map((r) => `${turnsText(r.n, false)} — ${m(r.s, l)}`).join(', ')}.`);
      if (ratio !== null) parts.push(uk ? `Удвічі більше обертів — ${times(ratio, l)} далі${at(9) ? `, утричі більше — ${times(at(9)! / s3!, l)}` : ''}: відстань росте як квадрат кількості обертів.` : `Twice the turns — ${times(ratio, l)} as far${at(9) ? `, three times — ${times(at(9)! / s3!, l)}` : ''}: the distance grows as the square of the turns.`);
      return parts.join(' ');
    }),
  };
};
