/**
 * Sounds of the lab, synthesized in the browser (Web Audio) — no sound files.
 * A "plop" when a body goes into a liquid, a soft fizz while salt dissolves.
 * Off by the 🔇 button (remembered); browsers allow sound only after a click
 * or a key, which is always how these happen.
 */
let ctx: AudioContext | null = null;
let on = true;

export const soundOn = (): boolean => on;
export function setSound(v: boolean): void {
  on = v;
}

function audio(): AudioContext | null {
  if (!on) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** A water "plop": a short tone that rises fast (the bubble), a second smaller one, a little splash of noise. */
export function plop(size = 1): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = 0.35;
  out.connect(a.destination);
  // Bigger bodies sound lower.
  const base = 260 / Math.max(0.6, Math.min(1.8, size));
  for (const [delay, f0, f1, len, vol] of [[0, base, base * 3.2, 0.13, 1], [0.07, base * 1.6, base * 4, 0.08, 0.5]] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t + delay);
    o.frequency.exponentialRampToValueAtTime(f1, t + delay + len);
    g.gain.setValueAtTime(0.0001, t + delay);
    g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + len);
    o.connect(g).connect(out);
    o.start(t + delay);
    o.stop(t + delay + len + 0.02);
  }
  noise(a, out, t, 0.18, 2500, 0.25);
}

/** Salt dissolving: a quiet fizz that fades. */
export function fizz(seconds = 1.6): void {
  const a = audio();
  if (!a) return;
  const out = a.createGain();
  out.gain.value = 0.18;
  out.connect(a.destination);
  noise(a, out, a.currentTime, seconds, 6000, 0.6);
}

function noise(a: AudioContext, out: AudioNode, t: number, len: number, freq: number, vol: number): void {
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * len), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}
