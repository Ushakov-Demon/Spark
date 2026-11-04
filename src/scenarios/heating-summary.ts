import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import { entityId } from '../core/ids.js';
import { createSimulation, type Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { celsius, seconds } from '../core/units.js';
import { isBurner, isHeater, isThermalBody } from '../domains/thermal/entities.js';
import { energySplit } from '../domains/thermal/energy.js';
import type { Block } from '../explain/blocks.js';
import { formatDuration, formatQuantity, sig, type ExplainContext } from '../explain/format.js';
import { HEATERS } from '../equipment/heaters.js';
import { VESSELS } from '../equipment/vessels.js';
import { tr, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { byLocale, t as tl } from '../knowledge/messages.js';
import { SOURCE_ID, WATER_ID, type HeatingParams } from './boil.js';

const BOIL = celsius(100);

export type HeatingStatus =
  | { readonly kind: 'boiled'; readonly at: number }
  | { readonly kind: 'will-boil'; readonly after: number } // more seconds needed
  | { readonly kind: 'never-boils'; readonly maxTemp: number }
  | { readonly kind: 'no-heat'; readonly reason: LocalizedText }
  | { readonly kind: 'off' };

const waterTemp = (s: SystemState): number => {
  const w = s.entities[entityId(WATER_ID)];
  if (!w || !isThermalBody(w)) throw new Error('no water');
  return w.state.temperature;
};
const sourcePower = (s: SystemState): number => {
  const e = s.entities[entityId(SOURCE_ID)];
  return e && (isHeater(e) || isBurner(e)) && e.params.on ? e.params.power : 0;
};

/**
 * Continues the experiment "in the mind" (the physics is deterministic) to tell
 * "will boil later" from "never boils". Stops at boiling, or when the water has
 * not warmed by 0.05 °C over 30 simulated minutes (steady state), or after 12 h.
 */
export function forecastBoil(simulation: Simulation, from: SystemState): HeatingStatus {
  const sim = createSimulation({ solvers: simulation.solvers, fixedDt: seconds(2) });
  let s = from;
  let checkpoint = { t: s.time, temp: waterTemp(s) };
  const limit = s.time + 12 * 3600;
  while (s.time < limit) {
    s = sim.tick(s, sim.fixedDt);
    const t = waterTemp(s);
    if (t >= BOIL) return { kind: 'will-boil', after: s.time - from.time };
    if (s.time - checkpoint.t >= 1800) {
      if (t - checkpoint.temp < 0.05) return { kind: 'never-boils', maxTemp: t };
      checkpoint = { t: s.time, temp: t };
    }
  }
  return { kind: 'never-boils', maxTemp: waterTemp(s) };
}

export function heatingStatus<C extends Command>(
  result: ExperimentResult<C>,
  simulation: Simulation,
  warnings: readonly LocalizedText[],
): HeatingStatus {
  if (waterTemp(result.final) >= BOIL) return { kind: 'boiled', at: result.final.time };
  if (warnings.length) return { kind: 'no-heat', reason: warnings[0]! };
  if (sourcePower(result.final) === 0) return { kind: 'off' };
  return forecastBoil(simulation, result.final);
}

interface Words {
  water(liters: string, where: string): string;
  lid: string;
  boiled(subject: string, time: string): string;
  energy(produced: string, pct: number): string;
  stopped(time: string, subject: string, from: string, to: string): string;
  willBoil(after: string): string;
  never(subject: string, max: string): string;
  neverWhy: string;
  tips(lid: boolean): string;
  noHeat(subject: string, reason: string): string;
  off(subject: string, now: string): string;
}

const W: Readonly<Record<Locale, Words>> = byLocale((lang: Locale) => ({
    water: (l, w) => tl(lang, 'heating-summary-w-water', { l, w }),
    lid: tl(lang, 'heating-summary-w-lid'),
    boiled: (s, t) => tl(lang, 'heating-summary-w-boiled', { s, t }),
    energy: (e, p) => tl(lang, 'heating-summary-w-energy', { e, p: String(p) }),
    stopped: (t, s, f, to) => tl(lang, 'heating-summary-w-stopped', { t, s, f, to }),
    willBoil: (a) => tl(lang, 'heating-summary-w-will-boil', { a }),
    never: (s, m) => tl(lang, 'heating-summary-w-never', { s, m }),
    neverWhy: tl(lang, 'heating-summary-w-never-why'),
    tips: (lid) => tl(lang, 'heating-summary-w-tips-2', { value: lid ? tl(lang, 'heating-summary-w-tips') : '' }),
    noHeat: (s, r) => tl(lang, 'heating-summary-w-no-heat', { s, r }),
    off: (s, n) => tl(lang, 'heating-summary-w-off', { s: s.charAt(0).toLowerCase(), s2: s.slice(1), n }),
  }));

/** The headline of a heating experiment, shown before any details. */
export function heatingSummary<C extends Command>(
  params: HeatingParams,
  result: ExperimentResult<C>,
  status: HeatingStatus,
  ctx: ExplainContext,
): Block[] {
  const { locale } = ctx;
  const w = W[locale];
  const heater = HEATERS[params.heater];
  const vessel = VESSELS[params.vessel];
  const where = `${tr(vessel.phraseIn[params.material] ?? vessel.name, locale)}${params.lid ? w.lid : ''} ${tr(heater.phrase, locale)}`;
  const liters =
    params.liters < 1
      ? `${Math.round(params.liters * 1000)} ${tl(locale, 'unit-sym-mL')}`
      : `${sig(params.liters, 3, locale)} ${tl(locale, 'unit-sym-L')}`;
  const subject = w.water(liters, where);
  const T = (k: number) => formatQuantity(k, 'K', { locale, level: 'school' });
  const t0 = waterTemp(result.initial);
  const t1 = waterTemp(result.final);
  const lidPossible = vessel.spec.lid === 'optional' && !params.lid;

  switch (status.kind) {
    case 'boiled': {
      const split = energySplit(result.initial, result.final);
      const toWater = split.shares.find((s) => s.entity === WATER_ID)?.energy ?? 0;
      const lines = [w.boiled(subject, formatDuration(status.at, locale))];
      if (split.produced > 0) lines.push(w.energy(formatQuantity(split.produced, 'J', { locale, level: 'school' }), Math.round((100 * toWater) / split.produced)));
      return [{ kind: 'summary', tone: 'success', lines }];
    }
    case 'will-boil':
      return [
        {
          kind: 'summary',
          tone: 'neutral',
          lines: [w.stopped(formatDuration(result.final.time, locale), lowerFirst(subject), T(t0), T(t1)), w.willBoil(formatDuration(status.after, locale))],
        },
      ];
    case 'never-boils':
      return [{ kind: 'summary', tone: 'failure', lines: [w.never(subject, T(status.maxTemp)), w.neverWhy, w.tips(lidPossible)] }];
    case 'no-heat':
      return [{ kind: 'summary', tone: 'failure', lines: [w.noHeat(subject, tr(status.reason, locale))] }];
    case 'off':
      return [{ kind: 'summary', tone: 'neutral', lines: [w.off(subject, T(t1))] }];
  }
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
