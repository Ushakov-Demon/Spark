import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The black box: the source's volts, which way the box stands, what the milliammeter shows (once the key is closed). */
export type BoxView = { readonly source: number; readonly reversed: boolean; readonly display?: string };

function view({ last, command, plan, locale }: SceneContext): BoxView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const bc = command?.type === 'lab.box' ? (command as unknown as { source: number; reversed: boolean }) : undefined;
  const planned = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.box');
  const first = planned?.kind === 'bench' ? (planned.command as { source: number }).source : 0;
  const mA = bc && r && r.value !== null ? (r.value * 1000).toFixed(1).replace('.', locale === 'uk' ? ',' : '.') : undefined;
  return { source: bc?.source ?? first, reversed: !!bc?.reversed, ...(mA !== undefined ? { display: mA } : {}) };
}

/**
 * The black box on the table: the source, the key, the box with its two terminals (turned round — its marks
 * the other way), the protective resistor and the multimeter as a milliammeter, all in one loop.
 */
function boxSvg(b: BoxView): string {
  const on = b?.display !== undefined;
  const flows = on && b!.display !== '0,0' && b!.display !== '0.0';
  const wire = flows ? '#e2b04a' : '#9aa3ad';
  const y = TABLE - 40;
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const source = `<rect x="120" y="${y - 30}" width="70" height="44" rx="5" style="fill:${DARK}"/><rect x="130" y="${y - 22}" width="50" height="16" rx="2" style="fill:#0f2a12"/><text class="sw-text" x="155" y="${y - 10}" text-anchor="middle" style="fill:#7CFC9a">${String(b?.source ?? 0).replace('.', ',')} V</text>`;
  const key = `<circle cx="225" cy="${y + 4}" r="3" style="fill:${DARK}"/><circle cx="255" cy="${y + 4}" r="3" style="fill:${DARK}"/><path d="M225,${y + 4} L${on ? 255 : 251},${on ? y + 4 : y - 10}" style="stroke:${DARK};stroke-width:3;stroke-linecap:round"/>`;
  // The box: black, a white «?», its terminals marked A and B — turned round, B comes first.
  const [l, r] = b?.reversed ? ['B', 'A'] : ['A', 'B'];
  const box = `<rect x="290" y="${y - 26}" width="74" height="44" rx="4" style="fill:#1b1b1f;stroke:#000"/><text x="327" y="${y + 4}" text-anchor="middle" style="font:700 22px system-ui;fill:#f4f4f4">?</text><circle cx="296" cy="${y + 4}" r="4" style="fill:#c9a227"/><circle cx="358" cy="${y + 4}" r="4" style="fill:#c9a227"/><text x="302" y="${y - 12}" text-anchor="middle" style="font:700 10px system-ui;fill:#e9e9e9">${l}</text><text x="352" y="${y - 12}" text-anchor="middle" style="font:700 10px system-ui;fill:#e9e9e9">${r}</text>`;
  const resistor = `<rect x="392" y="${y - 6}" width="50" height="20" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${['#8b4513', '#222', '#8b4513'].map((c, k) => `<rect x="${402 + k * 11}" y="${y - 6}" width="4" height="20" style="fill:${c}"/>`).join('')}`;
  const mx = 470;
  const meter = `<rect x="${mx}" y="${y - 44}" width="58" height="70" rx="7" style="fill:#f1c40f;stroke:#7d6608;stroke-width:1.5"/><rect x="${mx + 5}" y="${y - 38}" width="48" height="19" rx="2" style="fill:#c9d6a3;stroke:#55603a"/><text class="mm-text" x="${mx + 49}" y="${y - 24}" text-anchor="end">${b?.display ?? '-.-'}</text><text x="${mx + 29}" y="${y - 6}" text-anchor="middle" style="font:700 8px system-ui;fill:#2d2d2d">mA</text><circle cx="${mx + 29}" cy="${y + 8}" r="8" style="fill:#2d2d2d"/>`;
  const wires = W(`M175,${y + 4} H225`) + W(`M255,${y + 4} H292`) + W(`M362,${y + 4} H392`) + W(`M442,${y + 4} H${mx}`) + W(`M${mx + 58},${y + 4} H545 V${y + 36} H140 V${y + 4} H135`);
  return `${wires}${source}${key}${box}${resistor}${meter}`;
}

export const diodeBlackBoxScene = defineScene({ kind: 'box', view, svg: boxSvg, motion: () => null });
