/**
 * How things on the scene come to their new state — one set of rules for every instrument. A reading is not
 * there at once: a beam, a spring, a pointer swing to it; a block slides; a column of mercury creeps. Each
 * moving part is a channel with one of a few laws; a procedure (weights put on one by one) changes the
 * channels' targets over time. The motion is over when every channel has settled and the procedure is done.
 */

/** How a channel goes to its target. */
export type Law =
  /** A damped oscillation about the target (a beam, a spring with a load, a pointer): its period, s, and damping ratio; optional stops. */
  | { readonly kind: 'damped'; readonly period: number; readonly damping: number; readonly min?: number; readonly max?: number }
  /** Creeping up to the target without overshoot (a thermometer): time constant, s. */
  | { readonly kind: 'ease'; readonly tau: number }
  /** Moving at a steady speed to the target (a block pulled along): units per second. */
  | { readonly kind: 'steady'; readonly speed: number };

/** One moving part: where it is, how fast, where it goes. */
export class Channel {
  speed = 0;
  constructor(
    public value: number,
    public target: number,
    readonly law: Law,
    /** Close enough to call it at rest, in the channel's units. */
    readonly tolerance: number,
  ) {}

  step(dt: number): void {
    const law = this.law;
    if (law.kind === 'damped') {
      const w = (2 * Math.PI) / law.period;
      this.speed += (w * w * (this.target - this.value) - 2 * law.damping * w * this.speed) * dt;
      this.value += this.speed * dt;
      // On a stop it stays there (a beam resting on its stops).
      if (law.min !== undefined && this.value < law.min) (this.value = law.min), (this.speed = 0);
      if (law.max !== undefined && this.value > law.max) (this.value = law.max), (this.speed = 0);
    } else if (law.kind === 'ease') {
      this.value += (this.target - this.value) * Math.min(1, dt / law.tau);
    } else {
      const d = this.target - this.value;
      this.value += Math.sign(d) * Math.min(Math.abs(d), law.speed * dt);
    }
  }

  get settled(): boolean {
    return Math.abs(this.target - this.value) < this.tolerance && Math.abs(this.speed) < this.tolerance * 3;
  }
}

/** A step of a procedure: after `delay` ms, do something (put a weight on) — it may change the targets. */
export interface ProcedureStep {
  readonly delay: number;
  readonly apply: () => void;
}

/** A motion to play: its channels, the procedure, how to draw a frame. */
export interface Motion {
  readonly channels: readonly Channel[];
  readonly steps?: readonly ProcedureStep[];
  /** Draw the frame; `done` — the last frame (the reading can be shown). */
  readonly frame: (done: boolean) => void;
}

/** Play a motion to its end; returns a function that stops it. `onSettled` is called once at the end. */
export function play(m: Motion, onSettled: () => void): () => void {
  const steps = [...(m.steps ?? [])];
  let next = performance.now() + (steps[0]?.delay ?? 0);
  let last = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    // (The first frame's time may come a little before `last` was taken: never step backwards.)
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    while (steps.length && now >= next) {
      steps.shift()!.apply();
      next = now + (steps[0]?.delay ?? 0);
    }
    for (const c of m.channels) c.step(dt);
    const done = !steps.length && m.channels.every((c) => c.settled);
    // Settled is «within tolerance»: the last frame stands exactly at the targets (the same picture every time).
    if (done) for (const c of m.channels) c.value = c.target;
    m.frame(done);
    if (done) onSettled();
    else frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
