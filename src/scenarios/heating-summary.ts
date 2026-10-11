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

const W: Readonly<Record<Locale, Words>> = {
  uk: {
    water: (l, w) => `Вода (${l}) ${w}`,
    lid: ' з кришкою',
    boiled: (s, t) => `${s} закипіла за ${t}.`,
    energy: (e, p) => `Нагрівач виділив ${e} енергії; у воду пішло ${p} %, решта — на нагрівання посуду, самого нагрівача й повітря.`,
    stopped: (t, s, f, to) => `Дослід зупинено через ${t}: ${s} нагрілася з ${f} до ${to}.`,
    willBoil: (a) => `Якщо продовжити, вона закипить приблизно ще за ${a}.`,
    never: (s, m) => `${s} не закипить: найвища температура, до якої вона може нагрітися, — приблизно ${m}.`,
    neverWhy: 'Чому: що гарячіша вода, то більше теплоти вона віддає повітрю. При цій температурі втрати зрівнюються з теплотою, яку вода отримує від нагрівача, — і нагрівання зупиняється.',
    tips: (lid) => `Що можна змінити: потужніший нагрівач, менше води${lid ? ' або кришка' : ''}.`,
    noHeat: (s, r) => `${s} не нагрівається. ${r}`,
    off: (s, n) => `Нагрівач вимкнено — ${s.charAt(0).toLowerCase()}${s.slice(1)} не нагрівається (зараз ${n}).`,
  },
  en: {
    water: (l, w) => `Water (${l}) ${w}`,
    lid: ' with a lid',
    boiled: (s, t) => `${s} boiled in ${t}.`,
    energy: (e, p) => `The heater released ${e}; ${p} % went into the water, the rest heated the vessel, the heater itself and the air.`,
    stopped: (t, s, f, to) => `The experiment was stopped after ${t}: ${s} warmed from ${f} to ${to}.`,
    willBoil: (a) => `If continued, it would boil in about ${a} more.`,
    never: (s, m) => `${s} will not boil: the highest temperature it can reach is about ${m}.`,
    neverWhy: 'Why: the hotter the water, the more heat it loses to the air. At this temperature the losses equal the heat the water receives from the heater — and the heating stops.',
    tips: (lid) => `What could change it: a more powerful heater, less water${lid ? ', or a lid' : ''}.`,
    noHeat: (s, r) => `${s} does not heat up. ${r}`,
    off: (s, n) => `The heater is off — ${s.charAt(0).toLowerCase()}${s.slice(1)} is not heating (now ${n}).`,
  },
};

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
      ? `${Math.round(params.liters * 1000)} ${locale === 'uk' ? 'мл' : 'mL'}`
      : `${sig(params.liters, 3, locale)} ${locale === 'uk' ? 'л' : 'L'}`;
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
