import { airPlace, type AirWhere } from '../../../src/experiments/air-column/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The air: where the phone is — on the ground floor, on the ninth (`floor` between them while the lift goes), or in
 * the airship over the town; its barometer's reading; the labels.
 */
export type AirView = { readonly where: 'ground' | 'ninth' | 'airship' | 'high'; readonly floor: number; /** How far the camera has risen with the airship: 0 — on the ground, 1 — 300 m, 2 — 2 km. */ readonly zoom?: number; readonly read?: string; readonly label: string; readonly air: string };

function view({ last, command, plan, locale }: SceneContext): AirView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const ac = command?.type === 'lab.air' ? (command as unknown as { place: string; where: AirWhere }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.air');
  const cmd = ac ?? (next?.kind === 'bench' ? (next.command as unknown as { place: string; where: AirWhere }) : { place: '', where: 'ground' as const });
  const town = airPlace(cmd.place);
  const uk = locale === 'uk';
  const label = `${town.name}, ${Math.round(town.elevation ?? 0)} ${uk ? 'м над морем' : 'm above the sea'}`;
  // (The ninth floor before its reading: the phone still waits on the ground floor; the climb to 2 km — from 300 m.)
  // (Before the airship's first reading: still on the ninth floor.)
  const where = !ac && cmd.where === 'ninth' ? 'ground' : !ac && cmd.where === 'high' ? 'airship' : !ac && cmd.where === 'airship' ? 'ninth' : cmd.where;
  return { where, floor: where === 'ninth' ? 9 : 1, label, air: uk ? 'повітря' : 'air', ...(ac && r ? { read: formatMeasured('pressure', r.value, 1, locale) } : {}) };
}

/**
 * The air: a band of air beside, thick at the bottom and thinning upwards; a nine-storey block with its lift, the phone
 * on the floor it is on — or a mountain with the phone on its top. The phone's screen shows the barometer.
 */
function airSvg(a: AirView): string {
  const ground = TABLE - 2;
  const band = `<defs><linearGradient id="air-thin" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgba(140,200,255,0.55)"/><stop offset="1" stop-color="rgba(140,200,255,0.04)"/></linearGradient></defs><rect x="592" y="20" width="22" height="${ground - 20}" style="fill:url(#air-thin)"/><text class="bench-label" x="603" y="14" text-anchor="middle">${a.air}</text>`;
  const phone = (x: number, y: number) => `<rect x="${x - 9}" y="${y - 30}" width="18" height="30" rx="3" style="fill:#2b2f36"/><rect x="${x - 7}" y="${y - 27}" width="14" height="22" rx="1" style="fill:#cfe3f3"/>${a.read ? `<text class="bench-reading" x="${x - 14}" y="${y - 12}" text-anchor="end">${a.read}</text>` : ''}`;
  // A block of `n` storeys, 22 units each, its foot at (x, ground): the windows two to a storey.
  const storey = 22;
  const w = 80;
  const block = (x: number, n: number, numbers: boolean) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${ground - (i + 1) * storey}" width="${w}" height="${storey}" style="fill:#c9b79c;stroke:#8c7a5e"/><rect x="${x + 10}" y="${ground - (i + 1) * storey + 6}" width="14" height="10" style="fill:#7fa7c9"/><rect x="${x + 34}" y="${ground - (i + 1) * storey + 6}" width="14" height="10" style="fill:#7fa7c9"/>${numbers ? `<text x="${x - 6}" y="${ground - i * storey - 7}" text-anchor="end" style="font:10px sans-serif;fill:#d8e2ea">${i + 1}</text>` : ''}`).join('');
  const x0 = 470;
  const label = `<text class="bench-label" x="${x0 - 14}" y="${ground - 9 * storey + 4}" text-anchor="end">${a.label}</text>`;
  if (a.where === 'airship' || a.where === 'high') {
    // The camera flies with the airship: it stays big in the frame, and the town below shrinks — at 300 m to a fifth,
    // at 2 km to a speck among its neighbours, all to the left of it so none leaves the board (`zoom`: 0 — on the
    // ground, 1 — 300 m, 2 — 2 km).
    const z = a.zoom ?? (a.where === 'high' ? 2 : 1);
    const sc = z <= 1 ? 1 - 0.78 * z : 0.22 - 0.17 * (z - 1);
    const cx = x0 + w / 2;
    const town = `<g transform="translate(${cx},${ground}) scale(${sc}) translate(${-cx},${-ground})">${block(x0 - 4 * (w + 14), 14, false)}${block(x0 - 3 * (w + 14), 7, false)}${block(x0 - 2 * (w + 14), 5, false)}${block(x0 - (w + 14), 12, false)}${block(x0, 9, false)}</g>`;
    const sy = 110;
    // (On its envelope a registration in the German airships' manner, D-LZ…: an invented one.)
    const ship = `<g transform="translate(${cx},${sy}) scale(1.25)"><ellipse cx="0" cy="0" rx="46" ry="14" style="fill:#d9dde2;stroke:#7d858d;stroke-width:1.2"/><path d="M40,-4 l14,-9 v26 l-14,-9 Z" style="fill:#b9c0c8;stroke:#7d858d"/><rect x="-12" y="12" width="24" height="7" rx="2" style="fill:#5a636c"/><text x="-4" y="4" text-anchor="middle" style="font:700 10px sans-serif;fill:#3a4652;letter-spacing:1px">D-LZUA</text></g>`;
    return `${band}${town}${ship}${phone(cx, sy + 44)}<text class="bench-label" x="${cx}" y="${ground - 6}" text-anchor="middle">${a.label}</text>`;
  }
  const y = ground - (a.floor - 1) * storey;
  const lift = `<rect x="${x0 + w - 22}" y="${y - storey + 2}" width="18" height="${storey - 3}" style="fill:#e8e2d5;stroke:#555"/>`;
  return `${band}${block(x0, 9, true)}${lift}${phone(x0 + w - 13, y - 2)}${label}`;
}

/** The lift going up from the ground floor to the ninth; the barometer read once it stops. */
function liftUp(next: AirView, draw: (v: AirView) => void): Motion {
  const a = next;
  const ride = new Channel(1, 9, { kind: 'steady', speed: 3 }, 1e-3);
  const { read: _r, ...rest } = a;
  return {
    channels: [ride],
    frame: (done) => draw(done ? next : { ...rest, floor: Number.isFinite(ride.value) ? ride.value : 1 }),
  };
}

/** The airship climbing — from the ground to 300 m, or on to 2 km: the town shrinking below; the barometer read once it is there. */
function airshipUp(next: AirView, draw: (v: AirView) => void): Motion {
  const a = next;
  const from = a.where === 'high' ? 1 : 0;
  const climb = new Channel(from, from + 1, { kind: 'steady', speed: 0.45 }, 1e-3);
  const { read: _r, ...rest } = a;
  return {
    channels: [climb],
    frame: (done) => draw(done ? next : { ...rest, zoom: Number.isFinite(climb.value) ? climb.value : from }),
  };
}

/** A reading just taken up the stairs or in the air: the way there played. */
function airRun(next: AirView, draw: (v: AirView) => void): Motion | null {
  if (!next.read) return null;
  if (next.where === 'ninth') return liftUp(next, draw);
  if (next.where === 'airship' || next.where === 'high') return airshipUp(next, draw);
  return null;
}

export const airColumnScene = defineScene({ kind: 'air', view, svg: airSvg, motion: airRun });
