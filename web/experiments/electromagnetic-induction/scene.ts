import { ZERO_METER } from '../../../src/experiments/electromagnetic-induction/bench.js';
import { inductShown } from '../../../src/experiments/electromagnetic-induction/words.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** Induction: how the magnet (or the coil) moved and which pole faces the coil; the meter's swing (−1…1 of its scale) and reading. */
export type InductView = { readonly move: 'still' | 'in' | 'out' | 'coil' | 'none'; readonly pole: 'N' | 'S'; readonly swing: number; readonly read?: string };

function view({ last, command, locale }: SceneContext): InductView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const ic = command?.type === 'lab.induct' ? (command as unknown as { move: 'still' | 'in' | 'out' | 'coil'; pole: 'N' | 'S' }) : undefined;
  const I = ic && r ? r.value : null;
  return { move: ic?.move ?? 'none', pole: ic?.pole ?? 'N', swing: I === null ? 0 : I / ZERO_METER.max.value, ...(ic && r ? { read: inductShown(r.value, locale) } : {}) };
}

/**
 * Induction: the coil lying on the table, its axis left–right, wires to a milliammeter with its zero in the middle;
 * the bar magnet (north red, south blue) at the end of its move — in the coil or out to the left — the pole named
 * facing the coil; an arrow shows the move.
 */
function inductSvg(d: InductView): string {
  const y = TABLE - 70;
  const cx = 380;
  const move = d?.move ?? 'none';
  const coil = `<rect x="${cx - 22}" y="${y - 26}" width="44" height="52" rx="6" style="fill:#b0703a;stroke:#7a4a22"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${cx - 20 + i * 4.4},${y - 26} v52" style="stroke:#d4893a;stroke-width:1.4"/>`).join('')}<ellipse cx="${cx - 22}" cy="${y}" rx="5" ry="20" style="fill:#5a3416"/>`;
  // The magnet: 100 px long; inside — centred in the coil; out — away to the left.
  const mx = move === 'out' || move === 'none' ? cx - 150 : cx;
  const near = d?.pole ?? 'N';
  const far = near === 'N' ? 'S' : 'N';
  const color = (p: string) => (p === 'N' ? '#c0392b' : '#2563eb');
  const magnet = `<rect x="${mx - 50}" y="${y - 8}" width="50" height="16" style="fill:${color(far)}"/><rect x="${mx}" y="${y - 8}" width="50" height="16" style="fill:${color(near)}"/><text class="lever-mark" x="${mx - 40}" y="${y + 4}" style="fill:#fff;font-weight:700;font-size:10px">${far}</text><text class="lever-mark" x="${mx + 38}" y="${y + 4}" style="fill:#fff;font-weight:700;font-size:10px">${near}</text>`;
  // In the coil the magnet's right half is hidden behind the winding's front.
  const front = move === 'out' || move === 'none' ? '' : `<rect x="${cx - 22}" y="${y - 26}" width="44" height="52" rx="6" style="fill:#b0703a;opacity:0.85"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${cx - 20 + i * 4.4},${y - 26} v52" style="stroke:#d4893a;stroke-width:1.4;opacity:0.85"/>`).join('')}`;
  const arrow = move === 'in' ? `<path class="bench-arrow" d="M${cx - 120},${y - 40} H${cx - 40} m-8,-5 l8,5 l-8,5"/>` : move === 'out' ? `<path class="bench-arrow" d="M${cx - 40},${y - 40} H${cx - 120} m8,-5 l-8,5 l8,5"/>` : move === 'coil' ? `<path class="bench-arrow" d="M${cx + 90},${y - 40} H${cx + 30} m8,-5 l-8,5 l8,5"/>` : '';
  // The milliammeter: zero up in the middle, the needle ±60° over its scale.
  const gx = 530;
  const gy = TABLE - 120;
  const a = (Math.max(-1, Math.min(1, d?.swing ?? 0)) * Math.PI) / 3;
  const ticks = Array.from({ length: 11 }, (_, k) => {
    const t = ((k - 5) / 5) * (Math.PI / 3);
    return `<path d="M${gx + 30 * Math.sin(t)},${gy - 30 * Math.cos(t)} L${gx + (k % 5 === 0 ? 24 : 27) * Math.sin(t)},${gy - (k % 5 === 0 ? 24 : 27) * Math.cos(t)}" style="stroke:#333;stroke-width:0.9"/>`;
  }).join('');
  const meter = `<rect x="${gx - 40}" y="${gy - 42}" width="80" height="56" rx="6" style="fill:#f4f1e8;stroke:${DARK};stroke-width:2"/>${ticks}<text class="lever-mark" x="${gx}" y="${gy - 8}" text-anchor="middle" style="font-size:9px">0</text><path d="M${gx},${gy + 4} L${gx + 28 * Math.sin(a)},${gy + 4 - 28 * Math.cos(a)}" style="stroke:#c0392b;stroke-width:1.8"/><circle cx="${gx}" cy="${gy + 4}" r="2.5" style="fill:${DARK}"/><text class="lever-mark" x="${gx}" y="${gy + 11}" text-anchor="middle" style="font-size:8px">mA</text>${d?.read ? `<text class="bench-reading" x="${gx}" y="${gy - 50}" text-anchor="middle">${d.read}</text>` : ''}`;
  const wire = Math.abs(d?.swing ?? 0) > 0.01 ? '#e2b04a' : '#9aa3ad';
  const wires = `<path d="M${cx + 18},${y + 26} V${TABLE - 12} H${gx + 20} V${gy + 14}" style="fill:none;stroke:${wire};stroke-width:2"/><path d="M${cx - 18},${y + 26} V${TABLE - 6} H${gx - 20} V${gy + 14}" style="fill:none;stroke:${wire};stroke-width:2"/>`;
  return `${wires}${coil}${magnet}${front}${arrow}${meter}`;
}

export const electromagneticInductionScene = defineScene({ kind: 'induct', view, svg: inductSvg, motion: () => null });
