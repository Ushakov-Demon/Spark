/**
 * How much energy does it take to bring water to the boil?
 *
 *   npm run boil                                         # 20 L, steel pot 3 kg, 2 kW hotplate, from 20 °C
 *   npm run boil -- --liters 5 --pot aluminium --pot-mass 1 --power 1500 --start 10
 *   npm run boil -- --lang en --level expert --full
 *
 * Options: --liters, --start °C, --room °C, --pot steel|aluminium|iron, --pot-mass kg,
 *          --power W, --level, --lang uk|en, --full (whole report with laws and sources)
 */
import { createCommandRegistry, createSimulation, entityId, runExperiment, seconds } from '../src/core/index.js';
import { celsius, kelvin, toCelsius } from '../src/core/units.js';
import {
  createThermalSolver,
  heatForTemperatureChange,
  isHeater,
  isReservoir,
  isThermalBody,
  MATERIALS,
  THERMAL_COMMANDS,
  THERMAL_KNOWLEDGE,
  type ThermalCommand,
} from '../src/domains/thermal/index.js';
import { buildReport, fixed, formatQuantity, renderText, type ExplainContext } from '../src/explain/index.js';
import { isLocale, tr } from '../src/knowledge/i18n.js';
import { LEVELS, type Level } from '../src/knowledge/levels.js';
import { boilLab, DEFAULT_BOIL, potGeometry, type BoilParams, type PotMetal } from '../src/scenarios/index.js';
import { kilograms } from '../src/core/units.js';

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}
const num = (n: string, d: number) => {
  const v = arg(n);
  if (v === undefined) return d;
  const x = Number(v);
  if (!Number.isFinite(x) || x <= 0) fail(`--${n} must be a positive number`);
  return x;
};
const level = (arg('level') ?? 'school') as Level;
const locale = arg('lang') ?? 'uk';
if (!LEVELS.includes(level)) fail(`--level ${LEVELS.join('|')}`);
if (!isLocale(locale)) fail('--lang uk|en');
const potMaterial = (arg('pot') ?? DEFAULT_BOIL.potMaterial) as PotMetal;
if (!['steel', 'aluminium', 'iron'].includes(potMaterial)) fail('--pot steel|aluminium|iron');

const p: BoilParams = {
  liters: num('liters', DEFAULT_BOIL.liters),
  startTemp: Number(arg('start') ?? DEFAULT_BOIL.startTemp),
  roomTemp: Number(arg('room') ?? DEFAULT_BOIL.roomTemp),
  potMaterial,
  potMass: num('pot-mass', DEFAULT_BOIL.potMass),
  power: num('power', DEFAULT_BOIL.power),
};
if (!(p.startTemp < 100)) fail('--start must be below 100 °C');
const ctx: ExplainContext = { level, locale };
const uk = locale === 'uk';

const initial = boilLab(p);
const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.5) });
const BOIL = celsius(100);
const waterOf = (s: typeof initial) => {
  const w = s.entities[entityId('water')];
  if (!w || !isThermalBody(w)) throw new Error('water');
  return w;
};
const result = runExperiment<ThermalCommand>({
  initial,
  simulation,
  commands: createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS),
  duration: seconds(12 * 3600),
  sampleEvery: seconds(60),
  until: (s) => waterOf(s).state.temperature >= BOIL,
});

// --- energy bookkeeping from the final state -------------------------------
const f = result.final;
const body = (id: string) => {
  const e = f.entities[entityId(id)]!;
  const e0 = initial.entities[entityId(id)]!;
  if (!(isThermalBody(e) || isHeater(e)) || !(isThermalBody(e0) || isHeater(e0))) throw new Error(id);
  return e.params.mass * e.params.specificHeat * (e.state.temperature - e0.state.temperature);
};
const plate = f.entities[entityId('plate')]!;
const room = f.entities[entityId('room')]!;
if (!isHeater(plate) || !isReservoir(room)) throw new Error('scene');
const delivered = plate.state.energyDelivered;
const parts = [
  { uk: 'нагріла воду', en: 'heated the water', j: body('water') },
  { uk: 'нагріла каструлю', en: 'heated the pot', j: body('pot') },
  { uk: 'залишилась у розжареній плиті', en: 'stayed in the hot plate', j: body('plate') },
  { uk: 'пішла в повітря кімнати', en: 'went into the room air', j: room.state.heatAbsorbed },
];

// --- ideal minimum: Q = c·m·ΔT for water and pot, no losses ---------------
const waterMass = waterOf(initial).params.mass;
const dT = 100 - p.startTemp;
const qWater = heatForTemperatureChange(waterMass, MATERIALS.water.specificHeat.value, dT);
const qPot = heatForTemperatureChange(kilograms(p.potMass), MATERIALS[p.potMaterial].specificHeat.value, 100 - p.roomTemp);
const ideal = qWater + qPot;

// --- output ------------------------------------------------------------------
const J = (v: number) => formatQuantity(v, 'J', ctx);
const kWh = (v: number) => `${fixed(v / 3.6e6, 2, locale)} ${uk ? 'кВт·год' : 'kWh'}`;
const MJ = (v: number) => `${fixed(v / 1e6, 2, locale)} ${uk ? 'МДж' : 'MJ'}`;
const t = (s: number) => formatQuantity(s, 's', ctx);
const T = (c: number) => formatQuantity(celsius(c), 'K', ctx);
const g = potGeometry(p.liters);
const potName = tr(MATERIALS[p.potMaterial].name, locale).toLowerCase();
const out: string[] = [];

out.push('', uk ? '▌ Дослід: нагріти воду до кипіння' : '▌ Experiment: bring water to the boil', '');
out.push(
  uk
    ? `${p.liters} л води (${fixed(waterMass, 2, locale)} кг: густина ${fixed(MATERIALS.water.density.value, 2, locale)} кг/м³) від ${T(p.startTemp)}, каструля ${potName} ${p.potMass} кг (≈ ${fixed(g.radius * 200, 0, locale)} × ${fixed(g.height * 100, 0, locale)} см), електроплита ${p.power} Вт, кімната ${T(p.roomTemp)}.`
    : `${p.liters} L of water (${fixed(waterMass, 2, locale)} kg: density ${fixed(MATERIALS.water.density.value, 2, locale)} kg/m³) from ${T(p.startTemp)}, ${potName} pot ${p.potMass} kg (≈ ${fixed(g.radius * 200, 0, locale)} × ${fixed(g.height * 100, 0, locale)} cm), ${p.power} W hotplate, room ${T(p.roomTemp)}.`,
);

out.push('', uk ? '▌ Мінімум за формулою (без жодних втрат)' : '▌ Minimum by formula (no losses at all)', '');
out.push(`    Q = c · m · ΔT`);
out.push(
  `  • ${uk ? 'вода' : 'water'}: ${fixed(MATERIALS.water.specificHeat.value, 0, locale)} · ${fixed(waterMass, 2, locale)} · ${fixed(dT, 0, locale)} = ${MJ(qWater)}`,
  `  • ${uk ? 'каструля' : 'pot'}: ${fixed(MATERIALS[p.potMaterial].specificHeat.value, 0, locale)} · ${p.potMass} · ${fixed(100 - p.roomTemp, 0, locale)} = ${MJ(qPot)}`,
  `  = ${MJ(ideal)} = ${kWh(ideal)}; ${uk ? 'на плиті' : 'on a'} ${p.power} ${uk ? 'Вт це' : 'W hotplate that is'} ${t(ideal / p.power)}`,
);

out.push('', uk ? '▌ Симуляція (з нагрівом плити й втратами в повітря)' : '▌ Simulation (hotplate warm-up and losses to the air)', '');
if (!result.stoppedEarly) {
  const reached = toCelsius(kelvin(waterOf(f).state.temperature));
  out.push(
    uk
      ? `⚠ Вода не закипає: за 12 год вона дійшла лише до ${fixed(reached, 1, locale)} °C. Втрати в повітря зрівнялися з потужністю плити — потрібна потужніша плита або кришка.`
      : `⚠ The water never boils: after 12 h it only reached ${fixed(reached, 1, locale)} °C. Losses to the air balance the hotplate — use more power or a lid.`,
  );
} else {
  out.push(uk ? `Вода дійшла до 100 °C за ${t(f.time)}.` : `The water reached 100 °C in ${t(f.time)}.`);
  out.push(
    uk
      ? `Плита спожила ${MJ(delivered)} = ${kWh(delivered)}. Куди пішла ця енергія:`
      : `The hotplate used ${MJ(delivered)} = ${kWh(delivered)}. Where this energy went:`,
  );
  for (const part of parts) out.push(`  • ${fixed((100 * part.j) / delivered, 1, locale)} % ${uk ? part.uk : part.en} (${J(part.j)})`);
  const sum = parts.reduce((a, b) => a + b.j, 0);
  out.push(
    uk
      ? `  (сума ${MJ(sum)} — збігається зі спожитою енергією: закон збереження енергії)`
      : `  (total ${MJ(sum)} — equals the energy used: conservation of energy)`,
  );
  out.push(
    uk
      ? `ККД нагрівання води: ${fixed((100 * parts[0]!.j) / delivered, 0, locale)} %.`
      : `Efficiency of heating the water: ${fixed((100 * parts[0]!.j) / delivered, 0, locale)} %.`,
  );
}

out.push('', uk ? '▌ Що варто знати' : '▌ Good to know', '');
out.push(
  ...(uk
    ? [
        '  • Тут рахуємо лише нагрів ДО 100 °C. Щоб вода ще й википала (перетворювалася на пару), потрібно набагато більше енергії — цього модель поки не вміє.',
        '  • Випаровування з поверхні не враховане: біля 100 °C реальні втрати більші, тож реальний час буде довшим. Кришка суттєво зменшує втрати.',
        `  • Маса каструлі (${p.potMass} кг), розміри й контакт з плитою — оцінки; вкажіть свої через --pot-mass. Нержавіючої сталі в довіднику ще немає — використано вуглецеву сталь.`,
        '  • Коефіцієнти тепловіддачі — оціночні (див. --level expert --full).',
      ]
    : [
        '  • Only heating UP TO 100 °C is computed. Actually boiling the water away (turning it into steam) takes far more energy — the model cannot do that yet.',
        '  • Evaporation from the surface is ignored: near 100 °C real losses are higher, so the real time will be longer. A lid cuts losses a lot.',
        `  • Pot mass (${p.potMass} kg), size and hotplate contact are estimates; pass your own with --pot-mass. Stainless steel is not in the materials table yet — carbon steel is used.`,
        '  • Heat transfer coefficients are estimates (see --level expert --full).',
      ]),
);
console.log(out.join('\n'));

if (process.argv.includes('--full')) {
  console.log(
    renderText(
      buildReport({ title: uk ? 'Повний звіт' : 'Full report', level, locale, country: 'UA', result, simulation, domain: THERMAL_KNOWLEDGE, focusTime: f.time / 2 }),
    ),
  );
}
