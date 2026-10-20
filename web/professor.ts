/**
 * The Professor — the experimenter's avatar, narrator and guide.
 * A slightly absent-minded scientist: wild hair, chalk on his glasses,
 * a lab coat buttoned one button off. Drawn in plain SVG (no assets, any
 * screen size); moods change the face, hair and a few details.
 */
export type Mood = 'neutral' | 'thinking' | 'happy' | 'surprised' | 'sooty';
export const MOODS: readonly Mood[] = ['neutral', 'thinking', 'happy', 'surprised', 'sooty'];

export function professorSvg(mood: Mood = 'neutral', size = 220): string {
  const sooty = mood === 'sooty';
  const skin = sooty ? '#8a7a6e' : '#f2c9a5';
  const hair = sooty ? '#5b5b5b' : '#d9dcdf';
  const coat = sooty ? '#c9c4bd' : '#fbfbf8';

  // Hair: wild tufts around a balding top; wilder when surprised or after a blast.
  const wild = mood === 'surprised' || sooty ? 1.35 : 1;
  const tuft = (x: number, y: number, dx: number, dy: number) => `M${x},${y} q${dx * 0.4 * wild},${dy * 0.9 * wild} ${dx * wild},${dy * wild}`;
  const tufts = [
    tuft(62, 92, -26, -10),
    tuft(60, 104, -30, 4),
    tuft(64, 80, -20, -22),
    tuft(138, 92, 26, -10),
    tuft(140, 104, 30, 4),
    tuft(136, 80, 20, -22),
    tuft(96, 52, -4, -24),
    tuft(104, 52, 8, -22),
  ]
    .map((d) => `<path d="${d}" stroke="${hair}" stroke-width="9" stroke-linecap="round" fill="none"/>`)
    .join('');

  const brows: Record<Mood, string> = {
    neutral: 'M78,86 q8,-5 16,0 M106,86 q8,-5 16,0',
    thinking: 'M78,88 q8,-3 16,1 M106,80 q8,-7 16,-1',
    happy: 'M78,82 q8,-7 16,-1 M106,82 q8,-7 16,-1',
    surprised: 'M78,76 q8,-9 16,-2 M106,76 q8,-9 16,-2',
    sooty: 'M78,84 q8,3 16,0 M106,84 q8,3 16,0',
  };
  const eyes: Record<Mood, string> = {
    neutral: '<circle cx="86" cy="98" r="3"/><circle cx="114" cy="100" r="3"/>',
    thinking: '<circle cx="88" cy="94" r="3"/><circle cx="116" cy="96" r="3"/>',
    happy: '<path d="M82,99 q4,-5 8,0 M110,101 q4,-5 8,0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    surprised: '<circle cx="86" cy="98" r="4.5"/><circle cx="114" cy="100" r="4.5"/>',
    sooty: '<path d="M82,95 l8,6 M90,95 l-8,6 M110,97 l8,6 M118,97 l-8,6" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>',
  };
  const mouths: Record<Mood, string> = {
    neutral: '<path d="M90,131 q10,5 20,0" stroke="#7a3b2e" stroke-width="3" fill="none" stroke-linecap="round"/>',
    thinking: '<path d="M96,132 q7,-2 12,1" stroke="#7a3b2e" stroke-width="3" fill="none" stroke-linecap="round"/>',
    happy: '<path d="M86,128 q14,16 28,0 z" fill="#7a3b2e"/><path d="M90,129 q10,5 20,0" fill="#fff"/>',
    surprised: '<ellipse cx="100" cy="133" rx="6" ry="8" fill="#7a3b2e"/>',
    sooty: '<path d="M90,134 q5,-4 10,0 q5,4 10,0" stroke="#3a2a22" stroke-width="3" fill="none" stroke-linecap="round"/>',
  };

  // Round glasses, the right one a little lower; chalk smudges (or soot and a crack).
  const glasses = `
    <g fill="${sooty ? 'rgba(40,40,40,0.35)' : 'rgba(210,235,255,0.35)'}" stroke="#333" stroke-width="3">
      <circle cx="86" cy="98" r="13"/><circle cx="114" cy="100" r="13"/>
    </g>
    <path d="M99,99 q1,-3 2,0" stroke="#333" stroke-width="3" fill="none"/>
    <path d="M73,96 l-12,-3 M127,98 l12,-4" stroke="#333" stroke-width="3"/>
    ${
      sooty
        ? '<path d="M109,92 l5,6 -3,4 6,6" stroke="#eee" stroke-width="1.5" fill="none"/>'
        : '<g fill="#fff" opacity="0.85"><ellipse cx="80" cy="92" rx="5" ry="2.5" transform="rotate(-25 80 92)"/><ellipse cx="119" cy="105" rx="4" ry="2" transform="rotate(20 119 105)"/><circle cx="91" cy="104" r="1.6"/></g>'
    }`;

  // Smoke for the sooty mood.
  const smoke = sooty
    ? '<g fill="none" stroke="#9a9a9a" stroke-width="3" stroke-linecap="round" opacity="0.8"><path d="M80,40 q-6,-10 0,-18 q6,-8 0,-16"/><path d="M118,36 q6,-10 0,-18 q-6,-8 0,-16"/></g>'
    : '';

  // In the happy mood he raises a flask; otherwise a piece of chalk in his hand.
  const hand = mood === 'happy'
    ? `<path d="M138,184 q30,-4 34,-34" stroke="#9aa0a6" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M138,184 q30,-4 34,-34" stroke="${coat}" stroke-width="18" stroke-linecap="round" fill="none"/>
       <circle cx="172" cy="146" r="8" fill="${skin}"/>
       <path d="M166,140 l-4,-22 h20 l-4,22 l10,22 h-32 z" fill="rgba(120,200,255,0.75)" stroke="#333" stroke-width="2"/>
       <path d="M164,152 h28" stroke="#4aa8ff" stroke-width="6"/>`
    : `<path d="M138,184 q22,34 18,76" stroke="#9aa0a6" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M138,184 q22,34 18,76" stroke="${coat}" stroke-width="18" stroke-linecap="round" fill="none"/>
       <circle cx="156" cy="262" r="8" fill="${skin}"/>
       <rect class="p-chalk" x="160" y="256" width="12" height="4" rx="1.5" fill="#fff" stroke="#bbb" transform="rotate(-20 160 256)"/>`;
  const thinkingHand = mood === 'thinking'
    ? `<path d="M62,184 q-14,-10 22,-34" stroke="#9aa0a6" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M62,184 q-14,-10 22,-34" stroke="${coat}" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="84" cy="150" r="8" fill="${skin}"/>`
    : `<path d="M62,182 q-22,36 -18,78" stroke="#9aa0a6" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M62,182 q-22,36 -18,78" stroke="${coat}" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="44" cy="262" r="8" fill="${skin}"/>`;

  // Parts are grouped (legs, hands, head, eyes, glasses, mouth) so the idle scenes can move them;
  // closed eyes, a yawning mouth, "z-z-z" and a flying piece of chalk wait hidden until needed.
  return `<svg class="prof-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="${size}" height="${(size * 3) / 2}" role="img" aria-label="Professor (${mood})">
  ${smoke}
  <!-- legs and shoes -->
  <g class="p-leg-l"><rect x="78" y="268" width="16" height="26" fill="#3d4652"/><ellipse cx="84" cy="295" rx="14" ry="5" fill="#2a2a2a"/></g>
  <g class="p-leg-r"><rect x="106" y="268" width="16" height="26" fill="#3d4652"/><ellipse cx="118" cy="295" rx="14" ry="5" fill="#2a2a2a"/></g>
  <!-- lab coat, put on a bit crooked: left shoulder higher -->
  <path d="M58,170 q42,-24 86,4 l14,104 h-116 z" fill="${coat}" stroke="#9aa0a6" stroke-width="2"/>
  <path d="M92,166 l8,22 8,-20" fill="#7aa7d9"/>
  <!-- bow tie, askew -->
  <path d="M90,168 l10,6 -10,6 z M110,166 l-10,8 10,4 z" fill="#d94a3a" transform="rotate(-12 100 172)"/>
  <!-- buttons: one buttoned into the wrong hole -->
  <path d="M100,186 l-2,86" stroke="#9aa0a6" stroke-width="2"/>
  <g fill="#9aa0a6"><circle cx="97" cy="200" r="3"/><circle cx="96" cy="222" r="3"/><circle cx="103" cy="240" r="3"/></g>
  <!-- chalk dust on the sleeve and a pocket with pens -->
  <g fill="#ffffff" opacity="${sooty ? 0 : 0.9}"><circle cx="66" cy="230" r="4"/><circle cx="72" cy="236" r="2.5"/></g>
  <rect x="112" y="196" width="20" height="16" rx="2" fill="none" stroke="#9aa0a6" stroke-width="2"/>
  <path d="M117,197 v-8 M123,197 v-10" stroke="#2f6fcf" stroke-width="3" stroke-linecap="round"/>
  ${sooty ? '<g fill="#555" opacity="0.6"><circle cx="80" cy="210" r="7"/><circle cx="126" cy="250" r="9"/><circle cx="70" cy="258" r="5"/></g>' : ''}
  <g class="p-hand-r">${hand}</g>
  <rect class="p-chalk-fly" opacity="0" x="150" y="240" width="12" height="4" rx="1.5" fill="#fff" stroke="#bbb"/>
  <!-- neck and head -->
  <rect x="92" y="148" width="16" height="16" fill="${skin}"/>
  <g class="p-head">
  <ellipse cx="62" cy="104" rx="7" ry="10" fill="${skin}"/><ellipse cx="138" cy="106" rx="7" ry="10" fill="${skin}"/>
  <ellipse cx="100" cy="104" rx="40" ry="48" fill="${skin}"/>
  ${tufts}
  <path d="${brows[mood]}" stroke="${hair}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <g class="p-eyes" fill="#222">${eyes[mood]}</g>
  <path class="p-sleep-eyes" opacity="0" d="M80,99 q6,4 12,0 M108,101 q6,4 12,0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g class="p-glasses">${glasses}</g>
  <!-- nose and a bushy moustache -->
  <path d="M100,104 q-6,12 2,14" stroke="#c9906a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M84,124 q8,-8 16,-2 q8,-6 16,2 q-8,4 -16,0 q-8,4 -16,0 z" fill="${hair}"/>
  <g class="p-mouth">${mouths[mood]}</g>
  <ellipse class="p-yawn" opacity="0" cx="100" cy="134" rx="8" ry="11" fill="#7a3b2e"/>
  ${sooty ? '<g fill="#3a3a3a" opacity="0.45"><circle cx="76" cy="116" r="8"/><circle cx="124" cy="80" r="6"/></g>' : ''}
  </g>
  <!-- coffee break: an arm bent at the elbow brings the mug to the moustache (body → mug → hand) -->
  <g class="p-coffee" opacity="0">
    <path d="M62,182 Q52,216 72,228 Q90,214 92,172" stroke="#9aa0a6" stroke-width="22" stroke-linecap="round" fill="none"/>
    <path d="M62,182 Q52,216 72,228 Q90,214 92,172" stroke="${coat}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <g class="p-mug">
      <path d="M101,141 h24 v22 a5,5 0 0 1 -5,5 h-14 a5,5 0 0 1 -5,-5 z" fill="#c0392b" stroke="#7b241c" stroke-width="2"/>
      <path d="M101,146 q-9,0 -9,8 q0,8 9,8" fill="none" stroke="#7b241c" stroke-width="3"/>
      <path d="M104,144 h18" stroke="#5d3a1a" stroke-width="3"/>
      <g class="p-mug-steam" fill="none" stroke="#b9c2cb" stroke-width="2.5" stroke-linecap="round"><path d="M108,136 q-4,-6 0,-12 q4,-6 0,-12"/><path d="M117,136 q4,-6 0,-12 q-4,-6 0,-12"/></g>
    </g>
    <circle cx="93" cy="160" r="8" fill="${skin}"/>
  </g>
  <g class="p-hand-l">${thinkingHand}</g>
  <g class="p-zzz" opacity="0" fill="#5b8cff" font-family="Georgia, serif" font-weight="700"><text x="140" y="70" font-size="16">z</text><text x="152" y="52" font-size="20">z</text><text x="166" y="30" font-size="25">Z</text></g>
</svg>`;
}

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
