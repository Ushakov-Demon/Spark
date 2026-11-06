import { Channel, type ProcedureStep } from '../../motion.js';

/**
 * A set of weights on a balance's pan, for any scene with one: how they stand on the pan (`weightsOnPan`) and how they
 * are put there one by one (`placingWeights`).
 */

/** How far a row of weights reaches each way from the pan's middle. */
const PAN_ROW_HALF = 30;

/**
 * The weights on the pan, as a hand puts them: the first in the middle, the next to one side of it, then to the other;
 * what no longer fits in the row stands on top of it, a row higher. Largest first, so each row sits on a wider one.
 * The milligram plates, too thin for any of that, lie in a little pile on top. Each weight has its mass on it, in grams.
 */
export function weightsOnPan(x: number, pan: number, set: readonly number[]): string {
  let base = pan;
  let height = 0;
  let left = 0;
  let right = 0;
  let sideLeft = true;
  let plates = 0;
  return set
    .map((w) => {
      const g = w * 1000;
      if (g < 1) {
        plates += 2.5;
        return `<rect x="${x - 4.5}" y="${base - height - plates}" width="9" height="2.2" rx="0.8" style="fill:#d7dde6;stroke:#6d7177;stroke-width:0.5"/>`;
      }
      const h = 6 + Math.cbrt(g) * 3;
      const wd = 5 + Math.cbrt(g) * 1.9;
      const room = (edge: number) => edge + wd + 1 <= PAN_ROW_HALF;
      if (height > 0 && !room(left) && !room(right)) {
        base -= height;
        height = left = right = 0;
      }
      let at: number;
      if (height === 0) {
        at = x - wd / 2;
        left = right = wd / 2;
      } else if ((sideLeft && room(left)) || !room(right)) {
        at = x - left - 1 - wd;
        left += wd + 1;
        sideLeft = false;
      } else {
        at = x + right + 1;
        right += wd + 1;
        sideLeft = true;
      }
      height = Math.max(height, h);
      return `<rect x="${at}" y="${base - h}" width="${wd}" height="${h}" rx="1.5" style="fill:#c9a43a;stroke:#7a6533"/><text x="${at + wd / 2}" y="${base - h / 2 + 2.4}" text-anchor="middle" style="font:700 6.5px system-ui;fill:#3b2c05">${Math.round(g)}</text>`;
    })
    .join('');
}

/**
 * Weighing by hand: each weight of the set goes on from the largest, and one that tips the beam the other way is taken
 * off again. `on` — the weights on the pan as it goes, `beam` — the beam's tilt in degrees (positive — the load's side
 * is down), swinging towards where the difference sends it, up to its stops; `steps` — the procedure to play. The
 * period and damping are those of the drawing, not measured.
 */
export function placingWeights(mass: number, set: readonly number[]): { readonly on: number[]; readonly beam: Channel; readonly steps: ProcedureStep[] } {
  const on: number[] = [];
  const lean = () => 7 * Math.tanh((mass - on.reduce((a, x) => a + x, 0)) / 0.004);
  const beam = new Channel(0, lean(), { kind: 'damped', period: 1.1, damping: 0.45, min: -10, max: 10 }, 0.05);
  const steps: ProcedureStep[] = [{ delay: 700, apply: () => undefined }];
  let sum = 0;
  for (const w of set) {
    const heavy = sum + w > mass + 0.000005;
    // Grams take a moment to watch; the light milligram plates go on quicker; a weight that tips it over stays a moment longer.
    steps.push({ delay: w >= 0.001 ? 420 : 170, apply: () => (on.push(w), (beam.target = lean())) });
    if (heavy) steps.push({ delay: 620, apply: () => (on.splice(on.lastIndexOf(w), 1), (beam.target = lean())) });
    else sum += w;
  }
  return { on, beam, steps };
}
