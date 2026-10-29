import type { TouchCase } from '../../../src/experiments/contact-forces/bench.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { standSvg, THREAD, weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** Contact and non-contact forces: the case shown and how far it has played (0 — before, 1 — done). */
export type TouchView = { readonly case: string; readonly k: number; readonly read?: string };

function view({ last, command, plan, locale }: SceneContext): TouchView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const tc = command?.type === 'lab.touch' ? (command as unknown as { case: TouchCase }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.touch');
  const which = tc?.case ?? (next?.kind === 'bench' ? (next.command as unknown as { case: TouchCase }).case : 'magnet');
  const acts = r?.inputs?.['acts'] === 1;
  return { case: which, k: tc ? 1 : 0, ...(tc && r ? { read: acts ? (locale === 'uk' ? 'діє без дотику' : 'acts without touching') : locale === 'uk' ? 'без дотику не діє' : 'no force without touching' } : {}) };
}

/**
 * Contact and non-contact forces, one scene a case: the paper clip on its thread leaning to the magnet (across air,
 * or through a card); bits of paper jumping up to the rubbed comb; the block hung just clear of the table, drawn
 * aside without friction; the weight let go, falling. `k` — how far it has played.
 */
function touchSvg(t: TouchView): string {
  if (!t) return '';
  const k = t.k;
  // (Above the block and its pull; elsewhere low on the right.)
  const read = t.read ? `<text class="bench-reading" x="590" y="${t.case === 'lifted' ? TABLE - 70 : TABLE - 16}" text-anchor="end">${t.read}</text>` : '';
  if (t.case === 'magnet' || t.case === 'card') {
    const top = { x: 420, y: 90 };
    const len = 130;
    const a = (22 * k * Math.PI) / 180;
    const cx = top.x + len * Math.sin(a);
    const cy = top.y + len * Math.cos(a);
    const clip = `<path d="M${cx - 4},${cy} v14 a4,4 0 0 0 8,0 v-12 a3,3 0 0 0 -6,0 v10" style="fill:none;stroke:#b8c0c8;stroke-width:2"/>`;
    const magnet = `<rect x="${cx + 24 + (1 - k) * 60}" y="${cy - 4}" width="30" height="22" style="fill:#c0392b"/><rect x="${cx + 54 + (1 - k) * 60}" y="${cy - 4}" width="30" height="22" style="fill:#2e6db4"/><text x="${cx + 39 + (1 - k) * 60}" y="${cy + 11}" text-anchor="middle" style="font:700 10px system-ui;fill:#fff">N</text><text x="${cx + 69 + (1 - k) * 60}" y="${cy + 11}" text-anchor="middle" style="font:700 10px system-ui;fill:#fff">S</text>`;
    const card = t.case === 'card' ? `<rect x="${cx + 14 + (1 - k) * 60}" y="${cy - 40}" width="5" height="80" style="fill:#d8c39a;stroke:#9a7a4a"/>` : '';
    return `${standSvg(top.x - 100, top.x, top.y)}<path d="M${top.x},${top.y} L${cx},${cy}" style="stroke:${THREAD};stroke-width:1.4"/>${clip}${card}${magnet}${read}`;
  }
  if (t.case === 'comb') {
    const combY = TABLE - 70 - (1 - k) * 60;
    const comb = `<rect x="370" y="${combY - 12}" width="120" height="8" rx="2" style="fill:#2b3a4a"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${373 + i * 6},${combY - 4} v10" style="stroke:#2b3a4a;stroke-width:2"/>`).join('')}`;
    const bits = Array.from({ length: 9 }, (_, i) => {
      const x = 380 + i * 12;
      const up = k > 0.5 && i % 3 !== 2 ? Math.min(1, (k - 0.5) * 2.5) : 0;
      const y = TABLE - 4 - up * (TABLE - 4 - (combY + 8));
      return `<rect x="${x - 1}" y="${y - 5}" width="9" height="6" transform="rotate(${(i * 37) % 60 - 30} ${x + 3} ${y - 2})" style="fill:#f4f1e8;stroke:#b9b2a0;stroke-width:0.6"/>`;
    }).join('');
    return `${comb}${bits}${read}`;
  }
  if (t.case === 'lifted') {
    const top = { x: 400, y: 70 };
    const bx = top.x + 50 * k;
    const blockTop = TABLE - 6 - 40;
    const thread = `<path d="M${top.x},${top.y} L${bx},${blockTop}" style="stroke:${THREAD};stroke-width:1.4"/>`;
    const block = `<rect x="${bx - 30}" y="${blockTop}" width="60" height="40" rx="2" style="fill:#c8794a;stroke:#7a4a1f"/>`;
    const gap = `<path d="M${bx - 40},${TABLE - 1} h80" style="stroke:#ffd166;stroke-width:1;stroke-dasharray:3 3"/>`;
    const pull = `<path d="M${bx + 30},${blockTop + 20} h${30 + 10 * k}" style="stroke:${THREAD};stroke-width:1.4"/><path class="bench-arrow" d="M${bx + 66},${blockTop + 6} h26 l-5,-4 m5,4 l-5,4"/>`;
    return `${standSvg(top.x - 100, top.x, top.y)}${thread}${block}${gap}${pull}${read}`;
  }
  // The weight, let go from the hand, falls to the table (the way grows as t²).
  const y0 = 90;
  const y = y0 + (TABLE - 6 - 30 - y0) * k * k;
  const weight = weightsSvg(430, y, 3);
  const arrow = `<path class="bench-mark" d="M470,${y + 6} v34 m-4,-6 l4,6 l4,-6" style="fill:none"/><text class="bench-label" x="478" y="${y + 30}">F</text>`;
  return `${weight}${arrow}${read}`;
}

/** Contact and non-contact forces: each case plays in about 1.5 s (the weight's fall in its own 0.4 s or so, slowed). */
function touchRun(next: TouchView, draw: (v: TouchView) => void): Motion | null {
  const t = next;
  if (!t.read) return null;
  const k = new Channel(0, 1, { kind: 'steady', speed: 0.7 }, 0.001);
  return {
    channels: [k],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = t;
      draw({ ...rest, k: k.value });
    },
  };
}

export const contactForcesScene = defineScene({ kind: 'touch', view, svg: touchSvg, motion: touchRun });
