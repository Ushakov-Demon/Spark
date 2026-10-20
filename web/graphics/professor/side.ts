import type { Mood } from './front.js';

/**
 * The Professor in profile, facing right, hands behind his back and his head
 * tipped up: reading the blackboard. Same scale as the front view.
 */
export function professorSideSvg(mood: Mood = 'neutral', size = 220): string {
  const sooty = mood === 'sooty';
  const skin = sooty ? '#8a7a6e' : '#f2c9a5';
  const hair = sooty ? '#5b5b5b' : '#d9dcdf';
  const coat = sooty ? '#c9c4bd' : '#fbfbf8';
  const tuft = (x: number, y: number, dx: number, dy: number) => `<path d="M${x},${y} q${dx * 0.4},${dy * 0.9} ${dx},${dy}" stroke="${hair}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
  // Hair grows at the back and on top; the face looks to the right.
  const tufts = [tuft(76, 92, -24, -8), tuft(74, 106, -28, 6), tuft(80, 78, -18, -20), tuft(96, 58, -8, -22), tuft(110, 56, 4, -22)].join('');
  const eye = mood === 'happy' ? '<path d="M126,95 q4,-5 8,0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>' : `<circle cx="130" cy="94" r="${mood === 'surprised' ? 4 : 3}" fill="#222"/>`;
  return `<svg class="prof-svg side" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="${size}" height="${(size * 3) / 2}" role="img" aria-label="Professor reading the board">
  <!-- legs: one a little forward; shoes point the way he looks -->
  <g class="p-leg-l"><rect x="86" y="266" width="16" height="28" fill="#3d4652"/><ellipse cx="102" cy="295" rx="17" ry="5" fill="#2a2a2a"/></g>
  <g class="p-leg-r"><rect x="102" y="266" width="16" height="28" fill="#36404b"/><ellipse cx="120" cy="295" rx="17" ry="5" fill="#2a2a2a"/></g>
  <!-- the coat from the side: narrower, the back on the left -->
  <path d="M84,170 q26,-14 46,2 l12,104 h-72 l6,-62 z" fill="${coat}" stroke="#9aa0a6" stroke-width="2"/>
  <path d="M128,176 l6,10 -10,4 z" fill="#d94a3a"/>
  <path d="M126,186 l4,86" stroke="#9aa0a6" stroke-width="2"/>
  <g fill="#9aa0a6"><circle cx="128" cy="204" r="3"/><circle cx="129" cy="226" r="3"/></g>
  <!-- hands clasped behind the back -->
  <g class="p-hand-r"><path d="M106,184 q-12,26 -26,50" stroke="#9aa0a6" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M106,184 q-12,26 -26,50" stroke="${coat}" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="78" cy="238" r="8" fill="${skin}"/></g>
  <!-- neck and the head tipped up to the board -->
  <rect x="102" y="146" width="16" height="22" fill="${skin}"/>
  <!-- the outer group is what moves while he reads (scans the lines, nods); the inner keeps the tilt -->
  <g class="p-read"><g class="p-head" transform="rotate(-10 108 120)">
    <ellipse cx="108" cy="102" rx="36" ry="46" fill="${skin}"/>
    <path d="M139,99 q26,14 2,25" fill="${skin}" stroke="#c9906a" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="106" rx="7" ry="10" fill="${skin}" stroke="#d9a982" stroke-width="2"/>
    ${tufts}
    <path d="M121,82 q8,-6 16,-1" stroke="${hair}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <g class="p-eyes">${eye}</g>
    <circle cx="130" cy="95" r="11" fill="${sooty ? 'rgba(40,40,40,0.35)' : 'rgba(210,235,255,0.35)'}" stroke="#333" stroke-width="3"/>
    <path d="M119,96 L102,100" stroke="#333" stroke-width="3"/>
    <path d="M120,123 q12,-9 26,-2 q-12,9 -26,2 z" fill="${hair}"/>
    <path d="M129,133 q5,2 9,-1" stroke="#7a3b2e" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${sooty ? '' : '<ellipse cx="126" cy="90" rx="4" ry="2" fill="#fff" opacity="0.85" transform="rotate(-25 126 90)"/>'}
  </g></g>
</svg>`;
}
