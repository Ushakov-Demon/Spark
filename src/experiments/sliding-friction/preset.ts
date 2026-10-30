import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { SUBSTANCES } from '../../substances/catalog.js';

export const preset_friction_factors: Preset = {
  ask: { uk: 'Чи залежить сила тертя від того, на яку грань покласти брусок?', en: 'Does friction depend on which face the block lies on?' },
  id: 'friction-factors',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Від чого залежить сила тертя ковзання', en: 'What the force of sliding friction depends on' },
  question: {
    uk: 'Зважимо дерев’яний брусок, покладемо на нього тягарець 100 г і рівномірно тягтимемо динамометром по дерев’яній дошці: спершу на широкій грані, потім — поставивши на вужчу, далі по аркушу паперу, а наостанок із трьома тягарцями. Брусок поставили на вужчу грань — площа дотику з дошкою стала меншою. Що буде з силою тертя?',
    en: 'We weigh a wooden block, put a 100 g weight on it and pull it steadily with a dynamometer along a wooden board: first on its wide face, then stood on a narrower one, then over a sheet of paper, and at last with three weights. The block stands on a narrower face — less of it touches the board. What happens to the friction?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'friction',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: { uk: 'Дерев’яний брусок', en: 'Wooden block' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, face: 'wide' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, face: 'narrow' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, surface: 'paper' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 3, face: 'wide' } },
  ],
  choices: [ch('same', 'Лишиться такою самою', 'It stays the same'), ch('less', 'Зменшиться: менша площа — менше тертя', 'It gets smaller: less area, less friction'), ch('more', 'Збільшиться: брусок сильніше тисне на дошку', 'It grows: the block presses harder on the board')],
  trick: { uk: 'Більшість думає, що на вужчій грані тягти легше.', en: 'Most people think the block is easier to pull on its narrower face.' },
  formulas: ['mechanics.friction', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'між площею і якістю поверхонь рухомих тіл, масою рухомого тіла і силою тертя ковзання' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Сили тертя. Тертя в природі й техніці.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 26, рис. 26.5–26.7: брусок по дереву й по склу, на більшій і меншій грані, з тягарцями; закон Амонтона — Кулона' } },
  ],
  expect: 'reached',
};

export const answer_friction_factors = (run: PresetRun): PresetAnswer => {
  const pulls = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null);
  const at = (f: (c: Record<string, unknown>) => boolean) => pulls.find((x) => f(x.command as Record<string, unknown>))?.record ?? null;
  const wide = at((c) => c['weights'] === 1 && c['face'] !== 'narrow' && c['surface'] !== 'paper');
  const narrow = at((c) => c['face'] === 'narrow');
  const paper = at((c) => c['surface'] === 'paper');
  const heavy = at((c) => Number(c['weights']) === 3);
  const correct = wide && narrow ? (Math.abs(narrow.value! - wide.value!) < 0.05 ? 'same' : narrow.value! < wide.value! ? 'less' : 'more') : undefined;
  const N1 = (x: { value: number | null } | null, l: Locale) => (x ? formatMeasured('force', x.value!, 0.1, l) : '—');
  const Nof = (x: { inputs?: Record<string, number> } | null) => x?.inputs?.['N'] ?? 0;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Здається, що на вужчій грані тягти легше: менша площа — менше тертя. Так думає більшість. Але площа грані — ще не площа дотику. Навіть гладкі на вигляд поверхні торкаються лише верхівками горбиків, і справжня площа дотику — дуже мала частка площі грані. На широкій грані вага бруска розподіляється на багато горбиків, і кожен притиснутий слабко. На вужчій горбиків менше, зате кожен притиснутий сильніше й зминається глибше. Справжня площа дотику виходить приблизно однаковою: її задає не розмір грані, а те, з якою силою брусок притиснутий до дошки. Вага не змінилася — тож і тертя те саме. Інша річ — матеріали: папір інакше зчіплюється з деревом, ніж дерево з деревом. А тягарці притискають брусок сильніше — горбики зминаються більше, і тертя росте пропорційно силі тиску.\n\nВажливо: усе це — про тверді тіла (дерево, метал, пластик, скло). Для липких і м’яких матеріалів правило не діє: скотч тримається, навіть коли його ніщо не притискає, і що ширша смужка, то міцніше він тримає — тут площа дотику важлива. Тому в гоночних драгстерів широкі липкі шини. Та й для твердих тіл закон наближений: сила тертя росте з навантаженням не строго пропорційно.'
        : 'It seems easier to pull the block on its narrower face: less area, less friction. Most people think so. But the area of a face is not yet the area of contact. Even surfaces that look smooth touch only at the tips of their bumps, and the real area of contact is a very small fraction of the face. On the wide face the block’s weight is shared among many bumps, each pressed lightly. On the narrower face there are fewer bumps, but each is pressed harder and squashed deeper. The real area of contact comes out about the same: it is set not by the size of the face but by how hard the block is pressed to the board. The weight has not changed — so neither has the friction. The materials are another matter: paper catches on wood differently from wood on wood. And the weights press the block harder — the bumps are squashed more, and the friction grows in proportion to the pressing force.\n\nMind: all this is about solid bodies (wood, metal, plastic, glass). For sticky and soft materials the rule fails: adhesive tape holds even when nothing presses it, and the wider the strip, the better it holds — here the area of contact matters. That is why drag racers have wide, sticky tyres. And even for solid bodies the law is approximate: friction grows with the load not strictly in proportion.',
    ),
    say: both((l) => (l === 'uk' ? 'Для твердих тіл площа ролі не грає — важливі матеріали й сила тиску!' : 'For solid bodies the area does not matter — the materials and the pressing force do!')),
    text: both((l) =>
      l === 'uk'
        ? `Брусок із тягарцем на широкій грані — ${N1(wide, l)}, на вужчій — ${N1(narrow, l)}: площа дотику менша в півтора раза, а сила тертя та сама. По аркушу паперу — ${N1(paper, l)}: інша пара матеріалів, μ = F / N ≈ ${paper ? sig(paper.value! / Nof(paper), 2, l) : '—'} (у таблиці підручника папір по дереву — 0,40, дерево по дереву — 0,25). З трьома тягарцями — ${N1(heavy, l)}: сила тиску зросла з ${sig(Nof(wide), 2, l)} до ${sig(Nof(heavy), 2, l)} Н, у ${sig(Nof(heavy) / Math.max(1e-9, Nof(wide)), 2, l)} раза, і тертя — приблизно у стільки ж. Це закон Амонтона — Кулона: сила тертя ковзання не залежить від площі дотику й пропорційна силі нормальної реакції опори, F = μN, а μ залежить від матеріалів і того, як оброблені поверхні. Уперше це помітив Леонардо да Вінчі (1493), але його записи не опублікували; у 1699 році закон заново відкрив Ґ. Амонтон, а Ш. Кулон перевірив. Закон стосується твердих тіл: для липких і м’яких матеріалів (скотч, гоночні шини) площа дотику на тертя впливає.`
        : `The block with its weight on the wide face — ${N1(wide, l)}, on the narrower one — ${N1(narrow, l)}: one and a half times less area touching, the same friction. Over a sheet of paper — ${N1(paper, l)}: another pair of materials, μ = F / N ≈ ${paper ? sig(paper.value! / Nof(paper), 2, l) : '—'} (the textbook’s table: paper on wood 0.40, wood on wood 0.25). With three weights — ${N1(heavy, l)}: the pressing force grew from ${sig(Nof(wide), 2, l)} to ${sig(Nof(heavy), 2, l)} N, ${sig(Nof(heavy) / Math.max(1e-9, Nof(wide)), 2, l)} times, and the friction about as much. This is the Amontons–Coulomb law: sliding friction does not depend on the area of contact and is proportional to the normal force, F = μN, where μ depends on the materials and how the surfaces are finished. Leonardo da Vinci noticed it first (1493), but his notes were not published; in 1699 G. Amontons discovered the law anew, and C. Coulomb checked it. The law is about solid bodies: for sticky and soft materials (adhesive tape, racing tyres) the area of contact does affect friction.`,
    ),
  };
};

export const preset_friction_coefficient: Preset = {
  ask: { uk: 'Як зміниться коефіцієнт тертя μ = F/N, коли додаватимемо тягарці?', en: 'How will the coefficient μ = F/N change as weights are added?' },
  id: 'friction-coefficient',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Визначаємо коефіцієнт тертя ковзання', en: 'Finding the coefficient of sliding friction' },
  question: {
    uk: 'Зважимо дерев’яний брусок динамометром, а потім тягтимемо його по дерев’яній дошці — спершу порожнього, далі з одним, двома, трьома тягарцями по 100 г, щоразу записуючи покази динамометра. Що буде з коефіцієнтом тертя μ = F/N?',
    en: 'We weigh a wooden block on a dynamometer, then pull it along a wooden board — first bare, then with one, two, three 100 g weights, writing down the dynamometer each time. What happens to the coefficient μ = F/N?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'friction',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: { uk: 'Дерев’яний брусок', en: 'Wooden block' } },
    ...[0, 1, 2, 3].map((weights) => ({ kind: 'bench', command: { type: 'lab.pull', weights } }) as const),
  ],
  choices: [ch('same', 'Лишиться майже тим самим', 'It stays about the same'), ch('grows', 'Теж зростатиме', 'It grows too'), ch('falls', 'Зменшуватиметься', 'It gets smaller')],
  formulas: ['mechanics.friction', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 7', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 7. Визначення коефіцієнта тертя ковзання.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 27, лабораторна робота № 7, с. 191' } }],
  expect: 'reached',
};

export const answer_friction_coefficient = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null).map((x) => ({ n: Number(x.command['weights']), F: x.record.value!, N: x.record.inputs?.['N'] ?? 1 }));
  const P = (run.readings ?? []).find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
  const mus = rows.map((x) => x.F / x.N);
  const mean = mus.reduce((a, b) => a + b, 0) / Math.max(1, mus.length);
  const trend = rows.length >= 2 ? (mus[mus.length - 1]! - mus[0]!) / mean : 0;
  const correct = rows.length < 2 ? undefined : Math.abs(trend) < 0.25 ? 'same' : trend > 0 ? 'grows' : 'falls';
  const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Навіть гладкі на вигляд поверхні торкаються лише горбиками. Що сильніше брусок притиснутий до дошки, то більше горбиків змикається й зачіпається — справжня площа дотику, а з нею й сила тертя, росте пропорційно силі тиску. Тому відношення F/N лишається сталим для пари матеріалів — це коефіцієнт тертя: він залежить від того, з чого поверхні й як оброблені, але не від ваги бруска." : "Even surfaces that look smooth touch only at their bumps. The harder the block is pressed to the board, the more bumps meet and catch — the real area of contact, and with it the friction, grows in proportion to the pressing force. So the ratio F/N stays the same for a pair of materials — the coefficient of friction: it depends on what the surfaces are and how they are finished, not on the block’s weight.")),
    say: both((l) => (l === 'uk' ? `μ ≈ ${sig(mean, 2, l)} — для дерева по дереву!` : `μ ≈ ${sig(mean, 2, l)} — for wood on wood!`)),
    text: both((l) =>
      l === 'uk'
        ? `Брусок важить ${P !== null ? N1(P, l) : '≈ 1,4 Н'}; на горизонтальній дошці сила нормальної реакції N дорівнює вазі бруска з тягарцями. ${rows.map((x) => `N = ${sig(x.N, 2, l)} Н → F = ${N1(x.F, l)}, μ ≈ ${sig(x.F / x.N, 2, l)}`).join('; ')}. Сила тертя росте разом із навантаженням, а їхнє відношення — коефіцієнт тертя — лишається майже тим самим: μ ≈ ${sig(mean, 2, l)}. У таблиці підручника для дерева по дереву — 0,25. Розкид — бо динамометр показує лише десяті частки ньютона, а тягнути рівномірно непросто. Коефіцієнт тертя залежить від матеріалів і того, як оброблені поверхні, але не від ваги бруска.`
        : `The block weighs ${P !== null ? N1(P, l) : '≈ 1.4 N'}; on a level board the normal force N equals the weight of the block with its weights. ${rows.map((x) => `N = ${sig(x.N, 2, l)} N → F = ${N1(x.F, l)}, μ ≈ ${sig(x.F / x.N, 2, l)}`).join('; ')}. The friction grows with the load, while their ratio — the coefficient of friction — stays about the same: μ ≈ ${sig(mean, 2, l)}. The textbook’s table gives 0.25 for wood on wood. The spread is there because the dynamometer reads only tenths of a newton, and pulling steadily is not easy. The coefficient depends on the materials and how the surfaces are finished, not on the block’s weight.`,
    ),
  };
};
