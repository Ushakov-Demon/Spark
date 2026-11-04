import { illuminanceAt, lampFlux, meterDivision, type LuxmeterCommand } from '../../../src/experiments/light-meter/bench.js';
import { degText, lengthText, reading, wattText } from '../../../src/experiments/light-meter/words.js';
import type { LampKind } from '../../../src/equipment/lamps.js';
import { NUMBER_LOCALE } from '../../../src/knowledge/i18n.js';
import { t } from '../../../src/knowledge/messages.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A frosted lamp on a stand over a light meter lying on the table: the lamp's height is the distance (to one scale
 * for the whole run, so the heights compare; too tall a run is drawn shrunk and marked so), a dashed line with the
 * distance between them, the sensor lit the brighter the more light falls on it, the display beside it. Tilted,
 * the sensor turns on its hinge. Between the steps two knobs: the lamp's power and the sensor's tilt, the display
 * answering at once.
 */
export type LuxView = {
  readonly lamp: LampKind;
  readonly power: number;
  readonly r: number;
  readonly tilt: number;
  /** Pixels per metre, the same for the whole run; and whether that is still the true scale of the drawing. */
  readonly perM: number;
  readonly shrunk: boolean;
  /** Before the first look the display is blank. */
  readonly on: boolean;
  readonly read?: string;
  readonly labels: { readonly r: string; readonly lux: string; readonly scale: string; readonly power: string; readonly tilt: string; readonly height: string; readonly cm: string };
  readonly locale: 'uk' | 'en';
};

type Cmd = LuxmeterCommand;

/** The sensor's face on the table, its x; the stand's rod; the lamp's highest place. */
const X = 380;
const SENSOR_Y = TABLE - 16;
const ROD = 470;
const TOP = 36;
/** The stand's rod: the lamp goes up to a metre over the sensor (higher, if the run asks). */
const STAND = 1;
/** One centimetre of the drawing is about 6 px (the kit's CM): up to ~45 cm the lamp is drawn to scale. */
const TRUE_PER_M = 600;
const BULB = 15;

function view({ log, last, command, plan, locale }: SceneContext): LuxView {
  const mine = command?.type === 'lab.luxmeter' ? (command as unknown as Cmd) : undefined;
  const steps = plan.filter((s) => s.kind === 'bench' && s.command.type === 'lab.luxmeter').map((s) => (s.kind === 'bench' ? (s.command as unknown as Cmd) : undefined)).filter((c): c is Cmd => !!c);
  const c = mine ?? steps[0];
  // The scale from every distance of the run — those looked at and those still to come.
  const done = log.filter((e) => e.command.type === 'lab.luxmeter').map((e) => (e.command as unknown as Cmd).r);
  const rMax = Math.max(STAND, ...steps.map((s) => s.r), ...done, c?.r ?? 0.3);
  // The whole run fits between the sensor and the top: to scale while it can, shrunk beyond.
  const fit = (SENSOR_Y - TOP - BULB) / rMax;
  const perM = Math.min(TRUE_PER_M, fit);
  const r = mine && last ? readingsOf([last])[0]?.record : undefined;
  return {
    lamp: c?.lamp ?? 'led',
    power: c?.power ?? 8,
    r: c?.r ?? 0.3,
    tilt: mine?.tilt ?? 0,
    perM,
    shrunk: perM < TRUE_PER_M,
    on: !!mine,
    ...(r ? { read: reading(r, locale) } : {}),
    labels: { r: lengthText(c?.r ?? 0.3, locale), lux: t(locale, 'unit-sym-lx'), scale: t(locale, 'light-meter-scene-not-to-scale'), power: t(locale, 'light-meter-live-power'), tilt: t(locale, 'light-meter-live-tilt'), height: t(locale, 'light-meter-live-height'), cm: t(locale, 'unit-sym-cm') },
    locale,
  };
}

/** The display's figures: three, as the meter shows them. */
function display(E: number, locale: 'uk' | 'en'): string {
  const d = meterDivision(E);
  const digits = Math.max(0, Math.round(-Math.log10(d)));
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.round(E / d) * d);
}

function svg(v: LuxView): string {
  const E = illuminanceAt(lampFlux(v.lamp, v.power), v.r, v.tilt);
  // The lamp's centre: the distance r above the sensor, kept clear of it.
  const cy = Math.min(SENSOR_Y - BULB - 6, SENSOR_Y - v.r * v.perM);
  // How bright the sensor looks: 0 in the dark, near 1 from a few hundred lux (a log scale, the eye is so).
  const glow = v.on ? Math.max(0.08, Math.min(1, Math.log10(1 + E) / 3.3)) : 0.08;
  // The stand: its base on the table, the rod, an arm out to the lamp's socket.
  const stand = `<rect x="${ROD - 34}" y="${TABLE - 8}" width="68" height="8" rx="2" style="fill:${DARK}"/><rect x="${ROD - 3}" y="${TOP - 14}" width="6" height="${TABLE - 8 - TOP + 14}" style="fill:${STEEL}"/><rect x="${ROD - 7}" y="${cy - BULB - 22}" width="14" height="12" rx="2" style="fill:${DARK}"/><rect x="${X}" y="${cy - BULB - 19}" width="${ROD - X}" height="6" rx="2" style="fill:${STEEL}"/>`;
  // The lamp: its socket on the arm, the frosted bulb glowing, light going down to the meter.
  const rays = `<path d="M${X - BULB},${cy} L${X - 46},${SENSOR_Y} L${X + 46},${SENSOR_Y} L${X + BULB},${cy} Z" style="fill:rgba(255,236,170,${0.08 + 0.12 * glow})"/>`;
  const lamp = `<circle cx="${X}" cy="${cy}" r="${BULB * 2.2}" style="fill:rgba(255,230,150,0.18)"/><rect x="${X - 6}" y="${cy - BULB - 14}" width="12" height="9" rx="1" style="fill:#b8b29c"/><circle cx="${X}" cy="${cy}" r="${BULB}" style="fill:#fff7d6;stroke:#e9d79a;stroke-width:1.5"/>`;
  // The lamp on its arm is a knob: dragged up and down the rod (a handle on the clamp says so).
  const grip = `<g data-live="r" style="touch-action:none"><rect x="${X - BULB - 6}" y="${cy - BULB - 26}" width="${ROD - X + BULB + 16}" height="${2 * BULB + 32}" style="fill:transparent"/><path d="M${ROD + 14},${cy - BULB - 22} l5,-7 l5,7 M${ROD + 14},${cy - BULB - 10} l5,7 l5,-7" style="fill:none;stroke:#ffd166;stroke-width:2;stroke-linecap:round"/></g>`;
  // The height in a field right of the handle: whole centimetres, typed in.
  const field = `<foreignObject x="${ROD + 30}" y="${cy - BULB - 32}" width="92" height="28"><div class="scene-field"><input type="number" data-live-field="r" data-factor="0.01" min="${R_MIN * 100}" step="1" value="${Math.round(v.r * 100)}" aria-label="${v.labels.height}"/><span>${v.labels.cm}</span></div></foreignObject>`;
  // The sensor: a white disc in a dark housing on a hinge, turned by the tilt; the cable to the display.
  const a = v.tilt;
  const sensor = `<g transform="rotate(${a} ${X + 22} ${SENSOR_Y + 8})"><rect x="${X - 22}" y="${SENSOR_Y}" width="44" height="8" rx="2" style="fill:${DARK}"/><ellipse cx="${X}" cy="${SENSOR_Y}" rx="17" ry="3.5" style="fill:rgb(${Math.round(200 + 55 * glow)},${Math.round(200 + 50 * glow)},${Math.round(190 + 20 * glow)});stroke:#222;stroke-width:1"/></g><rect x="${X + 12}" y="${TABLE - 8}" width="16" height="8" style="fill:${DARK}"/>`;
  const cable = `<path d="M${X + 22},${TABLE - 4} C${X + 60},${TABLE - 2} ${X + 80},${TABLE - 2} 516,${TABLE - 20}" style="fill:none;stroke:#222;stroke-width:2"/>`;
  const screen = v.on ? `${display(E, v.locale)} ${v.labels.lux}` : '- - -';
  const meter = `<rect x="508" y="${TABLE - 52}" width="86" height="52" rx="6" style="fill:#f2c230;stroke:${DARK};stroke-width:2"/><rect x="514" y="${TABLE - 46}" width="74" height="22" rx="2" style="fill:#c9d6b8"/><text x="584" y="${TABLE - 30}" text-anchor="end" style="font:700 13px ui-monospace,monospace;fill:#1d2a1d">${screen}</text><text x="551" y="${TABLE - 9}" text-anchor="middle" style="font:700 9px system-ui,sans-serif;fill:${DARK}">LUX</text>`;
  // The note that the height is drawn shrunk: by the sensor, on the table's level — below the board's chalk.
  const shrunk = v.shrunk ? `<text x="${X - 26}" y="${SENSOR_Y + 4}" text-anchor="end" style="font:600 9px system-ui,sans-serif;fill:#e8e2cf">${v.labels.scale}</text>` : '';
  const read = v.read ? `<text class="bench-reading" x="551" y="${TABLE - 60}" text-anchor="middle">${v.read}</text>` : '';
  return `${stand}${rays}${lamp}${cable}${sensor}${meter}${shrunk}${read}${grip}${field}`;
}

/** The lamp moves up (or down) the stand from where it was to this distance, the display running; tilted, the sensor turns. About two seconds and a half. */
function motion(next: LuxView, draw: (v: LuxView) => void, prev: LuxView | null): Motion | null {
  if (!next.read) return null;
  const { read: _r, ...rest } = next;
  void _r;
  const from = prev && prev.on ? prev : null;
  const r0 = from?.r ?? next.r * 0.6;
  const t0 = from?.tilt ?? 0;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 0.4 }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const x = clock.value;
      // First the lamp, then the tilt (if any).
      const up = next.tilt ? Math.min(1, x / 0.5) : x;
      const turn = next.tilt ? Math.max(0, (x - 0.5) / 0.5) : 0;
      draw({ ...rest, r: r0 + (next.r - r0) * up, tilt: t0 + (next.tilt - t0) * turn, labels: { ...rest.labels, r: lengthText(r0 + (next.r - r0) * up, rest.locale) } });
    },
  };
}

/** The knobs: the lamp's power (up to what such lamps are made), the sensor's tilt; and the lamp's height, dragged. */
const POWER_MAX: Record<LampKind, number> = { led: 30, incandescent: 200 };
/** The lamp is not let nearer than a few centimetres to the sensor (its glass). */
const R_MIN = 0.04;
const live = {
  controls: (v: LuxView) => [
    { id: 'power', label: v.labels.power, min: 1, max: Math.max(POWER_MAX[v.lamp], Math.round(v.power)), step: 1, value: Math.round(v.power), text: wattText(v.power, v.locale) },
    { id: 'tilt', label: v.labels.tilt, min: 0, max: 85, step: 1, value: Math.round(v.tilt), text: degText(v.tilt, v.locale) },
  ],
  // Turned, the meter is on: it shows what falls on it now (the step's reading label goes, the display stays).
  apply: (v: LuxView, x: Readonly<Record<string, number>>): LuxView => {
    const { read: _r, ...rest } = v;
    void _r;
    // The lamp goes by whole centimetres.
    const r = x['r'] !== undefined ? Math.max(R_MIN, Math.round(x['r'] * 100) / 100) : v.r;
    // Typed in higher than the drawing holds: the drawing shrinks to it.
    const perM = Math.min(v.perM, (SENSOR_Y - TOP - BULB) / r);
    return { ...rest, on: true, power: x['power'] ?? v.power, tilt: x['tilt'] ?? v.tilt, r, perM, shrunk: v.shrunk || perM < TRUE_PER_M, labels: { ...rest.labels, r: lengthText(r, v.locale) } };
  },
  // The lamp goes up and down as far as the pointer — between the sensor and the top of the rod.
  drag: (v: LuxView, _knob: string, from: { readonly y: number }, to: { readonly y: number }): number => Math.max(R_MIN, Math.min(Math.max(v.r, (SENSOR_Y - TOP - BULB) / v.perM), Math.round((v.r + (from.y - to.y) / v.perM) * 100) / 100)),
  // A step measures the lamp where it stands, at the power and tilt shown.
  take: (c: { readonly type: string } & Record<string, unknown>, x: Readonly<Record<string, number>>) => ({ ...c, ...(x['r'] !== undefined ? { r: Math.max(R_MIN, Math.round(x['r'] * 100) / 100) } : {}), ...(x['power'] !== undefined ? { power: x['power'] } : {}), ...(x['tilt'] !== undefined ? { tilt: x['tilt'] } : {}) }),
};

export const lightMeterScene = defineScene({ kind: 'luxmeter', view, svg, motion, live });
