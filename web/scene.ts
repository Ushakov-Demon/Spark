/**
 * The lab scene: what stands on the table and what happens to it, drawn in SVG.
 * The static part (device, vessel, lid) is rebuilt only when the setup changes;
 * every frame only the "live" details move — liquid level, ice, crystals,
 * bubbles, steam, flame, glowing hotplate, thermometer, gas at the electrodes —
 * so CSS animations run smoothly. It shows the state, it computes nothing.
 */
import { professorSvg, type Mood } from './professor.js';

export type DeviceKind =
  | 'none'
  | 'hotplate'
  | 'induction'
  | 'gas'
  | 'bunsen'
  | 'spirit'
  | 'immersion'
  | 'fridge'
  | 'freezer'
  | 'ice-bath'
  | 'ice-salt-bath'
  | 'supply';
export type VesselShape = 'pot' | 'turka' | 'beaker' | 'flask-conical' | 'flask-round' | 'test-tube';
export type LiquidKind = 'water' | 'salt' | 'alcohol' | 'acid' | 'oil' | 'other';

export interface SceneView {
  readonly device: DeviceKind;
  /** Is the heater / flame / supply working, and how strongly (0…1). */
  readonly on: boolean;
  readonly intensity: number;
  /** Hotplate or immersion element temperature, °C. */
  readonly deviceTemp?: number;
  readonly vessel: VesselShape;
  readonly material: string;
  readonly lid: boolean;
  readonly liquid: LiquidKind;
  /** Share of the vessel filled, 0…1. */
  readonly fill: number;
  /** Contents temperature, °C. */
  readonly temperature: number;
  /** Share of the contents frozen, 0…1. */
  readonly solid: number;
  /** Salt crystals on the bottom, 0…1 (relative amount). */
  readonly crystals: number;
  /** Bubbles in the whole volume (boiling). */
  readonly boiling: boolean;
  /** Steam over the surface, 0…1. */
  readonly steam: number;
  /** Electrolysis: current, A, and the gases that form. */
  readonly current?: { readonly amps: number; readonly volts: number; readonly toxicGas: boolean };
  /** Setpoint of a cooler, °C (shown on its display). */
  readonly setpoint?: number;
  readonly running: boolean;
  /** Decimal separator for numbers on the drawing. */
  readonly decimal: ',' | '.';
  readonly professor: { readonly mood: Mood; readonly says: string };
}

export interface Scene {
  readonly element: HTMLElement;
  render(view: SceneView): void;
}

const NS = 'http://www.w3.org/2000/svg';
const W = 640;
const H = 360;
const TABLE = 318;
const CX = 330;

const METAL: Readonly<Record<string, { fill: string; edge: string }>> = {
  steel: { fill: '#b9c2cb', edge: '#7d8893' },
  'stainless-steel': { fill: '#c4ccd4', edge: '#808b96' },
  aluminium: { fill: '#d7dce1', edge: '#9aa3ac' },
  copper: { fill: '#c97a43', edge: '#8f4f24' },
  brass: { fill: '#d4af37', edge: '#9a7b1d' },
  'cast-iron': { fill: '#4b4f55', edge: '#2c2f33' },
  iron: { fill: '#5d6268', edge: '#363a3f' },
  enamel: { fill: '#eef1f4', edge: '#9aa3ac' },
  ceramic: { fill: '#f0e6d8', edge: '#b9a68c' },
};
const isGlass = (m: string) => m === 'glass' || m === 'borosilicate-glass';

const LIQUID: Readonly<Record<LiquidKind, string>> = {
  water: 'rgba(96, 170, 240, 0.55)',
  salt: 'rgba(120, 178, 205, 0.62)',
  alcohol: 'rgba(205, 228, 255, 0.4)',
  acid: 'rgba(238, 238, 214, 0.5)',
  oil: 'rgba(233, 188, 52, 0.78)',
  other: 'rgba(200, 210, 220, 0.5)',
};

interface VesselGeom {
  /** Outline of the vessel wall. */
  readonly outer: string;
  /** Inside of the vessel (liquid lives here). */
  readonly inner: string;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  /** Extras drawn with the vessel: handles, spout, graduations, clamp. */
  readonly extras: string;
  readonly lidPath?: string;
  /** Room for electrodes / immersion element: x range inside, near the top. */
  readonly mouth: { readonly l: number; readonly r: number };
}

/** Vessel geometry standing with its bottom at `base`. */
function vesselGeom(shape: VesselShape, base: number): VesselGeom {
  switch (shape) {
    case 'pot': {
      const w = 190, h = 112, l = CX - w / 2, r = CX + w / 2, t = base - h;
      return {
        outer: `M${l},${t} L${l},${base - 10} Q${l},${base} ${l + 12},${base} L${r - 12},${base} Q${r},${base} ${r},${base - 10} L${r},${t} Z`,
        inner: `M${l + 5},${t} L${l + 5},${base - 12} Q${l + 5},${base - 5} ${l + 14},${base - 5} L${r - 14},${base - 5} Q${r - 5},${base - 5} ${r - 5},${base - 12} L${r - 5},${t} Z`,
        left: l, right: r, top: t, bottom: base,
        extras: `<path class="handle" d="M${l},${t + 18} h-22 a7,7 0 0 0 0,14 h22"/><path class="handle" d="M${r},${t + 18} h22 a7,7 0 0 1 0,14 h-22"/>`,
        lidPath: `M${l - 6},${t} Q${CX},${t - 26} ${r + 6},${t} Z M${CX - 12},${t - 13} h24 v-8 h-24 Z`,
        mouth: { l: l + 30, r: r - 30 },
      };
    }
    case 'turka': {
      const wb = 86, wt = 62, h = 104, t = base - h;
      const lb = CX - wb / 2, rb = CX + wb / 2, lt = CX - wt / 2, rt = CX + wt / 2;
      return {
        outer: `M${lt - 6},${t} L${lb},${base - 6} Q${lb + 2},${base} ${lb + 8},${base} L${rb - 8},${base} Q${rb - 2},${base} ${rb},${base - 6} L${rt},${t} Z`,
        inner: `M${lt - 1},${t} L${lb + 5},${base - 8} L${rb - 5},${base - 8} L${rt},${t} Z`,
        left: lb, right: rb, top: t, bottom: base,
        extras: `<path class="handle long" d="M${rt + 4},${t + 22} L${rt + 120},${t - 6}"/>`,
        mouth: { l: lt + 6, r: rt - 6 },
      };
    }
    case 'beaker': {
      const w = 108, h = 136, l = CX - w / 2, r = CX + w / 2, t = base - h;
      const grads = [0.25, 0.5, 0.75].map((f) => `<path class="grad" d="M${l + 8},${base - 6 - f * (h - 14)} h16"/>`).join('');
      return {
        outer: `M${l - 8},${t - 4} Q${l},${t} ${l},${t + 8} L${l},${base - 6} Q${l},${base} ${l + 6},${base} L${r - 6},${base} Q${r},${base} ${r},${base - 6} L${r},${t} Z`,
        inner: `M${l + 3},${t + 6} L${l + 3},${base - 7} Q${l + 3},${base - 3} ${l + 8},${base - 3} L${r - 8},${base - 3} Q${r - 3},${base - 3} ${r - 3},${base - 7} L${r - 3},${t} Z`,
        left: l, right: r, top: t, bottom: base, extras: grads,
        mouth: { l: l + 18, r: r - 18 },
      };
    }
    case 'flask-conical': {
      const wb = 136, wn = 32, hb = 108, hn = 46, t = base - hb - hn;
      const lb = CX - wb / 2, rb = CX + wb / 2, ln = CX - wn / 2, rn = CX + wn / 2, shoulder = base - hb;
      return {
        outer: `M${ln},${t} L${ln},${shoulder} L${lb},${base - 6} Q${lb},${base} ${lb + 8},${base} L${rb - 8},${base} Q${rb},${base} ${rb},${base - 6} L${rn},${shoulder} L${rn},${t} Z`,
        inner: `M${ln + 3},${t} L${ln + 3},${shoulder + 2} L${lb + 6},${base - 7} L${rb - 6},${base - 7} L${rn - 3},${shoulder + 2} L${rn - 3},${t} Z`,
        left: lb, right: rb, top: t, bottom: base,
        extras: `<path class="rim" d="M${ln - 5},${t} h${wn + 10}"/>`,
        mouth: { l: ln + 5, r: rn - 5 },
      };
    }
    case 'flask-round': {
      const R = 62, wn = 28, hn = 56, cy = base - R, t = cy - R - hn + 8;
      const ln = CX - wn / 2, rn = CX + wn / 2;
      const join = Math.sqrt(R * R - (wn / 2) ** 2);
      return {
        outer: `M${ln},${t} L${ln},${cy - join} A${R},${R} 0 1 0 ${rn},${cy - join} L${rn},${t} Z`,
        inner: `M${ln + 3},${t} L${ln + 3},${cy - join + 3} A${R - 4},${R - 4} 0 1 0 ${rn - 3},${cy - join + 3} L${rn - 3},${t} Z`,
        left: CX - R, right: CX + R, top: t, bottom: base,
        extras: `<path class="stand" d="M${CX + R + 60},${TABLE} V${t - 10} M${CX + R + 60},${t + 18} H${rn + 2}"/><rect class="clamp" x="${rn - 2}" y="${t + 12}" width="12" height="12" rx="2"/>`,
        mouth: { l: ln + 4, r: rn - 4 },
      };
    }
    case 'test-tube': {
      const w = 34, h = 160, l = CX - w / 2, r = CX + w / 2, t = base - h;
      return {
        outer: `M${l},${t} L${l},${base - w / 2} A${w / 2},${w / 2} 0 0 0 ${r},${base - w / 2} L${r},${t} Z`,
        inner: `M${l + 3},${t} L${l + 3},${base - w / 2} A${w / 2 - 3},${w / 2 - 3} 0 0 0 ${r - 3},${base - w / 2} L${r - 3},${t} Z`,
        left: l, right: r, top: t, bottom: base,
        extras: `<path class="stand" d="M${r + 70},${TABLE} V${t - 14} M${r + 70},${t + 20} H${r + 2}"/><rect class="clamp" x="${r - 4}" y="${t + 14}" width="12" height="12" rx="2"/><path class="rim" d="M${l - 4},${t} h${w + 8}"/>`,
        mouth: { l: l + 6, r: r - 6 },
      };
    }
  }
}

/** Where the vessel bottom sits for this device. */
const baseFor = (d: DeviceKind, shape: VesselShape): number => {
  if (shape === 'flask-round' || shape === 'test-tube') return d === 'bunsen' || d === 'spirit' ? 236 : TABLE - 30;
  switch (d) {
    case 'hotplate':
    case 'induction':
    case 'gas':
      return TABLE - 34;
    case 'bunsen':
      return 240;
    case 'spirit':
      return 250;
    default:
      return TABLE;
  }
};

/** Static drawing of a device; dynamic parts carry classes the frame updates. */
function deviceSvg(d: DeviceKind, g: VesselGeom): string {
  const plateW = Math.min(240, Math.max(150, g.right - g.left + 40));
  switch (d) {
    case 'hotplate':
      return `<rect class="appliance" x="${CX - plateW / 2 - 20}" y="${TABLE - 26}" width="${plateW + 40}" height="26" rx="5"/>
        <ellipse class="plate" id="sc-plate" cx="${CX}" cy="${TABLE - 30}" rx="${plateW / 2 - 6}" ry="7"/>
        <circle class="lamp" id="sc-lamp" cx="${CX + plateW / 2 + 4}" cy="${TABLE - 13}" r="4"/>`;
    case 'induction':
      return `<rect class="glass-top" x="${CX - plateW / 2 - 20}" y="${TABLE - 30}" width="${plateW + 40}" height="30" rx="5"/>
        <g id="sc-coil" class="coil">${[0.35, 0.6, 0.85].map((k) => `<ellipse cx="${CX}" cy="${TABLE - 26}" rx="${(plateW / 2) * k}" ry="${4 * k + 1}"/>`).join('')}</g>
        <circle class="lamp" id="sc-lamp" cx="${CX + plateW / 2 + 4}" cy="${TABLE - 14}" r="4"/>`;
    case 'gas':
      return `<rect class="appliance" x="${CX - plateW / 2 - 20}" y="${TABLE - 18}" width="${plateW + 40}" height="18" rx="4"/>
        <path class="grate" d="M${CX - plateW / 2},${TABLE - 34} H${CX + plateW / 2} M${CX - 40},${TABLE - 34} V${TABLE - 18} M${CX + 40},${TABLE - 34} V${TABLE - 18}"/>
        <g id="sc-flame" class="flame ring">${[-36, -18, 0, 18, 36].map((x) => `<path d="M${CX + x - 5},${TABLE - 20} Q${CX + x},${TABLE - 40} ${CX + x + 5},${TABLE - 20} Z"/>`).join('')}</g>`;
    case 'bunsen':
      return `<path class="stand" d="M${CX - 70},${TABLE} L${CX - 54},240 M${CX + 70},${TABLE} L${CX + 54},240 M${CX - 62},240 H${CX + 62}"/>
        <rect class="appliance" x="${CX - 24}" y="${TABLE - 10}" width="48" height="10" rx="3"/><rect class="tube" x="${CX - 6}" y="${TABLE - 62}" width="12" height="54"/>
        <g id="sc-flame" class="flame cone"><path d="M${CX - 10},${TABLE - 62} Q${CX},${TABLE - 110} ${CX + 10},${TABLE - 62} Z"/><path class="inner" d="M${CX - 5},${TABLE - 62} Q${CX},${TABLE - 86} ${CX + 5},${TABLE - 62} Z"/></g>`;
    case 'spirit':
      return `<path class="stand" d="M${CX - 66},${TABLE} L${CX - 52},250 M${CX + 66},${TABLE} L${CX + 52},250 M${CX - 60},250 H${CX + 60}"/>
        <path class="lamp-glass" d="M${CX - 30},${TABLE} Q${CX - 34},${TABLE - 36} ${CX - 10},${TABLE - 44} H${CX + 10} Q${CX + 34},${TABLE - 36} ${CX + 30},${TABLE} Z"/>
        <rect class="tube" x="${CX - 5}" y="${TABLE - 54}" width="10" height="12"/>
        <g id="sc-flame" class="flame candle"><path d="M${CX - 8},${TABLE - 54} Q${CX},${TABLE - 82} ${CX + 8},${TABLE - 54} Q${CX},${TABLE - 47} ${CX - 8},${TABLE - 54} Z"/></g>`;
    case 'immersion':
      return `<g id="sc-element" class="element"><path d="M${g.mouth.l + 10},${g.top - 30} V${g.bottom - 30} q0,-10 10,-10 h${Math.max(10, g.mouth.r - g.mouth.l - 40)} q10,0 10,10 V${g.top - 30}"/></g>
        <path class="cable" d="M${g.mouth.l + 10},${g.top - 30} q-10,-24 -50,-28"/>`;
    case 'fridge':
    case 'freezer':
      return `<rect class="cabinet" x="${CX - 150}" y="${Math.min(g.top - 50, 120)}" width="300" height="${TABLE - Math.min(g.top - 50, 120)}" rx="10"/>
        <rect class="cabinet-in ${d}" x="${CX - 136}" y="${Math.min(g.top - 50, 120) + 12}" width="272" height="${TABLE - Math.min(g.top - 50, 120) - 18}" rx="6"/>
        <text class="display" x="${CX + 120}" y="${Math.min(g.top - 50, 120) + 30}" id="sc-setpoint" text-anchor="end"></text>
        ${d === 'freezer' ? `<g class="snow">${[[-110, 160], [100, 190], [-90, 250], [115, 270], [-120, 210]].map(([x, y]) => `<text x="${CX + x!}" y="${y}">❄</text>`).join('')}</g>` : ''}`;
    case 'ice-bath':
    case 'ice-salt-bath': {
      const l = g.left - 34, r = g.right + 34, t = g.bottom - Math.min(80, (g.bottom - g.top) * 0.6);
      return `<path class="basin" d="M${l},${t} L${l + 10},${TABLE} H${r - 10} L${r},${t} Z"/>
        <path class="bath-water" d="M${l + 4},${t + 10} L${l + 12},${TABLE - 3} H${r - 12} L${r - 4},${t + 10} Z"/>
        <g class="cubes">${[l + 18, l + 40, r - 40, r - 20].map((x, i) => `<rect x="${x - 9}" y="${t + 6 + (i % 2) * 18}" width="18" height="16" rx="3"/>`).join('')}</g>
        ${d === 'ice-salt-bath' ? `<g class="salt-dots">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${l + 16 + i * ((r - l - 32) / 5)}" cy="${TABLE - 10 - (i % 2) * 8}" r="2"/>`).join('')}</g>` : ''}`;
    }
    case 'supply': {
      const x = CX + 160, y = TABLE - 70, el = (px: number) => `<rect class="electrode" x="${px - 3}" y="${g.top - 24}" width="6" height="${g.bottom - g.top + 6}" rx="1.5"/>`;
      const a = g.mouth.l + (g.mouth.r - g.mouth.l) * 0.25, c = g.mouth.l + (g.mouth.r - g.mouth.l) * 0.75;
      return `<rect class="psu" x="${x}" y="${y}" width="120" height="70" rx="8"/>
        <rect class="psu-screen" x="${x + 10}" y="${y + 6}" width="100" height="36" rx="3"/>
        <text class="psu-text" id="sc-volts" x="${x + 102}" y="${y + 21}" text-anchor="end"></text><text class="psu-text amps" id="sc-amps" x="${x + 102}" y="${y + 37}" text-anchor="end"></text>
        <circle class="jack plus" cx="${x + 30}" cy="${y + 55}" r="6"/><circle class="jack minus" cx="${x + 90}" cy="${y + 55}" r="6"/>
        <path class="wire plus" d="M${x + 30},${y + 55} C${x - 10},${y + 60} ${a + 40},${g.top - 80} ${a},${g.top - 24}"/>
        <path class="wire minus" d="M${x + 90},${y + 55} C${x + 80},${g.top - 90} ${c + 30},${g.top - 70} ${c},${g.top - 24}"/>
        ${el(a)}${el(c)}`;
    }
    default:
      return '';
  }
}

export function createScene(): Scene {
  const root = document.createElement('div');
  root.className = 'scene';
  root.innerHTML = `<svg class="scene-svg" viewBox="0 52 ${W} ${H - 52}" role="img"></svg><div class="scene-prof"><div class="bubble" id="sc-says"></div><div class="prof" id="sc-prof"></div></div>`;
  const svg = root.querySelector('svg')!;
  const says = root.querySelector<HTMLElement>('#sc-says')!;
  const prof = root.querySelector<HTMLElement>('#sc-prof')!;
  let key = '';
  let mood: Mood | null = null;
  let geom: VesselGeom | null = null;
  const $ = <T extends Element>(id: string) => svg.querySelector<T>(`#${id}`);

  function build(v: SceneView) {
    const base = baseFor(v.device, v.vessel);
    const g = vesselGeom(v.vessel, base);
    geom = g;
    const glass = isGlass(v.material);
    const metal = METAL[v.material] ?? METAL['steel']!;
    const wallStyle = glass ? 'fill:rgba(210,232,255,0.18);stroke:#8fb8dd' : `fill:${metal.fill};stroke:${metal.edge}`;
    const front = v.device === 'immersion' || v.device === 'supply';
    // Thermometer to the left of the vessel.
    const tx = g.left - 46;
    svg.innerHTML = `
      <defs>
        <clipPath id="sc-in"><path d="${g.inner}"/></clipPath>
        <clipPath id="sc-liq"><rect id="sc-liq-rect" x="0" y="${g.bottom}" width="${W}" height="0"/></clipPath>
        <linearGradient id="sc-steam" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      </defs>
      <rect class="wall" x="-800" y="-200" width="${W + 1600}" height="${TABLE + 200}"/>
      <rect class="table" x="-800" y="${TABLE}" width="${W + 1600}" height="${H - TABLE + 200}"/>
      <path class="table-edge" d="M-800,${TABLE} H${W + 800}"/>
      ${front ? '' : deviceSvg(v.device, g)}
      <g class="vessel ${glass ? 'glass' : 'metal'}">
        ${glass ? '' : `<path d="${g.outer}" style="${wallStyle}" stroke-width="2"/>`}
        <g clip-path="url(#sc-in)">
          ${glass ? '' : `<path d="${g.inner}" class="inside"/>`}
          <g clip-path="url(#sc-liq)">
            <rect id="sc-liquid" x="${g.left - 10}" y="${g.top - 10}" width="${g.right - g.left + 20}" height="${g.bottom - g.top + 20}"/>
            <g id="sc-bubbles" class="bubbles">${Array.from({ length: 14 }, (_, i) => `<circle cx="${g.left + 16 + ((i * 37) % Math.max(20, g.right - g.left - 30))}" cy="${g.bottom - 8}" r="${2 + (i % 3)}" style="animation-delay:${(i * 0.17) % 1.6}s"/>`).join('')}</g>
          </g>
          <g id="sc-ice" class="ice"><rect x="${g.left - 10}" y="0" width="${g.right - g.left + 20}" height="0"/><path class="cracks" d="M${g.left + 20},0 l18,10 l14,-6 M${g.right - 40},0 l-12,9 l-16,-3"/></g>
          <g id="sc-crystals" class="crystals">${Array.from({ length: 18 }, (_, i) => `<path d="M${g.left + 18 + ((i * 29) % Math.max(20, g.right - g.left - 34))},${g.bottom - 5 - (i % 3) * 3} l4,-5 l4,5 l-4,4 Z"/>`).join('')}</g>
        </g>
        ${glass ? `<path d="${g.outer}" style="${wallStyle}" stroke-width="2.5"/>` : ''}
        ${g.extras}
        ${v.lid && g.lidPath ? `<path class="lid" d="${g.lidPath}" style="fill:${metal.fill};stroke:${metal.edge}"/>` : ''}
      </g>
      ${front ? deviceSvg(v.device, g) : ''}
      <g id="sc-gas" class="gas-bubbles">${Array.from({ length: 10 }, (_, i) => {
        const a = g.mouth.l + (g.mouth.r - g.mouth.l) * (i % 2 ? 0.75 : 0.25);
        return `<circle cx="${a + (i % 3) * 3 - 3}" cy="${g.bottom - 14}" r="${1.5 + (i % 2)}" style="animation-delay:${(i * 0.23) % 1.4}s"/>`;
      }).join('')}</g>
      <g id="sc-steam" class="steam">${[-0.3, 0, 0.3].map((k, i) => `<path d="M${CX + k * (g.right - g.left)},${(v.lid && g.lidPath ? g.top - 20 : g.top) - 4} q-12,-20 0,-40 q12,-20 0,-40" style="animation-delay:${i * 0.6}s"/>`).join('')}</g>
      <ellipse id="sc-cloud" class="toxic" cx="${CX}" cy="${g.top - 40}" rx="${(g.right - g.left) / 2 + 20}" ry="24"/>
      <g class="thermo">
        <rect x="${tx - 6}" y="${g.top - 10}" width="12" height="${g.bottom - g.top + 6}" rx="6"/>
        <circle cx="${tx}" cy="${g.bottom + 2}" r="10"/>
        <rect id="sc-merc" class="merc" x="${tx - 2.5}" y="${g.bottom}" width="5" height="0"/>
        <circle class="merc" cx="${tx}" cy="${g.bottom + 2}" r="6.5"/>
        <text id="sc-temp" class="thermo-text" x="${tx}" y="${g.top - 18}" text-anchor="middle"></text>
      </g>`;
  }

  return {
    element: root,
    render(v) {
      const k = [v.device, v.vessel, v.material, v.lid].join('|');
      if (k !== key) {
        key = k;
        build(v);
      }
      const g = geom!;
      // Liquid level and colour; ice floats on top, a fully frozen sample is all ice.
      const level = g.bottom - Math.max(0, Math.min(1, v.fill)) * (g.bottom - g.top);
      $('sc-liq-rect')?.setAttribute('y', String(level));
      $('sc-liq-rect')?.setAttribute('height', String(g.bottom - level + 2));
      const liq = $<SVGRectElement>('sc-liquid');
      if (liq) liq.style.fill = v.solid >= 1 ? 'rgba(220, 240, 255, 0.92)' : LIQUID[v.liquid];
      // Ice is lighter than water: a growing layer floats on top.
      const ice = $<SVGGElement>('sc-ice');
      if (ice) {
        const thick = v.solid > 0 && v.solid < 1 ? Math.max(4, v.solid * (g.bottom - level) * 0.9) : 0;
        const r = ice.querySelector('rect')!;
        r.setAttribute('y', String(level - 2));
        r.setAttribute('height', String(thick));
        ice.querySelector('path')!.setAttribute('transform', `translate(0 ${level + thick / 2})`);
        ice.style.opacity = thick > 0 ? '1' : '0';
      }
      $('sc-crystals')?.setAttribute('style', `opacity:${v.crystals > 0 ? Math.min(1, 0.35 + v.crystals) : 0}`);
      // A step that ended while the heater is still on keeps boiling on the drawing.
      $('sc-bubbles')?.classList.toggle('on', v.boiling);
      const steam = $<SVGGElement>('sc-steam');
      if (steam) {
        steam.style.opacity = String(Math.min(1, v.steam));
        steam.classList.toggle('on', v.steam > 0.02 && (v.running || v.boiling));
      }
      // Devices.
      const lamp = $('sc-lamp');
      lamp?.classList.toggle('on', v.on);
      const plate = $<SVGEllipseElement>('sc-plate');
      if (plate) {
        // Dark iron → red glow above ~300 °C.
        const k2 = Math.max(0, Math.min(1, ((v.deviceTemp ?? 20) - 120) / 380));
        plate.style.fill = `rgb(${Math.round(58 + k2 * 197)}, ${Math.round(58 + k2 * 30)}, ${Math.round(62 - k2 * 30)})`;
      }
      $('sc-coil')?.setAttribute('style', `opacity:${v.on ? 0.35 + 0.65 * v.intensity : 0.12}`);
      const flame = $<SVGGElement>('sc-flame');
      if (flame) {
        flame.style.opacity = v.on ? '1' : '0';
        flame.style.transform = `scale(${0.6 + 0.4 * v.intensity})`;
        flame.classList.toggle('flicker', v.on);
      }
      const element = $<SVGGElement>('sc-element');
      if (element) {
        const k3 = Math.max(0, Math.min(1, ((v.deviceTemp ?? 20) - 40) / 260));
        element.style.stroke = `rgb(${Math.round(110 + k3 * 145)}, ${Math.round(110 - k3 * 40)}, ${Math.round(115 - k3 * 80)})`;
      }
      const sp = $('sc-setpoint');
      if (sp) sp.textContent = v.setpoint === undefined ? '' : `${Math.round(v.setpoint)} °C`;
      // Power supply display and gas at the electrodes.
      const volts = $('sc-volts'), amps = $('sc-amps');
      if (volts) volts.textContent = v.current ? `${v.current.volts.toFixed(1)} V` : '';
      if (amps) amps.textContent = v.current ? `${v.current.amps.toFixed(2)} A` : '';
      const gas = $<SVGGElement>('sc-gas');
      if (gas) {
        const flowing = (v.current?.amps ?? 0) > 0.005 && v.running;
        gas.classList.toggle('on', flowing);
        gas.style.opacity = flowing ? String(Math.min(1, 0.3 + (v.current?.amps ?? 0) / 2)) : '0';
        gas.setAttribute('transform', `translate(0 0)`);
        gas.style.setProperty('--rise', `${Math.max(10, g.bottom - level - 6)}px`);
      }
      const cloud = $<SVGEllipseElement>('sc-cloud');
      if (cloud) cloud.style.opacity = v.current?.toxicGas && (v.current.amps ?? 0) > 0.05 ? String(Math.min(0.45, 0.1 + v.current.amps / 10)) : '0';
      // Thermometer: −30 … 120 °C scale (stretches for hotter things).
      const top = v.temperature > 120 ? Math.max(300, v.temperature) : 120;
      const k4 = Math.max(0, Math.min(1, (v.temperature + 30) / (top + 30)));
      const merc = $('sc-merc');
      const tubeH = g.bottom - g.top - 4;
      merc?.setAttribute('y', String(g.bottom - k4 * tubeH));
      merc?.setAttribute('height', String(k4 * tubeH));
      const tt = $('sc-temp');
      if (tt) tt.textContent = `${v.temperature.toFixed(1).replace('.', v.decimal)}°`;
      // The Professor.
      if (v.professor.mood !== mood) {
        mood = v.professor.mood;
        prof.innerHTML = professorSvg(mood, 110);
      }
      if (says.textContent !== v.professor.says) says.textContent = v.professor.says;
      says.hidden = !v.professor.says;
    },
  };
}
