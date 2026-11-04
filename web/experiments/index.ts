/// <reference types="vite/client" />
import type { ExperimentScene } from './types.js';

/**
 * The pictures of the experiment modules: web/experiments/<folder>/scene.ts, beside its module src/experiments/<folder>
 * (nothing to register by hand). Each comes in a chunk of its own when its experiment opens (`loadScene`), so the page's
 * start does not grow with the number of experiments; from then on it is drawn (`sceneOf`).
 */
const FILES = import.meta.glob<Readonly<Record<string, unknown>>>('./*/scene.ts');
/** The modules themselves (already in the page): which folder a kind of bench is in. */
const MODULES = import.meta.glob<Readonly<Record<string, unknown>>>('../../src/experiments/*/index.ts', { eager: true });

const isKinded = (x: unknown): x is { readonly kind: string } => typeof x === 'object' && x !== null && typeof (x as { kind?: unknown }).kind === 'string';
const FOLDER = new Map<string, string>(Object.entries(MODULES).flatMap(([path, m]) => Object.values(m).filter(isKinded).map((x) => [x.kind, path.split('/')[4]!] as const)));

const loaded = new Map<string, ExperimentScene<unknown>>();
const loading = new Map<string, Promise<void>>();

/** The scene of a kind of bench, once loaded (undefined — not a module's bench, or not loaded yet). */
export const sceneOf = (kind: string): ExperimentScene<unknown> | undefined => loaded.get(kind);

/** Loads the scene of a kind of bench (once; at once for a bench with none). A failed load may be tried again. */
export function loadScene(kind: string): Promise<void> {
  const file = FILES[`./${FOLDER.get(kind)}/scene.ts`];
  if (loaded.has(kind) || !file) return Promise.resolve();
  let p = loading.get(kind);
  if (!p) {
    p = file().then(
      (m) => {
        const scene = Object.values(m).find((x): x is ExperimentScene<unknown> => isKinded(x) && x.kind === kind);
        if (!scene) throw new Error(`web/experiments/${FOLDER.get(kind)}/scene.ts: no scene of kind ${kind}`);
        loaded.set(kind, scene);
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
