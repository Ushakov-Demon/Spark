import { INNER, PLANETS, planetIds } from '../../../src/experiments/solar-system-model/bench.js';
import { tr } from '../../../src/knowledge/i18n.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, PLASTICINE, springSvg, STEEL, THREAD, weightsSvg, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The Solar System's model: the field with the Sun-ball and the planets laid out (`marks`, as many as are out so far;
 * the field shows `range` metres); the orbits seen from above, the planets `years` on; Voyager's view back (`dark` —
 * how far the frame has gone dark, `dot` — the pale blue dot showing).
 */
export type PlanetsView = { readonly view: 'field' | 'orbits' | 'back'; readonly marks: readonly { readonly name: string; readonly distance: number; readonly size: number; readonly read: string; readonly color: string }[]; readonly range: number; readonly sun: string; readonly years?: number; readonly orbits?: readonly { readonly name: string; readonly a: number; readonly t: number; readonly color: string }[]; readonly dark?: number; readonly dot?: number; readonly caption?: string; readonly note?: string; /** The step just done, to be played. */ readonly anim?: 'ball' | 'inner' | 'outer' | 'kepler' | 'voyager' };

function view({ log, command, locale }: SceneContext): PlanetsView {
  const uk = locale === 'uk';
  const done = log.filter((e) => e.command.type === 'lab.planets');
  const step = (e: (typeof done)[number]) => (e.command as unknown as { step: string }).step;
  const ids = planetIds();
  // (Tenths: «21,5 м · 1,8 мм».)
  const one = (x: number) => new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 1 }).format(x);
  const color: Record<string, string> = { mercury: '#b0a89a', venus: '#e8d39a', earth: '#5a9fd8', mars: '#d9643a', jupiter: '#d8b48a', saturn: '#e6cf8c', uranus: '#9fd8e0', neptune: '#4a6fd8' };
  const marks = done.filter((e) => ['inner', 'outer'].includes(step(e))).flatMap((e) => readingsOf([e]).map((x) => {
    const id = ids[x.record.inputs?.['planet'] ?? 0]!;
    const size = x.record.inputs?.['size'] ?? 0;
    return { name: tr(PLANETS[id].name, locale), distance: x.record.value ?? 0, size, read: `${one(x.record.value ?? 0)} ${uk ? 'м' : 'm'} · ${one(size * 1000)} ${uk ? 'мм' : 'mm'}`, color: color[id]! };
  }));
  const last = command?.type === 'lab.planets' ? (command as unknown as { step: string }).step : undefined;
  const sun = uk ? 'Сонце, 20 см' : 'the Sun, 20 cm';
  const outer = done.some((e) => step(e) === 'outer');
  if (last === 'kepler') {
    const recs = readingsOf([[...done].pop()!]).map((x) => x.record);
    const orbits = recs.filter((r) => INNER.includes(ids[r.inputs?.['planet'] ?? 0]!)).map((r) => { const id = ids[r.inputs?.['planet'] ?? 0]!; return { name: tr(PLANETS[id].name, locale), a: r.inputs?.['a'] ?? 1, t: r.inputs?.['t'] ?? 1, color: color[id]! }; });
    return { view: 'orbits', marks, range: 700, sun, orbits, years: 2, anim: 'kepler', note: uk ? 'Юпітер і далі — за межами малюнка' : 'Jupiter and beyond — off the picture', caption: uk ? 'вид згори, відстані в масштабі' : 'from above, distances to scale' };
  }
  if (last === 'voyager') {
    const v = readingsOf([[...done].pop()!])[0]!.record;
    const probe = { name: uk ? '«Вояджер-1»' : 'Voyager 1', distance: v.value ?? 0, size: 0, read: `${Math.round(v.value ?? 0)} ${uk ? 'м' : 'm'}`, color: '#d8e2ea' };
    return { view: 'back', marks: [...marks, probe], range: 900, sun, dark: 1, dot: 1, anim: 'voyager', note: uk ? 'Земля — менше пікселя' : 'the Earth — less than a pixel' };
  }
  return { view: 'field', marks, range: outer ? 700 : 35, sun, caption: uk ? `поле: ${outer ? 700 : 35} м` : `the field: ${outer ? 700 : 35} m`, ...(last === 'ball' || last === 'inner' || last === 'outer' ? { anim: last } : {}) };
}

/**
 * The Solar System's model. The field: the Sun-ball on the left, a tape along the ground, each planet a dot (drawn
 * bigger than to scale — its true size is in its label) at its distance. The orbits: from above, the inner planets
 * round the Sun at the true ratio of their distances, turning at their true periods. Voyager's view back: the frame
 * goes dark, slanting beams of scattered sunlight cross it, and in one of them — a single pale blue dot.
 */
function planetsSvg(p: PlanetsView): string {
  if (!p) return '';
  if (p.view === 'orbits') {
    const cx = 470;
    const cy = 165;
    const k = 78;
    const sun = `<circle cx="${cx}" cy="${cy}" r="9" style="fill:#ffd54a;stroke:#f0a500;stroke-width:1.5"/>`;
    const rings = (p.orbits ?? []).map((o) => {
      const ang = (2 * Math.PI * (p.years ?? 0)) / o.t - Math.PI / 2;
      const x = cx + o.a * k * Math.cos(ang);
      const y = cy + o.a * k * Math.sin(ang);
      return `<circle cx="${cx}" cy="${cy}" r="${o.a * k}" style="fill:none;stroke:rgba(216,226,234,0.35);stroke-dasharray:3 4"/><circle cx="${x}" cy="${y}" r="4" style="fill:${o.color};stroke:#1d2a36"/><text class="bench-label" x="${x + 7}" y="${y - 6}">${o.name}</text>`;
    }).join('');
    const backdrop = `<circle cx="${cx}" cy="${cy}" r="${1.6 * k}" style="fill:rgba(16,24,20,0.88)"/>`;
    return `${backdrop}${sun}${rings}${p.note ? `<text class="bench-label" x="${cx}" y="${cy + 150}" text-anchor="middle">${p.note}</text>` : ''}${p.caption ? `<text class="bench-reading" x="${cx}" y="${cy - 130}" text-anchor="middle">${p.caption}</text>` : ''}`;
  }
  const ground = TABLE - 18;
  const x0 = 175;
  const x1 = 585;
  const at = (d: number) => x0 + (d / p.range) * (x1 - x0);
  const field = `<path d="M${x0 - 30},${ground + 6} H${x1 + 10}" style="stroke:#7fae6a;stroke-width:3"/><path d="M${x0},${ground + 2} H${x1}" style="stroke:#f1d36b;stroke-width:2;stroke-dasharray:2 3"/><circle cx="${x0 - 12}" cy="${ground - 8}" r="12" style="fill:#ffd54a;stroke:#f0a500;stroke-width:1.5"/><text class="bench-label" x="${x0 - 12}" y="${ground - 26}" text-anchor="middle">${p.sun}</text>`;
  // (Planets too close together for labels — the inner ones on the long field — go unlabelled.)
  let lastLabel = -Infinity;
  const dots = p.marks.map((m, i) => {
    const x = at(m.distance);
    const r = Math.max(2, Math.min(7, 2 + m.size * 300));
    const label = x - lastLabel > 40;
    if (label) lastLabel = x;
    const up = i % 2 === 0;
    return `<circle cx="${x}" cy="${ground - r}" r="${r}" style="fill:${m.color};stroke:#1d2a36;stroke-width:0.8"/>${label ? `<text class="bench-label" x="${x}" y="${up ? ground - 2 * r - 18 : ground - 2 * r - 6}" text-anchor="middle">${m.name}</text>` : ''}`;
  }).join('');
  const scale = `<text class="bench-label" x="${x1}" y="${ground + 22}" text-anchor="end">${p.caption ?? ''}</text>`;
  if (p.view === 'back') {
    // The view back: dark coming over the board, the beams, the dot (a pixel and a half) in the middle beam.
    const d = p.dark ?? 0;
    const beam = (x: number, w: number, o: number) => `<path d="M${x},14 l${w},0 l-150,300 l${-w},0 Z" style="fill:rgba(255,214,150,${o * d})"/>`;
    const dot = p.dot ? `<circle cx="432" cy="168" r="1.6" style="fill:rgba(170,210,255,${p.dot})"/>` : '';
    return `${field}${dots}${scale}<rect x="18" y="12" width="586" height="${ground - 4}" style="fill:rgba(4,6,10,${0.96 * d})"/>${beam(380, 34, 0.18)}${beam(470, 60, 0.26)}${beam(560, 22, 0.14)}${dot}${p.dot && p.note ? `<text class="bench-label" x="440" y="${ground - 20}" style="fill:rgba(200,215,230,${p.dot})">${p.note}</text>` : ''}`;
  }
  return `${field}${dots}${scale}`;
}

/**
 * The Solar System's model: the planets laid out one by one (the field widening to the giants); the orbits turning
 * for two of the Earth's years; Voyager's view back — the field stretching out to it, the dark, then the dot.
 */
function planetsRun(next: PlanetsView, draw: (v: PlanetsView) => void): Motion | null {
  const p = next;
  if (!p.anim) return null;
  const anim = p.anim!;
  // (The ball: a moment with the ruler — every reading waits for its motion to end.)
  const length = anim === 'kepler' ? 6 : anim === 'voyager' ? 5 : anim === 'ball' ? 0.8 : 0.7 * 4;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, ...rest } = p;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(rest);
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'ball') return draw(rest);
      if (anim === 'kepler') return draw({ ...rest, years: (2 * t) / length });
      if (anim === 'voyager') {
        // (1.5 s out along the field to the probe, 2 s of dark coming, then the dot.)
        const out = Math.min(1, t / 1.5);
        return draw({ ...rest, view: t < 1.5 ? 'field' : 'back', range: 700 + 200 * out, dark: Math.max(0, Math.min(1, (t - 1.5) / 2)), dot: Math.max(0, Math.min(1, (t - 3.6) / 1)) });
      }
      // Four planets of the step, 0.7 s each; the giants' field opens out from the inner one's 35 m.
      const before = p.marks.length - 4;
      const shown = before + Math.min(4, Math.floor(t / 0.7) + 1);
      const range = anim === 'outer' ? 35 + (700 - 35) * Math.min(1, t / 0.7) : p.range;
      draw({ ...rest, marks: p.marks.slice(0, shown), range });
    },
  };
}

export const solarSystemScene = defineScene({ kind: 'planets', view, svg: planetsSvg, motion: planetsRun });
