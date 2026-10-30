import { kineticEnergy, potentialEnergy } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, stepLine, STEPS_END, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_rolling_energy: Preset = {
  id: 'rolling-energy',
  ask: { uk: 'Яка частка потенціальної енергії кульки стане кінетичною m·v²/2?', en: 'What share of the ball’s potential energy becomes kinetic, m·v²/2?' },
  grade: 7,
  topic: WORK,
  title: { uk: 'Кінетична й потенціальна енергія кульки', en: 'A ball’s kinetic and potential energy' },
  question: {
    uk: 'Зважимо сталеву кульку й пустимо її з жолоба з висоти 5, 10 і 20 см над столом. Скотившись, вона котиться столом повз дві крейдяні риски за 50 см одна від одної, а телефон знімає це сповільнено — 240 кадрів за секунду. За кадрами знайдемо швидкість, порахуємо кінетичну енергію m·v²/2 і порівняємо з потенціальною m·g·h, яку кулька втратила. Яка частка потенціальної енергії кульки стане кінетичною m·v²/2?',
    en: 'We weigh a steel ball and let it go on a groove 5, 10 and 20 cm above the table. Having rolled down, it rolls along the table past two chalk marks 50 cm apart, and a phone films it in slow motion — 240 frames a second. From the frames we find the speed, work out the kinetic energy m·v²/2 and set it against the potential energy m·g·h the ball lost. What share of the ball’s potential energy becomes kinetic, m·v²/2?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'energy',
  plan: [{ kind: 'bench', command: { type: 'lab.energy', step: 'weigh' } }, ...[0.05, 0.1, 0.2].map((height) => ({ kind: 'bench', command: { type: 'lab.energy', step: 'roll', height } }) as const)],
  choices: [
    ch('all', 'Уся: енергія зберігається — m·v²/2 = m·g·h', 'All of it: energy is conserved — m·v²/2 = m·g·h'),
    ch('most', 'Помітно менша, ніж уся, — і та сама частка з будь-якої висоти', 'Noticeably less than all — and the same share from any height'),
    ch('tiny', 'Лише невелика частка: майже все з’їдає тертя', 'Only a small share: friction eats almost all'),
  ],
  // The share is the answer: chalked in once a guess is made.
  answerOnBoard: ['er:'],
  asides: [
    {
      uk: '1722 року нідерландець Віллем ’с Гравезанде кидав вантажі з різної висоти в м’яку глину. Удвічі швидший вантаж вибивав ямку не вдвічі, а приблизно вчетверо глибшу: енергія руху росте з квадратом швидкості. Французька вчена Емілі дю Шатле пояснила цей дослід і першою надрукувала, що енергія пропорційна m·v². А сам вислів «кінетична енергія» з’явився лише в середині XIX століття — у Вільяма Томсона (лорда Кельвіна).',
      en: 'In 1722 the Dutchman Willem ’s Gravesande dropped weights from different heights into soft clay. A weight twice as fast dug a hole not twice but about four times as deep: the energy of motion grows with the square of the speed. The French scholar Émilie du Châtelet explained the experiment and was the first to publish that the energy is proportional to m·v². The very words «kinetic energy» came only in the mid-19th century — from William Thomson (Lord Kelvin).',
    },
  ],
  formulas: ['mechanics.kinetic-energy', 'mechanics.potential-energy', 'mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: кінетичної та потенціальної енергії тіл' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'виявлення зміни і перетворення механічної енергії' },
  ],
  expect: 'reached',
};

export const answer_rolling_energy = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.energy' && x.record.value !== null);
  const m = R.find((x) => x.command['step'] === 'weigh')?.record.value ?? 0;
  const rolls = R.filter((x) => x.record.inputs?.['which'] === 2).map((x) => {
    const i = x.record.inputs ?? {};
    const h = R.find((y) => y.record.inputs?.['which'] === 1 && y.record.inputs?.['height'] === i['height'])?.record.value ?? i['height'] ?? 0;
    const v = (i['path'] ?? 0.5) / x.record.value!;
    const Ek = kineticEnergy(m, v);
    const Ep = potentialEnergy(m, i['g'] ?? 9.81, h);
    return { h, v, Ek, Ep, share: Ep > 0 ? Ek / Ep : 0, frames: i['frames'] ?? 0 };
  });
  const mean = rolls.length ? rolls.reduce((a, b) => a + b.share, 0) / rolls.length : 0;
  const correct = !rolls.length || !m ? undefined : mean > 0.92 ? 'all' : mean > 0.5 ? 'most' : 'tiny';
  const mJ = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${l === 'uk' ? 'мДж' : 'mJ'}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Енергія не зникає й не береться нізвідки — вона переходить з одного виду в інший. Скочуючись, кулька втрачає потенціальну енергію m·g·h. Та куди ж вона йде? Не лише в рух уперед: кулька ще й крутиться, а обертання теж має кінетичну енергію. Котячись без ковзання, суцільна кулька віддає обертанню 2/5 енергії свого руху вперед, тож на рух уперед лишається m·g·h / (1 + 2/5) = 5/7 ≈ 71 %. Ця частка не залежить ні від висоти, ні від маси, ні від розміру кульки — лише від того, що вона суцільна.\n\nТертя кочення тут мале — тому ні «уся», ні «майже нічого». А от якби кулька не котилася, а ковзала без тертя (як шайба по льоду), уся m·g·h стала б m·v²/2.'
        : 'Energy does not vanish or come from nowhere — it changes from one form to another. Rolling down, the ball loses the potential energy m·g·h. But where does it go? Not only into going forward: the ball also spins, and spinning has kinetic energy too. Rolling without slipping, a solid ball gives its spin 2/5 of the energy of its forward motion, so the forward motion keeps m·g·h / (1 + 2/5) = 5/7 ≈ 71 %. This share depends neither on the height nor on the ball’s mass or size — only on its being solid.\n\nRolling friction is small here — so neither «all» nor «almost none». But if the ball did not roll but slid without friction (like a puck on ice), all of m·g·h would become m·v²/2.',
    ),
    say: both((l) => (correct === 'most' ? (l === 'uk' ? `Кінетична енергія — лише ≈ ${Math.round(mean * 100)} % потенціальної, і з усіх висот однаково!` : `The kinetic energy is only ≈ ${Math.round(mean * 100)} % of the potential — the same from every height!`) : l === 'uk' ? 'Порівняймо енергії.' : 'Let us compare the energies.')),
    text: both((l) => {
      if (!rolls.length || !m) return '';
      const uk = l === 'uk';
      const list = rolls.map((x) => (uk ? `з ${Math.round(x.h * 100)} см — ${x.frames} кадрів, v ≈ ${sig(x.v, 3, l)} м/с: Eₖ ≈ ${mJ(x.Ek, l)}, Eₚ ≈ ${mJ(x.Ep, l)}, частка ≈ ${sig(x.share, 2, l)}` : `from ${Math.round(x.h * 100)} cm — ${x.frames} frames, v ≈ ${sig(x.v, 3, l)} m/s: Eₖ ≈ ${mJ(x.Ek, l)}, Eₚ ≈ ${mJ(x.Ep, l)}, share ≈ ${sig(x.share, 2, l)}`)).map(stepLine).join(';') + STEPS_END;
      return uk
        ? `Кулька ${sig(m * 1000, 3, l)} г. ${list}. Удвічі вища висота — удвічі більша Eₚ, а швидкість зросла лише в √2 раза: Eₖ росте з квадратом швидкості. Частка весь час ≈ ${sig(mean, 2, l)} — близько 5/7. (Тертя кочення й опір повітря не враховано; точність — один кадр.)`
        : `The ball is ${sig(m * 1000, 3, l)} g. ${list}. Twice the height — twice the Eₚ, and the speed grew only √2 times: Eₖ grows with the square of the speed. The share is ≈ ${sig(mean, 2, l)} each time — about 5/7. (Rolling friction and the air are left out; the precision is one frame.)`;
    }),
  };
};
