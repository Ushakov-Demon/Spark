/**
 * Going on after a ready-made experiment is answered — one place for every experiment, not written for each. It says
 * how this one can go on, draws the block under the answer, and takes its buttons:
 * - a vessel (the thermal engine takes anything): put something in or pick another action, then run it — «Start»
 *   waits until there is something to run;
 * - an apparatus with flexible conditions: the same apparatus again, with other conditions;
 * - neither: nothing to go on with (only «New experiment», which is not this module's).
 * The page gives what it knows (`GoOnContext`) and what its buttons do (`GoOnHandlers`); the module keeps whether
 * something was put in or picked since the answer.
 */
import { esc } from './experiment-sheet.js';

export interface GoOnContext {
  /** A guided experiment, its steps done and its answer given. */
  readonly answered: boolean;
  /** On an apparatus (a bench), not a vessel. */
  readonly bench: boolean;
  /** It has flexible conditions the pupil sees. */
  readonly varies: boolean;
  /** The vessel's action now: its name and what it does to all in the vessel ("прийде до теплової рівноваги"). */
  readonly action: { readonly label: string; readonly will: string };
}

export type GoOn = { readonly kind: 'vessel'; readonly ready: boolean; readonly action: GoOnContext['action'] } | { readonly kind: 'repeat' } | null;

export interface GoOnWords {
  readonly title: string;
  now(action: string, will: string): string;
  readonly first: string;
  readonly add: string;
  readonly change: string;
  /** Why «Start» waits. */
  readonly needs: string;
  readonly repeatTitle: string;
  readonly repeatText: string;
  readonly repeat: string;
}

export interface GoOnHandlers {
  add(): void;
  action(): void;
  start(): void;
  repeat(): void;
}

let something = false;

/** Something was put in or another action picked since the answer: going on has a point now. */
export const goOnMark = (): void => void (something = true);
/** A new experiment (or a new run of one): nothing yet. */
export const goOnReset = (): void => void (something = false);
/** Is there something to run — put in or picked since the answer? */
export const goOnReady = (): boolean => something;

/** How this experiment can go on now (null — it cannot, or it is not answered yet). */
export function goOnOf(c: GoOnContext): GoOn {
  if (!c.answered) return null;
  if (!c.bench) return { kind: 'vessel', ready: something, action: c.action };
  return c.varies ? { kind: 'repeat' } : null;
}

/** The block under the answer. */
export function goOnHtml(g: GoOn, w: GoOnWords): string {
  if (!g) return '';
  if (g.kind === 'repeat')
    return `<div class="go-on"><p class="go-on-title">${w.repeatTitle}</p><p>${w.repeatText}</p><div class="go-on-buttons"><button type="button" class="primary" data-go-repeat="1">${w.repeat}</button></div></div>`;
  const run = `▶ ${g.action.label}`;
  return `<div class="go-on"><p class="go-on-title">${w.title}</p><p>${w.now(g.action.label, g.action.will)}</p>${g.ready ? '' : `<p class="muted small">${w.first}</p>`}<div class="go-on-buttons"><button type="button" data-go-add="1">➕ ${w.add}</button><button type="button" data-go-action="1">${w.change}</button><button type="button" class="primary" data-go-start="1"${g.ready ? '' : ` disabled title="${esc(w.needs)}"`}>${run}</button></div></div>`;
}

/** A click in the block: handled (true) or not its own. */
export function goOnClick(target: HTMLElement, h: GoOnHandlers): boolean {
  const b = target.closest<HTMLButtonElement>('button[data-go-add], button[data-go-action], button[data-go-start], button[data-go-repeat]');
  if (!b) return false;
  if (b.dataset['goAdd']) h.add();
  else if (b.dataset['goAction']) h.action();
  else if (b.dataset['goStart']) h.start();
  else h.repeat();
  return true;
}
