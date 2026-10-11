/**
 * UI-agnostic explanation document. The console renders it as text,
 * a web UI can render the same blocks as cards, KaTeX formulas, tables.
 */
export type Block =
  | { readonly kind: 'heading'; readonly depth: 1 | 2 | 3; readonly text: string }
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'formula'; readonly plain: string; readonly latex: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'table'; readonly head: readonly string[]; readonly rows: readonly (readonly string[])[] }
  | { readonly kind: 'note'; readonly tone: 'info' | 'warning'; readonly text: string }
  /** The headline result of an experiment — shown first, prominently. */
  | { readonly kind: 'summary'; readonly tone: 'success' | 'failure' | 'neutral'; readonly lines: readonly string[] }
  /** Collapsed by default: "show the whole process". */
  | { readonly kind: 'details'; readonly summary: string; readonly blocks: readonly Block[] };

export const h = (depth: 1 | 2 | 3, text: string): Block => ({ kind: 'heading', depth, text });
export const p = (text: string): Block => ({ kind: 'paragraph', text });
export const list = (items: readonly string[]): Block => ({ kind: 'list', items });
export const note = (tone: 'info' | 'warning', text: string): Block => ({ kind: 'note', tone, text });
