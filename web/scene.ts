/**
 * The lab scene: what stands on the table and what happens to it, drawn in SVG.
 * The static part (device, vessel, lid) is rebuilt only when the setup changes;
 * every frame only the "live" details move — liquid level, ice, crystals,
 * bubbles, steam, flame, glowing hotplate, thermometer, gas at the electrodes —
 * so CSS animations run smoothly. It shows the state, it computes nothing.
 */
import { professorSideSvg, professorSvg, type Mood } from './graphics/professor/index.js';
import { blocksSvg } from './graphics/scene/bodies.js';
import { isGlass, LIQUID, METAL } from './graphics/scene/colors.js';
import { CX, H, TABLE, VIEW_TOP, W } from './graphics/scene/constants.js';
import { deviceSvg } from './graphics/scene/devices.js';
import { dynamometerSvg, scalesSvg } from './graphics/scene/instruments.js';
import { baseFor, vesselGeom, vesselPreview, type VesselGeom } from './graphics/scene/vessels.js';
import type { DeviceKind, LiquidKind, VesselShape } from './graphics/scene/types.js';

// The drawings live in graphics/; the scene puts them together and moves the live parts.
export type { DeviceKind, LiquidKind, VesselShape } from './graphics/scene/types.js';
export { liquidColor } from './graphics/scene/colors.js';
export { vesselPreview } from './graphics/scene/vessels.js';

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
  /** Solid pieces lying in the vessel (a metal block): colour and volume, m³. */
  readonly pieces?: readonly { readonly color: string; readonly volume: number; readonly share: number; readonly ball?: boolean }[];
  /** A body hanging on the dynamometer, in the air above the vessel or lowered into the liquid; what the dial shows. */
  readonly hang?: { readonly display: string; readonly into: 'air' | 'liquid'; readonly color: string; readonly volume: number; readonly share: number; readonly ball?: boolean };
  /** The level was just read by the marks: a line at the level and the reading. */
  readonly levelMark?: string;
  /** The blackboard on the wall: formulas of the current step with its numbers (latest last). */
  readonly board?: { readonly empty: string; readonly front: string; readonly back: string; readonly lines: readonly { readonly id: string; readonly title: string; readonly formula: string; readonly numbers?: string }[] };
  /** The vessel was just weighed: the scales on the table and what their display shows. */
  readonly scale?: { readonly look: 'kitchen-scale' | 'lab-balance'; readonly display: string };
  /** `act` — an idle scene the Professor plays when nobody does anything ("pace", "glasses"…). */
  readonly professor: { readonly mood: Mood; readonly says: string; readonly act?: string };
}

const NS = 'http://www.w3.org/2000/svg';

export interface Scene {
  readonly element: HTMLElement;
  /** Is the Professor reading the blackboard (the table moved aside)? */
  readonly reading: boolean;
  render(view: SceneView): void;
}


export function createScene(): Scene {
  const root = document.createElement('div');
  root.className = 'scene';
  // The blackboard hangs on the wall behind everything on the table (the drawing's wall is see-through);
  // a button pulls it to the front to read it all, and back.
  root.innerHTML = `<div class="scene-stage"><div class="table-buttons"><button type="button" class="board-toggle"></button></div><div class="board" id="sc-board" aria-live="polite"><div class="board-lines"></div><div class="board-empty"></div></div><svg class="scene-svg" viewBox="0 ${VIEW_TOP} ${W} ${H - VIEW_TOP}" role="img"></svg><div class="scene-prof"><div class="bubble" id="sc-says"></div><div class="prof" id="sc-prof"></div><div class="prof-side" id="sc-prof-side"></div></div></div>`;
  const svg = root.querySelector('svg')!;
  const says = root.querySelector<HTMLElement>('#sc-says')!;
  const prof = root.querySelector<HTMLElement>('#sc-prof')!;
  const profSide = root.querySelector<HTMLElement>('#sc-prof-side')!;
  let key = '';
  let mood: Mood | null = null;
  let act = '';
  const profBox = root.querySelector<HTMLElement>('.scene-prof')!;
  let geom: VesselGeom | null = null;
  let scaleKey = '';
  const board = root.querySelector<HTMLElement>('#sc-board')!;
  const boardLines = board.querySelector<HTMLElement>('.board-lines')!;
  const boardEmpty = board.querySelector<HTMLElement>('.board-empty')!;
  /** Lines on the board by id: a new one is written in chalk once, then only its numbers change. */
  const written = new Map<string, HTMLElement>();
  const BOARD_ROWS = 8;
  const boardToggle = root.querySelector<HTMLButtonElement>('.board-toggle')!;
  let boardLabels = { front: '', back: '' };
  const setToggle = () => {
    const reading = root.classList.contains('reading');
    boardToggle.textContent = reading ? boardLabels.back : boardLabels.front;
    boardToggle.setAttribute('aria-pressed', String(reading));
  };
  // Reading the board: the things on the table shrink and move to its right end, the Professor
  // steps back to the left, turns side-on and reads.
  boardToggle.onclick = () => {
    root.classList.toggle('reading');
    setToggle();
  };
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
    scaleKey = '';
    svg.innerHTML = `
      <defs>
        <clipPath id="sc-in"><path d="${g.inner}"/></clipPath>
        <clipPath id="sc-liq"><rect id="sc-liq-rect" x="0" y="${g.bottom}" width="${W}" height="0"/></clipPath>
        <linearGradient id="sc-steam" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      </defs>
      <rect class="wall" x="-800" y="-200" width="${W + 1600}" height="${TABLE + 200}"/>
      <rect class="table" x="-800" y="${TABLE}" width="${W + 1600}" height="${H - TABLE + 200}"/>
      <path class="table-edge" d="M-800,${TABLE} H${W + 800}"/>
      <g class="items">
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
          <g id="sc-pieces" class="pieces"></g>
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
      </g>
      <g id="sc-scale" class="scales"></g>
      <g id="sc-dyn" class="dyn"></g>
      <g id="sc-mark" class="level-mark"></g>
      </g>`;
  }

  return {
    element: root,
    get reading() {
      return root.classList.contains('reading');
    },
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
      // Bodies in the liquid, side by side: on the bottom if they sink, at the surface if they float
      // (the share under water as by Archimedes). A 10 cm³ block is about 22 units wide; narrow vessels squeeze them.
      const pk = `${(v.pieces ?? []).map((x) => `${x.color}:${x.volume.toExponential(2)}:${x.share.toFixed(2)}`).join('|')}@${Math.round(level)}`;
      const pg = $<SVGGElement>('sc-pieces');
      if (pg && pg.dataset['k'] !== pk) {
        pg.dataset['k'] = pk;
        pg.innerHTML = blocksSvg(v.pieces ?? [], g, level);
      }
      // The dynamometer with its body, and the level mark.
      const hk = v.hang ? `${v.hang.display}|${v.hang.into}|${v.hang.color}|${v.hang.volume}|${Math.round(level)}` : '';
      const dyn = $<SVGGElement>('sc-dyn');
      if (dyn && dyn.dataset['k'] !== hk) {
        dyn.dataset['k'] = hk;
        dyn.innerHTML = v.hang ? dynamometerSvg(v.hang, g, level) : '';
      }
      const mk = v.levelMark ? `${v.levelMark}|${Math.round(level)}` : '';
      const mark = $<SVGGElement>('sc-mark');
      if (mark && mark.dataset['k'] !== mk) {
        mark.dataset['k'] = mk;
        mark.innerHTML = v.levelMark ? `<path class="level-line" d="M${g.left - 6},${level} H${g.right + 10}"/><path class="level-arrow" d="M${g.right + 22},${level} l-9,-5 v10 z"/><text class="level-text" x="${g.right + 26}" y="${level + 4}">${v.levelMark}</text>` : '';
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
      // The blackboard: the latest few formulas; a line no longer there is wiped.
      const lines = (v.board?.lines ?? []).slice(-BOARD_ROWS);
      const keep = new Set(lines.map((l) => l.id));
      for (const [id, e] of written) if (!keep.has(id)) (e.remove(), written.delete(id));
      lines.forEach((l, idx) => {
        let e = written.get(l.id);
        if (!e) {
          e = document.createElement('div');
          e.className = 'board-line chalk-in';
          e.innerHTML = '<div class="bl-title"></div><div class="bl-formula"></div><div class="bl-numbers"></div>';
          written.set(l.id, e);
        }
        // The latest at the bottom; move a line only when the order changed (moving restarts its chalk).
        if (boardLines.children[idx] !== e) boardLines.insertBefore(e, boardLines.children[idx] ?? null);
        const [ti, fo, nu] = Array.from(e.children) as HTMLElement[];
        if (ti!.textContent !== l.title) ti!.textContent = l.title;
        if (fo!.textContent !== l.formula) fo!.textContent = l.formula;
        // The numbers come when the formula has done its work — written in chalk too.
        const num = l.numbers ? `= ${l.numbers}` : '';
        if (nu!.textContent !== num) {
          if (num && !nu!.textContent) {
            nu!.classList.add('chalk-in');
            // The Professor, reading the board, nods at the numbers.
            if (root.classList.contains('reading')) {
              profBox.classList.remove('nod');
              void profBox.offsetWidth;
              profBox.classList.add('nod');
            }
          }
          nu!.textContent = num;
        }
      });
      boardEmpty.textContent = lines.length ? '' : (v.board?.empty ?? '');
      if (v.board && (v.board.front !== boardLabels.front || v.board.back !== boardLabels.back)) {
        boardLabels = { front: v.board.front, back: v.board.back };
        setToggle();
      }
      board.hidden = !v.board;
      boardToggle.hidden = !v.board;
      // Scales: appear when the vessel was weighed, with a small copy of it on the platform.
      const sc = $<SVGGElement>('sc-scale');
      const scKey = v.scale ? [v.scale.look, v.vessel, v.material, v.liquid, Math.round(v.fill * 20), v.solid >= 1].join('|') : '';
      if (sc && scKey !== scaleKey) {
        scaleKey = scKey;
        sc.innerHTML = v.scale ? scalesSvg(v.scale.look, vesselPreview(v.vessel, v.material, v.solid >= 1 ? 'other' : v.liquid, Math.min(1, v.fill))) : '';
      }
      sc?.classList.toggle('on', !!v.scale);
      // The vessel moved onto the scales: it is not on the device meanwhile.
      root.classList.toggle('weighing', !!v.scale);
      const scText = $('sc-scale-text');
      if (scText && v.scale) scText.textContent = v.scale.display;
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
        profSide.innerHTML = professorSideSvg(mood, 110);
      }
      // An idle scene: one CSS class on the figure; a new scene restarts its animation.
      const nextAct = v.professor.act ?? '';
      if (nextAct !== act) {
        if (act) profBox.classList.remove(`act-${act}`);
        act = nextAct;
        if (act) {
          void profBox.offsetWidth;
          profBox.classList.add(`act-${act}`);
        }
      }
      if (says.textContent !== v.professor.says) says.textContent = v.professor.says;
      says.hidden = !v.professor.says;
    },
  };
}
