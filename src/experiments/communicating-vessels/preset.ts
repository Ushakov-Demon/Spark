import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_communicating_vessels: Preset = {
  id: 'communicating-vessels',
  ask: { uk: 'Де стоятиме вищий рівень — олії чи води?', en: 'Which level will stand higher — the oil’s or the water’s?' },
  grade: 7,
  topic: PRESSURE,
  title: { uk: 'Сполучені посудини: вода й олія', en: 'Communicating vessels: water and oil' },
  question: {
    uk: 'Наллємо у скляну U-подібну трубку води й порівняємо рівні в обох колінах. Потім доливатимемо в ліве коліно соняшникову олію — 10 мл, а тоді ще 10 мл — і щоразу вимірюватимемо лінійкою висоту стовпа олії й висоту води в правому коліні над рівнем межі між олією й водою. Де стоятиме вищий рівень — олії чи води?',
    en: 'We pour water into a glass U-tube and compare the levels in its two arms. Then we pour sunflower oil into the left arm — 10 mL, then 10 mL more — and each time measure with a ruler the height of the oil column and of the water in the right arm above the level of the boundary between the oil and the water. Which level will stand higher — the oil’s or the water’s?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'utube',
  plan: [0, 10, 20].map((poured) => ({ kind: 'bench', command: { type: 'lab.utube', poured, liquid: 'sunflower-oil' } }) as const),
  choices: [ch('oil', 'Вищим буде рівень олії', 'The oil’s level will be higher'), ch('water', 'Вищим буде рівень води', 'The water’s level will be higher'), ch('same', 'Рівні будуть однакові', 'The levels will be the same')],
  choicesAt: 'end',
  answerOnBoard: ['rhoU:'],
  formulas: ['mechanics.communicating-vessels', 'mechanics.hydrostatic-pressure'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Сполучені посудини. … моделювання: сполучених посудин' }],
  expect: 'reached',
};

export const answer_communicating_vessels = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.utube' && x.record.value !== null);
  const alone = R.find((x) => x.record.inputs?.['which'] === 2)?.record;
  const pours = [...new Set(R.filter((x) => Number(x.command['poured']) > 0).map((x) => Number(x.command['poured'])))].map((ml) => ({
    ml,
    oil: R.find((x) => Number(x.command['poured']) === ml && x.record.inputs?.['which'] === 1)?.record.value ?? 0,
    water: R.find((x) => Number(x.command['poured']) === ml && x.record.inputs?.['which'] === 0)?.record.value ?? 0,
    rhoW: R[0]?.record.inputs?.['rhoWater'] ?? 997,
    rhoO: R[0]?.record.inputs?.['rhoOil'] ?? 919,
  }));
  const last = pours[pours.length - 1];
  const correct = !last ? undefined : last.oil > last.water + 0.001 ? 'oil' : last.water > last.oil + 0.001 ? 'water' : 'same';
  const rho = last && last.oil > 0 ? (last.rhoW * last.water) / last.oil : 0;
  const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${l === 'uk' ? 'см' : 'cm'}`;
  const list = (l: Locale) => pours.map((x) => (l === 'uk' ? `олії ${x.ml} мл: h_олії = ${cm(x.oil, l)}, h_води = ${cm(x.water, l)}` : `${x.ml} mL of oil: h_oil = ${cm(x.oil, l)}, h_water = ${cm(x.water, l)}`)).join('; ');
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Рідина в сполучених посудинах стоїть спокійно, коли на одному рівні в обох колінах тиск однаковий — інакше вона перетікала б туди, де тиск менший. З самою водою це означає однакові рівні. На рівні межі олії й води зліва тисне стовп олії, справа — стовп води: ρ_олії·g·h_олії = ρ_води·g·h_води. Олія легша за воду, тож її стовп мусить бути вищим, щоб тиснути так само.'
        : 'A liquid in communicating vessels stays still when the pressure is the same at one level in both arms — otherwise it would flow to where it is lower. With water alone that means the same levels. At the level of the boundary the oil column presses on the left, the water column on the right: ρ_oil·g·h_oil = ρ_water·g·h_water. Oil is lighter than water, so its column has to be taller to press as hard.',
    ),
    say: both((l) => (correct === 'oil' ? (l === 'uk' ? 'Стовп олії вищий — бо олія легша за воду!' : 'The oil column is taller — oil is lighter than water!') : l === 'uk' ? 'Подивімося на лінійку.' : 'Let us look at the ruler.')),
    text: both((l) =>
      l === 'uk'
        ? `Сама вода стояла в обох колінах на одному рівні${alone ? ` (різниця ${cm(alone.value ?? 0, l)})` : ''}. Потім: ${list(l)}. Стовп олії щоразу вищий за стовп води, а їхнє відношення стале: тиски на рівні межі рівні, ρ_олії·h_олії = ρ_води·h_води. Звідси густина олії ρ = ρ_води·h_води / h_олії ≈ ${sig(rho, 3, l)} кг/м³ (у таблиці — ${sig(last?.rhoO ?? 0, 3, l)} кг/м³).`
        : `Water alone stood at one level in both arms${alone ? ` (a difference of ${cm(alone.value ?? 0, l)})` : ''}. Then: ${list(l)}. The oil column is taller than the water column each time, and their ratio stays the same: the pressures are equal at the boundary, ρ_oil·h_oil = ρ_water·h_water. Hence the oil’s density ρ = ρ_water·h_water / h_oil ≈ ${sig(rho, 3, l)} kg/m³ (the table gives ${sig(last?.rhoO ?? 0, 3, l)} kg/m³).`,
    ),
  };
};
