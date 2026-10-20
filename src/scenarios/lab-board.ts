import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { isSupply } from '../domains/electrical/entities.js';
import { bodyMass, type ThermalBody } from '../domains/thermal/entities.js';
import { sig } from '../explain/format.js';
import type { Locale } from '../knowledge/i18n.js';
import { COMPONENTS } from '../components/index.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { formatReading, weigh } from './weighing.js';
import type { ScaleId } from '../equipment/scales.js';
import { sampleOf, type LabParams } from './thermal-lab.js';

/**
 * The blackboard over the lab table: the formulas of what is going on in the
 * current step, with this run's numbers put in. Each phase of the step —
 * warming the ice, melting it, warming the water, boiling — gets its own line,
 * in the order they happened, and its numbers grow as the step goes on. The
 * physical constants come from the substance models (sourced data).
 */
export interface BoardLine {
  /** Stable while the phase lasts (the page animates a new line once). */
  readonly id: string;
  /** What it is about: "нагрівання води". */
  readonly title: string;
  readonly formula: string;
  /** The formula with the numbers put in, and the result. */
  readonly numbers: string;
}

type Phase = 'solid' | 'liquid' | 'mix';
const C = (k: number) => k - ZERO_CELSIUS_IN_KELVIN;
const iceMass = (b: ThermalBody) => (b.state.mixture ? b.state.mixture.ice : (b.state.solidFraction ?? 0) * bodyMass(b));
const phaseOf = (b: ThermalBody): Phase => {
  const m = b.state.mixture;
  const s = m ? (m.water > 0 ? m.ice / m.water : 0) : (b.state.solidFraction ?? 0);
  return s >= 1 - 1e-9 ? 'solid' : s <= 1e-9 ? 'liquid' : 'mix';
};
const boiled = (b: ThermalBody) => b.state.boiledOff ?? 0;

/** The board for a step: `states` are the step's states in time order (the recorded samples and now); `weighed` — the scales used in it, latest last. */
export function boardLines(p: LabParams, states: readonly SystemState[], locale: Locale, weighed: readonly ScaleId[] = []): BoardLine[] {
  const uk = locale === 'uk';
  const sub = SUBSTANCES[p.substance];
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const kJ = (j: number) => (Math.abs(j) >= 1e4 ? `${n(j / 1000)} ${uk ? 'кДж' : 'kJ'}` : `${n(j)} ${uk ? 'Дж' : 'J'}`);
  const out: BoardLine[] = [];
  if (!states.length) return out;
  const name = (uk ? (sub.genitive?.uk ?? sub.name.uk) : sub.name.en).toLowerCase();
  const iceName = uk ? 'льоду' : 'ice';

  // Split the step into phases: runs of states where the sample is all solid, all liquid or both.
  const bodies = states.map(sampleOf);
  let start = 0;
  let k = 0;
  for (let i = 1; i <= bodies.length; i++) {
    const same = i < bodies.length && phaseOf(bodies[i]!) === phaseOf(bodies[start]!);
    if (same) continue;
    const a = bodies[Math.max(0, start - 1)]!; // the phase began right after the state before it
    const b = bodies[i - 1]!;
    const ph = phaseOf(bodies[start]!);
    const id = `${k++}:${ph}`;
    if (ph === 'mix') {
      const dm = iceMass(b) - iceMass(a);
      // Ice is frozen water, also when it forms in salt water.
      const lambda = b.state.mixture ? COMPONENTS.water.melting?.latentHeat?.value : sub.freezing?.latentHeat.value;
      if (lambda && Math.abs(dm) > 1e-6) {
        const m = Math.abs(dm);
        out.push({
          id,
          title: dm > 0 ? (uk ? `кристалізація: замерзло ${n(m * 1000)} г` : `freezing: ${n(m * 1000)} g froze`) : uk ? `плавлення: розтануло ${n(m * 1000)} г` : `melting: ${n(m * 1000)} g melted`,
          formula: 'Q = λ·m',
          numbers: `${n(lambda)} · ${n(m)} ≈ ${kJ(lambda * m)}`,
        });
      }
    } else {
      const c = ph === 'solid' ? (b.state.mixture ? COMPONENTS.water.phases.solid?.specificHeat?.value : sub.freezing?.solidSpecificHeat.value) : sub.liquid.specificHeat.value;
      const dT = C(b.state.temperature) - C(a.state.temperature);
      const m = bodyMass(b);
      if (c && Math.abs(dT) >= 0.05) {
        const what = ph === 'solid' ? iceName : name;
        out.push({
          id,
          title: dT > 0 ? (uk ? `нагрівання ${what}` : `warming the ${what}`) : uk ? `охолодження ${what}` : `cooling the ${what}`,
          formula: 'Q = c·m·Δt',
          numbers: `${n(c)} · ${n(m)} · ${n(Math.abs(dT), 2)} ≈ ${kJ(c * m * Math.abs(dT))}`,
        });
      }
    }
    start = i;
  }

  // Boiling: the water that left as steam took L for every kilogram.
  const steam = boiled(bodies[bodies.length - 1]!) - boiled(bodies[0]!);
  const L = sub.boiling?.latentHeat.value;
  // A tenth of a gram: less is the very first bubbles, not boiling yet worth a line.
  if (L && steam >= 1e-4) {
    out.push({ id: 'boil', title: uk ? `кипіння: википіло ${n(steam * 1000)} г` : `boiling: ${n(steam * 1000)} g boiled off`, formula: 'Q = L·m', numbers: `${n(L)} · ${n(steam)} ≈ ${kJ(L * steam)}` });
  }

  // A current through the liquid: Ohm's law and the heat it releases (Joule–Lenz).
  const sup = Object.values(states[states.length - 1]!.entities).find(isSupply);
  if (sup && sup.state.current > 0 && sup.state.resistance) {
    const I = sup.state.current;
    const R = sup.state.resistance;
    const t = sup.state.time;
    const amps = I < 0.1 ? `${n(I * 1000, 2)} ${uk ? 'мА' : 'mA'}` : `${n(I, 3)} ${uk ? 'А' : 'A'}`;
    out.push({ id: 'ohm', title: uk ? 'струм у рідині' : 'current in the liquid', formula: 'I = U/R', numbers: `${n(I * R, 3)} ${uk ? 'В' : 'V'} / ${n(R, 3)} ${uk ? 'Ом' : 'Ω'} ≈ ${amps}` });
    if (t > 0) out.push({ id: 'joule', title: uk ? 'теплота від струму' : 'heat from the current', formula: 'Q = I²·R·t', numbers: `${n(I, 3)}² · ${n(R, 3)} · ${n(t, 3)} ≈ ${kJ(I * I * R * t)}` });
  }
  // The latest weighing: what the scales show is the vessel plus what is in it.
  const scale = weighed[weighed.length - 1];
  if (scale) {
    const w = weigh(states[states.length - 1]!, scale);
    if (w.reading !== null && w.tare !== null) {
      const g = (kg: number) => formatReading(scale, kg, locale);
      out.push({ id: 'weigh', title: uk ? 'зважування: посуд + вміст' : 'weighing: vessel + contents', formula: 'm = m₁ + m₂', numbers: `${g(w.tare)} + ${g(w.reading - w.tare)} = ${g(w.reading)}` });
    }
  }
  return out;
}
