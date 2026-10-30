import { BENCH_BLOCK } from '../../../src/scenarios/bench-kit.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { blockSvg, CM, rulerSvg, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The block on the table (its edges, m); the edge being measured — 0 length, 1 width, 2 height — and the reading. */
export type PressureView = { readonly block: readonly [number, number, number]; readonly edge?: { readonly index: 0 | 1 | 2; readonly display: string } };

function view({ last, command, locale }: SceneContext): PressureView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = command;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  return c?.type === 'lab.edge' && r ? { block: BENCH_BLOCK.edges, edge: { index: Number(c['edge']) as 0 | 1 | 2, display: show('length', r.value) } } : { block: BENCH_BLOCK.edges };
}

function pressureSvg(v: PressureView): string {
  // Pressure: the block on the table, the ruler at the edge being measured.
  const base = TABLE;
  const x = 250;
  const w = v.block[0] * 100 * CM;
  const h = v.block[2] * 100 * CM;
  const e = v.edge;
  const ruler = !e ? '' : e.index === 2 ? rulerSvg(x + w + 6, base - h, 5, true) : rulerSvg(x, base - h - 30, 15, false);
  const label = e ? `<text class="bench-reading" x="${x + w / 2}" y="${base - h - (e.index === 2 ? 14 : 40)}" text-anchor="middle">${['a', 'b', 'c'][e.index]} = ${e.display}</text>` : '';
  // The width is the depth of the block: drawn as its top face, slanted.
  const depth = v.block[1] * 100 * CM * 0.45;
  const top = `<path d="M${x},${base - h} l${depth},${-depth * 0.6} h${w} l${-depth},${depth * 0.6} z" style="fill:#e6be86;stroke:${WOOD_EDGE}"/><path d="M${x + w},${base} l${depth},${-depth * 0.6} v${-h} l${-depth},${depth * 0.6} z" style="fill:#c4914f;stroke:${WOOD_EDGE}"/>`;
  return `${top}${blockSvg(x, base, v.block)}${e?.index === 1 ? `<path class="bench-mark" d="M${x + w + 2},${base - h} l${depth},${-depth * 0.6}"/>` : ''}${ruler}${label}`;
}

export const blockPressureScene = defineScene({ kind: 'pressure', view, svg: pressureSvg, motion: () => null });
