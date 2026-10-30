import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The ball on the balance, or the groove raised so high (m) and the table with its two chalk marks: where the ball is
 * (0 — at the top of the groove, 0.4 — at its foot, 1 — past the second mark), the frames the phone counted.
 */
export type EnergyView = { readonly weigh: boolean; readonly mass?: string; readonly height: number; readonly at: number; readonly frames?: string; readonly cm?: string };

/** 400 px to the metre (the 50 cm between the marks — 200 px). */
const K = 400;
const FLOOR = TABLE - 6;
const FOOT = 330;
const MARK1 = 345;
const MARK2 = MARK1 + 0.5 * K;
const R = 6;

function view({ last, command, locale }: SceneContext): EnergyView {
  const ec = command?.type === 'lab.energy' ? (command as unknown as { step: string; height?: number }) : undefined;
  const recs = last && ec ? readingsOf([last]).map((x) => x.record) : [];
  if (!ec || ec.step === 'weigh') return { weigh: true, height: 0, at: 0, ...(recs[0] ? { mass: formatMeasured('mass', recs[0].value, 0.00001, locale) } : {}) };
  const n = recs.find((r) => r.inputs?.['which'] === 2)?.inputs?.['frames'] ?? 0;
  return { weigh: false, height: ec.height ?? 0.1, at: 1, cm: locale === 'uk' ? 'см' : 'cm', frames: locale === 'uk' ? `${n} кадр${n % 10 === 1 && n % 100 !== 11 ? '' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'и' : 'ів'}` : `${n} frames` };
}

const ballSvg = (x: number, y: number) => `<defs><radialGradient id="en-steel" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#9aa6b2"/><stop offset="1" stop-color="#1f262d"/></radialGradient></defs><circle cx="${x}" cy="${y}" r="${R}" style="fill:url(#en-steel);stroke:#11161b;stroke-width:0.8"/>`;

function svg(v: EnergyView): string {
  if (v.weigh) {
    const x = 400;
    const top = 286;
    return `<rect class="scale-body lab" x="${x - 60}" y="${top}" width="120" height="${TABLE - top}" rx="6"/><rect class="scale-stem" x="${x - 4}" y="${top - 6}" width="8" height="6"/><ellipse class="scale-pan" cx="${x}" cy="${top - 6}" rx="40" ry="5"/>${v.mass ? ballSvg(x, top - 6 - R - 3) : ballSvg(x + 110, FLOOR - R)}<rect class="scale-lcd" x="${x - 36}" y="${TABLE - 24}" width="72" height="16" rx="2"/><text class="scale-text" x="${x}" y="${TABLE - 12.5}" text-anchor="middle">${v.mass ?? ''}</text>`;
  }
  const top = FLOOR - v.height * K;
  const start = FOOT - 160;
  // The groove: from its raised end down to the table; its stand; the height marked.
  const groove = `<path d="M${start},${top} L${FOOT},${FLOOR}" style="stroke:#9a6b33;stroke-width:5;stroke-linecap:round"/><rect x="${start - 4}" y="${top}" width="5" height="${FLOOR - top}" style="fill:#8d949c"/><path d="M${start - 14},${top} V${FLOOR}" style="stroke:#efe9d2;stroke-dasharray:3 3"/><text class="bench-reading" x="${start - 18}" y="${(top + FLOOR) / 2 + 4}" text-anchor="end">h = ${Math.round(v.height * 100)} ${v.cm ?? ''}</text>`;
  const marks = [MARK1, MARK2].map((x) => `<path d="M${x},${FLOOR + 1} v-10" style="stroke:#ffffff;stroke-width:2.5"/>`).join('') + `<text class="bench-reading" x="${(MARK1 + MARK2) / 2}" y="${FLOOR - 18}" text-anchor="middle">50 ${v.cm ?? ''}</text>`;
  // The ball: down the groove for the first 40 % of the way, then along the table.
  const k = v.at;
  const [bx, by] = k <= 0.4 ? [start + (FOOT - start) * (k / 0.4), top + (FLOOR - top) * (k / 0.4)] : [FOOT + (MARK2 + 20 - FOOT) * ((k - 0.4) / 0.6), FLOOR];
  const ball = ballSvg(bx, by - R - (k <= 0.4 ? 2 : 0));
  // The phone filming the marks, its frame count.
  const phone = `<rect x="${MARK2 + 24}" y="${FLOOR - 70}" width="30" height="54" rx="5" style="fill:#2b2f36;stroke:#111"/><circle cx="${MARK2 + 39}" cy="${FLOOR - 62}" r="3" style="fill:#e74c3c"/><text class="bench-reading" x="${MARK2 + 30}" y="${FLOOR - 78}" text-anchor="middle">🎥 ${v.frames ?? ''}</text>`;
  return `${groove}${marks}${ball}${phone}`;
}

/** The ball let go: down the groove and along the table, played slowly (the phone's slow motion), about 2.5 s. */
function motion(next: EnergyView, draw: (v: EnergyView) => void): Motion | null {
  if (next.weigh) return null;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 0.4 }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      // Speeding up down the groove (from rest), steady on the table.
      const u = clock.value;
      const at = u < 0.5 ? 0.4 * (u / 0.5) ** 2 : 0.4 + 0.6 * ((u - 0.5) / 0.5);
      const { frames: _f, ...rest } = next;
      void _f;
      draw({ ...rest, at });
    },
  };
}

export const rollingEnergyScene = defineScene({ kind: 'energy', view, svg, motion });
