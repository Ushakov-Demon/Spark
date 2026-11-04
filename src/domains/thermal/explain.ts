import type { ExperimentLogEntry, ExperimentResult } from '../../core/experiment.js';
import type { SystemState } from '../../core/state.js';
import { h, list, p, type Block } from '../../explain/blocks.js';
import type { DataUsage, DomainKnowledge } from '../../explain/domain.js';
import { formatQuantity, formatTime, sig, type ExplainContext } from '../../explain/format.js';
import { entityLabel } from '../../explain/report.js';
import { tr, type Locale } from '../../knowledge/i18n.js';
import { atLeast, type Level } from '../../knowledge/levels.js';
import { byLocale, localized, t as tl } from '../../knowledge/messages.js';
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

const MSG: Readonly<Record<Locale, ThermalMessages>> = byLocale((l: Locale) => ({
    start: tl(l, 'thermal-explain-msg-start'),
    end: tl(l, 'thermal-explain-msg-end'),
    peak: tl(l, 'thermal-explain-msg-peak'),
    showProcess: (n) => tl(l, 'thermal-explain-msg-show-process', { value: tl(l, 'count-records', { n }) }),
    time: tl(l, 'thermal-explain-msg-time'),
    power: tl(l, 'thermal-explain-msg-power'),
    on: tl(l, 'thermal-explain-msg-on'),
    off: tl(l, 'thermal-explain-msg-off'),
    bodySummary: (n, s, pk, e) => tl(l, 'thermal-explain-msg-body-summary-2', { n, s, e, pk: pk ? tl(l, 'thermal-explain-msg-body-summary', { pk }) : '' }),
    switched: (on) => (on ? tl(l, 'thermal-explain-msg-switched') : tl(l, 'thermal-explain-msg-switched-2')),
    setPower: (pw) => tl(l, 'thermal-explain-msg-set-power', { pw }),
    heaterCmd: (a, n) => tl(l, 'thermal-explain-msg-heater-cmd', { n, a }),
    and: tl(l, 'thermal-explain-msg-and'),
    pour: (mass, temp, into) => tl(l, 'thermal-explain-msg-pour', { into, mass, temp }),
    added: (into, mass, what, temp) => tl(l, 'thermal-explain-msg-added', { into, mass, what, temp }),
    setTemp: (n, temp) => tl(l, 'thermal-explain-msg-set-temp', { n, temp }),
    intervention: (e) => tl(l, 'thermal-explain-msg-intervention', { e }),
    energyTitleNovice: tl(l, 'thermal-explain-msg-energy-title-novice'),
    energyNovice: (total, share) =>
      tl(l, 'thermal-explain-msg-energy-novice', { total, share: String(share) }),
    energyTitle: tl(l, 'thermal-explain-msg-energy-title'),
    energy: tl(l, 'thermal-explain-msg-energy'),
    fromHeaters: tl(l, 'thermal-explain-msg-from-heaters'),
    external: tl(l, 'thermal-explain-msg-external'),
    toRoom: tl(l, 'thermal-explain-msg-to-room'),
    shouldRemain: tl(l, 'thermal-explain-msg-should-remain'),
    actualChange: tl(l, 'thermal-explain-msg-actual-change'),
    reference: tl(l, 'thermal-explain-msg-reference'),
    residual: (j, rel) => tl(l, 'thermal-explain-msg-residual', { j, rel }),
    specificHeatOf: (n) => tl(l, 'thermal-explain-msg-specific-heat-of', { n }),
    convectionOf: (n) => tl(l, 'thermal-explain-msg-convection-of', { n }),
    conductionOf: (n) => tl(l, 'thermal-explain-msg-conduction-of', { n }),
    linkOf: (n) => tl(l, 'thermal-explain-msg-link-of', { n }),
    deviceRating: (n) => tl(l, 'thermal-explain-msg-device-rating', { n }),
    flameShare: (n) => tl(l, 'thermal-explain-msg-flame-share', { n }),
  }));

const MATERIALS_MSG: Readonly<Record<Locale, { wall(link: string, material: string): string }>> = byLocale((l: Locale) => ({ wall: (link, m) => tl(l, 'thermal-explain-materials-msg-wall', { link, m }) }));

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
  const both = (f: (l: Locale) => string) => localized((l: Locale) => f(l));
  for (const b of bodiesOf(s)) {
    const subId = 'substance' in b.params ? b.params.substance : undefined;
    const sub = subId && subId in SUBSTANCES ? SUBSTANCES[subId as SubstanceId] : undefined;
    if (sub && !seen.has(`sub:${sub.id}`)) {
      seen.add(`sub:${sub.id}`);
      const n = (l: Locale) => tr(sub.name, l);
      const add = (label: (l: Locale) => string, v: SourcedValue) => out.push({ label: both(label), origin: 'catalog', sourced: v });
      add((l) => MSG[l].specificHeatOf(n(l)), sub.liquid.specificHeat);
      if (sub.melt) add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used')}`, sub.melt.liquidSpecificHeat);
      add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-2')}`, sub.liquid.density);
      if (sub.melt) {
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-3')}`, sub.melt.point);
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-4')}`, sub.melt.latentHeat);
      } else if (sub.freezing) {
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-5')}`, sub.freezing.point);
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-4')}`, sub.freezing.latentHeat);
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-6')}`, sub.freezing.solidSpecificHeat);
      }
      if (sub.boiling) {
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-7')}`, sub.boiling.point);
        add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-8')}`, sub.boiling.latentHeat);
      }
      if (sub.decomposes) add((l) => `${n(l)}: ${tl(l, 'thermal-explain-data-used-9')}`, sub.decomposes);
    }
    const mat = b.params.material ? MATERIALS[b.params.material as keyof typeof MATERIALS] : undefined;
    if (!mat || seen.has(mat.id)) continue;
    seen.add(mat.id);
    out.push({ label: both((l) => MSG[l].specificHeatOf(tr(mat.name, l))), origin: 'catalog', sourced: mat.specificHeat });
  }
  for (const e of Object.values(s.entities)) {
    const cooler = isReservoir(e) && e.params.device ? getCooler(e.params.device) : undefined;
    if (cooler) out.push({ label: both((l) => `${tr(cooler.name, l)}: ${tl(l, 'thermal-explain-data-used-label')}`), origin: 'catalog', sourced: cooler.spec.setpoint.data });
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
