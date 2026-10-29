import { rootBend } from '../../../src/experiments/roots-gravity/bench.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * Roots and gravity: the jar of maize seedlings standing, on its side (`tilt` 0…90°, turning it over), or on the
 * clinostat (`spin` — its turn, degrees); the roots' tips bent down by `bend` degrees; the clock — `minutes`.
 */
export type GraviView = { readonly tilt: number; readonly bend: number; readonly clino?: boolean; readonly spin?: number; readonly minutes?: number; readonly read?: string; /** The step just done, to be played. */ readonly anim?: 'upright' | 'side' | 'clino' };

/** The jar as the last step left it — standing, on its side with the roots bent, on the clinostat. */
function view({ log, command }: SceneContext): GraviView {
  type Step = 'upright' | 'side' | 'clino';
  const done = log.filter((e) => e.command.type === 'lab.gravi');
  const lastStep = done.length ? (done[done.length - 1]!.command as unknown as { step: Step }).step : undefined;
  const recs = done.length ? readingsOf([done[done.length - 1]!]).map((x) => x.record) : [];
  const cg = command?.type === 'lab.gravi' ? (command as unknown as { step: Step }).step : undefined;
  const end = recs.at(-1);
  const read = cg && cg !== 'upright' && end ? `${end.value}°` : undefined;
  const minutes = lastStep && lastStep !== 'upright' ? end?.inputs?.['time'] ?? 120 : undefined;
  return { tilt: lastStep === 'side' ? 90 : 0, bend: lastStep === 'side' ? end?.exact ?? 0 : 0, ...(lastStep === 'clino' ? { clino: true, spin: 0 } : {}), ...(minutes !== undefined ? { minutes } : {}), ...(read ? { read } : {}), ...(cg ? { anim: cg } : {}) };
}

/**
 * Roots and gravity: a glass jar with a paper towel inside, three maize grains against the glass and their roots.
 * The jar turned by `tilt` (on its side at 90°); each root straight from its grain, then its tip bent towards the
 * Earth by `bend` (drawn in the jar's frame, so the bend shows against the floor); on the clinostat the jar on an axle
 * with a little motor. A clock with the minutes since the jar was laid down.
 */
function graviSvg(g: GraviView): string {
  const cx = 470;
  const w = 110;
  const h = 150;
  const turn = g.clino ? 90 + (g.spin ?? 0) : g.tilt;
  // On the table the jar stands (or lies) on it, its centre as high as half its turned height; on the clinostat — on the axle.
  const r = (g.tilt * Math.PI) / 180;
  const cy = g.clino ? 170 : TABLE - 4 - (h / 2) * Math.cos(r) - (w / 2 + 8) * Math.sin(r);
  const jar = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" style="fill:rgba(220,236,245,0.25);stroke:#d8e2ea;stroke-width:2"/><rect x="${-w / 2 + 6}" y="${-h / 2 + 18}" width="${w - 12}" height="${h - 26}" rx="4" style="fill:rgba(250,250,247,0.5)"/><rect x="${-w / 2 - 3}" y="${-h / 2 - 10}" width="${w + 6}" height="12" rx="3" style="fill:#8d949c"/>`;
  // Three grains; their roots grow along the jar (+y in its frame), then the tip turns towards the real down: on its
  // side (turned 90° clockwise) that is the jar's +x, so the tip goes (sin b, cos b) of the jar's frame.
  const b = ((g.clino ? 0 : g.bend) * Math.PI) / 180;
  const roots = [-34, 0, 34].map((x) => {
    const y0 = -h / 2 + 34;
    const y1 = y0 + 8 + 56;
    const tip = 18;
    return `<ellipse cx="${x}" cy="${y0}" rx="8" ry="10" style="fill:#f2c94c;stroke:#c9a227"/><path d="M${x},${y0 + 8} V${y1} Q${x},${y1 + tip * 0.5} ${x + tip * Math.sin(b)},${y1 + tip * Math.cos(b)}" style="fill:none;stroke:#fbf6e9;stroke-width:3;stroke-linecap:round"/>`;
  }).join('');
  const body = `<g transform="translate(${cx},${cy}) rotate(${turn})">${jar}${roots}</g>`;
  const stand = g.clino ? `<rect x="${cx - 8}" y="${cy}" width="16" height="${TABLE - cy}" style="fill:${STEEL}"/><rect x="${cx - 40}" y="${TABLE - 10}" width="80" height="10" rx="2" style="fill:${DARK}"/><circle cx="${cx}" cy="${cy}" r="9" style="fill:${DARK}"/>` : '';
  const clock = g.minutes !== undefined ? `<g transform="translate(${cx + 110},100)"><circle r="20" style="fill:#fbf8ef;stroke:${DARK};stroke-width:1.5"/><path d="M0,0 L${14 * Math.sin((g.minutes / 60) * 2 * Math.PI)},${-14 * Math.cos((g.minutes / 60) * 2 * Math.PI)}" style="stroke:${DARK};stroke-width:1.6"/><text y="36" text-anchor="middle" class="bench-reading">${Math.floor(g.minutes / 60)}:${String(Math.round(g.minutes) % 60).padStart(2, '0')}</text></g>` : '';
  return `${stand}${body}${clock}${g.read ? `<text class="bench-reading" x="${cx + 110}" y="150" text-anchor="middle">${g.read}</text>` : ''}`;
}

/**
 * Roots and gravity: the jar laid on its side (1 s), then two hours in 6 s — the clock running, the root tips
 * bending by the measured law; on the clinostat the jar spinning (sped up) and the roots staying straight.
 */
function graviRun(g: GraviView, draw: (v: GraviView) => void): Motion | null {
  if (!g.anim) return null;
  const anim = g.anim;
  const length = anim === 'upright' ? 0.8 : anim === 'side' ? 7 : 6;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = g;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...rest, ...(g.read ? { read: g.read } : {}) });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'upright') return draw(rest);
      if (anim === 'side') {
        if (t < 1) return draw({ ...rest, tilt: 90 * t, bend: 0, minutes: 0 });
        const minutes = Math.min(120, ((t - 1) / 6) * 120);
        return draw({ ...rest, tilt: 90, bend: rootBend(minutes), minutes });
      }
      const minutes = Math.min(120, (t / 6) * 120);
      draw({ ...rest, spin: (t * 120) % 360, minutes });
    },
  };
}

export const rootsGravityScene = defineScene({ kind: 'gravi', view, svg: graviSvg, motion: graviRun });
