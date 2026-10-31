import { scaleText } from '../../../src/experiments/map-scale/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { parsePlace } from '../../../src/scenarios/place.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A map on the table: its scale, the two towns' dots (as far apart as on the map, a pixel a millimetre, kept within the
 * sheet; turned as the towns lie — north up), the ruler laid between them and what it read.
 */
export type MapView = { readonly scale: string; readonly a: string; readonly b: string; readonly dx: number; readonly dy: number; readonly onMap: number; readonly read?: string; readonly laid?: number };

/** The sheet: 360 × 220 px; a pixel a millimetre of the map, at most the sheet's width. */
const W = 360;
const H = 200;
const X0 = 240;
const Y0 = TABLE - 20 - H;

function view({ last, command, plan, locale }: SceneContext): MapView {
  type Cmd = { from: string; to: string; scale: number };
  const uk = locale === 'uk';
  const mc = command?.type === 'lab.map' ? (command as unknown as Cmd) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.map');
  const c = mc ?? (next?.kind === 'bench' ? (next.command as unknown as Cmd) : undefined);
  const a = parsePlace(c?.from) ?? { name: '?', lat: 0, lon: 0 };
  const b = parsePlace(c?.to) ?? { name: '?', lat: 0, lon: 1 };
  // The direction from one town to the other, north up (the longitude's degrees shorter away from the equator).
  const ex = (b.lon - a.lon) * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const ny = b.lat - a.lat;
  const n = Math.hypot(ex, ny) || 1;
  const r = mc && last ? readingsOf([last])[0]?.record : undefined;
  const onMap = r?.value ?? (c ? 0 : 0);
  return { scale: c ? scaleText(c.scale, uk) : '', a: a.name, b: b.name, dx: ex / n, dy: -ny / n, onMap, ...(r ? { read: formatMeasured('length', r.value, 0.001, locale) } : {}) };
}

function svg(v: MapView): string {
  // The towns: a pixel a millimetre (kept on the sheet); before the ruler — at a middling distance.
  const px = v.onMap ? Math.min(W - 60, Math.max(8, v.onMap * 1000)) : 160;
  const cx = X0 + W / 2;
  const cy = Y0 + H / 2;
  const ax = cx - (v.dx * px) / 2;
  const ay = cy - (v.dy * px) / 2;
  const bx = cx + (v.dx * px) / 2;
  const by = cy + (v.dy * px) / 2;
  const sheet = `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" rx="4" style="fill:#f3ead2;stroke:#b39b5c;stroke-width:2"/><path d="M${X0 + 20},${Y0 + 150} q80,-40 160,-10 t160,-20" style="fill:none;stroke:#8fb8dd;stroke-width:3;opacity:0.7"/><text x="${X0 + W - 10}" y="${Y0 + H - 10}" text-anchor="end" style="font:600 11px system-ui,sans-serif;fill:#5e3f1a">${v.scale}</text><text x="${X0 + 14}" y="${Y0 + 20}" style="font:600 11px system-ui,sans-serif;fill:#5e3f1a">N ↑</text>`;
  const towns = [[ax, ay, v.a], [bx, by, v.b]].map(([x, y, t]) => `<circle cx="${x}" cy="${y}" r="4" style="fill:#c0392b;stroke:#7d1f16"/><text x="${x}" y="${Number(y) - 8}" text-anchor="middle" style="font:600 11px system-ui,sans-serif;fill:#2b2f36">${t}</text>`).join('');
  // The ruler along the line between the towns, its reading beside it.
  const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  // (Laid on: it comes up from below the sheet, `laid` 0…1.)
  const lift = (1 - (v.laid ?? 1)) * 120;
  const ruler = v.read || v.laid !== undefined ? `<g transform="translate(${ax} ${ay + lift}) rotate(${ang})"><rect x="-6" y="6" width="${px + 12}" height="14" style="fill:rgba(241,227,184,0.92);stroke:#b39b5c"/>${Array.from({ length: Math.floor(px / 10) + 1 }, (_, i) => `<path d="M${i * 10},6 v${i % 5 === 0 ? 7 : 4}" style="stroke:#3d3d3d;stroke-width:0.8"/>`).join('')}</g>${v.read ? `<text class="bench-reading" x="${X0 + W / 2}" y="${Y0 - 8}" text-anchor="middle">l = ${v.read}</text>` : ''}` : '';
  return `${sheet}${ruler}${towns}`;
}

/** The ruler laid on between the towns (about a second); its reading at the end. */
function motion(next: MapView, draw: (v: MapView) => void): Motion | null {
  if (!next.read) return null;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 }, 1e-6);
  const { read: _r, ...rest } = next;
  void _r;
  return { channels: [clock], frame: (done) => draw(done ? next : { ...rest, laid: clock.value }) };
}

export const mapScaleScene = defineScene({ kind: 'map', view, svg, motion });
