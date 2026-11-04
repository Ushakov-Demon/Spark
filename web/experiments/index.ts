/// <reference types="vite/client" />
import { registerExperiment } from '../../src/experiments/registry.js';
import { loadRunTexts } from '../locales.js';
import type { ExperimentModule } from '../../src/experiments/types.js';
import type { ExperimentScene } from './types.js';

/**
 * The experiments the page loads when they open: a module (src/experiments/<folder>/index.ts — its commands, words,
 * board and answers), its picture (web/experiments/<folder>/scene.ts) and its run's texts (<folder>.run.ftl), each in
 * a chunk of its own, so the page's start does not grow with the number of experiments; it has only their cards
 * (src/experiments/cards.ts). Nothing to register by hand: all is found by the folder, which a card names by its kind.
 */
const MODULES = import.meta.glob<Readonly<Record<string, unknown>>>('../../src/experiments/*/index.ts');
const SCENES = import.meta.glob<Readonly<Record<string, unknown>>>('./*/scene.ts');
/** The cards themselves (already in the page): which folder a kind of bench is in. */
const CARDS = import.meta.glob<Readonly<Record<string, unknown>>>('../../src/experiments/*/preset.ts', { eager: true });

const isKinded = (x: unknown): x is { readonly kind: string } => typeof x === 'object' && x !== null && typeof (x as { kind?: unknown }).kind === 'string';
const FOLDER = new Map<string, string>(Object.entries(CARDS).flatMap(([path, m]) => (isKinded(m['card']) ? [[m['card'].kind, path.split('/')[4]!] as const] : [])));

const scenes = new Map<string, ExperimentScene<unknown>>();
const loading = new Map<string, Promise<void>>();

/** The scene of a kind of bench, once loaded (undefined — not a module's bench, or not loaded yet). */
export const sceneOf = (kind: string): ExperimentScene<unknown> | undefined => scenes.get(kind);

/**
 * Loads the experiment of a kind of bench — its module (registered), its scene and its run's texts — once; at once for
 * a bench with none. A failed load may be tried again.
 */
export function loadExperiment(kind: string): Promise<void> {
  const folder = FOLDER.get(kind);
  const mod = MODULES[`../../src/experiments/${folder}/index.ts`];
  const scene = SCENES[`./${folder}/scene.ts`];
  if (scenes.has(kind) || !mod || !scene) return Promise.resolve();
  let p = loading.get(kind);
  if (!p) {
    p = Promise.all([mod(), scene(), loadRunTexts(folder!)]).then(
      ([m, s]) => {
        const module = Object.values(m).find((x): x is ExperimentModule<never> => isKinded(x) && x.kind === kind && 'commands' in x);
        const picture = Object.values(s).find((x): x is ExperimentScene<unknown> => isKinded(x) && x.kind === kind);
        if (!module || !picture) throw new Error(`${folder}: no module or scene of kind ${kind}`);
        registerExperiment(module);
        scenes.set(kind, picture);
      },
      (e: unknown) => {
        loading.delete(kind);
        throw e;
      },
    );
    loading.set(kind, p);
  }
  return p;
}

/** Every experiment (a recording may hold any one's steps). */
export const loadAllExperiments = (): Promise<void> => Promise.all([...FOLDER.keys()].map(loadExperiment)).then(() => undefined);
