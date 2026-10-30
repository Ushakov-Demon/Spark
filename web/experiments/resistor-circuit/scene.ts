import { AMMETER, VOLTMETER } from '../../../src/experiments/resistor-circuit/bench.js';
import { readingsOf, formatMeasured } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, meterSvg } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The circuit (grade 8): the source's volts; what the ammeter and the voltmeter show (their needles, 0…1 of the scale) — absent, the key is open. */
export type CircuitView = { readonly source: number; readonly amps?: { readonly text: string; readonly share: number }; readonly volts?: { readonly text: string; readonly share: number } };

function view({ last, command, locale }: SceneContext): CircuitView {
  const cc = command?.type === 'lab.circuit' ? (command as unknown as { source: number }) : undefined;
  const recs = last ? readingsOf([last]).map((x) => x.record) : [];
  const I = recs.find((x) => x.quantity === 'current');
  const U = recs.find((x) => x.quantity === 'voltage');
  return { source: cc?.source ?? 0, ...(cc && I && U ? { amps: { text: formatMeasured('current', I.value, 0.01, locale), share: (I.value ?? 0) / AMMETER.max.value }, volts: { text: formatMeasured('voltage', U.value, 0.1, locale), share: (U.value ?? 0) / VOLTMETER.max.value } } : {}) };
}

/**
 * The circuit on the table: the source on the left, the key, the ammeter in series, the resistor; the voltmeter
 * across the resistor above it. Wires light up when the key is closed.
 */
function circuitSvg(c: CircuitView): string {
  const on = !!c?.amps;
  const wire = on ? '#e2b04a' : '#9aa3ad';
  const y = TABLE - 40;
  const top = TABLE - 130;
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const source = `<rect x="140" y="${y - 30}" width="70" height="44" rx="5" style="fill:${DARK}"/><rect x="150" y="${y - 22}" width="50" height="16" rx="2" style="fill:#0f2a12"/><text class="sw-text" x="175" y="${y - 10}" text-anchor="middle" style="fill:#7CFC9a">${String(c?.source ?? 0).replace('.', ',')} V</text><circle cx="155" cy="${y + 4}" r="3" style="fill:#c0392b"/><circle cx="195" cy="${y + 4}" r="3" style="fill:#222"/>`;
  const key = `<circle cx="250" cy="${y + 4}" r="3" style="fill:${DARK}"/><circle cx="280" cy="${y + 4}" r="3" style="fill:${DARK}"/><path d="M250,${y + 4} L${on ? 280 : 276},${on ? y + 4 : y - 10}" style="stroke:${DARK};stroke-width:3;stroke-linecap:round"/>`;
  const resistor = `<rect x="430" y="${y - 6}" width="60" height="20" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${[0, 1, 2].map((k) => `<rect x="${442 + k * 12}" y="${y - 6}" width="4" height="20" style="fill:${['#8b4513', '#222', '#c0392b'][k]}"/>`).join('')}`;
  const wires = W(`M195,${y + 4} H250`) + W(`M280,${y + 4} H340`) + W(`M392,${y + 4} H430`) + W(`M490,${y + 4} H540 V${y + 40} H150 V${y + 4} H155`) + W(`M410,${y + 4} V${top + 40} H${435}`) + W(`M485,${top + 40} H510 V${y + 4}`);
  return `${wires}${source}${key}${meterSvg(366, y + 6, 'A', c?.amps?.share, c?.amps?.text)}${resistor}${meterSvg(460, top + 40, 'V', c?.volts?.share, c?.volts?.text)}`;
}

export const resistorCircuitScene = defineScene({ kind: 'circuit', view, svg: circuitSvg, motion: () => null });
