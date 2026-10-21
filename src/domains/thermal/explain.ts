import type { ExperimentLogEntry, ExperimentResult } from '../../core/experiment.js';
import type { SystemState } from '../../core/state.js';
import { h, list, p, type Block } from '../../explain/blocks.js';
import type { DataUsage, DomainKnowledge } from '../../explain/domain.js';
import { formatQuantity, formatTime, pluralUk, sig, type ExplainContext } from '../../explain/format.js';
import { entityLabel } from '../../explain/report.js';
import { tr, type Locale } from '../../knowledge/i18n.js';
import { atLeast, type Level } from '../../knowledge/levels.js';
import { THERMAL_FORMULAS } from './catalog.js';
import type { ThermalCommand } from './commands.js';
import { isBurner, isHeater, isReservoir, isThermalBody, type Heater, type ThermalBody } from './entities.js';
import { getCooler, getHeater } from '../../equipment/catalog.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { SUBSTANCES, type SubstanceId } from '../../substances/catalog.js';
import { THERMAL_LAWS } from './laws.js';
import { isSupplyLink, isThermalLink } from './links.js';
import { CONVECTION, MATERIALS } from './materials.js';
import { thermalEnergy } from './solver.js';

interface ThermalMessages {
  start: string;
  end: string;
  peak: string;
  showProcess(n: number): string;
  time: string;
  power: string;
  on: string;
  off: string;
  bodySummary(name: string, start: string, peak: string | null, end: string): string;
  switched(on: boolean): string;
  setPower(p: string): string;
  heaterCmd(actions: string, name: string): string;
  and: string;
  pour(mass: string, temp: string, into: string): string;
  added(into: string, mass: string, what: string, temp: string): string;
  setTemp(name: string, temp: string): string;
  intervention(energy: string): string;
  energyTitleNovice: string;
  energyNovice(total: string, share: number): string;
  energyTitle: string;
  energy: string;
  fromHeaters: string;
  external: string;
  toRoom: string;
  shouldRemain: string;
  actualChange: string;
  reference: string;
  residual(j: string, rel: string): string;
  specificHeatOf(name: string): string;
  convectionOf(name: string): string;
  conductionOf(name: string): string;
  linkOf(name: string): string;
  deviceRating(name: string): string;
  flameShare(name: string): string;
}

const MSG: Readonly<Record<Locale, ThermalMessages>> = {
  uk: {
    start: 'на початку',
    end: 'наприкінці',
    peak: 'найвища',
    showProcess: (n) => `Показати весь процес (${n} ${pluralUk(n, 'запис', 'записи', 'записів')})`,
    time: 'час',
    power: 'живлення',
    on: 'увімк',
    off: 'вимк',
    bodySummary: (n, s, pk, e) => `${n}: на початку ${s}${pk ? `, найвища — ${pk}` : ''}, наприкінці ${e}.`,
    switched: (on) => (on ? 'увімкнули' : 'вимкнули'),
    setPower: (pw) => `встановили потужність ${pw}`,
    heaterCmd: (a, n) => `«${n}»: ${a}`,
    and: ' і ',
    pour: (mass, temp, into) => `«${into}»: долили ${mass} за ${temp}`,
    added: (into, mass, what, temp) => `«${into}»: додали ${mass} — ${what}, ${temp}`,
    setTemp: (n, temp) => `«${n}»: вручну задали температуру ${temp}`,
    intervention: (e) => `; це втручання: енергія ${e} взялася «ззовні» і врахована в балансі`,
    energyTitleNovice: 'Куди поділася енергія',
    energyNovice: (total, share) =>
      `Нагрівач виділив ${total} теплоти. Приблизно ${share} % з неї пішло в кімнату, решта залишилася в чайнику. Жодна частинка енергії не зникла — її можна точно порахувати.`,
    energyTitle: 'Баланс енергії (закон збереження енергії)',
    energy: 'енергія',
    fromHeaters: 'виділив нагрівач',
    external: 'принесено доливанням і втручаннями',
    toRoom: 'пішло в кімнату',
    shouldRemain: '= мало залишитися в тілах',
    actualChange: 'фактично змінилася внутрішня енергія',
    reference: 'Внутрішню енергію відлічуємо від 0 °C: важливі лише зміни, а точка відліку — домовленість.',
    residual: (j, rel) => `Нев’язка балансу: ${j} Дж (${rel} відносно ΔU) — похибка округлення чисел з рухомою комою.`,
    specificHeatOf: (n) => `${n}: питома теплоємність`,
    convectionOf: (n) => `Тепловіддача ${n}: коефіцієнт h`,
    conductionOf: (n) => `Теплопровідність ${n}`,
    linkOf: (n) => `Зв’язок ${n}: провідність G`,
    deviceRating: (n) => `${n}: номінальна потужність`,
    flameShare: (n) => `${n}: частка теплоти полум’я, що йде в посудину`,
  },
  en: {
    start: 'start',
    end: 'end',
    peak: 'peak',
    showProcess: (n) => `Show the whole process (${n} ${n === 1 ? 'row' : 'rows'})`,
    time: 'time',
    power: 'power',
    on: 'on',
    off: 'off',
    bodySummary: (n, s, pk, e) => `${n}: started at ${s}${pk ? `, peak ${pk}` : ''}, ended at ${e}.`,
    switched: (on) => (on ? 'switched on' : 'switched off'),
    setPower: (pw) => `set power to ${pw}`,
    heaterCmd: (a, n) => `${a} "${n}"`,
    and: ' and ',
    pour: (mass, temp, into) => `poured ${mass} at ${temp} into "${into}"`,
    added: (into, mass, what, temp) => `"${into}": added ${mass} of ${what} at ${temp}`,
    setTemp: (n, temp) => `manually set the temperature of "${n}" to ${temp}`,
    intervention: (e) => `; this is an intervention: ${e} of energy came «from outside» and is included in the balance`,
    energyTitleNovice: 'Where the energy went',
    energyNovice: (total, share) =>
      `The heater released ${total} of heat. About ${share} % of it went into the room, the rest stayed in the kettle. Not a bit of energy disappeared — it can all be accounted for.`,
    energyTitle: 'Energy balance (conservation of energy)',
    energy: 'energy',
    fromHeaters: 'released by the heater',
    external: 'brought in by pouring and interventions',
    toRoom: 'lost to the room',
    shouldRemain: '= should remain in the bodies',
    actualChange: 'actual change of internal energy',
    reference: 'Internal energy is counted from 0 °C: only changes matter, the reference point is a convention.',
    residual: (j, rel) => `Balance residual: ${j} J (${rel} relative to ΔU) — floating-point rounding error.`,
    specificHeatOf: (n) => `${n}: specific heat capacity`,
    convectionOf: (n) => `Heat transfer ${n}: coefficient h`,
    conductionOf: (n) => `Conduction ${n}`,
    linkOf: (n) => `Link ${n}: conductance G`,
    deviceRating: (n) => `${n}: rated power`,
    flameShare: (n) => `${n}: share of the flame's heat reaching the vessel`,
  },
};

const MATERIALS_MSG: Readonly<Record<Locale, { wall(link: string, material: string): string }>> = {
  uk: { wall: (link, m) => `Стінка ${link}: теплопровідність матеріалу «${m}»` },
  en: { wall: (link, m) => `Wall ${link}: conductivity of «${m}»` },
};

const bodiesOf = (s: SystemState) => Object.values(s.entities).filter((e): e is ThermalBody | Heater => isThermalBody(e) || isHeater(e));
const ROW_EVERY: Readonly<Record<Level, number>> = { novice: 120, school: 60, advanced: 60, expert: 30 };

function timeline(result: ExperimentResult<ThermalCommand>, ctx: ExplainContext): Block[] {
  const { level, locale } = ctx;
  const m = MSG[locale];
  const T = (k: number, c: ExplainContext = ctx) => formatQuantity(k, 'K', c);
  const tableCtx: ExplainContext = { locale, level: level === 'expert' ? 'advanced' : level };
  const bodies = bodiesOf(result.final);
  const heaters = bodies.filter(isHeater);
  const name = (id: string) => entityLabel(result.final, id, locale);

  // Compact view: from → to (and the peak, if it was higher than both).
  const summaryRows = bodies.map((b) => {
    let start = NaN;
    let max = { t: 0, temp: -Infinity };
    for (const s of result.samples) {
      const e = s.entities[b.id];
      if (!e || !(isThermalBody(e) || isHeater(e))) continue;
      if (Number.isNaN(start)) start = e.state.temperature;
      if (e.state.temperature > max.temp) max = { t: s.time, temp: e.state.temperature };
    }
    const end = b.state.temperature;
    const peak = max.temp - Math.max(start, end) > 0.05 ? `${T(max.temp, tableCtx)} (${formatTime(max.t, locale)})` : '—';
    return [name(b.id), T(start, tableCtx), T(end, tableCtx), peak];
  });
  const out: Block[] = [
    {
      kind: 'table',
      head: ['', `${m.start} (${formatTime(result.initial.time, locale)})`, `${m.end} (${formatTime(result.final.time, locale)})`, m.peak],
      rows: summaryRows,
    },
  ];

  // Full process, collapsed: at most ~30 rows.
  const every = Math.max(ROW_EVERY[level] / 6, Math.ceil(result.final.time / 30 / 10) * 10);
  const rows = result.samples
    .filter((s, i, all) => Math.abs(s.time / every - Math.round(s.time / every)) < 1e-6 || i === all.length - 1)
    .map((s) => [
      formatTime(s.time, locale),
      ...bodies.map((b) => {
        const e = s.entities[b.id];
        return e && (isThermalBody(e) || isHeater(e)) ? T(e.state.temperature, tableCtx) : '—';
      }),
      ...heaters.map((hh) => {
        const e = s.entities[hh.id];
        return e && isHeater(e) ? (e.params.on ? m.on : m.off) : '—';
      }),
    ]);
  out.push({
    kind: 'details',
    summary: m.showProcess(rows.length),
    blocks: [{ kind: 'table', head: [m.time, ...bodies.map((b) => name(b.id)), ...heaters.map((hh) => `${name(hh.id)}: ${m.power}`)], rows }],
  });
  return out;
}

function describeCommand(e: ExperimentLogEntry<ThermalCommand>, ctx: ExplainContext, s: SystemState): string {
  const { locale } = ctx;
  const m = MSG[locale];
  const name = (id: string) => entityLabel(s, id, locale);
  const c = e.command;
  const note = e.note ? ` («${e.note}»)` : '';
  switch (c.type) {
    case 'thermal.heater.set': {
      const parts: string[] = [];
      if (c.on !== undefined) parts.push(m.switched(c.on));
      if (c.power !== undefined) parts.push(m.setPower(formatQuantity(c.power, 'W', ctx)));
      return m.heaterCmd(parts.join(m.and), name(c.entity)) + note;
    }
    case 'thermal.pour':
      return m.pour(formatQuantity(c.mass, 'kg', ctx), formatQuantity(c.temperature, 'K', ctx), name(c.into)) + note;
    case 'thermal.add': {
      const sub = SUBSTANCES[c.substance as SubstanceId];
      const what = sub ? tr(c.frozen && sub.solidName ? sub.solidName : sub.name, locale).toLowerCase() : c.substance;
      return m.added(name(c.into), formatQuantity(c.mass, 'kg', ctx), what, formatQuantity(c.temperature, 'K', ctx)) + note;
    }
    case 'thermal.temperature.set': {
      const energy = e.ok && atLeast(ctx.level, 'school') ? m.intervention(formatQuantity(e.externalEnergy, 'J', ctx)) : '';
      return m.setTemp(name(c.entity), formatQuantity(c.temperature, 'K', ctx)) + note + energy;
    }
  }
}

function energyBalance(result: ExperimentResult<ThermalCommand>, ctx: ExplainContext): Block[] {
  const { level, locale } = ctx;
  const m = MSG[locale];
  const sum = (s: SystemState, f: (e: SystemState['entities'][keyof SystemState['entities']]) => number) =>
    Object.values(s.entities).reduce((acc, e) => acc + f(e), 0);
  const heat = (s: SystemState) => sum(s, (e) => (isHeater(e) || isBurner(e) ? e.state.energyDelivered : 0));
  const lost = (s: SystemState) => sum(s, (e) => (isReservoir(e) ? e.state.heatAbsorbed : 0));
  const fromHeaters = heat(result.final) - heat(result.initial);
  const toRoom = lost(result.final) - lost(result.initial);
  const external = result.externalEnergy;
  const dU = thermalEnergy(result.final) - thermalEnergy(result.initial);
  const J = (v: number) => formatQuantity(v, 'J', ctx);

  if (level === 'novice') {
    const share = fromHeaters > 0 ? Math.round((100 * toRoom) / fromHeaters) : 0;
    return [h(2, m.energyTitleNovice), p(m.energyNovice(J(fromHeaters), share))];
  }
  const out: Block[] = [
    h(2, m.energyTitle),
    {
      kind: 'table',
      head: ['', m.energy],
      rows: [
        [m.fromHeaters, `+${J(fromHeaters)}`],
        [m.external, `${external >= 0 ? '+' : ''}${J(external)}`],
        [m.toRoom, `−${J(toRoom)}`],
        [m.shouldRemain, J(fromHeaters + external - toRoom)],
        [m.actualChange, J(dU)],
      ],
    },
  ];
  if (atLeast(level, 'advanced')) out.push(p(m.reference));
  if (atLeast(level, 'expert')) {
    const residual = dU - (fromHeaters + external - toRoom);
    out.push(p(m.residual(sig(residual, 3, locale), sig(Math.abs(residual) / Math.max(1, Math.abs(dU)), 2, locale))));
  }
  return out;
}

function dataUsed(s: SystemState): DataUsage[] {
  const out: DataUsage[] = [];
  const seen = new Set<string>();
  const both = (f: (l: Locale) => string) => ({ uk: f('uk'), en: f('en') });
  for (const b of bodiesOf(s)) {
    const subId = 'substance' in b.params ? b.params.substance : undefined;
    const sub = subId && subId in SUBSTANCES ? SUBSTANCES[subId as SubstanceId] : undefined;
    if (sub && !seen.has(`sub:${sub.id}`)) {
      seen.add(`sub:${sub.id}`);
      const n = (l: Locale) => tr(sub.name, l);
      const add = (label: (l: Locale) => string, v: SourcedValue) => out.push({ label: both(label), origin: 'catalog', sourced: v });
      add((l) => MSG[l].specificHeatOf(n(l)), sub.liquid.specificHeat);
      if (sub.melt) add((l) => `${n(l)}: ${l === 'uk' ? 'теплоємність розплаву' : 'specific heat (melt)'}`, sub.melt.liquidSpecificHeat);
      add((l) => `${n(l)}: ${l === 'uk' ? 'густина' : 'density'}`, sub.liquid.density);
      if (sub.melt) {
        add((l) => `${n(l)}: ${l === 'uk' ? 'температура плавлення' : 'melting point'}`, sub.melt.point);
        add((l) => `${n(l)}: ${l === 'uk' ? 'питома теплота плавлення' : 'latent heat of fusion'}`, sub.melt.latentHeat);
      } else if (sub.freezing) {
        add((l) => `${n(l)}: ${l === 'uk' ? 'температура замерзання' : 'freezing point'}`, sub.freezing.point);
        add((l) => `${n(l)}: ${l === 'uk' ? 'питома теплота плавлення' : 'latent heat of fusion'}`, sub.freezing.latentHeat);
        add((l) => `${n(l)}: ${l === 'uk' ? 'теплоємність у твердому стані' : 'specific heat (solid)'}`, sub.freezing.solidSpecificHeat);
      }
      if (sub.boiling) {
        add((l) => `${n(l)}: ${l === 'uk' ? 'температура кипіння' : 'boiling point'}`, sub.boiling.point);
        add((l) => `${n(l)}: ${l === 'uk' ? 'питома теплота пароутворення' : 'latent heat of vaporisation'}`, sub.boiling.latentHeat);
      }
      if (sub.decomposes) add((l) => `${n(l)}: ${l === 'uk' ? 'температура димлення' : 'smoke point'}`, sub.decomposes);
    }
    const mat = b.params.material ? MATERIALS[b.params.material as keyof typeof MATERIALS] : undefined;
    if (!mat || seen.has(mat.id)) continue;
    seen.add(mat.id);
    out.push({ label: both((l) => MSG[l].specificHeatOf(tr(mat.name, l))), origin: 'catalog', sourced: mat.specificHeat });
  }
  for (const e of Object.values(s.entities)) {
    const cooler = isReservoir(e) && e.params.device ? getCooler(e.params.device) : undefined;
    if (cooler) out.push({ label: both((l) => `${tr(cooler.name, l)}: ${l === 'uk' ? 'температура' : 'temperature'}`), origin: 'catalog', sourced: cooler.spec.setpoint.data });
    const d = (isHeater(e) || isBurner(e)) && e.params.device ? getHeater(e.params.device) : undefined;
    if (!d) continue;
    out.push({ label: both((l) => MSG[l].deviceRating(tr(d.name, l))), origin: 'catalog', sourced: d.spec.ratingData });
  }
  for (const c of s.connections) {
    if (isSupplyLink(c)) {
      const d = c.params.dataRef ? getHeater(c.params.dataRef) : undefined;
      const target = s.entities[c.b.entity];
      const share = d?.spec.vesselShare;
      if (d && share && target && !isReservoir(target)) out.push({ label: both((l) => MSG[l].flameShare(tr(d.name, l))), origin: 'catalog', sourced: share });
      continue;
    }
    if (!isThermalLink(c)) continue;
    const name = (l: Locale) => `${entityLabel(s, c.a.entity, l)} ↔ ${entityLabel(s, c.b.entity, l)}`;
    const o = c.params.origin;
    if (o?.type === 'wall' && o.material in MATERIALS) {
      out.push({ label: both((l) => MATERIALS_MSG[l].wall(name(l), tr(MATERIALS[o.material as keyof typeof MATERIALS].name, l))), origin: 'catalog', sourced: MATERIALS[o.material as keyof typeof MATERIALS].conductivity });
      if (o.dataRef && o.dataRef in CONVECTION) {
        out.push({ label: both((l) => MSG[l].convectionOf(name(l))), origin: 'catalog', sourced: CONVECTION[o.dataRef as keyof typeof CONVECTION] });
      }
    } else if (o?.type === 'convection' && o.dataRef && o.dataRef in CONVECTION) {
      out.push({ label: both((l) => MSG[l].convectionOf(name(l))), origin: 'catalog', sourced: CONVECTION[o.dataRef as keyof typeof CONVECTION] });
    } else if (o?.type === 'conduction' && o.dataRef && o.dataRef in MATERIALS) {
      out.push({ label: both((l) => MSG[l].conductionOf(name(l))), origin: 'catalog', sourced: MATERIALS[o.dataRef as keyof typeof MATERIALS].conductivity });
    } else {
      out.push({ label: both((l) => MSG[l].linkOf(name(l))), origin: 'scenario', value: c.params.conductance, unit: 'W/K' });
    }
  }
  return out;
}

export const THERMAL_KNOWLEDGE: DomainKnowledge<ThermalCommand> = {
  formulas: THERMAL_FORMULAS,
  laws: THERMAL_LAWS,
  timeline,
  describeCommand,
  energyBalance,
  dataUsed,
};
