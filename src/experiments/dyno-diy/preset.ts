import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { DYNO_DIVISION } from './bench.js';
import { scalesSequence } from '../scales-diy/bench.js';

export const preset_dyno_diy: Preset = {
  ask: { uk: 'Скільки покаже динамометр, якщо почепити невелике яблуко?', en: 'What will a dynamometer show with a small apple on it?' },
  id: 'dyno-diy',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Саморобний динамометр', en: 'A dynamometer of our own' },
  question: {
    uk: 'Змайструємо динамометр: дощечка, смужка паперу, пружина, стрілка з дроту й гачок зі скріпки. Шкалу нанесемо самі — за тягарцями по 100 г. А тоді почепимо на нього невелике яблуко, грамів на сто. Що покаже динамометр?',
    en: 'We make a dynamometer: a board, a strip of paper, a spring, a wire pointer and a paper-clip hook. We draw the scale ourselves — by 100 g weights. Then we hang a small apple, about a hundred grams, on it. What will the dynamometer show?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'dyno',
  plan: (['marks', 'scale', 'apple', 'egg'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.dyno', step } }) as const),
  choices: [ch('one', 'Близько 1 Н', 'About 1 N'), ch('hundred', 'Близько 100 Н — яблуко ж важить 100 г', 'About 100 N — the apple is 100 g, after all'), ch('tenth', 'Близько 0,1 Н', 'About 0.1 N')],
  trick: { uk: 'Багато хто плутає грами з ньютонами: маса — не сила.', en: 'Many mix up grams and newtons: mass is not force.' },
  answerOnBoard: ['da:'],
  formulas: ['mechanics.weight', 'mechanics.hooke'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез; динамометра' }],
  expect: 'reached',
};

export const answer_dyno_diy = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.dyno' && x.record.value !== null);
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const marks = of('marks');
  const L = of('scale')[0];
  const apple = of('apple')[0];
  const egg = of('egg')[0];
  const correct = apple ? (apple.value! > 0.5 && apple.value! < 2 ? 'one' : apple.value! >= 2 ? 'hundred' : 'tenth') : undefined;
  const N = (x: number, l: Locale) => formatMeasured('force', x, DYNO_DIVISION, l);
  const mm = (x: number, l: Locale) => `${Math.round(x * 1000)} ${l === 'uk' ? 'мм' : 'mm'}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Динамометр — це пружина зі шкалою. Пружина видовжується пропорційно силі (закон Гука), тож рівні сили дають рівні відстані між рисками — і шкалу досить розмітити двома-трьома відомими силами, а решту поділити рівно. Відомі сили дають тягарці: Земля тягне 100 г із силою 0,98 Н.\n\nМаса й сила — різні речі. Яблуко має масу 100 г, а тягне вниз із силою близько 1 Н — одиниці, названої на честь Ньютона. Якби яблуко опинилося на Місяці, його маса лишилася б 100 г, а динамометр показав би значно менше: там слабше тяжіння.'
        : 'A dynamometer is a spring with a scale. A spring stretches in proportion to the force (Hooke’s law), so equal forces give equal gaps between the marks — the scale needs only two or three known forces, the rest is divided evenly. Weights give known forces: the Earth pulls 100 g with 0.98 N.\n\nMass and force are different things. The apple has a mass of 100 g and pulls down with about 1 N — the unit named after Newton. Were the apple on the Moon, its mass would stay 100 g, but the dynamometer would show much less: gravity is weaker there.',
    ),
    say: both((l) => (apple ? (l === 'uk' ? `Яблуко — ${N(apple.value!, l)}. Сто грамів — це маса, а ньютон — сила.` : `The apple — ${N(apple.value!, l)}. A hundred grams is a mass, a newton a force.`) : '')),
    text: both((l) => {
      const uk = l === 'uk';
      const parts: string[] = [];
      if (marks.length) parts.push(uk ? `Риски від одного, двох і трьох тягарців — ${marks.map((r) => mm(r.value!, l)).join(', ')} від нуля: відстані між ними однакові.` : `The marks of one, two and three weights — ${marks.map((r) => mm(r.value!, l)).join(', ')} from zero: evenly spaced.`);
      if (L) parts.push(uk ? `На 1 Н припадає ${mm(L.value!, l)}, на поділку 0,1 Н — ${sig(L.value! * 100, 2, l)} мм.` : `1 N takes ${mm(L.value!, l)}, a 0.1 N division ${sig(L.value! * 100, 2, l)} mm.`);
      if (apple) parts.push(uk ? `Яблуко масою 100 г — ${N(apple.value!, l)} (F = m·g = ${sig(apple.exact, 2, l)} Н).` : `The 100 g apple — ${N(apple.value!, l)} (F = m·g = ${sig(apple.exact, 2, l)} N).`);
      if (egg) {
        // (What the home-made scales made of it: sheets of 5 g and millilitres of water.)
        const s = scalesSequence('egg').at(-1)!;
        const m = (s.sheets * 5 + s.water) / 1000;
        const F = sig(m * (egg.inputs?.['g'] ?? 9.81), 2, l);
        parts.push(uk ? `Яйце — ${N(egg.value!, l)}; на саморобних терезах воно важило ${sig(m * 1000, 3, l)} г, а ${sig(m, 2, l)} кг · 9,8 Н/кг ≈ ${F} Н: прилади погоджуються.` : `The egg — ${N(egg.value!, l)}; on the home-made scales it weighed ${sig(m * 1000, 3, l)} g, and ${sig(m, 2, l)} kg · 9.8 N/kg ≈ ${F} N: the instruments agree.`);
      }
      return parts.join(' ');
    }),
  };
};
