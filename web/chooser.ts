/**
 * Choosing things over the table: the pictures stand in a row above it, the one in the middle large,
 * its neighbours small at the sides; arrows, a swipe or the side pictures turn the row. The chosen one
 * flies down to its place on the table (a bottle tips over the vessel and pours). It draws and moves,
 * it decides nothing: what is offered and what a choice does come from the page.
 */

export interface ChoiceCard {
  readonly key: string;
  readonly name: string;
  readonly note?: string | undefined;
  /** A picture: an <svg> (with `data-fit` it is cropped to what is drawn) or an icon. */
  readonly pic: string;
  /** The button's words for this one ("Put it on the table", "Pour it in"). */
  readonly action: string;
}

export interface ChooserStage {
  readonly title: string;
  readonly cards: readonly ChoiceCard[];
  /** The card in the middle at first (what is chosen now). */
  readonly start: number;
  /** Which step of how many (the dots), if there are several. */
  readonly step?: { readonly at: number; readonly of: number };
  /** A line under the row: what went wrong with the last choice. */
  readonly error?: string;
}

export interface Chooser {
  readonly open: boolean;
  /** Show a stage; `choose` gets the card and its picture (to fly from). */
  show(stage: ChooserStage, choose: (card: ChoiceCard, pic: HTMLElement) => void, close: () => void): void;
  hide(): void;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createChooser(host: HTMLElement, words: () => { prev: string; next: string; close: string }): Chooser {
  const box = document.createElement('div');
  box.className = 'chooser';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  host.append(box);
  let at = 0;
  let count = 0;
  let busy = false;
  let onKey: ((e: KeyboardEvent) => void) | null = null;

  const hide = () => {
    box.hidden = true;
    host.classList.remove('choosing');
    box.innerHTML = '';
    if (onKey) document.removeEventListener('keydown', onKey);
    onKey = null;
  };

  return {
    get open() {
      return !box.hidden;
    },
    hide,
    show(stage, choose, close) {
      hide();
      busy = false;
      box.hidden = false;
      box.classList.remove('flying');
      host.classList.add('choosing');
      const labels = words();
      count = stage.cards.length;
      at = Math.max(0, Math.min(count - 1, stage.start));
      box.setAttribute('aria-label', stage.title);
      const head = el('div', 'ch-head');
      head.append(el('span', 'ch-title', stage.title));
      if (stage.step && stage.step.of > 1) {
        const dots = el('span', 'ch-steps');
        for (let i = 0; i < stage.step.of; i++) dots.append(el('i', i < stage.step.at ? 'done' : i === stage.step.at ? 'on' : ''));
        head.append(dots);
      }
      const x = button('ch-close', '✕', labels.close);
      x.onclick = () => {
        hide();
        close();
      };
      head.append(x);
      const row = el('div', 'ch-row');
      const items = stage.cards.map((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ch-item';
        b.innerHTML = `<span class="ch-pic">${c.pic}</span>`;
        b.append(el('span', 'ch-name', c.name), ...(c.note ? [el('span', 'ch-note', c.note)] : []));
        // The middle one is chosen; a side one comes to the middle.
        b.onclick = () => (i === at ? pick() : turn(i - at));
        return b;
      });
      row.append(...items);
      const prev = button('ch-arrow prev', '‹', labels.prev);
      const next = button('ch-arrow next', '›', labels.next);
      prev.onclick = () => turn(-1);
      next.onclick = () => turn(1);
      const go = button('primary ch-go', '', '');
      go.onclick = () => pick();
      const foot = el('div', 'ch-foot', ...(stage.error ? [el('p', 'ch-error', `⚠ ${stage.error}`)] : []));
      foot.prepend(go);
      box.append(head, el('div', 'ch-stage', prev, row, next), foot);
      for (const svg of box.querySelectorAll<SVGSVGElement>('svg[data-fit]')) fit(svg);

      const place = () => {
        items.forEach((b, i) => {
          const off = i - at;
          const far = Math.abs(off) > 1;
          b.style.transform = `translateX(calc(-50% + ${Math.max(-2, Math.min(2, off)) * 115}%)) scale(${off === 0 ? 1 : 0.62})`;
          b.style.opacity = far ? '0' : off === 0 ? '1' : '0.55';
          b.classList.toggle('mid', off === 0);
          b.tabIndex = off === 0 ? 0 : -1;
          b.setAttribute('aria-hidden', String(far));
        });
        prev.disabled = at === 0;
        next.disabled = at === count - 1;
        go.textContent = stage.cards[at]?.action ?? '';
      };
      const turn = (by: number) => {
        if (busy) return;
        at = Math.max(0, Math.min(count - 1, at + by));
        place();
      };
      const pick = () => {
        const c = stage.cards[at];
        if (busy || !c) return;
        busy = true;
        // The row steps aside while the chosen one flies down.
        box.classList.add('flying');
        choose(c, items[at]!.querySelector<HTMLElement>('.ch-pic')!);
      };
      // A swipe turns the row too.
      let from: number | null = null;
      row.addEventListener('pointerdown', (e) => (from = e.clientX));
      row.addEventListener('pointerup', (e) => {
        if (from !== null && Math.abs(e.clientX - from) > 40) turn(e.clientX < from ? 1 : -1);
        from = null;
      });
      onKey = (e) => {
        if (box.hidden || (e.target as HTMLElement | null)?.closest('input, select, textarea')) return;
        if (e.key === 'ArrowLeft') turn(-1);
        else if (e.key === 'ArrowRight') turn(1);
        else if (e.key === 'Escape') x.click();
        else return;
        e.preventDefault();
      };
      document.addEventListener('keydown', onKey);
      place();
    },
  };
}

/**
 * Fly a picture from the row to its place on the table: lifted a little, then down onto the place,
 * shrunk or grown to its size there. `pour` — a bottle: it stops over the vessel, tips and empties.
 * Resolves when it has landed (at once with reduced motion).
 */
export function fly(host: HTMLElement, pic: HTMLElement, to: DOMRect | null, pour = false): Promise<void> {
  const a = pic.getBoundingClientRect();
  if (!to || !to.width || !a.width || reduced()) return Promise.resolve();
  const h = host.getBoundingClientRect();
  const ghost = pic.cloneNode(true) as HTMLElement;
  ghost.classList.add('ch-ghost');
  Object.assign(ghost.style, { left: `${a.left - h.left}px`, top: `${a.top - h.top}px`, width: `${a.width}px`, height: `${a.height}px` });
  host.append(ghost);
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  let frames: Keyframe[];
  let ms: number;
  if (pour) {
    // Over the vessel's mouth, a little to its right; tipped towards it.
    const s = Math.min(1, (to.width * 0.55) / a.width, (to.height * 0.9) / a.height);
    const dx = to.right - (a.width * s) / 2 - ax;
    const dy = to.top - (a.height * s) / 2 - 6 - ay;
    const at = (k: number, r: number) => `translate(${dx * k}px, ${dy * k - (k > 0 && k < 1 ? 30 : 0)}px) scale(${1 + (s - 1) * k}) rotate(${r}deg)`;
    frames = [
      { transform: at(0, 0), offset: 0 },
      { transform: at(0.5, 0), offset: 0.25 },
      { transform: at(1, 0), offset: 0.5 },
      { transform: at(1, -115), offset: 0.75, opacity: 1 },
      { transform: at(1, -115), offset: 1, opacity: 0 },
    ];
    ms = 1500;
  } else {
    const s = Math.min(to.width / a.width, to.height / a.height);
    const dx = to.left + to.width / 2 - ax;
    // Standing on the table: bottoms meet.
    const dy = to.bottom - (a.height * s) / 2 - ay;
    frames = [
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(${(1 + s) / 2})`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})` },
    ];
    ms = 750;
  }
  return new Promise((done) => {
    const anim = ghost.animate(frames, { duration: ms, easing: 'ease-in-out', fill: 'forwards' });
    anim.onfinish = anim.oncancel = () => {
      ghost.remove();
      done();
    };
  });
}

/** Crop an <svg> to what is drawn in it (its first group), with a little margin. */
function fit(svg: SVGSVGElement) {
  const g = svg.querySelector('g');
  if (!g) return;
  try {
    const b = g.getBBox();
    if (!b.width || !b.height) return;
    const m = Math.max(b.width, b.height) * 0.04;
    svg.setAttribute('viewBox', `${b.x - m} ${b.y - m} ${b.width + 2 * m} ${b.height + 2 * m}`);
  } catch {
    // Not drawn (hidden): the picture keeps its own box.
  }
}

function el(tag: string, cls: string, ...kids: (string | Node)[]): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...kids);
  return e;
}
function button(cls: string, text: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = text;
  if (label) b.setAttribute('aria-label', label);
  return b;
}
