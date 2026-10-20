/**
 * Small line icons for the shelf (24 × 24, drawn with currentColor). Operations
 * and equipment name their icon in their own data (`icon`, `look`).
 */
const P: Readonly<Record<string, string>> = {
  // operations
  'heat-up': '<path d="M9 14V4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z"/><path d="M11 14V8"/><path d="M17 9l2.5-3L22 9M19.5 6v8"/>',
  boil: '<path d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M2 11h2M20 11h2"/><circle cx="9" cy="6" r="1.4"/><circle cx="13" cy="4" r="1"/><circle cx="15.5" cy="7" r="1.4"/>',
  evaporate: '<path d="M3 16h18l-2 4H5z"/><path d="M8 12c-1-1.5 1-2.5 0-4M12 12c-1-1.5 1-2.5 0-4M16 12c-1-1.5 1-2.5 0-4"/><path d="M9 18.2l1-1 1 1M13 18.2l1-1 1 1"/>',
  'cool-down': '<path d="M9 14V4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z"/><path d="M11 14v-3"/><path d="M17 11l2.5 3L22 11M19.5 14V6"/>',
  freeze: '<path d="M12 2v20M4 6l16 12M20 6L4 18"/><path d="M9 3l3 2 3-2M9 21l3-2 3 2M3 9l2.5 1L5 13M21 9l-2.5 1 .5 3"/>',
  melt: '<rect x="5" y="4" width="11" height="10" rx="2"/><path d="M8 7l3 3"/><path d="M18 14c0 2-1.2 3-2.5 3S13 16 13 14c0-1.5 2.5-4 2.5-4S18 12.5 18 14z"/><path d="M4 20h16"/>',
  current: '<path d="M13 2L5 13h6l-2 9 9-12h-6z"/>',
  // scales of a balance: two pans level
  balance: '<path d="M12 3v17M7 20h10M4 7h16"/><path d="M4 7l-2.5 6a2.5 2.5 0 0 0 5 0zM20 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  // vessels
  pot: '<path d="M4 8h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M1.5 10H4M20 10h2.5"/><path d="M8 5h8"/>',
  turka: '<path d="M7 6h8l1.5 13a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19z"/><path d="M15.5 9l7-4"/>',
  beaker: '<path d="M5 3h12M6 3v15a3 3 0 0 0 3 3h5a3 3 0 0 0 3-3V3"/><path d="M6 12h11M9 7h2M9 15h2"/>',
  calorimeter: '<path d="M7 5v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5"/><path d="M3.5 7v13.5h17V7"/><path d="M2 5h20"/><path d="M7 12h10"/>',
  'flask-conical': '<path d="M9 3h6M10 3v6l-6 10a1.5 1.5 0 0 0 1.3 2.2h13.4A1.5 1.5 0 0 0 20 19l-6-10V3"/><path d="M6.5 15h11"/>',
  'flask-round': '<path d="M10 3h4M10.5 3v6.5a6 6 0 1 0 3 0V3"/><path d="M7 15h10"/>',
  'test-tube': '<path d="M14 2l8 8M15.5 3.5L5 14a3 3 0 0 0 4.2 4.2L19.7 7.7"/><path d="M8 11.5h6"/>',
  // devices
  hotplate: '<rect x="2" y="15" width="20" height="5" rx="1.5"/><ellipse cx="12" cy="13" rx="7" ry="2"/><path d="M8 9c0-1.5 1-1.5 1-3M12 9c0-1.5 1-1.5 1-3M16 9c0-1.5 1-1.5 1-3"/>',
  induction: '<rect x="2" y="15" width="20" height="5" rx="1.5"/><ellipse cx="12" cy="17.5" rx="5" ry="1.2"/><ellipse cx="12" cy="17.5" rx="2.5" ry="0.6"/><path d="M7 11c2-2 8-2 10 0M9 8c1.5-1.2 4.5-1.2 6 0"/>',
  gas: '<path d="M3 20h18M6 17h12"/><path d="M8 17c-1.5-2 .5-3 0-5 2 1 2 3 1.5 5M12 17c-1.5-2.5.5-4 0-7 2.5 1.5 2.5 4.5 1.5 7M16 17c-1.5-2 .5-3 0-5 2 1 2 3 1.5 5"/>',
  bunsen: '<path d="M8 22h8M10 22V12h4v10"/><path d="M12 11c-2-2.5 0-4.5 0-8 2.5 2.5 2.5 5.5 0 8z"/>',
  spirit: '<path d="M6 21c-.5-4 1-7 4-8h4c3 1 4.5 4 4 8z"/><path d="M11 13v-2h2v2"/><path d="M12 10c-1.6-1.8 0-3.2 0-6 2 2 2 4.2 0 6z"/>',
  immersion: '<path d="M9 2v14a3 3 0 0 0 6 0V2"/><path d="M9 6h6M9 10h6"/><path d="M12 2c0-1 3-1 5 1"/>',
  fridge: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 9h14M8 5v2M8 12v4"/>',
  freezer: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 9v8M8.5 11l7 4M15.5 11l-7 4"/>',
  'ice-bath': '<path d="M3 10l2 10h14l2-10z"/><rect x="7" y="12" width="4" height="4" rx="1"/><rect x="13" y="13" width="4" height="4" rx="1"/><path d="M3 10h18"/>',
  'ice-salt-bath': '<path d="M3 10l2 10h14l2-10z"/><rect x="7" y="12" width="4" height="4" rx="1"/><circle cx="15" cy="15" r=".8"/><circle cx="17" cy="13" r=".8"/><circle cx="14.5" cy="12.5" r=".8"/><path d="M3 10h18"/>',
  battery: '<rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 2v3M15 2v3M12 10v5M9.5 12.5h5"/>',
  usb: '<rect x="8" y="2" width="8" height="7" rx="1"/><path d="M10 4h1M13 4h1M12 9v13"/><path d="M12 15l-3-2v-2M12 18l3-2v-2"/>',
  supply: '<rect x="2" y="6" width="20" height="13" rx="2"/><rect x="5" y="9" width="9" height="4" rx="1"/><circle cx="17.5" cy="11" r="1.5"/><circle cx="7" cy="16" r="1"/><circle cx="12" cy="16" r="1"/>',
  room: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
};

export const icon = (name: string | undefined, cls = 'ic'): string =>
  name && P[name] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[name]}</svg>` : '';
