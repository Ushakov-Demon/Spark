import { bulbAt, SCALE_HIGH, SCALE_LOW, SCALE_MARKS_BETWEEN, SCALE_NUMBERED, type ThermometerCommand } from '../../../src/experiments/read-thermometer/bench.js';
import { reading } from '../../../src/experiments/read-thermometer/words.js';
import { NUMBER_LOCALE } from '../../../src/knowledge/i18n.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { standSvg, stopwatchSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A thermometer on a stand over a glass of water: in the air it shows the room, lowered into the glass its column
 * climbs (or falls) to the water's temperature (hot water steams a little), and when its time is up it is taken out,
 * the reading kept, and has cooled back to the room before the next dip. Beside it the scale near the column's top,
 * magnified, as one reads it — and the stopwatch since the bulb went in. Stirred, a rod goes round in the water.
 */
export type ThermoView = {
  readonly room: number;
  readonly water: number;
  /** In the water (0…1: going down), and for how long, s. */
  readonly dipped: number;
  readonly t: number;
  /** Taken out with its reading: what the column stands at, °C. */
  readonly held?: number;
  readonly stir: boolean;
  /** The scale step: the divisions between two numbered marks counted (0…1). */
  readonly counting?: number;
  readonly scaleStep: boolean;
  readonly read?: string;
  readonly decimal: string;
};

type Cmd = ThermometerCommand;

function view({ last, command, plan, locale }: SceneContext): ThermoView {
  const mine = command?.type === 'lab.thermometer' ? (command as unknown as Cmd) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.thermometer');
  const first = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.thermometer' && (s.command as unknown as Cmd).step === 'dip');
  const c = mine ?? (next?.kind === 'bench' ? (next.command as unknown as Cmd) : undefined);
  const water = c?.step === 'dip' ? c.water : first?.kind === 'bench' ? (first.command as unknown as Cmd & { water: number }).water : 45;
  const r = mine && last ? readingsOf([last])[0]?.record : undefined;
  const decimal = new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(1.5).charAt(1);
  const base = { room: c?.room ?? 22, water, stir: false, decimal, ...(r ? { read: reading(r, locale) } : {}) };
  // Before its step a dip is shown still in the air: the bulb goes in with the step.
  if (!c || c.step === 'scale' || !mine) return { ...base, dipped: 0, t: 0, scaleStep: c?.step === 'scale' };
  const stir = !!c.stir;
  return { ...base, dipped: 0, held: bulbAt(c.room, c.water, c.t, stir), t: c.t, stir, scaleStep: false };
}

/** The thermometer: its rod's x, the bulb's centre in the air and how far it goes down; the scale, px per °C. */
const X = 405;
const BULB_AIR = 185;
const DIP = 95;
const PER_DEG = 1.5;
const BEAKER = { x0: 360, x1: 450, top: 200, level: 226 };
/** The magnified scale: where it stands, px per °C, how many °C it shows. */
const LENS = { x0: 472, x1: 590, y0: 22, y1: 202, perDeg: 11, span: 15 };
const ALCOHOL = '#d9312b';

/** Water is water at any temperature: light blue; hot (from 40 °C), a little steam goes up from it. */
const WATER = 'rgba(110, 175, 235, 0.85)';
const STEAMS_FROM = 40;

function svg(v: ThermoView): string {
  const T = v.held ?? (v.dipped > 0 ? bulbAt(v.room, v.water, v.t, v.stir) : v.room);
  const cy = BULB_AIR + DIP * v.dipped;
  const zero = cy - 18;
  const yOf = (deg: number) => zero - (deg - SCALE_LOW) * PER_DEG;
  const top = yOf(SCALE_HIGH) - 10;
  // The glass of water.
  const steam = v.water >= STEAMS_FROM ? [0, 1, 2].map((i) => `<path d="M${BEAKER.x0 + 20 + i * 26},${BEAKER.top - 4} q-6,-10 0,-20 q6,-10 0,-20" style="fill:none;stroke:rgba(255,255,255,0.45);stroke-width:3;stroke-linecap:round"/>`).join('') : '';
  const beaker = `${steam}<rect x="${BEAKER.x0}" y="${BEAKER.level}" width="${BEAKER.x1 - BEAKER.x0}" height="${TABLE - 1 - BEAKER.level}" style="fill:${WATER}"/><path d="M${BEAKER.x0},${BEAKER.top} V${TABLE - 1} H${BEAKER.x1} V${BEAKER.top}" style="fill:none;stroke:#cfe3ea;stroke-width:3"/>`;
  // The thermometer: a glass tube with its scale, the bulb, the alcohol column up to T.
  const ticks = Array.from({ length: (SCALE_HIGH - SCALE_LOW) / 5 + 1 }, (_, i) => {
    const d = SCALE_LOW + i * 5;
    return `<path d="M${X + 5},${yOf(d)} h${d % 10 === 0 ? 7 : 4}" style="stroke:#3d3d3d;stroke-width:0.8"/>`;
  }).join('');
  const nums = Array.from({ length: (SCALE_HIGH - SCALE_LOW) / 20 + 1 }, (_, i) => `<text x="${X + 14}" y="${yOf(SCALE_LOW + i * 20) + 3}" style="font:600 8px system-ui,sans-serif;fill:#2b2f36">${SCALE_LOW + i * 20}</text>`).join('');
  const thermo = `<rect x="${X - 6}" y="${top}" width="30" height="${cy - top}" rx="4" style="fill:#f7f5ee;stroke:#b8b29c"/><rect x="${X - 2}" y="${top + 4}" width="4" height="${zero - top}" rx="2" style="fill:#ffffff;stroke:#c9c4b4;stroke-width:0.6"/><rect x="${X - 1.5}" y="${yOf(T)}" width="3" height="${cy - yOf(T)}" style="fill:${ALCOHOL}"/><circle cx="${X}" cy="${cy}" r="7" style="fill:${ALCOHOL};stroke:#8f1d18;stroke-width:1"/>${ticks}${nums}`;
  // The stand holds it by the top.
  const stand = standSvg(330, X - 6, top + 12);
  // The stirring rod: round and round in the water (its place from the time).
  const stir = v.stir && v.dipped > 0 ? `<path d="M${X - 22 + 14 * Math.sin(v.t * 3)},${BEAKER.top - 18} l6,${TABLE - 8 - BEAKER.top + 10}" style="stroke:#e8e2cf;stroke-width:3;stroke-linecap:round"/>` : '';
  // The scale near the column's top, magnified; on the scale step, the divisions between two numbered marks counted.
  const centre = v.scaleStep ? Math.floor(v.room / SCALE_NUMBERED) * SCALE_NUMBERED + SCALE_NUMBERED / 2 : Math.max(SCALE_LOW + LENS.span / 2, Math.min(SCALE_HIGH - LENS.span / 2, T));
  const lensMid = (LENS.y0 + LENS.y1) / 2;
  const lensY = (deg: number) => lensMid - (deg - centre) * LENS.perDeg;
  const lx = (LENS.x0 + LENS.x1) / 2 - 18;
  const inLens = (y: number) => y > LENS.y0 + 2 && y < LENS.y1 - 2;
  let lensTicks = '';
  for (let d = Math.ceil(centre - LENS.span / 2); d <= centre + LENS.span / 2; d++) {
    const y = lensY(d);
    if (!inLens(y)) continue;
    const numbered = d % SCALE_NUMBERED === 0;
    lensTicks += `<path d="M${lx + 8},${y} h${numbered ? 22 : d % 5 === 0 ? 16 : 11}" style="stroke:#2b2f36;stroke-width:${numbered ? 1.6 : 1}"/>`;
    if (numbered || d % 5 === 0) lensTicks += `<text x="${lx + 34}" y="${y + 4}" style="font:${numbered ? 700 : 500} ${numbered ? 12 : 10}px system-ui,sans-serif;fill:#2b2f36">${d}</text>`;
  }
  const a = Math.floor(v.room / SCALE_NUMBERED) * SCALE_NUMBERED;
  const counted = v.scaleStep ? Math.round((v.read ? 1 : (v.counting ?? 0)) * SCALE_MARKS_BETWEEN) : 0;
  const count = Array.from({ length: counted }, (_, i) => `<rect x="${lx + 6}" y="${lensY(a + i + 1)}" width="26" height="${LENS.perDeg}" style="fill:rgba(255,209,102,${i % 2 ? 0.45 : 0.7})"/>`).join('');
  const columnTop = Math.max(LENS.y0 + 1, Math.min(LENS.y1 - 1, lensY(T)));
  const lens = `<rect x="${LENS.x0}" y="${LENS.y0}" width="${LENS.x1 - LENS.x0}" height="${LENS.y1 - LENS.y0}" rx="10" style="fill:#f7f5ee;stroke:#8d949c;stroke-width:3"/>${count}<rect x="${lx - 3}" y="${columnTop}" width="7" height="${LENS.y1 - 1 - columnTop}" style="fill:${ALCOHOL}"/>${lensTicks}<path d="M${X + 24},${yOf(T)} L${LENS.x0},${lensMid}" style="stroke:#ffd166;stroke-width:1;stroke-dasharray:3 3"/>`;
  const watch = stopwatchSvg({ display: v.dipped > 0 || v.held !== undefined ? (v.t < 100 ? v.t.toFixed(1) : v.t.toFixed(0)).replace('.', v.decimal) : '0' + v.decimal + '0' }, 530);
  const read = v.read ? `<text class="bench-reading" x="${(LENS.x0 + LENS.x1) / 2}" y="${LENS.y0 - 6}" text-anchor="middle">${v.read}</text>` : '';
  return `${beaker}${stand}${thermo}${stir}${lens}${watch}${read}`;
}

/**
 * The scale step: the ten divisions counted one by one (about two seconds). A dip (about three seconds and a half): the
 * column back to the room's, if the last dip left it up; the thermometer down into the glass; the column moves while the
 * stopwatch runs; the reading, and the thermometer out.
 */
function motion(next: ThermoView, draw: (v: ThermoView) => void, prev: ThermoView | null): Motion | null {
  if (!next.read) return null;
  const { read: _r, held: _h, ...rest } = next;
  void _r;
  void _h;
  if (next.scaleStep) {
    const clock = new Channel(0, 1, { kind: 'steady', speed: 0.5 }, 1e-6);
    return { channels: [clock], frame: (done) => (done ? draw(next) : draw({ ...rest, counting: clock.value })) };
  }
  const before = prev?.held;
  const cooled = before === undefined ? 0 : 0.12;
  const lowered = cooled + 0.2;
  const raised = 0.82;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 0.28 }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const x = clock.value;
      if (x < cooled) return draw({ ...rest, dipped: 0, t: 0, held: before! + (next.room - before!) * (x / cooled) });
      if (x < lowered) return draw({ ...rest, dipped: (x - cooled) / (lowered - cooled), t: 0 });
      if (x < raised) return draw({ ...rest, dipped: 1, t: next.t * ((x - lowered) / (raised - lowered)) });
      draw({ ...next, dipped: 1 - (x - raised) / (1 - raised) });
    },
  };
}

export const readThermometerScene = defineScene({ kind: 'thermometer', view, svg, motion });
