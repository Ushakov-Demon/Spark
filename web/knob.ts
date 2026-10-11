/**
 * A rotary knob like on a real stove. Value 0 … 1 (0 = off).
 * Drag up/down or around, scroll, or use arrow keys; it is an ARIA slider.
 */
export interface Knob {
  readonly element: HTMLElement;
  value: number;
  setLabels(labels: { readonly min: string; readonly max: string; readonly off: string }, ticks: readonly string[]): void;
  setDisabled(disabled: boolean): void;
}

const START = -135; // degrees at value 0
const SWEEP = 270;
const SVG = 'http://www.w3.org/2000/svg';

export function createKnob(onChange: (value: number) => void, describe: (value: number) => string): Knob {
  let value = 0;
  let disabled = false;
  let ticks: readonly string[] = [];

  const root = document.createElement('div');
  root.className = 'knob';
  root.tabIndex = 0;
  root.setAttribute('role', 'slider');
  root.setAttribute('aria-valuemin', '0');
  root.setAttribute('aria-valuemax', '100');

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '-60 -60 120 120');
  const tickGroup = document.createElementNS(SVG, 'g');
  const dial = document.createElementNS(SVG, 'g');
  dial.innerHTML = '<circle r="34" class="knob-body"/><rect x="-3" y="-34" width="6" height="22" rx="3" class="knob-pointer"/>';
  svg.append(tickGroup, dial);
  const readout = document.createElement('div');
  readout.className = 'knob-readout';
  root.append(svg, readout);

  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [Math.cos(rad) * r, Math.sin(rad) * r] as const;
  };

  function drawTicks() {
    tickGroup.innerHTML = '';
    const n = Math.max(ticks.length, 2);
    for (let i = 0; i < n; i++) {
      const deg = START + (SWEEP * i) / (n - 1);
      const [x1, y1] = polar(deg, 40);
      const [x2, y2] = polar(deg, 46);
      const line = document.createElementNS(SVG, 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('class', 'knob-tick');
      tickGroup.append(line);
      const label = ticks[i];
      if (label) {
        const [tx, ty] = polar(deg, 54);
        const t = document.createElementNS(SVG, 'text');
        t.setAttribute('x', String(tx));
        t.setAttribute('y', String(ty + 3));
        t.setAttribute('class', 'knob-label');
        t.textContent = label;
        tickGroup.append(t);
      }
    }
  }

  function render() {
    dial.setAttribute('transform', `rotate(${START + SWEEP * value})`);
    const text = describe(value);
    readout.textContent = text;
    root.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    root.setAttribute('aria-valuetext', text);
    root.classList.toggle('is-off', value === 0);
  }

  function set(v: number, notify = true) {
    const next = Math.min(1, Math.max(0, Math.round(v * 100) / 100));
    if (next === value) return;
    value = next;
    render();
    if (notify) onChange(value);
  }

  // Drag: vertical movement or angle around the centre, whichever feels natural.
  let dragging = false;
  root.addEventListener('pointerdown', (e) => {
    if (disabled) return;
    dragging = true;
    root.setPointerCapture(e.pointerId);
    angleTo(e);
  });
  root.addEventListener('pointermove', (e) => dragging && angleTo(e));
  root.addEventListener('pointerup', () => (dragging = false));
  root.addEventListener('pointercancel', () => (dragging = false));
  function angleTo(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // 0 = up
    if (deg > 180) deg -= 360;
    if (deg < START - 20 || deg > START + SWEEP + 20) return; // dead zone at the bottom
    set((Math.min(Math.max(deg, START), START + SWEEP) - START) / SWEEP);
  }
  root.addEventListener(
    'wheel',
    (e) => {
      if (disabled) return;
      e.preventDefault();
      set(value + (e.deltaY < 0 ? 0.05 : -0.05));
    },
    { passive: false },
  );
  root.addEventListener('keydown', (e) => {
    if (disabled) return;
    const step = e.shiftKey ? 0.1 : 0.05;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(value + step);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(value - step);
    else if (e.key === 'Home' || e.key === '0') set(0);
    else if (e.key === 'End') set(1);
    else return;
    e.preventDefault();
  });

  drawTicks();
  render();
  return {
    element: root,
    get value() {
      return value;
    },
    set value(v: number) {
      set(v, false);
    },
    setLabels(l, t) {
      void l;
      ticks = t;
      drawTicks();
      render();
    },
    setDisabled(d) {
      disabled = d;
      root.classList.toggle('is-disabled', d);
      root.setAttribute('aria-disabled', String(d));
    },
  };
}
