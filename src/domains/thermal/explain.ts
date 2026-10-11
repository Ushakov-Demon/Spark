import type { ExperimentLogEntry, ExperimentResult } from '../../core/experiment.js';
import type { SystemState } from '../../core/state.js';
import { h, list, p, type Block } from '../../explain/blocks.js';
import type { DataUsage, DomainKnowledge } from '../../explain/domain.js';
import { formatQuantity, formatTime, sig } from '../../explain/format.js';
import { entityLabel } from '../../explain/report.js';
import { atLeast, type Level } from '../../knowledge/levels.js';
import type { ThermalCommand } from './commands.js';
import { isHeater, isReservoir, isThermalBody, type Heater, type ThermalBody } from './entities.js';
import { THERMAL_FORMULAS } from './catalog.js';
import { THERMAL_LAWS } from './laws.js';
import { isThermalLink } from './links.js';
import { CONVECTION, MATERIALS } from './materials.js';
import { thermalEnergy } from './solver.js';

const T = (k: number, level: Level) => formatQuantity(k, 'K', level);
const bodiesOf = (s: SystemState) => Object.values(s.entities).filter((e): e is ThermalBody | Heater => isThermalBody(e) || isHeater(e));
const ROW_EVERY: Readonly<Record<Level, number>> = { novice: 120, school: 60, advanced: 60, expert: 30 };

function timeline(result: ExperimentResult<ThermalCommand>, level: Level): Block[] {
  const out: Block[] = [];
  const bodies = bodiesOf(result.final);
  const heaters = bodies.filter(isHeater);
  const every = ROW_EVERY[level];

  const rows = result.samples
    .filter((s, i, all) => Math.abs(s.time / every - Math.round(s.time / every)) < 1e-6 || i === all.length - 1)
    .map((s) => [
      formatTime(s.time),
      ...bodies.map((b) => {
        const e = s.entities[b.id];
        return e && (isThermalBody(e) || isHeater(e)) ? T(e.state.temperature, level === 'expert' ? 'advanced' : level) : '—';
      }),
      ...heaters.map((hh) => {
        const e = s.entities[hh.id];
        return e && isHeater(e) ? (e.params.on ? 'вкл' : 'выкл') : '—';
      }),
    ]);
  out.push({
    kind: 'table',
    head: ['время', ...bodies.map((b) => b.label ?? b.id), ...heaters.map((hh) => `${hh.label ?? hh.id}: питание`)],
    rows,
  });

  const lines: string[] = [];
  for (const b of bodies) {
    let max = { t: 0, temp: -Infinity };
    let start = NaN;
    for (const s of result.samples) {
      const e = s.entities[b.id];
      if (!e || !(isThermalBody(e) || isHeater(e))) continue;
      if (Number.isNaN(start)) start = e.state.temperature;
      if (e.state.temperature > max.temp) max = { t: s.time, temp: e.state.temperature };
    }
    const end = b.state.temperature;
    const name = b.label ?? b.id;
    const peak = max.temp - Math.max(start, end) > 0.05 ? `, самая высокая — ${T(max.temp, level)} (на ${formatTime(max.t)})` : '';
    lines.push(`${name}: в начале ${T(start, level)}${peak}, в конце ${T(end, level)}.`);
  }
  out.push(list(lines));
  return out;
}

function describeCommand(e: ExperimentLogEntry<ThermalCommand>, level: Level, s: SystemState): string {
  const c = e.command;
  const name = (id: string) => entityLabel(s, id);
  const extra = e.note ? ` («${e.note}»)` : '';
  switch (c.type) {
    case 'thermal.heater.set': {
      const parts: string[] = [];
      if (c.on !== undefined) parts.push(c.on ? 'включили' : 'выключили');
      if (c.power !== undefined) parts.push(`установили мощность ${formatQuantity(c.power, 'W', level)}`);
      return `${parts.join(' и ')} «${name(c.entity)}»${extra}`;
    }
    case 'thermal.pour':
      return `долили ${formatQuantity(c.mass, 'kg', level)} при ${T(c.temperature, level)} в «${name(c.into)}»${extra}`;
    case 'thermal.temperature.set': {
      const energy = e.ok && atLeast(level, 'school') ? `; это вмешательство: энергия ${formatQuantity(e.externalEnergy, 'J', level)} взялась «извне» и учтена в балансе` : '';
      return `вручную задали температуру «${name(c.entity)}» = ${T(c.temperature, level)}${extra}${energy}`;
    }
  }
}

function energyBalance(result: ExperimentResult<ThermalCommand>, level: Level): Block[] {
  const heat = (s: SystemState) =>
    Object.values(s.entities).reduce((sum, e) => sum + (isHeater(e) ? e.state.energyDelivered : 0), 0);
  const lost = (s: SystemState) => Object.values(s.entities).reduce((sum, e) => sum + (isReservoir(e) ? e.state.heatAbsorbed : 0), 0);
  const fromHeaters = heat(result.final) - heat(result.initial);
  const toRoom = lost(result.final) - lost(result.initial);
  const external = result.externalEnergy;
  const dU = thermalEnergy(result.final) - thermalEnergy(result.initial);
  const J = (v: number) => formatQuantity(v, 'J', level);

  if (level === 'novice') {
    const share = fromHeaters > 0 ? Math.round((100 * toRoom) / fromHeaters) : 0;
    return [h(2, 'Куда делась энергия'), p(`Нагреватель выделил ${J(fromHeaters)} тепла. В комнату ушло примерно ${share} % от этого, остальное осталось в чайнике. Энергия никуда не пропала!`)];
  }
  const out: Block[] = [h(2, 'Баланс энергии (закон сохранения энергии)')];
  out.push({
    kind: 'table',
    head: ['', 'энергия'],
    rows: [
      ['выделил нагреватель', `+${J(fromHeaters)}`],
      ['принесено доливанием и вмешательствами', `${external >= 0 ? '+' : ''}${J(external)}`],
      ['ушло в комнату', `−${J(toRoom)}`],
      ['= должно было остаться в телах', J(fromHeaters + external - toRoom)],
      ['фактически изменилась внутренняя энергия', J(dU)],
    ],
  });
  if (atLeast(level, 'advanced')) out.push(p('Внутренняя энергия отсчитывается от 0 °C: важны только изменения, а точка отсчёта — договорённость.'));
  if (atLeast(level, 'expert')) {
    const residual = dU - (fromHeaters + external - toRoom);
    out.push(p(`Невязка баланса: ${sig(residual, 3)} Дж (${sig(Math.abs(residual) / Math.max(1, Math.abs(dU)), 2)} относительно ΔU) — ошибка округления чисел с плавающей точкой.`));
  }
  return out;
}

function dataUsed(s: SystemState): DataUsage[] {
  const out: DataUsage[] = [];
  const seen = new Set<string>();
  for (const b of bodiesOf(s)) {
    const m = b.params.material ? MATERIALS[b.params.material as keyof typeof MATERIALS] : undefined;
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push({ label: `${m.name.ru}: удельная теплоёмкость`, origin: 'catalog', sourced: m.specificHeat });
  }
  for (const c of s.connections) {
    if (!isThermalLink(c)) continue;
    const name = `${entityLabel(s, c.a.entity)} ↔ ${entityLabel(s, c.b.entity)}`;
    const o = c.params.origin;
    if (o?.type === 'convection' && o.dataRef && o.dataRef in CONVECTION) {
      out.push({ label: `Теплоотдача ${name}: коэффициент h`, origin: 'catalog', sourced: CONVECTION[o.dataRef as keyof typeof CONVECTION] });
    } else if (o?.type === 'conduction' && o.dataRef && o.dataRef in MATERIALS) {
      out.push({ label: `Теплопроводность ${name}`, origin: 'catalog', sourced: MATERIALS[o.dataRef as keyof typeof MATERIALS].conductivity });
    } else {
      out.push({ label: `Связь ${name}: проводимость G`, origin: 'scenario', value: c.params.conductance, unit: 'W/K' });
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
