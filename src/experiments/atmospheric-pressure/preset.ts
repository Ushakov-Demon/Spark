import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, stepLine, STEPS_END, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_atmospheric_pressure: Preset = varied(
  {
    id: 'atmospheric-pressure',
    ask: { uk: 'Чи покаже шприц такий самий тиск повітря, як барометр?', en: 'Will a syringe show the same air pressure as the barometer?' },
    grade: 7,
    topic: PRESSURE,
    title: { uk: 'Вимірюємо атмосферний тиск шприцом', en: 'Measuring the atmospheric pressure with a syringe' },
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'atm',
    choices: [ch('less', 'Менший, ніж барометр', 'Less than the barometer'), ch('same', 'Такий самий, як барометр', 'The same as the barometer'), ch('more', 'Більший, ніж барометр', 'More than the barometer')],
    choicesAt: 'end',
    answerOnBoard: ['pa:'],
    formulas: ['mechanics.atmosphere-syringe', 'mechanics.pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'вимірювання й визначення: атмосферного й гідростатичного тиску' }],
    expect: 'reached',
  },
  {
    // The weather: the barometer, and so the force on the plunger, differ from day to day.
    controls: [{ id: 'air', label: { uk: 'Погода (тиск повітря)', en: 'The weather (air pressure)' }, kind: 'choice', options: [ch('99000', 'Циклон: 990 гПа', 'A cyclone: 990 hPa'), ch('101300', 'Звичайний день: 1013 гПа', 'An ordinary day: 1013 hPa'), ch('103500', 'Антициклон: 1035 гПа', 'An anticyclone: 1035 hPa')], value: '101300' }],
    build: (v) => {
      const air = Number(v['air']);
      return {
        question: {
          uk: 'Шприц на 1 мл, динамометр, лінійка й барометр-анероїд. Виміряємо, яку довжину займає шкала шприца від 0 до 1 мл, і подивимося на барометр. Спершу витягнемо поршень динамометром із відкритим носиком, потім — закривши носик ковпачком: до позначок 0,25, 0,5 і 1 мл. Тиск повітря дасть сила, поділена на площу поршня. Чи покаже шприц такий самий тиск, як барометр?',
          en: 'A 1 mL syringe, a dynamometer, a ruler and an aneroid barometer. We measure how long the syringe’s scale from 0 to 1 mL is and look at the barometer. First we pull the plunger out with the dynamometer with the nozzle open, then with the nozzle shut by a cap: to the 0.25, 0.5 and 1 mL marks. The force over the plunger’s area gives the air’s pressure. Will the syringe show the same pressure as the barometer?',
        },
        plan: [
          { kind: 'bench', command: { type: 'lab.atm', step: 'scale', air } },
          { kind: 'bench', command: { type: 'lab.atm', step: 'barometer', air } },
          { kind: 'bench', command: { type: 'lab.atm', step: 'open', air } },
          ...[0.25, 0.5, 1].map((pulled) => ({ kind: 'bench', command: { type: 'lab.atm', step: 'sealed', air, pulled } }) as const),
        ],
      };
    },
  },
);

export const answer_atmospheric_pressure = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.atm' && x.record.value !== null);
  const len = R.find((x) => x.command['step'] === 'scale')?.record.value ?? 0;
  const p0 = R.find((x) => x.command['step'] === 'barometer')?.record.value ?? 0;
  const open = R.find((x) => x.command['step'] === 'open')?.record.value ?? 0;
  const pulls = R.filter((x) => x.command['step'] === 'sealed').map((x) => ({ v: Number(x.command['pulled']), F: x.record.value!, p: len > 0 ? (x.record.value! * len) / 1e-6 : 0 }));
  const last = pulls[pulls.length - 1];
  // Beyond the dynamometer's half division (as a share of the force), the syringe's pressure differs from the barometer's.
  const off = last && last.F > 0 ? 0.05 / last.F : 1;
  const correct = !last || !p0 ? undefined : Math.abs(last.p - p0) <= off * p0 ? 'same' : last.p < p0 ? 'less' : 'more';
  const hPa = (p: number, l: Locale) => formatMeasured('pressure', p, 100, l);
  const N = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  const mlT = (v: number, l: Locale) => `${sig(v, 2, l)} ${l === 'uk' ? 'мл' : 'mL'}`;
  const list = (l: Locale) => pulls.map((x) => `${mlT(x.v, l)} — ${N(x.F, l)} → ${hPa(x.p, l)}`).map(stepLine).join(';') + STEPS_END;
  const short = last && p0 ? Math.round((1 - last.p / p0) * 100) : 0;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Поки носик відкритий, повітря заходить у шприц слідом за поршнем і тисне на нього зсередини так само, як ззовні, — тягнути легко. Коли носик закритий, зсередини тиснути майже нічому, і повітря ззовні впирається в поршень з силою F = p·S. Але трохи повітря завжди лишається в носику. Коли поршень іде вгору, це повітря розходиться по всьому шприцу й тисне зсередини тим слабше, чим більше йому місця. Тому сила зростає, що далі витягнуто поршень, і наближається до p·S, але не досягає її: тиск зі шприца виходить трохи меншим, ніж показує барометр.'
        : 'While the nozzle is open, air comes into the syringe after the plunger and presses on it from inside as much as from outside — it pulls easily. With the nozzle shut, there is almost nothing inside to press, and the air outside pushes on the plunger with F = p·S. But a little air always stays in the nozzle. As the plunger goes up, that air spreads over the whole syringe and presses from inside the weaker the more room it has. So the force grows the farther the plunger is pulled and comes near p·S, but does not reach it: the syringe’s pressure comes out a little less than the barometer shows.',
    ),
    say: both((l) => (last ? (l === 'uk' ? `Шприц показав ${hPa(last.p, l)}, барометр — ${hPa(p0, l)}.` : `The syringe showed ${hPa(last.p, l)}, the barometer ${hPa(p0, l)}.`) : l === 'uk' ? 'Подивімося, що показав динамометр.' : 'Let us look at the dynamometer.')),
    text: both((l) =>
      l === 'uk'
        ? `Шкала 1 мл займає ${sig(len * 100, 2, l)} см, тож площа поршня S = V / l ≈ ${sig(1e-6 / Math.max(len, 1e-9) * 1e4, 3, l)} см². З відкритим носиком динамометр показав ${N(open, l)}. Із закритим: ${list(l)} (p = F / S). Барометр показував ${hPa(p0, l)}: шприц дав ${correct === 'same' ? 'той самий тиск у межах точності динамометра' : correct === 'less' ? `на ${short} % менше — тим ближче до барометра, що далі витягнуто поршень` : 'більше'}. (Тертя поршня не враховано: у справжньому шприці воно додає до сили.)`
        : `The 1 mL scale is ${sig(len * 100, 2, l)} cm long, so the plunger’s area S = V / l ≈ ${sig(1e-6 / Math.max(len, 1e-9) * 1e4, 3, l)} cm². With the nozzle open the dynamometer showed ${N(open, l)}. Shut: ${list(l)} (p = F / S). The barometer showed ${hPa(p0, l)}: the syringe gave ${correct === 'same' ? 'the same pressure within the dynamometer’s accuracy' : correct === 'less' ? `${short} % less — the nearer the barometer the farther the plunger is pulled` : 'more'}. (The plunger’s friction is left out: in a real syringe it adds to the force.)`,
    ),
  };
};
