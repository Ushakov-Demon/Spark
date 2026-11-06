/**
 * What the Professor raises in his hand when pleased: an instrument of the experiment at hand, one that can be held.
 * A stopwatch comes first, then a thermometer, then any other; with none of them he just points a finger up.
 */
export type Held = 'stopwatch' | 'thermometer' | 'dynamometer' | 'ruler' | 'weight' | 'magnet' | 'ammeter' | 'phone' | 'finger';

const BENCHES: Readonly<Partial<Record<Held, readonly string[]>>> = {
  stopwatch: ['sink', 'motion', 'thermometer', 'carry', 'snail', 'stairs', 'wind'],
  dynamometer: ['forces', 'pressure', 'atm', 'friction', 'slope', 'lever', 'lift', 'mg', 'press'],
  ruler: ['rows', 'area', 'map', 'bounce', 'planets', 'scales', 'spring', 'winch', 'luxmeter', 'energy'],
  weight: ['balance', 'pulley'],
  magnet: ['touch', 'induct'],
  ammeter: ['circuit', 'pair', 'box', 'magnet'],
  phone: ['air', 'coin', 'plant'],
};
const HELD_ON = new Map<string, Held>(Object.entries(BENCHES).flatMap(([held, kinds]) => kinds.map((k) => [k, held as Held] as const)));

/** The instrument for a bench; with no bench (a vessel on the table), the thermometer, if the experiment has one. */
export const heldOn = (bench: string | undefined, thermometer: boolean): Held => (bench ? (HELD_ON.get(bench) ?? 'finger') : thermometer ? 'thermometer' : 'finger');

/** The drawings, standing in the raised hand: the hand's centre is at (172, 146), the figure's view box 200 × 300. */
export const HELD_SVG: Readonly<Record<Exclude<Held, 'finger'>, string>> = {
  stopwatch: '<rect x="168" y="96" width="8" height="8" rx="2" fill="#555"/><circle cx="172" cy="122" r="19" fill="#f4f1e6" stroke="#333" stroke-width="3"/><path d="M172,108 v3 M186,122 h-3 M172,136 v-3 M158,122 h3" stroke="#333" stroke-width="2"/><path d="M172,122 l7,-9" stroke="#d94a3a" stroke-width="2.5" stroke-linecap="round"/><circle cx="172" cy="122" r="2.5" fill="#333"/>',
  thermometer: '<rect x="166" y="78" width="12" height="62" rx="6" fill="#f7f5ee" stroke="#333" stroke-width="2"/><rect x="170" y="94" width="4" height="46" fill="#d9312b"/><circle cx="172" cy="142" r="9" fill="#d9312b" stroke="#333" stroke-width="2"/><path d="M178,88 h-4 M178,98 h-4 M178,108 h-4 M178,118 h-4" stroke="#333" stroke-width="1.5"/>',
  dynamometer: '<path d="M172,76 v8" stroke="#333" stroke-width="3"/><rect x="162" y="84" width="20" height="58" rx="3" fill="#e8e4d4" stroke="#333" stroke-width="2"/><path d="M168,92 h8 M168,102 h8 M168,112 h8 M168,122 h8 M168,132 h8" stroke="#333" stroke-width="1.5"/><path d="M162,110 h20" stroke="#d94a3a" stroke-width="3"/>',
  ruler: '<rect x="163" y="74" width="18" height="78" rx="2" fill="#e9c46a" stroke="#333" stroke-width="2"/><path d="M163,84 h7 M163,94 h11 M163,104 h7 M163,114 h11 M163,124 h7 M163,134 h11" stroke="#333" stroke-width="1.5"/>',
  weight: '<circle cx="172" cy="100" r="6" fill="#c9a227" stroke="#7a6533" stroke-width="2"/><rect x="169" y="104" width="6" height="8" fill="#c9a227" stroke="#7a6533" stroke-width="2"/><rect x="156" y="112" width="32" height="32" rx="4" fill="#d4af37" stroke="#7a6533" stroke-width="2"/>',
  magnet: '<path d="M152,142 V116 a20,20 0 0 1 40,0 V142 h-13 V116 a7,7 0 0 0 -14,0 V142 z" fill="#d9312b" stroke="#333" stroke-width="2"/><rect x="152" y="130" width="13" height="12" fill="#e8e8e8" stroke="#333" stroke-width="2"/><rect x="179" y="130" width="13" height="12" fill="#e8e8e8" stroke="#333" stroke-width="2"/>',
  ammeter: '<rect x="150" y="100" width="44" height="42" rx="4" fill="#2f3b47" stroke="#333" stroke-width="2"/><path d="M156,126 a16,16 0 0 1 32,0 z" fill="#f4f1e6" stroke="#333" stroke-width="1.5"/><path d="M172,126 l7,-12" stroke="#d94a3a" stroke-width="2.5" stroke-linecap="round"/><text x="172" y="138" text-anchor="middle" font-size="10" font-weight="700" fill="#f4f1e6">A</text>',
  phone: '<rect x="156" y="88" width="32" height="58" rx="5" fill="#2b2f36" stroke="#333" stroke-width="2"/><rect x="160" y="94" width="24" height="44" rx="2" fill="#8fd0ff"/><circle cx="172" cy="142" r="2" fill="#999"/>',
};
