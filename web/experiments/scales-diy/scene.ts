import { scalesMasses, scalesSequence, scalesTilt, type ScalesLoad } from '../../../src/experiments/scales-diy/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, PLASTICINE, springSvg, STEEL, THREAD, weightsSvg, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * Home-made scales: what lies in the cups (`load`), the beam's tilt (degrees, + — the left cup down; without it, from
 * the masses), the syringe over the right cup while water goes in; `units` — «г», «мл».
 */
export type ScalesView = { readonly load: ScalesLoad; readonly angle?: number; readonly syringe?: boolean; readonly units: readonly [string, string]; readonly read?: string; /** The step just done, to be played. */ readonly anim?: 'zero' | 'check' | 'egg' };

function view({ log, last, command, plan, locale }: SceneContext): ScalesView {
  type Step = 'zero' | 'check' | 'egg';
  const done = log.filter((e) => e.ok && e.command.type === 'lab.scales');
  const lastStep = done.length ? (done[done.length - 1]!.command as unknown as { step: Step }).step : undefined;
  const load = lastStep ? scalesSequence(lastStep).at(-1)! : { plasticine: false, sheet: false, egg: false, sheets: 0, water: 0 };
  const cs = command?.type === 'lab.scales' ? (command as unknown as { step: Step }).step : undefined;
  const r = cs && last ? readingsOf([last]).map((x) => x.record)[0] : undefined;
  const read = r && cs !== 'zero' ? formatMeasured('mass', r.value, 0.001, locale) : undefined;
  return { load, units: locale === 'uk' ? ['г', 'мл'] : ['g', 'mL'], ...(read ? { read } : {}), ...(cs ? { anim: cs } : {}) };
}

/**
 * Home-made scales: a stand with an arm, a thread down to the middle of a 30 cm ruler (the beam, tilting about it),
 * a yoghurt cup hanging upright from each end. In the left cup a folded sheet or an egg, plasticine stuck to its side;
 * in the right one a stack of sheets and water; the syringe above it while water goes in.
 */
function scalesSvg(s: ScalesView): string {
  if (!s) return '';
  const px = 470;
  const py = 136;
  const arm = 110;
  const { left, right } = scalesMasses(s.load);
  const a = s.angle ?? scalesTilt(left, right);
  const r = (-a * Math.PI) / 180;
  const end = (k: -1 | 1) => [px + k * arm * Math.cos(r), py + k * arm * Math.sin(r)] as const;
  const stand = `<rect x="${px + 120}" y="${TABLE - 8}" width="60" height="8" rx="2" style="fill:${DARK}"/><rect x="${px + 147}" y="90" width="6" height="${TABLE - 98}" style="fill:${STEEL}"/><rect x="${px - 4}" y="90" width="157" height="6" rx="2" style="fill:${STEEL}"/><path d="M${px},96 V${py - 4}" style="stroke:${THREAD};stroke-width:1.2"/>`;
  const ticks = Array.from({ length: 31 }, (_, k) => `<path d="M${px - arm + (k * 2 * arm) / 30},${py - 4} v${k % 5 ? 3 : 5}" style="stroke:#5a4a14;stroke-width:0.6"/>`).join('');
  const beam = `<g transform="rotate(${-a} ${px} ${py})"><rect x="${px - arm - 4}" y="${py - 4}" width="${2 * arm + 8}" height="8" rx="1.5" style="fill:#f1d36b;stroke:#a88a2c;stroke-width:0.8"/>${ticks}<circle cx="${px}" cy="${py - 2}" r="2" style="fill:${DARK}"/></g>`;
  const drop = 64;
  const cup = (k: -1 | 1, inside: string, side: string) => {
    const [x, y] = end(k);
    const top = y + drop;
    const h = 44;
    return `<path d="M${x},${y} L${x - 20},${top} M${x},${y} L${x + 20},${top}" style="stroke:${THREAD};stroke-width:1"/>${inside.replace(/\{x\}/g, String(x)).replace(/\{b\}/g, String(top + h))}<path d="M${x - 24},${top} L${x - 17},${top + h} L${x + 17},${top + h} L${x + 24},${top} Z" style="fill:rgba(250,250,247,0.3);stroke:#e4e4dc;stroke-width:1.4"/>${side.replace(/\{x\}/g, String(x)).replace(/\{t\}/g, String(top))}`;
  };
  const l = s.load;
  const leftIn = `${l.sheet ? `<rect x="{x}" y="{b}" width="22" height="9" transform="translate(-11,-11)" style="fill:#ffffff;stroke:#9aa3ab;stroke-width:0.8"/>` : ''}${l.egg ? `<ellipse cx="{x}" cy="{b}" rx="12" ry="16" transform="translate(0,-17)" style="fill:#f3e2c4;stroke:#c9a874;stroke-width:1"/>` : ''}`;
  const leftSide = l.plasticine ? `<ellipse cx="{x}" cy="{t}" rx="5" ry="4" transform="translate(-22,14)" style="fill:${PLASTICINE};stroke:#a64d1f;stroke-width:0.6"/>` : '';
  const stack = Array.from({ length: l.sheets }, (_, k) => `<rect x="{x}" y="{b}" width="26" height="2" transform="translate(-13,${-3 - 2.2 * k})" style="fill:#ffffff;stroke:#9aa3ab;stroke-width:0.4"/>`).join('');
  const water = l.water ? `<rect x="{x}" y="{b}" width="32" height="${1 + 1.4 * l.water}" transform="translate(-16,${-1 - 1.4 * l.water})" style="fill:rgba(90,159,216,0.7)"/>` : '';
  const [rx, ry] = end(1);
  const syringe = s.syringe ? `<g transform="translate(${rx + 6},${ry + 8}) rotate(20)"><rect x="-4" y="-34" width="8" height="30" rx="1" style="fill:rgba(230,240,248,0.9);stroke:#7d858d"/><rect x="-1" y="-4" width="2" height="10" style="fill:#7d858d"/><rect x="-6" y="-40" width="12" height="6" style="fill:#7d858d"/></g>` : '';
  const [g, ml] = s.units;
  const what = [l.sheets ? `${l.sheets} × 5 ${g}` : '', l.water ? `${l.water} ${ml}` : ''].filter(Boolean).join(' + ');
  const note = what ? `<text class="bench-label" x="${rx}" y="${ry + drop + 62}" text-anchor="middle">${what}</text>` : '';
  return `${stand}${beam}${cup(-1, leftIn, leftSide)}${cup(1, `${stack}${water}`, '')}${syringe}${note}${s.read ? `<text class="bench-reading" x="${px}" y="${TABLE - 14}" text-anchor="middle">${s.read}</text>` : ''}`;
}

/**
 * Home-made scales: the step's loads one after another — the plasticine; the sheet or the egg, then the sheets (0.35 s
 * each), then water a millilitre at a time (0.6 s, the syringe over the cup) — the beam swinging to each new tilt.
 */
function scalesRun(next: ScalesView, draw: (v: ScalesView) => void): Motion | null {
  const s = next;
  if (!s.anim) return null;
  const seq = scalesSequence(s.anim!);
  const lengths = seq.map((x, k) => (k === 0 ? 0.8 : x.water !== seq[k - 1]!.water ? 0.6 : x.sheets !== seq[k - 1]!.sheets ? 0.35 : 0.8));
  const total = lengths.reduce((a, b) => a + b, 0) + 0.6;
  const clock = new Channel(0, total, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = s;
  const tilt = (k: number) => { const m = scalesMasses(seq[k]!); return scalesTilt(m.left, m.right); };
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...rest, ...(s.read ? { read: s.read } : {}) });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      let k = 0;
      let at = 0;
      while (k < seq.length - 1 && t >= at + lengths[k]!) at += lengths[k++]!;
      // The beam swings to the new tilt in 0.3 s.
      const u = Math.min(1, (t - at) / 0.3);
      const from = k === 0 ? (s.anim === 'zero' ? 0 : tilt(0)) : tilt(k - 1);
      const angle = from + (tilt(k) - from) * (1 - (1 - u) ** 2);
      draw({ ...rest, load: seq[k]!, angle, syringe: seq[k]!.water > 0 });
    },
  };
}

export const scalesDiyScene = defineScene({ kind: 'scales', view, svg: scalesSvg, motion: scalesRun });
