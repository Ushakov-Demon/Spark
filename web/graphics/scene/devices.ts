import { CX, TABLE } from './constants.js';
import type { DeviceKind } from './types.js';
import type { VesselGeom } from './vessels.js';

/** Static drawing of a device; dynamic parts carry classes the frame updates. */
export function deviceSvg(d: DeviceKind, g: VesselGeom): string {
  const plateW = Math.min(240, Math.max(150, g.right - g.left + 40));
  switch (d) {
    case 'hotplate':
      return `<rect class="appliance" x="${CX - plateW / 2 - 20}" y="${TABLE - 26}" width="${plateW + 40}" height="26" rx="5"/>
        <ellipse class="plate" id="sc-plate" cx="${CX}" cy="${TABLE - 30}" rx="${plateW / 2 - 6}" ry="7"/>
        <circle class="lamp" id="sc-lamp" cx="${CX + plateW / 2 + 4}" cy="${TABLE - 13}" r="4"/>`;
    case 'induction':
      return `<rect class="glass-top" x="${CX - plateW / 2 - 20}" y="${TABLE - 30}" width="${plateW + 40}" height="30" rx="5"/>
        <g id="sc-coil" class="coil">${[0.35, 0.6, 0.85].map((k) => `<ellipse cx="${CX}" cy="${TABLE - 26}" rx="${(plateW / 2) * k}" ry="${4 * k + 1}"/>`).join('')}</g>
        <circle class="lamp" id="sc-lamp" cx="${CX + plateW / 2 + 4}" cy="${TABLE - 14}" r="4"/>`;
    case 'gas':
      return `<rect class="appliance" x="${CX - plateW / 2 - 20}" y="${TABLE - 18}" width="${plateW + 40}" height="18" rx="4"/>
        <path class="grate" d="M${CX - plateW / 2},${TABLE - 34} H${CX + plateW / 2} M${CX - 40},${TABLE - 34} V${TABLE - 18} M${CX + 40},${TABLE - 34} V${TABLE - 18}"/>
        <g id="sc-flame" class="flame ring">${[-36, -18, 0, 18, 36].map((x) => `<path d="M${CX + x - 5},${TABLE - 20} Q${CX + x},${TABLE - 40} ${CX + x + 5},${TABLE - 20} Z"/>`).join('')}</g>`;
    case 'bunsen':
      return `<path class="stand" d="M${CX - 70},${TABLE} L${CX - 54},240 M${CX + 70},${TABLE} L${CX + 54},240 M${CX - 62},240 H${CX + 62}"/>
        <rect class="appliance" x="${CX - 24}" y="${TABLE - 10}" width="48" height="10" rx="3"/><rect class="tube" x="${CX - 6}" y="${TABLE - 62}" width="12" height="54"/>
        <g id="sc-flame" class="flame cone"><path d="M${CX - 10},${TABLE - 62} Q${CX},${TABLE - 110} ${CX + 10},${TABLE - 62} Z"/><path class="inner" d="M${CX - 5},${TABLE - 62} Q${CX},${TABLE - 86} ${CX + 5},${TABLE - 62} Z"/></g>`;
    case 'spirit':
      return `<path class="stand" d="M${CX - 66},${TABLE} L${CX - 52},250 M${CX + 66},${TABLE} L${CX + 52},250 M${CX - 60},250 H${CX + 60}"/>
        <path class="lamp-glass" d="M${CX - 30},${TABLE} Q${CX - 34},${TABLE - 36} ${CX - 10},${TABLE - 44} H${CX + 10} Q${CX + 34},${TABLE - 36} ${CX + 30},${TABLE} Z"/>
        <rect class="tube" x="${CX - 5}" y="${TABLE - 54}" width="10" height="12"/>
        <g id="sc-flame" class="flame candle"><path d="M${CX - 8},${TABLE - 54} Q${CX},${TABLE - 82} ${CX + 8},${TABLE - 54} Q${CX},${TABLE - 47} ${CX - 8},${TABLE - 54} Z"/></g>`;
    case 'immersion':
      return `<g id="sc-element" class="element"><path d="M${g.mouth.l + 10},${g.top - 30} V${g.bottom - 30} q0,-10 10,-10 h${Math.max(10, g.mouth.r - g.mouth.l - 40)} q10,0 10,10 V${g.top - 30}"/></g>
        <path class="cable" d="M${g.mouth.l + 10},${g.top - 30} q-10,-24 -50,-28"/>`;
    case 'fridge':
    case 'freezer':
      return `<rect class="cabinet" x="${CX - 150}" y="${Math.min(g.top - 50, 120)}" width="300" height="${TABLE - Math.min(g.top - 50, 120)}" rx="10"/>
        <rect class="cabinet-in ${d}" x="${CX - 136}" y="${Math.min(g.top - 50, 120) + 12}" width="272" height="${TABLE - Math.min(g.top - 50, 120) - 18}" rx="6"/>
        <text class="display" x="${CX + 120}" y="${Math.min(g.top - 50, 120) + 30}" id="sc-setpoint" text-anchor="end"></text>
        ${d === 'freezer' ? `<g class="snow">${[[-110, 160], [100, 190], [-90, 250], [115, 270], [-120, 210]].map(([x, y]) => `<text x="${CX + x!}" y="${y}">❄</text>`).join('')}</g>` : ''}`;
    case 'ice-bath':
    case 'ice-salt-bath': {
      const l = g.left - 34, r = g.right + 34, t = g.bottom - Math.min(80, (g.bottom - g.top) * 0.6);
      return `<path class="basin" d="M${l},${t} L${l + 10},${TABLE} H${r - 10} L${r},${t} Z"/>
        <path class="bath-water" d="M${l + 4},${t + 10} L${l + 12},${TABLE - 3} H${r - 12} L${r - 4},${t + 10} Z"/>
        <g class="cubes">${[l + 18, l + 40, r - 40, r - 20].map((x, i) => `<rect x="${x - 9}" y="${t + 6 + (i % 2) * 18}" width="18" height="16" rx="3"/>`).join('')}</g>
        ${d === 'ice-salt-bath' ? `<g class="salt-dots">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${l + 16 + i * ((r - l - 32) / 5)}" cy="${TABLE - 10 - (i % 2) * 8}" r="2"/>`).join('')}</g>` : ''}`;
    }
    case 'supply': {
      const x = CX + 160, y = TABLE - 70, el = (px: number) => `<rect class="electrode" x="${px - 3}" y="${g.top - 24}" width="6" height="${g.bottom - g.top + 6}" rx="1.5"/>`;
      const a = g.mouth.l + (g.mouth.r - g.mouth.l) * 0.25, c = g.mouth.l + (g.mouth.r - g.mouth.l) * 0.75;
      return `<rect class="psu" x="${x}" y="${y}" width="120" height="70" rx="8"/>
        <rect class="psu-screen" x="${x + 10}" y="${y + 6}" width="100" height="36" rx="3"/>
        <text class="psu-text" id="sc-volts" x="${x + 102}" y="${y + 21}" text-anchor="end"></text><text class="psu-text amps" id="sc-amps" x="${x + 102}" y="${y + 37}" text-anchor="end"></text>
        <circle class="jack plus" cx="${x + 30}" cy="${y + 55}" r="6"/><circle class="jack minus" cx="${x + 90}" cy="${y + 55}" r="6"/>
        <path class="wire plus" d="M${x + 30},${y + 55} C${x - 10},${y + 60} ${a + 40},${g.top - 80} ${a},${g.top - 24}"/>
        <path class="wire minus" d="M${x + 90},${y + 55} C${x + 80},${g.top - 90} ${c + 30},${g.top - 70} ${c},${g.top - 24}"/>
        ${el(a)}${el(c)}`;
    }
    case 'furnace': {
      // A muffle furnace: a firebrick box around the crucible, its inside glowing with the set temperature.
      const l = CX - 120, r = CX + 120, t = Math.min(g.top - 46, 170);
      return `<rect class="furnace" x="${l}" y="${t}" width="${r - l}" height="${TABLE - t}" rx="8"/>
        <rect class="furnace-in" id="sc-furnace" x="${l + 16}" y="${t + 16}" width="${r - l - 32}" height="${TABLE - t - 30}" rx="4"/>
        <text class="display" x="${r - 12}" y="${t + 12}" id="sc-setpoint" text-anchor="end"></text>`;
    }
    default:
      return '';
  }
}
