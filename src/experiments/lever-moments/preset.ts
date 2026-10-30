import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, stepLine, STEPS_END, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_lever_moments: Preset = {
  id: 'lever-moments',
  ask: { uk: 'За якої умови важіль перебуває в рівновазі?', en: 'When is a lever in balance?' },
  grade: 8,
  topic: WORK,
  title: { uk: 'Умова рівноваги важеля', en: 'The condition of a lever’s balance' },
  question: {
    uk: 'Важіль-лінійка висить на осі в штативі й сам урівноважений; отвори для гачків — через 5 см. Чіплятимемо тягарці по 100 г ліворуч і праворуч на різних відстанях від осі, а потім урівноважимо їх динамометром. Щоразу знайдемо момент сили з кожного боку: M = F·l. За якої умови важіль перебуває в рівновазі?',
    en: 'A lever ruler hangs on an axis in a stand and balances by itself; the holes for the hooks are every 5 cm. We hang 100 g weights left and right at different distances from the axis, then balance them with a dynamometer. Each time we find the moment on each side: M = F·l. When is a lever in balance?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'lever',
  plan: [
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.1 }, right: { weights: 1, at: 0.2 } } },
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.15 }, right: { weights: 3, at: 0.1 } } },
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 3, at: 0.1 }, right: { dynamometer: true, at: 0.2 } } },
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.2 }, right: { dynamometer: true, at: 0.1 } } },
  ],
  choices: [ch('moments', 'Коли моменти сил з обох боків рівні: F₁·l₁ = F₂·l₂', 'When the moments on both sides are equal: F₁·l₁ = F₂·l₂'), ch('forces', 'Коли сили з обох боків однакові', 'When the forces on both sides are the same'), ch('arms', 'Коли плечі з обох боків однакові', 'When the arms on both sides are the same')],
  choicesAt: 'end',
  answerOnBoard: ['M1:', 'M2:'],
  formulas: ['mechanics.moment', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'Прості механізми. Важіль. Умова рівноваги важеля.' },
    { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 1', topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'same', quote: '№ 1. Вивчення умови рівноваги важеля.' },
  ],
  expect: 'reached',
};

export const answer_lever_moments = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.lever' && x.record.value !== null).map((x) => ({ F1: x.record.inputs?.['F1'] ?? 0, l1: x.record.inputs?.['l1'] ?? 0, F2: x.record.value!, l2: x.record.inputs?.['l2'] ?? 0, dyn: x.record.instrument === 'dynamometer', balanced: x.record.inputs?.['balanced'] === 1 }));
  const M = (F: number, l: number) => F * l;
  // Within what the dynamometer tells (half its 0.1 N division at that arm): the moments are equal.
  const equal = rows.every((x) => Math.abs(M(x.F1, x.l1) - M(x.F2, x.l2)) <= 0.05 * x.l2 + 1e-9);
  const forcesDiffer = rows.some((x) => Math.abs(x.F1 - x.F2) > 0.1);
  const armsDiffer = rows.some((x) => Math.abs(x.l1 - x.l2) > 1e-6);
  const correct = rows.length ? (equal ? 'moments' : !forcesDiffer ? 'forces' : !armsDiffer ? 'arms' : undefined) : undefined;
  const N = (x: number, l: Locale) => formatMeasured('force', x, 0.01, l);
  const cm = (x: number) => Math.round(x * 100);
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Уяви, що важіль трохи повернувся навколо осі. Кожна точка важеля проходить дугу, і що далі точка від осі, то довша її дуга: на плечі 20 см — удвічі довша, ніж на плечі 10 см (шлях s = l · кут). Сам важіль енергії не додає й не забирає (тертя в осі мале), тож робота, яку виконує сила з одного боку, дорівнює роботі з другого: F₁·s₁ = F₂·s₂. Підстав s = l · кут — кут однаковий для всього важеля й скорочується: F₁·l₁ = F₂·l₂. Ось чому важить не сила сама по собі й не плече саме по собі, а їхній добуток — момент сили. Це й «золоте правило механіки»: удвічі менша сила — зате вдвічі довший шлях; виграєш у силі — програєш у відстані. Тому дверну ручку ставлять далеко від завіс, гайку відкручують довгим ключем, а ломом підважують камінь, який руками не зрушиш." : "Imagine the lever turned a little about its axis. Every point of it moves along an arc, and the farther a point from the axis, the longer its arc: at 20 cm twice as long as at 10 cm (the path s = l · angle). The lever itself adds no energy and takes none (there is little friction at the axis), so the work done by the force on one side equals the work on the other: F₁·s₁ = F₂·s₂. Put s = l · angle — the angle is the same for the whole lever and cancels: F₁·l₁ = F₂·l₂. That is why what matters is neither the force alone nor the arm alone but their product — the moment. This is the “golden rule of mechanics”: half the force — but twice the path; what you gain in force you lose in distance. That is why a door handle sits far from the hinges, a nut is undone with a long spanner, and a crowbar lifts a stone hands cannot move.")),
    say: both((l) => (l === 'uk' ? 'Рівні моменти — і важіль у рівновазі!' : 'Equal moments — and the lever balances!')),
    text: both((l) => {
      const list = rows.map((x) => (l === 'uk' ? `${N(x.F1, l)} · ${cm(x.l1)} см ${x.dyn ? `і динамометр ${formatMeasured('force', x.F2, 0.1, l)}` : `і ${N(x.F2, l)}`} · ${cm(x.l2)} см: M₁ ≈ ${sig(M(x.F1, x.l1), 3, l)} Н·м, M₂ ≈ ${sig(M(x.F2, x.l2), 3, l)} Н·м` : `${N(x.F1, l)} · ${cm(x.l1)} cm ${x.dyn ? `and the dynamometer ${formatMeasured('force', x.F2, 0.1, l)}` : `and ${N(x.F2, l)}`} · ${cm(x.l2)} cm: M₁ ≈ ${sig(M(x.F1, x.l1), 3, l)} N·m, M₂ ≈ ${sig(M(x.F2, x.l2), 3, l)} N·m`)).map(stepLine).join(';') + STEPS_END;
      return l === 'uk'
        ? `${list}. Сили з боків були різні, плечі — теж, а важіль щоразу стояв рівно: рівними були моменти сил. Умова рівноваги важеля: F₁·l₁ = F₂·l₂ — у скільки разів менша сила, у стільки разів довше її плече. Це закон важеля, відомий з часів Архімеда. Розбіжності в соті частки — бо динамометр показує лише десяті частки ньютона.`
        : `${list}. The forces on the two sides differed, so did the arms, and every time the lever stood level: the moments were equal. The condition of a lever’s balance: F₁·l₁ = F₂·l₂ — as many times smaller a force, as many times longer its arm. This is the law of the lever, known since Archimedes. Differences in the hundredths come from the dynamometer reading only tenths of a newton.`;
    }),
  };
};
