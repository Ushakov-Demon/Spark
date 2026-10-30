import { HUMAN_POWER_BRIEF, HUMAN_POWER_SUSTAINED, METRIC_HORSEPOWER } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_stairs_power: Preset = varied(
  {
    id: 'stairs-power',
    ask: { uk: 'Яку потужність ти розвиваєш, вибігаючи сходами?', en: 'What power do you develop running up the stairs?' },
    grade: 7,
    topic: WORK,
    title: { uk: 'Робота й потужність: сходами на поверх', en: 'Work and power: up the stairs to the next floor' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'stairs',
    choices: [
      ch('less', 'Меншу за одну кінську силу', 'Less than one horsepower'),
      ch('more', 'Більшу за кінську силу: на коротких ривках людина сильніша за коня', 'More than a horsepower: in short bursts a person is stronger than a horse'),
      ch('same', 'Таку саму, як ідучи кроком: сходи ті самі — і робота та сама', 'The same as walking: the stairs are the same — and so is the work'),
    ],
    // The powers are the answer: chalked in once a guess is made.
    answerOnBoard: ['sN:'],
    asides: [
      {
        uk: '«Кінську силу» вигадав шотландський інженер Джеймс Ватт наприкінці XVIII століття — щоб продавати свої парові машини тим, хто досі крутив млини кіньми. Він порахував: кінь на млині обходить коло радіусом 12 футів 144 рази за годину і тягне із силою близько 180 фунтів — виходило ≈ 32 572 фут-фунти роботи за хвилину. Ватт і його компаньйон Метью Болтон округлили це до 33 000.',
        en: 'The «horsepower» was thought up by the Scottish engineer James Watt in the late 18th century — to sell his steam engines to those who still turned their mills with horses. He reckoned: a mill horse walks a circle of 12-foot radius 144 times an hour and pulls with about 180 pounds-force — some 32,572 foot-pounds of work a minute. Watt and his partner Matthew Boulton rounded it to 33,000.',
      },
    ],
    formulas: ['mechanics.work', 'mechanics.power', 'mechanics.potential-energy'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: … механічної роботи, коли сила діє вздовж напрямку руху; потужності' }],
    expect: 'reached',
  },
  {
    // The pupil's own measurements (an example by default): their mass, the stairs, the two times.
    controls: [
      { id: 'mass', label: { uk: 'Твоя маса', en: 'Your mass' }, kind: 'number', unit: 'кг', min: 25, max: 120, step: 1, value: 50 },
      { id: 'steps', label: { uk: 'Сходинок до поверху', en: 'Steps to the floor' }, kind: 'number', unit: '', min: 6, max: 40, step: 1, value: 18 },
      { id: 'rise', label: { uk: 'Висота сходинки', en: 'A step’s height' }, kind: 'number', unit: 'см', min: 12, max: 20, step: 0.5, value: 16 },
      { id: 'walk', label: { uk: 'Час кроком', en: 'Time walking' }, kind: 'number', unit: 'с', min: 3, max: 60, step: 0.5, value: 12 },
      { id: 'run', label: { uk: 'Час бігом', en: 'Time running' }, kind: 'number', unit: 'с', min: 1.5, max: 30, step: 0.5, value: 4 },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const steps = Number(v['steps']);
      const rise = Number(v['rise']) / 100;
      const all = { mass, steps, rise };
      return {
        question: {
          uk: `Вимірюємо себе. Стань на підлогові ваги, виміряй лінійкою сходинку й порахуй сходинки до наступного поверху. Тоді піднімися на поверх спокійним кроком, а потім вибіжи бігом — товариш щоразу засікає час секундоміром. (Під сценою — твої вимірювання: зараз там приклад, підстав свої.) Яку потужність ти розвиваєш, вибігаючи сходами?`,
          en: `We measure ourselves. Stand on the floor scales, measure a step with a ruler and count the steps to the next floor. Then walk up one floor at an easy pace, and then run up — a friend times you each time with a stopwatch. (Under the scene are your measurements: an example for now, put in your own.) What power do you develop running up the stairs?`,
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.stairs', step: 'weigh', mass } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'measure', steps, rise } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'climb', pace: 'walk', ...all, time: Number(v['walk']) } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'climb', pace: 'run', ...all, time: Number(v['run']) } },
        ],
      };
    },
  },
);

export const answer_stairs_power = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.stairs' && x.command['step'] === 'climb' && x.record.value !== null);
  const climbs = R.map((x) => {
    const i = x.record.inputs ?? {};
    return { run: i['run'] === 1, time: x.record.value!, work: i['work'] ?? 0, power: i['power'] ?? 0, mass: i['mass'] ?? 0, height: i['height'] ?? 0 };
  });
  const walk = climbs.find((x) => !x.run);
  const dash = climbs.find((x) => x.run);
  const hp = METRIC_HORSEPOWER.value;
  const correct = !dash ? undefined : dash.power < hp ? 'less' : 'more';
  const W = (x: number, l: Locale) => `${Math.round(x)} ${l === 'uk' ? 'Вт' : 'W'}`;
  const J = (x: number, l: Locale) => `${Math.round(x)} ${l === 'uk' ? 'Дж' : 'J'}`;
  const sec = (x: number, l: Locale) => `${sig(x, 3, l)} ${l === 'uk' ? 'с' : 's'}`;
  const hpOf = (x: number, l: Locale) => `${sig(x / hp, 2, l)} ${l === 'uk' ? 'к. с.' : 'hp'}`;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Піднімаючись, ти долаєш свою вагу: ноги штовхають тебе вгору із силою, що дорівнює вазі m·g, на висоту поверху h. Механічна робота — сила на шлях уздовж неї: A = m·g·h. Крок уперед уздовж сходинки роботи проти ваги не потребує — важить лише висота. Тому сходи ті самі — і робота та сама, хоч кроком, хоч бігом: стільки ж набуває й твоя потенціальна енергія.\n\nА от потужність — як швидко виконано роботу: N = A/t. Бігом ти ту саму роботу виконуєш у кілька разів швидше — і потужність у стільки ж разів більша. Для порівняння: здорова людина може довго давати близько 70 Вт механічної потужності, а коротким ривком — близько 890 Вт, тобто ≈ 1,2 кінської сили. Тож коротким ривком людина може працювати навіть потужніше за коня — але лише кілька секунд. Порівняй зі своїм бігом.'
        : 'Going up, you overcome your weight: your legs push you up with a force equal to your weight m·g over the floor’s height h. Mechanical work is a force times the distance along it: A = m·g·h. A step forward along the tread needs no work against your weight — only the height counts. So the stairs are the same — and so is the work, walking or running: your potential energy grows by just as much.\n\nBut power is how fast the work is done: N = A/t. Running, you do the same work several times faster — and the power is that many times greater. For comparison: a healthy person can give about 70 W of mechanical power for a long time, and about 890 W in a short burst — ≈ 1.2 horsepower. So in a short burst a person can work even harder than a horse — but only for a few seconds. Compare with your own run.',
    ),
    say: both((l) => (dash ? (l === 'uk' ? `Бігом — ${W(dash.power, l)}, це ${hpOf(dash.power, l)}!` : `Running — ${W(dash.power, l)}, that is ${hpOf(dash.power, l)}!`) : l === 'uk' ? 'Порахуймо роботу й потужність.' : 'Let us work out the work and the power.')),
    text: both((l) => {
      if (!walk || !dash) return '';
      const uk = l === 'uk';
      const k = dash.power / Math.max(1e-9, walk.power);
      const ref = uk
        ? ` Довго людина може давати ≈ ${W(HUMAN_POWER_SUSTAINED.value, l)}, ривком — ≈ ${W(HUMAN_POWER_BRIEF.value, l)}; кінська сила — ${W(hp, l)}.`
        : ` A person can give ≈ ${W(HUMAN_POWER_SUSTAINED.value, l)} for a long time and ≈ ${W(HUMAN_POWER_BRIEF.value, l)} in a burst; a horsepower is ${W(hp, l)}.`;
      return uk
        ? `Маса ${sig(walk.mass, 3, l)} кг, висота поверху ${sig(walk.height, 3, l)} м: робота A = m·g·h ≈ ${J(walk.work, l)} — і кроком, і бігом однакова. Кроком за ${sec(walk.time, l)} — потужність ≈ ${W(walk.power, l)} (${hpOf(walk.power, l)}); бігом за ${sec(dash.time, l)} — ≈ ${W(dash.power, l)} (${hpOf(dash.power, l)}), у ${sig(k, 2, l)} раза більша.${ref}`
        : `A mass of ${sig(walk.mass, 3, l)} kg, a floor ${sig(walk.height, 3, l)} m high: the work A = m·g·h ≈ ${J(walk.work, l)} — the same walking and running. Walking, ${sec(walk.time, l)} — a power of ≈ ${W(walk.power, l)} (${hpOf(walk.power, l)}); running, ${sec(dash.time, l)} — ≈ ${W(dash.power, l)} (${hpOf(dash.power, l)}), ${sig(k, 2, l)} times more.${ref}`;
    }),
  };
};
