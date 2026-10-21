import type { Simulation } from '../core/simulation.js';
import { canHeat } from '../equipment/compatibility.js';
import { COOLERS, type CoolerId } from '../equipment/coolers.js';
import { HEATERS, type HeaterId } from '../equipment/heaters.js';
import { VESSELS } from '../equipment/vessels.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { isDrySample } from './choices.js';
import { sig } from '../explain/format.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import { OPERATIONS } from './operations/index.js';
import { forecastLab, labImpossibility, labSetup, operationContext, type LabParams } from './thermal-lab.js';

/** A concrete change that makes the goal reachable: what to tell the experimenter and the new settings. */
export interface LabFix {
  readonly label: LocalizedText;
  readonly params: LabParams;
}

const T = (c: number): LocalizedText => ({ uk: `${sig(c, 3, 'uk')} °C`, en: `${sig(c, 3, 'en')} °C` });
const withoutHeater = (p: LabParams): LabParams => {
  const { heater: _h, ...rest } = p;
  void _h;
  return rest;
};
const withoutCooler = (p: LabParams): LabParams => {
  const { cooler: _c, ...rest } = p;
  void _c;
  return rest;
};

/**
 * The goal is impossible as set up: turn what the operation needs into changes
 * from the catalog (a colder cooler or setpoint, another target, a heater) and keep
 * only those that really make it possible.
 */
export function labFixes(p: LabParams): LabFix[] {
  const needs = OPERATIONS[p.action].needs?.(operationContext(p));
  if (!needs) return [];
  const out: LabFix[] = [];
  if (needs.colderThan !== undefined) {
    const limit = needs.colderThan;
    for (const id of Object.keys(COOLERS) as CoolerId[]) {
      const { min, max, default: def } = COOLERS[id].spec.setpoint;
      // The default if it is cold enough, else the warmest whole degree below the limit.
      const sp = def < limit ? def : Math.max(min, Math.min(max, Math.ceil(limit) - 1));
      if (!(sp < limit) || (p.cooler?.id === id && p.cooler.setpoint === sp)) continue;
      const q: LabParams = { ...withoutHeater(p), cooler: { id, setpoint: sp } };
      const name = COOLERS[id].name;
      if (!labImpossibility(q)) out.push({ label: { uk: `${name.uk}, ${T(sp).uk}`, en: `${name.en}, ${T(sp).en}` }, params: q });
    }
  }
  if (needs.target) {
    const t = needs.target.min ?? needs.target.max;
    if (t !== undefined) {
      const q: LabParams = { ...p, target: t };
      if (!labImpossibility(q)) out.push({ label: { uk: `Цільова температура ${T(t).uk}`, en: `Target ${T(t).en}` }, params: q });
    }
  }
  if (needs.heatAbove !== undefined) {
    const vessel = VESSELS[p.vessel];
    for (const id of Object.keys(HEATERS) as HeaterId[]) {
      const h = HEATERS[id];
      if (!canHeat(h, vessel, p.material, p.size).ok) continue;
      const q: LabParams = { ...withoutCooler(p), heater: { id, rating: h.spec.defaultRating, knob: 1 } };
      if (!labImpossibility(q)) out.push({ label: { uk: `Нагріти: ${h.name.uk.toLowerCase()}`, en: `Heat with: ${h.name.en.toLowerCase()}` }, params: q });
      if (out.length >= 3) break;
    }
  }
  return out;
}

/**
 * Heating stalls (losses catch up with the heater): try the obvious remedies and
 * keep those that reach the goal when re-run in the mind.
 */
export function stallFixes(p: LabParams, simulation: Simulation): LabFix[] {
  const h = p.heater ? HEATERS[p.heater.id] : undefined;
  const candidates: LabFix[] = [];
  if (h && p.heater) {
    if (h.spec.control === 'knob' && p.heater.knob < 1) candidates.push({ label: { uk: 'Ручку на максимум', en: 'Knob to maximum' }, params: { ...p, heater: { ...p.heater, knob: 1 } } });
    if (VESSELS[p.vessel].spec.lid === 'optional' && !p.lid) candidates.push({ label: { uk: 'Накрити кришкою', en: 'Put a lid on' }, params: { ...p, lid: true } });
    const strongest = Math.max(...h.spec.ratings);
    if (strongest > p.heater.rating) {
      candidates.push({ label: { uk: `Потужніша модель, ${sig(strongest, 4, 'uk')} Вт, на максимум`, en: `A stronger model, ${sig(strongest, 4, 'en')} W, at full` }, params: { ...p, heater: { ...p.heater, rating: strongest, knob: 1 } } });
    }
  }
  if (p.liters > 0.2) candidates.push({ label: { uk: 'Удвічі менше речовини', en: 'Half the amount' }, params: { ...p, liters: Math.round(p.liters * 50) / 100 } });
  // Strong heating of a dry solid: a porcelain crucible in the flame of a lab burner.
  if (isDrySample(SUBSTANCES[p.substance]) && p.vessel !== 'crucible') {
    const crucible = VESSELS.crucible;
    const size = crucible.spec.sizes.find((z) => z >= p.liters) ?? crucible.spec.sizes[crucible.spec.sizes.length - 1]!;
    candidates.push({
      label: { uk: 'Порцеляновий тигель над газовим пальником', en: 'A porcelain crucible over a Bunsen burner' },
      params: { ...p, vessel: 'crucible', material: 'porcelain', size, lid: false, liters: Math.min(p.liters, size), heater: { id: 'bunsen-burner', rating: HEATERS['bunsen-burner'].spec.defaultRating, knob: 1 } },
    });
  }
  const works = (c: LabFix) => {
    const s = labSetup(c.params);
    return !s.warnings.length && forecastLab(c.params, simulation, s.state).kind === 'will-reach';
  };
  const found = candidates.filter(works);
  if (found.length) return found;
  // Nothing simple helps: a different heater, at full power (the first two that work).
  const vessel = VESSELS[p.vessel];
  for (const id of Object.keys(HEATERS) as HeaterId[]) {
    if (!h || id === p.heater?.id || found.length >= 2) continue;
    const other = HEATERS[id];
    if (!canHeat(other, vessel, p.material, p.size).ok) continue;
    const fix: LabFix = {
      label: { uk: `Інший нагрівач: ${other.name.uk.toLowerCase()}`, en: `Another heater: ${other.name.en.toLowerCase()}` },
      params: { ...p, heater: { id, rating: Math.max(...other.spec.ratings), knob: 1 } },
    };
    if (works(fix)) found.push(fix);
  }
  // Melting what no flame can melt (salt at 801 °C): a furnace a hundred degrees hotter — in a crucible, if this vessel would not stand it.
  const tm = SUBSTANCES[p.substance].melt?.point.value;
  if (OPERATIONS[p.action].uses === 'either' && tm !== undefined) {
    for (const id of Object.keys(COOLERS) as CoolerId[]) {
      const f = COOLERS[id];
      if (!f.spec.hot || found.length >= 3) continue;
      const setpoint = Math.min(f.spec.setpoint.max, Math.ceil((tm + 100) / 50) * 50);
      const inFurnace: LabParams = { ...withoutHeater(p), cooler: { id, setpoint } };
      const crucible = VESSELS.crucible;
      const size = crucible.spec.sizes.find((z) => z >= p.liters) ?? crucible.spec.sizes[crucible.spec.sizes.length - 1]!;
      for (const fix of [
        { label: { uk: `${f.name.uk}, ${T(setpoint).uk}`, en: `${f.name.en}, ${T(setpoint).en}` }, params: inFurnace },
        { label: { uk: `Порцеляновий тигель у печі, ${T(setpoint).uk}`, en: `A porcelain crucible in the furnace, ${T(setpoint).en}` }, params: { ...inFurnace, vessel: 'crucible' as const, material: 'porcelain', size, lid: false, liters: Math.min(p.liters, size) } },
      ]) {
        if (works(fix)) {
          found.push(fix);
          break;
        }
      }
    }
  }
  return found;
}
