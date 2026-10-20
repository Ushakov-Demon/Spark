import { COMPONENTS, NACL_SOLUTE } from '../components/index.js';
import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { cellReading } from '../domains/electrical/conductivity.js';
import { isSupply } from '../domains/electrical/entities.js';
import { electrolysisGases } from '../domains/electrical/gases.js';
import { formatDuration, formatQuantity, sig } from '../explain/format.js';
import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import { paperTime, timeToGoal } from './lab-debrief.js';
import { sampleOf, type LabParams, type LabStatus } from './thermal-lab.js';
import { formatReading, weigh } from './weighing.js';

/**
 * Answers to the questions the ready-made experiments ask — built from what
 * really happened in this run (times, temperatures, how much froze, currents,
 * gases), comparing with a second run "in the mind" where the question is a
 * comparison. Physics facts used in the texts come from the component models.
 */
export interface PresetRun {
  /** Operation steps in order (additions are part of the state between them). */
  readonly steps: readonly { readonly params: LabParams; readonly result: ExperimentResult<Command>; readonly status: LabStatus }[];
  readonly simulation: Simulation;
}
export interface PresetAnswer {
  /** The Professor's short line. */
  readonly say: LocalizedText;
  /** The answer itself, a few sentences. */
  readonly text: LocalizedText;
}

type Step = PresetRun['steps'][number];
const both = (f: (l: Locale) => string): LocalizedText => ({ uk: f('uk'), en: f('en') });
const C = (k: number, l: Locale) => `${sig(k - ZERO_CELSIUS_IN_KELVIN, 3, l).replace('-', '−')} °C`;
const D = (s: number, l: Locale) => formatDuration(s, l);
/** Current in readable units: 27 мкА, 35 мА, 1,67 А. */
const A = (amps: number, l: Locale) =>
  amps < 1e-3 ? `${sig(amps * 1e6, 2, l)} ${l === 'uk' ? 'мкА' : 'µA'}` : amps < 0.1 ? `${sig(amps * 1e3, 2, l)} ${l === 'uk' ? 'мА' : 'mA'}` : formatQuantity(amps, 'A', { locale: l, level: 'school' });
const Q = (v: number, unit: string, l: Locale) => formatQuantity(v, unit, { locale: l, level: 'school' });
const reachedAt = (s: Step) => (s.status.kind === 'reached' || s.status.kind === 'decomposes' ? s.status.at : s.result.final.time - s.result.initial.time);
const temp = (st: SystemState) => sampleOf(st).state.temperature;
const LF_KJ = COMPONENTS.water.melting!.latentHeat!.value / 1000;
const CW = COMPONENTS.water.phases.liquid!.specificHeat!.value;

/** Seconds (from the step start) when ice first appeared, and the temperature then. */
function firstIce(s: Step): { at: number; T: number } | undefined {
  const x = s.result.samples.find((st) => (sampleOf(st).state.solidFraction ?? 0) > 0);
  return x ? { at: x.time - s.result.initial.time, T: temp(x) } : undefined;
}
/** How long the solid fraction was between 0 and 1 (a melting or freezing plateau), s. */
function plateau(s: Step): number {
  const samples = s.result.samples;
  let t = 0;
  for (let i = 1; i < samples.length; i++) {
    const f = sampleOf(samples[i]!).state.solidFraction ?? 0;
    if (f > 0 && f < 1) t += samples[i]!.time - samples[i - 1]!.time;
  }
  return t;
}
/** Mean current over a step, A, and the charge it carried, C. */
function current(s: Step): { amps: number; charge: number; time: number } {
  const a = Object.values(s.result.initial.entities).find(isSupply);
  const b = Object.values(s.result.final.entities).find(isSupply);
  if (!a || !b) return { amps: 0, charge: 0, time: 0 };
  const charge = b.state.charge - a.state.charge;
  const time = s.result.final.time - s.result.initial.time;
  return { amps: time > 0 ? charge / time : 0, charge, time };
}
const ratio = (a: number, b: number, l: Locale) => sig(a / Math.max(b, 1e-12), 2, l);

export const PRESET_ANSWERS: Readonly<Record<string, (run: PresetRun) => PresetAnswer>> = {
  'weigh-the-water': ({ steps }) => {
    // What the kitchen scales show at the start, after freezing and after boiling.
    const [freeze, boil] = [steps[0]!, steps[1] ?? steps[0]!];
    const at = (st: SystemState) => weigh(st, 'kitchen-scale');
    const [a, b, c] = [at(freeze.result.initial), at(freeze.result.final), at(boil.result.final)];
    const g = (kg: number | null, l: Locale) => formatReading('kitchen-scale', kg, l);
    const dFreeze = (a.reading ?? 0) - (b.reading ?? 0);
    const dBoil = (b.reading ?? 0) - (c.reading ?? 0);
    return {
      say: both((l) => (l === 'uk' ? 'Маса нікуди не зникає — вона йде парою!' : 'Mass does not vanish — it leaves as vapour!')),
      text: both((l) =>
        l === 'uk'
          ? `На початку ваги показали ${g(a.reading, l)}, після замерзання — ${g(b.reading, l)}: вода стала льодом, але не стала ні важчою, ні легшою${dFreeze > 0 ? ` (${g(dFreeze, l)} встигли випаруватися, поки вода холонула)` : ''}. Лід лише займає більше місця, бо він менш густий. Після кипіння — ${g(c.reading, l)}: на ${g(dBoil, l)} менше. Ця вода не зникла — вона пішла в повітря парою.`
          : `At the start the scales showed ${g(a.reading, l)}, after freezing ${g(b.reading, l)}: the water turned to ice but became neither heavier nor lighter${dFreeze > 0 ? ` (${g(dFreeze, l)} evaporated while it was cooling)` : ''}. Ice only takes more room, because it is less dense. After boiling: ${g(c.reading, l)}, ${g(dBoil, l)} less. That water did not vanish — it went into the air as vapour.`,
      ),
    };
  },
  'boil-a-litre': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const paper = paperTime(s.params);
    return {
      say: both((l) => (l === 'uk' ? `Закипіло за ${D(t, l)}!` : `Boiled in ${D(t, l)}!`)),
      text: both((l) =>
        l === 'uk'
          ? `Літр води закипів за ${D(t, l)}.${paper ? ` Розрахунок «на папері», коли вся енергія плити йде лише у воду, дає ${D(paper, l)} — насправді вийшло на ${Math.round((t / paper - 1) * 100)} % довше.` : ''} Різниця — це теплота, що пішла на саму каструлю, у повітря кімнати й на пару: справжній дослід завжди довший за ідеальний розрахунок.`
          : `A litre of water boiled in ${D(t, l)}.${paper ? ` The “paper” calculation, where all the hob's energy goes into the water, gives ${D(paper, l)} — the real run took ${Math.round((t / paper - 1) * 100)} % longer.` : ''} The difference is the heat that went into the pot itself, into the room air and into steam: a real experiment always takes longer than the ideal calculation.`,
      ),
    };
  },
  'lid-or-not': ({ steps, simulation }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const other = timeToGoal({ ...s.params, lid: !s.params.lid }, simulation);
    const [withLid, without] = s.params.lid ? [t, other] : [other, t];
    return {
      say: both((l) => (l === 'uk' ? 'Кришка береже теплоту!' : 'A lid keeps the heat in!')),
      text: both((l) =>
        l === 'uk'
          ? `З кришкою вода закипіла${s.params.lid ? '' : ' б'} за ${D(withLid, l)}, без кришки — за ${D(without, l)}: на ${D(Math.max(0, without - withLid), l)} довше. Кришка не випускає пару: теплота, яку без кришки забирало б випаровування з поверхні, лишається в каструлі.`
          : `With a lid the water boil${s.params.lid ? 'ed' : 's'} in ${D(withLid, l)}, without one in ${D(without, l)}: ${D(Math.max(0, without - withLid), l)} longer. A lid keeps the steam in: the heat that evaporation from the surface would take away stays in the pot.`,
      ),
    };
  },
  'melt-ice': ({ steps }) => {
    const s = steps[0]!;
    const p = plateau(s);
    return {
      say: both((l) => (l === 'uk' ? 'Помітив, що температура стояла на нулі?' : 'Did you notice the temperature stuck at zero?')),
      text: both((l) =>
        l === 'uk'
          ? `Поки лід танув, термометр приблизно ${D(p, l)} показував 0 °C — температура не мінялася! Уся теплота з кімнати йшла не на нагрівання, а на руйнування кристаликів льоду: на кожен кілограм — ${sig(LF_KJ, 3, l)} кДж (питома теплота плавлення). Лише коли розтанув останній шматочок, вода почала теплішати.`
          : `While the ice was melting, the thermometer showed 0 °C for about ${D(p, l)} — the temperature did not change! All the heat from the room went not into warming but into breaking the ice crystals: ${sig(LF_KJ, 3, l)} kJ for every kilogram (the latent heat of fusion). Only when the last piece melted did the water start to warm up.`,
      ),
    };
  },
  'freeze-water': ({ steps }) => {
    const s = steps[0]!;
    const total = reachedAt(s);
    const ice = firstIce(s);
    const cool = ice?.at ?? total;
    const freeze = Math.max(0, total - cool);
    const degrees = Math.round((LF_KJ * 1000) / CW);
    return {
      say: both((l) => (l === 'uk' ? (freeze > cool ? 'Замерзати — довше, ніж холонути!' : 'Ось і лід!') : freeze > cool ? 'Freezing takes longer than cooling!' : 'There is the ice!')),
      text: both((l) =>
        l === 'uk'
          ? `Охолодити воду до 0 °C вдалося за ${D(cool, l)}, а перетворити її на лід — ще за ${D(freeze, l)}. Щоб вода замерзла, з неї треба забрати ${sig(LF_KJ, 3, l)} кДж на кожен кілограм — стільки ж, скільки потрібно, щоб нагріти той самий кілограм води на ≈ ${degrees} °C.`
          : `Cooling the water to 0 °C took ${D(cool, l)}, and turning it into ice another ${D(freeze, l)}. To freeze, water has to give away ${sig(LF_KJ, 3, l)} kJ per kilogram — as much as it takes to warm the same kilogram of water by ≈ ${degrees} °C.`,
      ),
    };
  },
  'road-salt': ({ steps }) => {
    const ice = steps.map(firstIce).find((x) => x !== undefined);
    const last = steps[steps.length - 1]!;
    const solid = sampleOf(last.result.final).state.solidFraction ?? 0;
    const firstSolid = sampleOf(steps[0]!.result.final).state.solidFraction ?? 0;
    const te = NACL_SOLUTE.eutectic.t;
    const sp = steps[0]!.params.cooler?.setpoint ?? 0;
    return {
      say: both((l) => (l === 'uk' ? 'Ось чому солять дороги!' : 'That is why roads are salted!')),
      text: both((l) => {
        const uk = l === 'uk';
        const start = ice ? C(ice.T, l) : uk ? 'нижче нуля' : 'below zero';
        const tE = `${sig(te, 3, l).replace('-', '−')} °C`;
        const head = uk
          ? `Морська вода почала замерзати лише при ${start}, а не при 0 °C, як прісна. При ${sig(sp, 3, l).replace('-', '−')} °C замерзло тільки ${Math.round(firstSolid * 100)} % води: лід утворюється з прісної води, а розсіл, що лишається, стає солонішим і замерзає дедалі холодніше — повністю аж нижче ${tE}.`
          : `Sea water started to freeze only at ${start}, not at 0 °C like fresh water. At ${sig(sp, 3, l)} °C only ${Math.round(firstSolid * 100)} % of the water froze: ice forms from fresh water, and the brine left behind gets saltier and freezes ever colder — completely only below ${tE}.`;
        const tail = uk
          ? ' Тому сіль на дорозі перетворює лід на солону воду, яка не замерзає на помірному морозі.'
          : ' That is why salt on a road turns ice into salty water that does not freeze in a moderate frost.';
        const more =
          steps.length > 1 && solid >= 1
            ? uk
              ? ` А в холоднішій морозилці вона нарешті замерзла повністю.`
              : ` In a colder freezer it finally froze completely.`
            : '';
        return head + tail + more;
      }),
    };
  },
  'alcohol-vs-water': ({ steps, simulation }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const tw = timeToGoal({ ...s.params, substance: 'water' }, simulation);
    const less = Math.round((1 - COMPONENTS.ethanol.phases.liquid!.specificHeat!.value / CW) * 100);
    const tb = COMPONENTS.ethanol.boiling!.point.value;
    return {
      say: both((l) => (l === 'uk' ? 'Спирт — швидший!' : 'Alcohol wins!')),
      text: both((l) =>
        l === 'uk'
          ? `Спирт закипів за ${D(t, l)} при ${sig(tb, 3, l)} °C. Стільки ж води в тому самому стакані закипало б ${D(tw, l)} — у ${ratio(tw, t, l)} раза довше. Причин дві: спирт кипить нижче (${sig(tb, 3, l)} °C проти 100 °C), а нагріти його на 1 °C потрібно на ${less} % менше енергії, ніж воду.`
          : `Alcohol boiled in ${D(t, l)} at ${sig(tb, 3, l)} °C. The same amount of water in the same beaker would take ${D(tw, l)} — ${ratio(tw, t, l)} times longer. Two reasons: alcohol boils lower (${sig(tb, 3, l)} °C against 100 °C), and warming it by 1 °C takes ${less} % less energy than water.`,
      ),
    };
  },
  'sea-salt': ({ steps }) => {
    const mix = sampleOf(steps[steps.length - 1]!.result.final).state.mixture;
    const salt = mix?.salt ?? 0;
    const crystals = mix?.crystals ?? 0;
    return {
      say: both((l) => (l === 'uk' ? 'Уся сіль повернулася!' : 'All the salt came back!')),
      text: both((l) =>
        l === 'uk'
          ? `Ми розчинили у воді ${Q(salt, 'kg', l)} солі, а коли вода випарувалась, на дні лишилося ${Q(crystals, 'kg', l)} кристалів — уся сіль. Під час розчинення вона не зникла: розпалася на частинки, надто малі, щоб їх побачити, і просто чекала у воді. Так можна добути сіль і з морської води.`
          : `We dissolved ${Q(salt, 'kg', l)} of salt in water, and when the water boiled away, ${Q(crystals, 'kg', l)} of crystals were left on the bottom — all of it. Dissolving did not destroy it: it broke into particles too small to see and simply waited in the water. Salt can be won from sea water the same way.`,
      ),
    };
  },
  'does-water-conduct': ({ steps }) => {
    const before = current(steps[0]!).amps;
    const after = current(steps[steps.length - 1]!).amps;
    return {
      say: both((l) => (l === 'uk' ? 'Струм несуть йони солі!' : 'The salt ions carry the current!')),
      text: both((l) =>
        l === 'uk'
          ? `У дистильованій воді струм був лише ${A(before, l)} — вона майже не проводить електрику. Коли досипали солі, струм став ${A(after, l)}${before > 1e-6 ? ` — у ${ratio(after, before, l)} разів більше` : ''}! Сіль у воді розпадається на заряджені частинки — йони Na⁺ і Cl⁻, і саме вони переносять заряд. Вода з крана теж містить розчинені солі й проводить струм — тому з електроприладами біля води треба бути обережним.`
          : `In distilled water the current was only ${A(before, l)} — it barely conducts electricity. After adding salt the current became ${A(after, l)}${before > 1e-6 ? ` — ${ratio(after, before, l)} times more` : ''}! In water salt splits into charged particles — Na⁺ and Cl⁻ ions, and they carry the charge. Tap water also contains dissolved salts and conducts — so be careful with electrical devices near water.`,
      ),
    };
  },
  'joule-heating': ({ steps }) => {
    const s = steps[0]!;
    const { amps, time } = current(s);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const heat = (e: SystemState) => (e.entities['supply.heat' as never] as unknown as { state: { energyDelivered: number } } | undefined)?.state.energyDelivered ?? 0;
    const q = heat(s.result.final) - heat(s.result.initial);
    return {
      say: both((l) => (l === 'uk' ? `Нагріли струмом на ${sig(dT, 2, l)} °C!` : `Heated by ${sig(dT, 2, l)} °C with a current!`)),
      text: both((l) =>
        l === 'uk'
          ? `За ${D(time, l)} струм ${A(amps, l)} нагрів морську воду на ${sig(dT, 2, l)} °C: у рідині виділилося ${Q(q, 'J', l)} теплоти. Це закон Джоуля–Ленца: Q = I²·R·t — удвічі більший струм гріє вчетверо сильніше. Так працюють кип’ятильники й чайники, тільки струм там іде через металеву спіраль, а не через воду.`
          : `In ${D(time, l)} a current of ${A(amps, l)} warmed the sea water by ${sig(dT, 2, l)} °C: ${Q(q, 'J', l)} of heat was released in the liquid. This is the Joule–Lenz law: Q = I²·R·t — twice the current heats four times as much. Immersion heaters and kettles work like this, only the current flows through a metal coil, not through the water.`,
      ),
    };
  },
  electrolysis: ({ steps }) => {
    const s = steps[0]!;
    const { charge, time } = current(s);
    const e = cellReading(sampleOf(s.result.final)).electrolysis;
    const gases = e ? electrolysisGases(e, charge, temp(s.result.initial)) : [];
    const h2 = gases[0]?.volume ?? 0;
    return {
      say: both((l) => (l === 'uk' ? `≈ ${sig(h2 * 1e6, 2, l)} мл водню!` : `≈ ${sig(h2 * 1e6, 2, l)} mL of hydrogen!`)),
      text: both((l) =>
        l === 'uk'
          ? `За ${D(time, l)} через розчин пройшов заряд ${Q(charge, 'C', l)}, і на електродах виділилося ≈ ${Q(h2 * 1e6, 'mL', l)} водню та стільки ж хлору. За законом Фарадея газу виділяється рівно стільки, скільки заряду пройшло: удвічі довше або удвічі більший струм — удвічі більше газу.`
          : `In ${D(time, l)} a charge of ${Q(charge, 'C', l)} passed through the solution, and ≈ ${Q(h2 * 1e6, 'mL', l)} of hydrogen and as much chlorine formed at the electrodes. By Faraday's law the gas is exactly proportional to the charge: twice as long or twice the current — twice the gas.`,
      ),
    };
  },
  'oil-does-not-boil': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    return {
      say: both((l) => (l === 'uk' ? 'Олія не кипить — вона димить!' : 'Oil does not boil — it smokes!')),
      text: both((l) =>
        l === 'uk'
          ? `Олія так і не закипіла: при ${C(temp(s.result.final), l)} вона почала димітися й розкладатися. Вода кипить при 100 °C і вище не нагрівається, а олія розкладається раніше, ніж закипить, — зате нагрівається значно сильніше. Тому на олії смажать: вона гріє їжу набагато гарячіше за окріп.`
          : `The oil never boiled: at ${C(temp(s.result.final), l)} it started to smoke and break down. Water boils at 100 °C and gets no hotter, while oil breaks down before it boils — but gets much hotter. That is why we fry in oil: it heats food far hotter than boiling water.`,
      ),
    };
  },
  'alcohol-in-freezer': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const tf = COMPONENTS.ethanol.melting!.point.value;
    return {
      say: both((l) => (l === 'uk' ? 'Спирт морозу не боїться!' : 'Alcohol does not mind the frost!')),
      text: both((l) =>
        l === 'uk'
          ? `Спирт охолонув до ${C(temp(s.result.final), l)}, але лишився рідким: він замерзає лише при ${sig(tf, 3, l).replace('-', '−')} °C — жодна домашня морозилка так не вміє. Вода тут давно стала б льодом.`
          : `The alcohol cooled to ${C(temp(s.result.final), l)} but stayed liquid: it freezes only at ${sig(tf, 3, l)} °C — no home freezer gets that cold. Water would have turned to ice long ago.`,
      ),
    };
  },
  'grand-chain': ({ steps }) => {
    const currents = steps.filter((s) => s.params.supply);
    const a = currents[0];
    const b = currents[currents.length - 1];
    if (!a || !b || a === b) return { say: both(() => ''), text: both(() => '') };
    const i1 = current(a).amps, i2 = current(b).amps;
    return {
      say: both((l) => (l === 'uk' ? 'Гарячий розчин проводить краще!' : 'A hot solution conducts better!')),
      text: both((l) =>
        l === 'uk'
          ? `У розчині при ≈ ${C(temp(a.result.initial), l)} струм був ${A(i1, l)}, а в гарячому, при ≈ ${C(temp(b.result.initial), l)}, — ${A(i2, l)}: на ${Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)} % більше при тій самій напрузі. Що гарячіша рідина, то легше в ній рухаються йони — і тим краще вона проводить струм.`
          : `In the solution at ≈ ${C(temp(a.result.initial), l)} the current was ${A(i1, l)}, in the hot one at ≈ ${C(temp(b.result.initial), l)} — ${A(i2, l)}: ${Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)} % more at the same voltage. The hotter the liquid, the easier its ions move — and the better it conducts.`,
      ),
    };
  },
};
