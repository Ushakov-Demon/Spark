import { AMMETER, VOLTMETER } from '../../../src/experiments/resistor-circuit/bench.js';
import { readingsOf, formatMeasured } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, meterSvg } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** A resistor seen from above: its body and colour bands (2 Ω — red-black-gold, 4 Ω — yellow-black-gold). */
function resistorSvg(x: number, y: number, ohms: number): string {
  const bands = ohms === 2 ? ['#c0392b', '#222', '#b8860b'] : ['#e6c229', '#222', '#b8860b'];
  return `<rect x="${x}" y="${y - 10}" width="56" height="20" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${bands.map((b, k) => `<rect x="${x + 12 + k * 11}" y="${y - 10}" width="4" height="20" style="fill:${b}"/>`).join('')}<text class="lever-mark" x="${x + 28}" y="${y + 21}" text-anchor="middle">${ohms} Ом</text>`;
}

export type PairView = { readonly connection: 'series' | 'parallel'; readonly source: number; readonly at: 'r1' | 'r2' | 'both'; readonly amps?: { readonly text: string; readonly share: number }; readonly volts?: { readonly text: string; readonly share: number } };

function view({ last, command, plan, locale }: SceneContext): PairView {
  const pc = command?.type === 'lab.pair' ? (command as unknown as { source: number; at: 'r1' | 'r2' | 'both'; connection: 'series' | 'parallel' }) : undefined;
  const recs = last ? readingsOf([last]).map((x) => x.record) : [];
  const I = recs.find((x) => x.quantity === 'current');
  const U = recs.find((x) => x.quantity === 'voltage');
  const first = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.pair');
  const source = pc?.source ?? (first?.kind === 'bench' && first.command.type === 'lab.pair' ? first.command.source : 0);
  const connection = pc?.connection ?? (first?.kind === 'bench' && first.command.type === 'lab.pair' ? first.command.connection : 'series');
  return { connection, source, at: pc?.at ?? 'r1', ...(pc && I && U ? { amps: { text: formatMeasured('current', I.value, 0.01, locale), share: (I.value ?? 0) / AMMETER.max.value }, volts: { text: formatMeasured('voltage', U.value, 0.1, locale), share: (U.value ?? 0) / VOLTMETER.max.value } } : {}) };
}

/**
 * Two resistors on the table, in series (one after the other) or in parallel (two branches); the ammeter and the
 * voltmeter where this step reads them.
 */
function pairSvg(p: PairView): string {
  const kind = p?.connection ?? 'series';
  const on = !!p?.amps;
  const wire = on ? '#e2b04a' : '#9aa3ad';
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const y = TABLE - 40;
  const at = p?.at ?? 'both';
  const source = `<rect x="110" y="${y - 30}" width="70" height="44" rx="5" style="fill:${DARK}"/><rect x="120" y="${y - 22}" width="50" height="16" rx="2" style="fill:#0f2a12"/><text class="sw-text" x="145" y="${y - 10}" text-anchor="middle" style="fill:#7CFC9a">${String(p?.source ?? 0).replace('.', ',')} V</text>`;
  const amm = (x: number, yy: number) => meterSvg(x, yy, 'A', p?.amps?.share, p?.amps?.text);
  const volt = (x: number, yy: number) => meterSvg(x, yy, 'V', p?.volts?.share, p?.volts?.text);
  if (kind === 'series') {
    // Source → ammeter → R1 → R2 → back; the voltmeter above R1, R2 or both.
    const r1x = 330;
    const r2x = 430;
    const vx = at === 'r1' ? r1x + 28 : at === 'r2' ? r2x + 28 : (r1x + r2x + 56) / 2;
    const [va, vb] = at === 'r1' ? [r1x, r1x + 56] : at === 'r2' ? [r2x, r2x + 56] : [r1x, r2x + 56];
    const vy = TABLE - 150;
    return `${W(`M180,${y} H244 M296,${y} H${r1x} M${r1x + 56},${y} H${r2x} M${r2x + 56},${y} H540 V${y + 34} H145 V${y + 14}`)}${W(`M${va},${y} V${vy + 14} H${vx - 26} M${vx + 26},${vy + 14} H${vb} V${y}`)}${source}${amm(270, y + 2)}${resistorSvg(r1x, y, 2)}${resistorSvg(r2x, y, 4)}${volt(vx, vy)}`;
  }
  // Parallel: a fork after the ammeter of the main line (or the ammeter in one branch); the voltmeter across the pair.
  const fx = 300;
  const jx = 500;
  const b1 = y - 50;
  const b2 = y + 10;
  const main = at === 'both';
  const ax = main ? 245 : 360;
  const ay = at === 'r1' ? b1 + 2 : at === 'r2' ? b2 + 2 : y + 2;
  const branch = (yy: number, ohms: number, metered: boolean) => (metered ? W(`M${fx},${yy} H${ax - 26} M${ax + 26},${yy} H410`) : W(`M${fx},${yy} H410`)) + resistorSvg(410, yy, ohms) + W(`M466,${yy} H${jx}`);
  const vy = TABLE - 175;
  return `${W(`M180,${y} H${main ? ax - 26 : fx}`)}${main ? W(`M${ax + 26},${y} H${fx}`) : ''}${W(`M${fx},${b1} V${b2} M${jx},${b1} V${b2} M${jx},${y} H560 V${y + 44} H145 V${y + 14}`)}${branch(b1, 2, at === 'r1')}${branch(b2, 4, at === 'r2')}${W(`M${fx},${b1} V${vy + 14} H${400 - 26} M${400 + 26},${vy + 14} H${jx} V${b1}`)}${source}${amm(ax, ay)}${volt(400, vy)}`;
}

export const twoResistorsScene = defineScene({ kind: 'pair', view, svg: pairSvg, motion: () => null });
