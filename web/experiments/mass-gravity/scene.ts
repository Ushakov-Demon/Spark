import { mgInstrument, type MgCommand } from '../../../src/experiments/mass-gravity/bench.js';
import { blockName, massText } from '../../../src/experiments/mass-gravity/shared.js';
import { G } from '../../../src/domains/mechanics/constants.js';
import { gravityForce } from '../../../src/domains/mechanics/formulas.js';
import { tr, type Locale } from '../../../src/knowledge/i18n.js';
import { t } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { SUBSTANCES } from '../../../src/substances/catalog.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { BODY_COLOR, CM, dynamometerSvg, forceGaugeSvg, standSvg, weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A stand with the instrument the force calls for (the lab dynamometer, a force gauge beyond it) and the body of this
 * step: on the table before it, then up on the hook. The body as it is: 100 g weights for whole hundreds of grams up
 * to a kilogram, a small weight under 50 g, else a crate with its mass; a block of a substance at its real size (by
 * the substance's density), its substance and mass under it; larger than the room — smaller and marked so.
 */
type Body =
  | { readonly kind: 'weights'; readonly n: number }
  | { readonly kind: 'small'; readonly label: string }
  | { readonly kind: 'crate'; readonly label: string }
  | { readonly kind: 'block'; readonly side: number; readonly color: string; readonly label: string; readonly scaled: boolean };
export type MgView = {
  readonly body: Body;
  /** 0 — on the table, 1 — on the hook. */
  readonly up: number;
  readonly meter: 'lab' | 'gauge';
  readonly mass: string;
  readonly force?: string;
  readonly labels: { readonly scale: string };
};

const ROD = 360;
const ARM_X = 470;
const ARM = 60;
/** The instrument hangs from the arm; its hook ends this far below the arm. */
const HOOK = ARM + 96;
/** A block's drawn side is kept within these, px (a real size beyond — drawn so and marked). */
const BLOCK_MAX = 120;
const BLOCK_MIN = 8;

function bodyOf(c: MgCommand, l: Locale): Body {
  if (c.body !== 'weights') {
    const s = SUBSTANCES[c.body];
    // The cube's side from its volume, at the drawing's scale (CM px to a centimetre).
    const real = Math.cbrt(c.mass / s.liquid.density.value) * 100 * CM;
    const side = Math.max(BLOCK_MIN, Math.min(BLOCK_MAX, real));
    return { kind: 'block', side, color: BODY_COLOR[c.body] ?? '#c8995a', label: `${tr(blockName(c.body), l).toLowerCase()}, ${massText(c.mass, l)}`, scaled: side !== real };
  }
  const hundreds = Math.round(c.mass / 0.1);
  if (hundreds >= 1 && hundreds <= 10 && Math.abs(c.mass - hundreds * 0.1) < 1e-9) return { kind: 'weights', n: hundreds };
  return { kind: c.mass < 0.05 ? 'small' : 'crate', label: massText(c.mass, l) };
}
const bodyHeight = (b: Body): number => (b.kind === 'weights' ? b.n * 10 : b.kind === 'small' ? 12 : b.kind === 'crate' ? 30 : b.side);

function view({ last, command, plan, locale }: SceneContext): MgView {
  const mine = command?.type === 'lab.mg' ? (command as unknown as MgCommand) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.mg');
  const c = mine ?? (next?.kind === 'bench' ? (next.command as unknown as MgCommand) : undefined) ?? { type: 'lab.mg', mass: 0.1, body: 'weights' };
  const base = { body: bodyOf(c, locale), mass: `m = ${massText(c.mass, locale)}`, labels: { scale: t(locale, 'mass-gravity-scene-scale') } };
  const r = mine && last ? readingsOf([last])[0]?.record : undefined;
  if (!r) return { ...base, up: 0, meter: mgInstrument(gravityForce(c.mass, G)) === 'force-gauge' ? 'gauge' : 'lab' };
  return { ...base, up: 1, meter: r.instrument === 'force-gauge' ? 'gauge' : 'lab', force: formatMeasured('force', r.value, r.inputs?.['division'] ?? 0.1, locale) };
}

function svg(v: MgView): string {
  const h = bodyHeight(v.body);
  // From the table up to the hook (a short thread between).
  const onTable = TABLE - h;
  const hung = HOOK + 10;
  const top = onTable + (hung - onTable) * v.up;
  const x = ARM_X;
  const b = v.body;
  const body =
    b.kind === 'weights'
      ? weightsSvg(x, top, b.n, 28, 10)
      : b.kind === 'small'
        ? `<rect x="${x - 6}" y="${top}" width="12" height="12" rx="2" style="fill:#c9a227;stroke:#7a6533"/><text class="bench-reading" x="${x + 12}" y="${top + 10}">${b.label}</text>`
        : b.kind === 'crate'
          ? `<rect x="${x - 22}" y="${top}" width="44" height="30" rx="2" style="fill:#9a6b33;stroke:#5e3f1a;stroke-width:1.5"/><path d="M${x - 22},${top + 10} h44 M${x - 22},${top + 20} h44" style="stroke:#5e3f1a;stroke-width:0.8"/><text class="bench-reading" x="${x}" y="${top + 19}" text-anchor="middle">${b.label}</text>`
          : `<rect x="${x - b.side / 2}" y="${top}" width="${b.side}" height="${b.side}" rx="1.5" style="fill:${b.color};stroke:rgba(0,0,0,0.45);stroke-width:1.2"/><text class="bench-reading" x="${x}" y="${v.up >= 1 ? top + b.side + 16 : top - 8}" text-anchor="middle">${b.label}${b.scaled ? ` (${v.labels.scale})` : ''}</text>`;
  // The thread from the hook, once it hangs.
  const thread = v.up >= 1 ? `<path d="M${x},${HOOK} V${top}" style="stroke:#3a3f46;stroke-width:2"/>` : '';
  const meter = v.meter === 'gauge' ? forceGaugeSvg(x, ARM + 6, v.force ?? '') : `${dynamometerSvg(x, ARM + 6, false, v.force ?? '')}<path d="M${x},${ARM + 86} V${HOOK}" style="stroke:#3a3f46;stroke-width:2"/>`;
  // (The force is on the instrument itself, and on the board.)
  const reading = `<text class="bench-reading" x="596" y="${ARM + 12}" text-anchor="end">${v.mass}</text>`;
  return `${standSvg(ROD, ARM_X + 6, ARM)}${meter}${thread}${body}${reading}`;
}

/** The body goes up from the table onto the hook (about 1.2 s); the reading comes when it hangs. */
function motion(next: MgView, draw: (v: MgView) => void): Motion | null {
  if (!next.force) return null;
  const { force: _f, ...still } = next;
  void _f;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / 1.2 }, 1e-6);
  return { channels: [clock], frame: (done) => draw(done ? next : { ...still, up: clock.value }) };
}

export const massGravityScene = defineScene({ kind: 'mg', view, svg, motion });
