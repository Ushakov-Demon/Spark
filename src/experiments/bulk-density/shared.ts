/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */

/** The granular substances on the table: the catalogue's solids that come as grains, crystals, powder or filings. */
export const BULK_SUBSTANCES = ['sodium-chloride', 'sucrose', 'sodium-bicarbonate', 'calcium-carbonate', 'copper-sulfate', 'iron'] as const;
export type BulkSubstance = (typeof BULK_SUBSTANCES)[number];
/** Each one's everyday name (the card's texts): «кухонна сіль», not «натрій хлорид». */
export const BULK_NAME: Readonly<Record<BulkSubstance, string>> = {
  'sodium-chloride': 'bulk-density-substance-salt',
  sucrose: 'bulk-density-substance-sugar',
  'sodium-bicarbonate': 'bulk-density-substance-soda',
  'calcium-carbonate': 'bulk-density-substance-chalk',
  'copper-sulfate': 'bulk-density-substance-vitriol',
  iron: 'bulk-density-substance-iron',
};
