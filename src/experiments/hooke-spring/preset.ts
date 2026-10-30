import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_hooke_spring: Preset = varied(
  {
    id: 'hooke-spring',
    grade: 7,
    topic: INTERACTION,
    title: { uk: 'Як розтягується пружина?', en: 'How does a spring stretch?' },
    guided: true,
    bench: 'spring',
    choices: [ch('proportional', 'Пропорційно: удвічі більша сила — удвічі більше видовження', 'In proportion: twice the force, twice the extension'), ch('faster', 'Видовження росте швидше за силу', 'The extension grows faster than the force'), ch('slower', 'Видовження росте повільніше за силу', 'The extension grows slower than the force')],
    formulas: ['mechanics.hooke', 'mechanics.weight'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження • інерції; пружних властивостей тіл' }, { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 6', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 6. Дослідження пружних властивостей тіл.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 24, лабораторна робота № 6, с. 172' } }, { program: 'oxfordaqa-igcse-sciences', item: 'Physics RP 1', match: 'same', quote: 'Investigate the relationship between force and extension for a spring.' }],
    expect: 'reached',
  },
  {
    // Only the springs that four 100 g weights stretch within the 40 cm ruler.
    controls: [{ id: 'spring', label: { uk: 'Пружина з набору', en: 'Spring of the set' }, kind: 'choice', options: [ch('25', 'Тугіша', 'Stiffer'), ch('15', 'М’якша', 'Softer')], value: '25' }],
    build: (v) => {
      const stiffness = Number(v['spring']);
      return {
        question: {
          uk: `Підвісимо ${stiffness === 25 ? 'тугішу' : 'м’якшу'} пружину з набору на штатив і будемо чіпляти до неї тягарці по 100 г — один, два, три, чотири, щоразу вимірюючи її довжину лінійкою. Як видовження пружини залежить від сили, що її розтягує?`,
          en: `We hang the ${stiffness === 25 ? 'stiffer' : 'softer'} spring of the set on a stand and add 100 g weights to it — one, two, three, four — measuring its length with a ruler each time. How does the spring’s extension depend on the force stretching it?`,
        },
        params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
        plan: [0, 1, 2, 3, 4].map((weights) => ({ kind: 'bench', command: { type: 'lab.stretch', weights, stiffness } }) as const),
      };
    },
  },
);

export const answer_hooke_spring = (run: PresetRun): PresetAnswer => {
  const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.stretch' && x.record.value !== null);
  const l0 = r.find((x) => x.command['weights'] === 0)?.record.value ?? null;
  const rows = r.filter((x) => Number(x.command['weights']) > 0).map((x) => ({ n: Number(x.command['weights']), F: x.record.inputs?.['F'] ?? 0, x: x.record.value! - (l0 ?? 0) }));
  const ks = rows.map((x) => x.F / x.x);
  const kMean = ks.reduce((a, b) => a + b, 0) / Math.max(1, ks.length);
  const spread = ks.length ? (Math.max(...ks) - Math.min(...ks)) / kMean : 0;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const ratio = first && last ? last.x / first.x / (last.F / first.F) : 1;
  const correct = l0 === null || rows.length < 2 ? undefined : Math.abs(ratio - 1) < 0.08 ? 'proportional' : ratio > 1 ? 'faster' : 'slower';
  const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
  return {
    ...(correct ? { correct } : {}),
    why: both((l) => (l === 'uk' ? "Пружина розтягується, бо трохи віддаляються одна від одної частинки її металу, а сили між ними тягнуть їх назад. При малих зміщеннях ці сили ростуть пропорційно зміщенню — так у кожному витку, тож і вся пружина подовжується пропорційно силі: удвічі більший вантаж — удвічі більше видовження. Відношення F/x — жорсткість — залежить від пружини: товщини дроту, діаметра й числа витків. Так буває, поки деформація пружна: розтягнута надто сильно пружина вже не повернеться до своєї довжини — там закон Гука не діє." : "A spring stretches because the particles of its metal move a little apart, and the forces between them pull them back. For small shifts these forces grow in proportion to the shift — in every coil, so the whole spring lengthens in proportion to the force: twice the load, twice the extension. The ratio F/x — the stiffness — depends on the spring: the wire’s thickness, the diameter and the number of coils. This holds while the deformation is elastic: a spring stretched too far does not return to its length — Hooke’s law does not hold there.")),
    say: both((l) => (l === 'uk' ? `Видовження пропорційне силі: k ≈ ${sig(kMean, 2, l)} Н/м!` : `The extension is proportional to the force: k ≈ ${sig(kMean, 2, l)} N/m!`)),
    text: both((l) =>
      l === 'uk'
        ? `Кожен тягарець 100 г тягне пружину із силою ≈ 0,98 Н. ${rows.map((x) => `${x.n} × 100 г: x = ${cm(x.x, l)}`).join('; ')}. У скільки разів більша сила, у стільки ж разів більше й видовження, а відношення F/x майже однакове: k ≈ ${sig(kMean, 2, l)} Н/м (розкид ${sig(spread * 100, 2, l)} % — бо лінійка показує лише міліметри). Це закон Гука: F = k·x. Він діє, доки деформація пружна — коли тягарці зняти, пружина повертається до довжини ${l0 !== null ? cm(l0, l) : 'l₀'}. У підручнику цю роботу виконують із гумовим шнуром; гума підкоряється закону Гука гірше, ніж сталева пружина, особливо за великих розтягів.`
        : `Each 100 g weight pulls the spring with ≈ 0.98 N. ${rows.map((x) => `${x.n} × 100 g: x = ${cm(x.x, l)}`).join('; ')}. As many times as the force grows, so does the extension, and F/x stays nearly the same: k ≈ ${sig(kMean, 2, l)} N/m (a spread of ${sig(spread * 100, 2, l)} % — the ruler shows only millimetres). That is Hooke’s law: F = k·x. It holds while the deformation is elastic — take the weights off, and the spring comes back to ${l0 !== null ? cm(l0, l) : 'l₀'}. The textbook does this lab work with a rubber cord; rubber follows Hooke’s law less closely than a steel spring, especially when stretched far.`,
    ),
  };
};
