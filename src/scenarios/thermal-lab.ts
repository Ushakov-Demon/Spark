import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import { entityId } from '../core/ids.js';
import { createSimulation, type Simulation } from '../core/simulation.js';
import { createState, type SystemState } from '../core/state.js';
import { celsius, seconds, ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { coolerSurroundings, placeCooler, placeHeater, placeVessel } from '../domains/thermal/assembly.js';
import { energySplit } from '../domains/thermal/energy.js';
import { bodyMass, isBurner, isHeater, isThermalBody, reservoir, thermostat, type ThermalBody } from '../domains/thermal/entities.js';
import type { Block } from '../explain/blocks.js';
import { formatDuration, formatQuantity, sig, type ExplainContext } from '../explain/format.js';
import { COOLERS, type CoolerId } from '../equipment/coolers.js';
import { HEATERS, type HeaterId } from '../equipment/heaters.js';
import { VESSELS, type VesselId } from '../equipment/vessels.js';
import { tr, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { OPERATION_IDS, OPERATIONS, type Gender, type Operation, type OperationContext, type OperationId } from './operations/index.js';

/**
 * The thermal lab: put a substance into a vessel and heat it, cool it, boil,
 * freeze or melt it. Presets set the stop condition; the experimenter chooses
 * everything else.
 */
export type LabAction = OperationId;
export const LAB_ACTIONS: readonly LabAction[] = OPERATION_IDS;

/** Heating actions use a heater; cooling actions a cooler; melting either (or just the room). */
export const actionUses = (a: LabAction): Operation['uses'] => OPERATIONS[a].uses;

export interface LabParams {
  readonly action: LabAction;
  /** Target temperature, °C (heat-to, cool-to). */
  readonly target?: number;
  readonly substance: SubstanceId;
  /** Amount, litres of liquid. */
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly vessel: VesselId;
  readonly size: number;
  readonly material: string;
  readonly vesselMass?: number;
  readonly lid: boolean;
  /** Heating source (heat-to, boil; optional for melt). */
  readonly heater?: { readonly id: HeaterId; readonly rating: number; readonly knob: number };
  /** Cold surroundings (cool-to, freeze; none = the room air). */
  readonly cooler?: { readonly id: CoolerId; readonly setpoint: number };
  readonly roomTemp: number; // °C
  /** Relative humidity of the room air, 0…1 (default 0.5). */
  readonly humidity?: number;
}

export const SAMPLE_ID = 'sample';
export const LAB_VESSEL_ID = 'vessel';
export const LAB_HEATER_ID = 'heater';
export const LAB_ROOM_ID = 'room';
export const LAB_COOLER_ID = 'cooler';
const THERMOSTAT_ID = 'thermostat';

export interface LabSetup {
  readonly state: SystemState;
  readonly warnings: readonly LocalizedText[];
}

export function labSetup(p: LabParams): LabSetup {
  const substance = SUBSTANCES[p.substance];
  const vesselItem = VESSELS[p.vessel];
  const cooler = p.cooler ? COOLERS[p.cooler.id] : undefined;
  const room = celsius(p.roomTemp);
  const coolerPiece = cooler ? placeCooler({ item: cooler, id: LAB_COOLER_ID, setpoint: p.cooler!.setpoint }) : undefined;
  const surroundings = cooler ? coolerSurroundings(cooler, LAB_COOLER_ID) : undefined;
  const vessel = placeVessel({
    item: vesselItem,
    id: LAB_VESSEL_ID,
    liquidId: SAMPLE_ID,
    size: p.size,
    material: p.material,
    ...(p.vesselMass === undefined ? {} : { mass: p.vesselMass }),
    lid: p.lid,
    substance,
    liters: p.liters,
    startTemp: p.startTemp,
    roomId: LAB_ROOM_ID,
    roomTemp: p.roomTemp,
    ...(surroundings ? { outside: surroundings, surfaceTo: cooler!.spec.method === 'air' ? LAB_COOLER_ID : LAB_ROOM_ID } : {}),
  });
  const heater = p.heater
    ? placeHeater({
        item: HEATERS[p.heater.id],
        id: LAB_HEATER_ID,
        rating: p.heater.rating,
        knob: p.heater.knob,
        vessel: { item: vesselItem, id: LAB_VESSEL_ID, liquidId: SAMPLE_ID, material: p.material, size: p.size, liters: p.liters },
        roomId: LAB_ROOM_ID,
        roomTemp: p.roomTemp,
        liquidTemp: p.startTemp,
      })
    : undefined;
  const extra =
    OPERATIONS[p.action].thermostat && p.heater && p.target !== undefined
      ? [thermostat({ id: THERMOSTAT_ID, label: { uk: 'Терморегулятор', en: 'Thermostat' }, sensor: SAMPLE_ID, actuator: LAB_HEATER_ID, target: celsius(p.target), hysteresis: 1 })]
      : [];
  const state = createState({
    entities: [
      ...vessel.entities,
      ...(heater?.entities ?? []),
      ...(coolerPiece?.entities ?? []),
      reservoir({ id: LAB_ROOM_ID, label: { uk: 'Повітря в кімнаті', en: 'Room air' }, temperature: room, humidity: p.humidity ?? 0.5 }),
      ...extra,
    ],
    connections: [...vessel.connections, ...(heater?.connections ?? [])],
    environment: { ambientTemperature: room },
  });
  return { state, warnings: [...vessel.warnings, ...(heater?.warnings ?? [])] };
}

// ---------------------------------------------------------------- outcome

export const sampleOf = (s: SystemState): ThermalBody => {
  const e = s.entities[entityId(SAMPLE_ID)];
  if (!e || !isThermalBody(e)) throw new Error('no sample');
  return e;
};

const K = (c: number) => c + ZERO_CELSIUS_IN_KELVIN;

/** Has the experiment reached its goal? (Used as the `until` stop condition.) */
export function labGoalReached(p: LabParams, s: SystemState): boolean {
  return OPERATIONS[p.action].reached(sampleOf(s), p, SUBSTANCES[p.substance]);
}

export type LabStatus =
  | { readonly kind: 'reached'; readonly at: number }
  | { readonly kind: 'will-reach'; readonly after: number }
  | { readonly kind: 'stalls'; readonly limit: number } // never: steady state at `limit` K
  | { readonly kind: 'impossible'; readonly reason: LocalizedText }
  | { readonly kind: 'decomposes'; readonly at: number } // oil reached its smoke point instead of boiling
  | { readonly kind: 'no-heat'; readonly reason: LocalizedText }
  | { readonly kind: 'off' };

/** What surrounds the vessel: the cooler or the room. */
function operationContext(p: LabParams): OperationContext {
  const cold = p.cooler ? COOLERS[p.cooler.id] : undefined;
  return {
    p,
    sub: SUBSTANCES[p.substance],
    surroundingTemp: cold ? p.cooler!.setpoint : p.roomTemp,
    where: (l) => (cold ? tr(cold.phrase, l) : l === 'uk' ? 'у кімнаті' : 'in the room'),
  };
}

/** Reasons the goal can never be reached — known before running anything. */
export function labImpossibility(p: LabParams): LocalizedText | undefined {
  return OPERATIONS[p.action].impossible?.(operationContext(p));
}

const sourcePower = (s: SystemState): number => {
  const e = s.entities[entityId(LAB_HEATER_ID)];
  return e && (isHeater(e) || isBurner(e)) && e.params.on ? e.params.power : 0;
};

/** Continues the experiment "in the mind" to tell "later" from "never" (stops on reaching the goal or a steady state). */
export function forecastLab(p: LabParams, simulation: Simulation, from: SystemState): LabStatus {
  const sim = createSimulation({ solvers: simulation.solvers, fixedDt: seconds(2) });
  const sub = SUBSTANCES[p.substance];
  let s = from;
  const progress = (x: SystemState) => {
    const b = sampleOf(x);
    return { T: b.state.temperature, s: b.state.solidFraction ?? 0, m: bodyMass(b) };
  };
  let checkpoint = { t: s.time, ...progress(s) };
  const limit = s.time + 24 * 3600;
  while (s.time < limit) {
    s = sim.tick(s, sim.fixedDt);
    if (labGoalReached(p, s)) {
      if (OPERATIONS[p.action].endsInstead?.(sub) === 'decomposes') return { kind: 'decomposes', at: s.time };
      return { kind: 'will-reach', after: s.time - from.time };
    }
    if (s.time - checkpoint.t >= 1800) {
      const now = progress(s);
      if (Math.abs(now.T - checkpoint.T) < 0.05 && Math.abs(now.s - checkpoint.s) < 0.001 && Math.abs(now.m - checkpoint.m) < 1e-5) return { kind: 'stalls', limit: now.T };
      checkpoint = { t: s.time, ...now };
    }
  }
  return { kind: 'stalls', limit: sampleOf(s).state.temperature };
}

export function labStatus<C extends Command>(p: LabParams, result: ExperimentResult<C>, simulation: Simulation, warnings: readonly LocalizedText[]): LabStatus {
  const sub = SUBSTANCES[p.substance];
  if (labGoalReached(p, result.final)) {
    // Times are counted from the start of this run (a protocol step starts later than 0).
    const at = result.final.time - result.initial.time;
    if (OPERATIONS[p.action].endsInstead?.(sub) === 'decomposes') return { kind: 'decomposes', at };
    return { kind: 'reached', at };
  }
  const impossible = labImpossibility(p);
  if (impossible) return { kind: 'impossible', reason: impossible };
  if (warnings.length) return { kind: 'no-heat', reason: warnings[0]! };
  if (p.heater && OPERATIONS[p.action].uses === 'heater' && sourcePower(result.final) === 0) return { kind: 'off' };
  return forecastLab(p, simulation, result.final);
}

// ---------------------------------------------------------------- headline

/** For "did not boil but heated up to 232 °C". */
const HEATED_TO: Readonly<Record<Gender, string>> = { f: 'нагрілася до', m: 'нагрівся до', n: 'нагрілося до' };

/** "Distilled water (2 L) in a steel pot on a kitchen gas hob" — the subject of the headline. */
function subject(p: LabParams, locale: Locale, now?: SystemState): { text: string; gender: Gender } {
  const sub = SUBSTANCES[p.substance];
  // Salt was added during the experiment: it is a solution now.
  const salted = now !== undefined && !sub.mixture && sampleOf(now).state.mixture !== undefined;
  const vessel = VESSELS[p.vessel];
  const amount = p.liters < 1 ? `${Math.round(p.liters * 1000)} ${locale === 'uk' ? 'мл' : 'mL'}` : `${sig(p.liters, 3, locale)} ${locale === 'uk' ? 'л' : 'L'}`;
  let name = salted ? (locale === 'uk' ? 'Вода з сіллю' : 'Salt water') : tr(sub.name, locale);
  let gender: Gender = salted ? 'f' : sub.gender;
  if (OPERATIONS[p.action].subjectIsSolid) {
    if (sub.solidName) {
      name = tr(sub.solidName, locale);
      gender = 'm';
    } else name = locale === 'uk' ? `${sub.gender === 'f' ? 'Замерзла' : 'Замерзлий'} ${name.toLowerCase()}` : `Frozen ${name.toLowerCase()}`;
  }
  const where = tr(vessel.phraseIn[p.material] ?? vessel.name, locale) + (p.lid ? (locale === 'uk' ? ' з кришкою' : ' with a lid') : '');
  const by = p.heater ? ` ${tr(HEATERS[p.heater.id].phrase, locale)}` : p.cooler ? ` ${tr(COOLERS[p.cooler.id].phrase, locale)}` : locale === 'uk' ? ' у кімнаті' : ' in the room';
  return { text: `${name} (${amount}) ${where}${by}`, gender };
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Real-life dangers of this combination (shown with the headline, never blocks the experiment). */
export function labCautions(p: LabParams): LocalizedText[] {
  const sub = SUBSTANCES[p.substance];
  const out: LocalizedText[] = [];
  if (sub.flammable && p.heater && HEATERS[p.heater.id].spec.method === 'flame') {
    out.push({
      uk: `Насправді ${lowerFirst(tr(sub.name, 'uk'))} не гріють на відкритому вогні: він легко займається, а пара вибухонебезпечна. У віртуальній лабораторії — можна, у справжній — ні.`,
      en: `In real life ${tr(sub.name, 'en').toLowerCase()} is never heated over an open flame: it catches fire easily and its vapour can explode. Fine in the virtual lab — not in a real one.`,
    });
  }
  return out;
}

export function labSummary<C extends Command>(p: LabParams, result: ExperimentResult<C>, status: LabStatus, ctx: ExplainContext): Block[] {
  const blocks = labHeadline(p, result, status, ctx);
  const cautions = labCautions(p).map((c) => tr(c, ctx.locale));
  return cautions.length ? [...blocks, { kind: 'note', tone: 'warning', text: cautions.join(' ') }] : blocks;
}

function labHeadline<C extends Command>(p: LabParams, result: ExperimentResult<C>, status: LabStatus, ctx: ExplainContext): Block[] {
  const { locale } = ctx;
  const uk = locale === 'uk';
  const sub = SUBSTANCES[p.substance];
  const { text: subj, gender } = subject(p, locale, result.final);
  const T = (k: number) => formatQuantity(k, 'K', { locale, level: 'school' });
  const op = OPERATIONS[p.action];
  const target = p.target !== undefined && op.target ? ` ${T(K(p.target))}` : '';
  const past = `${uk ? op.verbs.past.uk[gender] : op.verbs.past.en}${target}`;
  const future = `${tr(op.verbs.future, locale)}${target}`;
  const notFuture = `${tr(op.verbs.negative ?? op.verbs.future, locale)}${target}`;
  const b0 = sampleOf(result.initial);
  const b1 = sampleOf(result.final);

  const energyLine = (): string | null => {
    const split = energySplit(result.initial, result.final);
    if (split.produced > 0) {
      // Into the contents = what they store now + what their boiling vapour carried away.
      const toSample = split.shares.filter((s) => s.entity === SAMPLE_ID && (s.role === 'body' || s.role === 'vapour')).reduce((sum, s) => sum + s.energy, 0);
      const pct = Math.round((100 * toSample) / split.produced);
      return uk
        ? `Нагрівач виділив ${formatQuantity(split.produced, 'J', { locale, level: 'school' })} енергії; у вміст посуду пішло ${pct} %.`
        : `The heater released ${formatQuantity(split.produced, 'J', { locale, level: 'school' })}; ${pct} % went into the contents of the vessel.`;
    }
    const lost = -(split.shares.find((s) => s.entity === SAMPLE_ID)?.energy ?? 0);
    if (lost > 0) {
      return uk
        ? `Для цього ${lowerFirst(tr(sub.name, locale))} віддала навколишньому ${formatQuantity(lost, 'J', { locale, level: 'school' })} теплоти${op.heatGivenNote ? op.heatGivenNote.uk : ''}.`
        : `To do so it gave ${formatQuantity(lost, 'J', { locale, level: 'school' })} of heat to its surroundings${op.heatGivenNote ? op.heatGivenNote.en : ''}.`;
    }
    return null;
  };

  switch (status.kind) {
    case 'reached': {
      const lines = [uk ? `${subj} ${past} за ${formatDuration(status.at, locale)}.` : `${subj} ${past} in ${formatDuration(status.at, locale)}.`];
      lines.push(...(op.reachedNotes?.(b1, locale) ?? []));
      const e = energyLine();
      if (e) lines.push(uk ? e.replace(/віддала навколишньому/, sub.gender === 'f' ? 'віддала навколишньому' : 'віддав навколишньому') : e);
      return [{ kind: 'summary', tone: 'success', lines }];
    }
    case 'will-reach':
      return [
        {
          kind: 'summary',
          tone: 'neutral',
          lines: [
            uk
              ? `Дослід зупинено через ${formatDuration(result.final.time - result.initial.time, locale)}: температура змінилася з ${T(b0.state.temperature)} до ${T(b1.state.temperature)}${b1.state.solidFraction !== undefined && b1.state.solidFraction > 0 && b1.state.solidFraction < 1 ? ` (твердого — ${Math.round(b1.state.solidFraction * 100)} %)` : ''}.`
              : `The experiment was stopped after ${formatDuration(result.final.time - result.initial.time, locale)}: the temperature changed from ${T(b0.state.temperature)} to ${T(b1.state.temperature)}.`,
            uk ? `Якщо продовжити, ${lowerFirst(subj)} ${future} приблизно ще за ${formatDuration(status.after, locale)}.` : `If continued, it would ${future} in about ${formatDuration(status.after, locale)} more.`,
          ],
        },
      ];
    case 'stalls': {
      const heating = op.direction === 'heating';
      return [
        {
          kind: 'summary',
          tone: 'failure',
          lines: [
            uk
              ? `${subj} не ${notFuture}: ${heating ? 'найвища' : 'найнижча'} температура, якої можна досягти, — приблизно ${T(status.limit)}.`
              : `${subj} will not ${notFuture}: the ${heating ? 'highest' : 'lowest'} temperature it can reach is about ${T(status.limit)}.`,
            heating
              ? uk
                ? 'Чому: що гарячіше тіло, то більше теплоти воно віддає повітрю. При цій температурі втрати зрівнюються з теплотою від нагрівача — і нагрівання зупиняється.'
                : 'Why: the hotter the body, the more heat it loses to the air. At this temperature the losses equal the heat from the heater — and the heating stops.'
              : uk
                ? 'Чому: тіло не може стати холоднішим за те, що його оточує.'
                : 'Why: a body cannot get colder than its surroundings.',
          ],
        },
      ];
    }
    case 'impossible': {
      const first = op.impossibleHeadline?.(b1, subj, locale) ?? (uk ? `${subj} не ${notFuture}.` : `${subj} will not ${notFuture}.`);
      return [{ kind: 'summary', tone: 'failure', lines: [first, tr(status.reason, locale)] }];
    }
    case 'decomposes': {
      const smoke = sub.decomposes!.value;
      return [
        {
          kind: 'summary',
          tone: 'failure',
          lines: [
            uk
              ? `${subj} не ${op.verbs.past.uk[gender]}, а за ${formatDuration(status.at, locale)} ${HEATED_TO[gender]} ${T(K(smoke))}.`
              : `${subj} did not ${tr(op.verbs.future, 'en')} but reached ${T(K(smoke))} in ${formatDuration(status.at, locale)}.`,
            uk
              ? `При цій температурі ${lowerFirst(tr(sub.name, locale))} не кипить, а починає димітися й розкладатися — далі гріти небезпечно.`
              : `At this temperature it does not boil but starts to smoke and break down — heating further is dangerous.`,
          ],
        },
      ];
    }
    case 'no-heat':
      return [{ kind: 'summary', tone: 'failure', lines: [uk ? `${subj} не нагрівається. ${tr(status.reason, locale)}` : `${subj} does not heat up. ${tr(status.reason, locale)}`] }];
    case 'off':
      return [{ kind: 'summary', tone: 'neutral', lines: [uk ? `Нагрівач вимкнено (зараз ${T(b1.state.temperature)}).` : `The heater is off (now ${T(b1.state.temperature)}).`] }];
  }
}

/** "Distilled water (1 L) in a steel pot on an electric hob" — what is on the table right now. */
export const labSubject = (p: LabParams, locale: Locale, now?: SystemState): string => subject(p, locale, now).text;
