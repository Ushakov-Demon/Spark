import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { SHEET } from './bench.js';

export const preset_scales_diy: Preset = {
  ask: { uk: 'Як зважити яйце на саморобних терезах, якщо гир немає?', en: 'How to weigh an egg on home-made scales with no weights?' },
  id: 'scales-diy',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Саморобні терези', en: 'Scales of our own' },
  question: {
    uk: 'Змайструємо терези: лінійку завдовжки 30 см підвісимо на нитці за середину, а на кінцях на нитках — два стаканчики від йогурту. Плечі однакові, тож лінійка стоїть рівно, коли маси в стаканчиках однакові. Але набору гир у нас немає. Як зважити куряче яйце?',
    en: 'We make scales: a 30 cm ruler hung by a thread at its middle, and a yoghurt cup on a thread at each end. The arms are equal, so the ruler stays level when the masses in the cups are equal. But we have no set of weights. How to weigh a hen’s egg?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'scales',
  plan: (['zero', 'check', 'egg'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.scales', step } }) as const),
  choices: [ch('known', 'Тим, чия маса відома: аркушами паперу й водою', 'With things of known mass: sheets of paper and water'), ch('cant', 'Ніяк: без гир терези покажуть лише, що важче', 'No way: without weights the scales only show which is heavier'), ch('size', 'Ніяк точно — хіба що на око, за розміром', 'Not exactly — only by eye, by its size')],
  answerOnBoard: ['sg:'],
  formulas: ['mechanics.density', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез' }],
  expect: 'reached',
};

export const answer_scales_diy = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.scales' && x.record.value !== null);
  const at = (step: string) => recs.find((x) => x.command['step'] === step)?.record;
  const check = at('check');
  const egg = at('egg');
  const g = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${l === 'uk' ? 'г' : 'g'}`;
  return {
    ...(egg ? { correct: 'known' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Плечі в лінійки однакові, а Земля притягує однакові маси однаково — тож лінійка стоїть рівно, коли маси в стаканчиках рівні. Гирею може бути будь-що, чия маса відома: аркуш паперу, вода зі шприца. Як із набором гир, кладемо спершу великі, а тоді дрібні.\n\nТерези — один із найдавніших приладів, і їм здавна вірили як найчеснішому судді: плечі рівні, жодна шалька не має переваги. У давньоєгипетській «Книзі мертвих» (її сувої писали приблизно з 1550 по 50 рік до н. е.) серце людини кладуть на терези проти пера Маат — богині істини й справедливості. Зважує бог Анубіс, записує бог Тот, і якщо терези рівні — людина жила чесно.\n\nА гирі колись перевіряли так само — водою. 1795 року грам визначили як масу кубічного сантиметра води. 1889 року головною гирею світу став «Великий К» (Le Grand K) — циліндр зі сплаву платини й іридію заввишки 39 мм, який зберігають під Парижем. Його копії звіряли з ним на терезах — і за століття вони розійшлися приблизно на 50 мікрограмів. Тому з 20 травня 2019 року кілограм визначають через сталу Планка, а зважують на терезах Кіббла: там гирю заміняє електричний струм.'
        : 'The ruler’s arms are equal, and the Earth pulls equal masses equally — so the ruler stays level when the masses in the cups are equal. Anything of known mass can be a weight: a sheet of paper, water from a syringe. As with a set of weights, the big ones go first, then the small.\n\nScales are among the oldest instruments, and they were long trusted as the fairest of judges: the arms are equal, neither pan has the advantage. In the ancient Egyptian Book of the Dead (its scrolls were written from about 1550 to 50 BC) a person’s heart is laid on the scales against the feather of Maat — the goddess of truth and justice. The god Anubis weighs, the god Thoth writes it down, and if the scales balance, the person lived honestly.\n\nAnd weights were once checked the same way — with water. In 1795 the gram was defined as the mass of a cubic centimetre of water. In 1889 the world’s chief weight became Le Grand K — a cylinder of platinum and iridium 39 mm tall, kept near Paris. Its copies were compared with it on scales — and over a century they drifted apart by about 50 micrograms. So since 20 May 2019 the kilogram has been defined by the Planck constant and weighed on Kibble balances: there an electric current takes the place of the weight.',
    ),
    say: both((l) => (egg ? (l === 'uk' ? `Яйце — ${g(egg.value!, l)}, і жодної гирі!` : `The egg — ${g(egg.value!, l)}, and not a single weight!`) : '')),
    text: both((l) => {
      const uk = l === 'uk';
      const parts: string[] = [uk ? 'Порожні стаканчики зрівняли пластиліном.' : 'The empty cups were evened with plasticine.'];
      if (check) parts.push(uk ? `Аркуш A4 врівноважили ${check.inputs?.['water']} мл води — ${g(check.value!, l)}: аркуш і справді важить ${g(SHEET.value, l)}, терези узгоджуються самі з собою.` : `The A4 sheet was balanced by ${check.inputs?.['water']} mL of water — ${g(check.value!, l)}: the sheet does weigh ${g(SHEET.value, l)}, the scales agree with themselves.`);
      if (egg) parts.push(uk ? `Яйце: ${egg.inputs?.['sheets']} аркушів по 5 г і ${egg.inputs?.['water']} мл води — ${g(egg.value!, l)}. Терези відчувають десь пів грама, тож точніше за грам ними не зважиш.` : `The egg: ${egg.inputs?.['sheets']} sheets of 5 g and ${egg.inputs?.['water']} mL of water — ${g(egg.value!, l)}. The scales feel about half a gram, so they weigh no better than to a gram.`);
      return parts.join(' ');
    }),
  };
};
