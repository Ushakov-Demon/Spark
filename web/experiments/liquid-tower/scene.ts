import { TOWER_LIQUIDS, type TowerBody, towerLiquidName } from '../../../src/experiments/liquid-tower/bench.js';
import { tr } from '../../../src/knowledge/i18n.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The tower's cylinder: 11 units to the centimetre; 250 mL across 3.8 cm inside — 50 mL is 4.4 cm of it. */
const TOWER_X = 500;
const TOWER_PX_PER_ML = (11 * 4.41) / 50;
const TOWER_COLORS = ['rgba(240,214,140,0.85)', 'rgba(74,144,217,0.75)', 'rgba(232,197,71,0.85)', 'rgba(224,108,140,0.7)'];
/** The bodies: a grey hexagon nut; a clear bluish square; a white piece; a wooden cube — 1 cm or so, side by side. */
const TOWER_BODY: Record<'nut' | 'acrylic' | 'hdpe' | 'pine', { dx: number; h: number; svg: (x: number, y: number) => string }> = {
  nut: { dx: 0, h: 7, svg: (x, y) => `<rect x="${x - 8}" y="${y - 7}" width="16" height="7" rx="1" style="fill:#7d858d;stroke:#3a3f46"/><path d="M${x - 3},${y - 7} v7 M${x + 3},${y - 7} v7" style="stroke:#3a3f46;stroke-width:0.8"/>` },
  acrylic: { dx: -9, h: 9, svg: (x, y) => `<rect x="${x - 5}" y="${y - 9}" width="10" height="9" rx="1" style="fill:rgba(200,235,255,0.85);stroke:#1f6fa8;stroke-width:1.2"/>` },
  hdpe: { dx: 9, h: 6, svg: (x, y) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="6" rx="1" style="fill:#fafafa;stroke:#555;stroke-width:1"/>` },
  pine: { dx: 0, h: 11, svg: (x, y) => `<rect x="${x - 6}" y="${y - 11}" width="12" height="11" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>` },
};
/** Where a body's bottom is drawn when it rests: `share` of it below the mark (on the bottom: on the glass). */
const towerBodyHeight = (b: 'nut' | 'acrylic' | 'hdpe' | 'pine') => TOWER_BODY[b].h;

/**
 * The liquid tower: how many layers are poured (2.5 — the third half-way); the bodies in the cylinder, each
 * where it is (mL mark of its bottom… or resting: `share` of it below the mark), the names of the liquids.
 */
export type TowerView = { readonly poured: number; readonly bodies: readonly { readonly body: 'nut' | 'acrylic' | 'hdpe' | 'pine'; readonly at: number }[]; readonly names: readonly string[]; readonly ml: string; /** What has just happened, to be played: the pouring, or the last body going in. */ readonly anim?: 'pour' | 'drop' };

function view({ log, command, locale }: SceneContext): TowerView {
  const done = log.filter((e) => e.command.type === 'lab.tower');
  const poured = done.some((e) => (e.command as unknown as { step: string }).step === 'pour') ? 4 : 0;
  const bodies = done
    .filter((e) => (e.command as unknown as { step: string }).step === 'drop')
    .map((e) => {
      const body = (e.command as unknown as { body: TowerBody }).body;
      const rec = readingsOf([e])[0]!.record;
      const h = towerBodyHeight(body) / TOWER_PX_PER_ML;
      return { body, at: (rec.value ?? 0) * 1e6 - (rec.inputs?.['share'] ?? 0) * h };
    });
  const lastTower = command?.type === 'lab.tower' ? (command as unknown as { step: 'pour' | 'drop' }).step : undefined;
  const names = TOWER_LIQUIDS.map((l) => tr(towerLiquidName(l), locale));
  return { poured, bodies, names, ml: locale === 'uk' ? 'мл' : 'mL', ...(lastTower ? { anim: lastTower } : {}) };
}

function towerSvg(t: TowerView): string {
  const w = 44;
  const bottom = TABLE - 14;
  const k = TOWER_PX_PER_ML;
  const x0 = TOWER_X - w / 2;
  const top = bottom - 250 * k;
  const layers = TOWER_COLORS.map((c, i) => {
    const fill = Math.max(0, Math.min(1, t.poured - i));
    if (!fill) return '';
    const y1 = bottom - 50 * k * (i + fill);
    return `<rect x="${x0 + 2}" y="${y1}" width="${w - 4}" height="${50 * k * fill}" style="fill:${c}"/>`;
  }).join('');
  const names = t.names.map((n, i) => (t.poured >= i + 1 ? `<text class="bench-label" x="${x0 - 8}" y="${bottom - 50 * k * (i + 0.5) + 4}" text-anchor="end">${n}</text>` : '')).join('');
  const marks = [50, 100, 150, 200, 250].map((m) => `<path d="M${x0 + w - 10},${bottom - m * k} h10" style="stroke:#d8e2ea;stroke-width:1"/><text class="bench-label" x="${x0 + w + 6}" y="${bottom - m * k + 4}">${m}</text>`).join('');
  const bodies = t.bodies.map((b) => TOWER_BODY[b.body].svg(TOWER_X + TOWER_BODY[b.body].dx, Math.min(bottom, bottom - b.at * k))).join('');
  const glass = `<rect x="${x0}" y="${top - 6}" width="${w}" height="${bottom - top + 6}" rx="3" style="fill:none;stroke:#9fb4c4;stroke-width:2.5"/><rect x="${x0 - 14}" y="${bottom}" width="${w + 28}" height="8" rx="2" style="fill:${DARK}"/>`;
  return `${layers}${bodies}${glass}${marks}<text class="bench-label" x="${x0 + w + 6}" y="${top - 10}">${t.ml}</text>${names}`;
}

/** The tower: the four liquids poured one after another; or the last body let in from above, slowing to where it rests. */
function towerRun(next: TowerView, draw: (v: TowerView) => void): Motion | null {
  const t = next;
  if (!t.anim) return null;
  const pour = t.anim === 'pour';
  const clock = new Channel(0, 1, { kind: 'steady', speed: pour ? 1 / 4 : 1 / 1.6 }, 1e-4);
  const last = t.bodies[t.bodies.length - 1];
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = clock.value;
      if (pour) return draw({ ...t, poured: 4 * u });
      // (From above the cylinder's top, fast through the light layers, slowing down: an ease-out.)
      const at = last ? 280 + (last.at - 280) * (1 - (1 - u) ** 3) : 0;
      draw({ ...t, bodies: [...t.bodies.slice(0, -1), ...(last ? [{ ...last, at }] : [])] });
    },
  };
}

export const liquidTowerScene = defineScene({ kind: 'tower', view, svg: towerSvg, motion: towerRun });
