import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, dynamometerSvg, STEEL, THREAD, weightsSvg } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The lever (grade 8): weights on the left so far out, on the right weights or the dynamometer (what it shows); how it tips (−1 left down, 0 level, 1 right down). */
type Lever = { readonly left: { readonly weights: number; readonly at: number }; readonly right: { readonly weights?: number; readonly at: number; readonly dynamometer?: string }; readonly tip: number };
/** The lever once a step is done; before it — the bare lever (null). */
export type LeverView = Lever | null;

function view({ last, command, locale }: SceneContext): LeverView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const lc = command?.type === 'lab.lever' ? (command as unknown as { left: { weights: number; at: number }; right: { weights?: number; at: number; dynamometer?: true } }) : undefined;
  return lc && r ? { left: lc.left, right: lc.right.dynamometer ? { at: lc.right.at, dynamometer: show('force', r.value) } : { at: lc.right.at, weights: lc.right.weights ?? 0 }, tip: r.inputs?.['tip'] ?? 0 } : null;
}

/**
 * The lever ruler on its axis in the stand: holes every 5 cm, the weights hanging on threads, the dynamometer
 * pulling down on the right. Tipped a few degrees to the heavier side when the moments differ.
 */
function leverSvg(lv: LeverView): string {
  const ax = 330;
  // Low on the stand: the board's writing stays clear above it.
  const ay = 200;
  const U = 7.5; // units per cm
  const half = 21 * U;
  const tilt = (lv?.tip ?? 0) * 8;
  const holes = Array.from({ length: 9 }, (_, i) => (i - 4) * 5 * U).map((x) => `<circle cx="${ax + x}" cy="${ay}" r="1.8" style="fill:${DARK}"/>`).join('');
  const marks = [5, 10, 15, 20].flatMap((c) => [-c, c]).map((c) => `<text class="lever-mark" x="${ax + c * U}" y="${ay - 7}" text-anchor="middle">${Math.abs(c)}</text>`).join('');
  const hang = (cmFromAxis: number, n: number) => {
    const x = ax + cmFromAxis * U;
    return `<path d="M${x},${ay + 3} v26" style="stroke:${THREAD};stroke-width:1.3"/>${weightsSvg(x, ay + 29, n, 18, 9)}`;
  };
  const left = lv ? hang(-lv.left.at * 100, lv.left.weights) : '';
  const r = lv?.right;
  const right = !r ? '' : r.dynamometer !== undefined
    ? (() => {
        const x = ax + r.at * 100 * U;
        return `<path d="M${x},${ay + 3} v12" style="stroke:${THREAD};stroke-width:1.3"/>${dynamometerSvg(x, ay + 15, false, r.dynamometer)}<path d="M${x},${ay + 95} v16" style="stroke:${THREAD};stroke-width:1.3"/><path class="bench-arrow" d="M${x + 22},${ay + 70} v30 l-4,-6 m4,6 l4,-6"/>`;
      })()
    : hang(r.at * 100, r.weights ?? 0);
  return `<rect x="${ax - 40}" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="${ax - 3}" y="${ay}" width="6" height="${TABLE - 8 - ay}" style="fill:${STEEL}"/><g transform="rotate(${tilt} ${ax} ${ay})"><rect x="${ax - half}" y="${ay - 5}" width="${2 * half}" height="10" rx="2" style="fill:#e9d9a8;stroke:#a8955a"/>${holes}${marks}${left}${right}</g><circle cx="${ax}" cy="${ay}" r="4.5" style="fill:${DARK}"/>`;
}

export const leverMomentsScene = defineScene({ kind: 'lever', view, svg: leverSvg, motion: () => null });
