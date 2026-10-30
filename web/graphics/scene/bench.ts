import { CM, THREAD, standSvg, blockSvg, dynamometerSvg } from './kit.js';
import type { ExperimentKind } from '../../../src/experiments/index.js';
import { sceneOf } from '../../experiments/index.js';

/**
 * The bench, drawn on the table instead of the vessel: every experiment of it is a module (web/experiments) with
 * its own view and drawing; here — only what every bench shares: a body weighed on the dynamometer hanging from the
 * stand. Sizes follow the real ones: 1 cm of the apparatus is 6 units of the drawing.
 */
export interface BenchView {
  readonly kind: ExperimentKind;
  /** The block hanging on a dynamometer to be weighed: what it shows. */
  readonly hang?: string;
  /** The block's edges, m (the one weighed on the dynamometer). */
  readonly block: readonly [number, number, number];
  /** An experiment module's own view (web/experiments), drawn by its scene. */
  readonly scene?: unknown;
}

/** A dynamometer hanging from the stand with the block on its hook (weighing the block). */
function hangingBlock(display: string, block: readonly [number, number, number]): string {
  const rodX = 230;
  const armX = 330;
  const armY = 40;
  const w = block[0] * 100 * CM;
  const h = block[2] * 100 * CM;
  return `${standSvg(rodX, armX, armY)}${dynamometerSvg(armX, armY + 6, false, display)}<path d="M${armX},${armY + 86} v24" style="stroke:${THREAD};stroke-width:1.5"/>${blockSvg(armX - w / 2, armY + 110 + h, block)}`;
}

export function benchSvg(v: BenchView): string {
  // (A body weighed on the dynamometer: drawn here, the same on every bench.)
  if (v.hang) return hangingBlock(v.hang, v.block);
  const scene = sceneOf(v.kind);
  return scene && v.scene !== undefined ? scene.svg(v.scene) : '';
}
