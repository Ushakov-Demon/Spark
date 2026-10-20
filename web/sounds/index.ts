/**
 * Sounds of the lab, synthesized in the browser (Web Audio) — no sound files.
 * A "plop" when a body goes into a liquid, a soft fizz while salt dissolves.
 * Off by the 🔇 button (remembered); browsers allow sound only after a click
 * or a key, which is always how these happen.
 */
let ctx: AudioContext | null = null;
let on = true;
/**
 * Browsers keep sound off until the person clicks or presses a key; anything scheduled before that
 * would all play at once on the first click. So nothing sounds before a first gesture.
 */
let woke = false;
if (typeof window !== 'undefined') {
  const wake = () => (woke = true);
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, wake, { once: true, capture: true });
}

export const soundOn = (): boolean => on;
export function setSound(v: boolean): void {
  on = v;
}

function audio(): AudioContext | null {
  if (!on || !woke) return null;
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

/**
 * The Professor's voices: a cartoon burble, synthesized — no recordings. Each voice is a recipe:
 * a source wave, a pitch range, a syllable length, and (for the human-like ones) vowel formants,
 * so the syllables sound like "а-о-у-е-и" in a made-up language.
 */
export type VoiceId = 'mumble' | 'gruff' | 'chirp' | 'robot' | 'whistle' | 'none';
interface Voice {
  readonly wave: OscillatorType;
  readonly low: number; // Hz
  readonly high: number;
  readonly step: number; // s per syllable
  readonly vowels: boolean;
  readonly glide: number; // pitch change within a syllable (×)
  readonly volume: number;
  readonly quantize?: readonly number[]; // pitch ratios (a robot sings notes)
}
const VOICES: Readonly<Record<Exclude<VoiceId, 'none'>, Voice>> = {
  mumble: { wave: 'sawtooth', low: 130, high: 190, step: 0.095, vowels: true, glide: 0.92, volume: 0.32 },
  gruff: { wave: 'sawtooth', low: 82, high: 115, step: 0.12, vowels: true, glide: 0.9, volume: 0.38 },
  chirp: { wave: 'triangle', low: 420, high: 720, step: 0.062, vowels: false, glide: 1.25, volume: 0.2 },
  robot: { wave: 'square', low: 220, high: 220, step: 0.075, vowels: false, glide: 1, volume: 0.09, quantize: [1, 1.26, 1.5, 2] },
  whistle: { wave: 'sine', low: 950, high: 1500, step: 0.1, vowels: false, glide: 1.12, volume: 0.16 },
};
export const VOICE_IDS: readonly VoiceId[] = ['mumble', 'gruff', 'chirp', 'robot', 'whistle', 'none'];
/** Formants (F1, F2), Hz, of the vowels а, о, у, е, и — what makes a buzz sound like a voice. */
const VOWELS: readonly (readonly [number, number])[] = [[750, 1250], [520, 900], [330, 760], [480, 1850], [320, 2250]];
let voice: VoiceId = 'mumble';
export const currentVoice = (): VoiceId => voice;
export function setVoice(v: VoiceId): void {
  voice = v;
}

/**
 * The Professor "speaking": a burble of syllables in the chosen voice. As many syllables as the line
 * has words (two per long word), at most ≈ 1.5 s; the voice goes up at the end of a question and
 * brightens on "!". Returns how long it lasts, s.
 */
export function babble(text: string, v: VoiceId = voice): number {
  if (v === 'none') return 0;
  const a = audio();
  if (!a || !text.trim()) return 0;
  const vc = VOICES[v];
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = Math.min(Math.floor(1.5 / vc.step), Math.max(3, words.reduce((n, w) => n + (w.length > 6 ? 2 : 1), 0)));
  const question = /\?\s*$/.test(text);
  const exclaim = /!\s*$/.test(text);
  const t0 = a.currentTime + 0.02;
  const out = a.createGain();
  out.gain.value = vc.volume;
  out.connect(a.destination);
  for (let i = 0; i < syllables; i++) {
    const t = t0 + i * vc.step + (Math.random() - 0.5) * vc.step * 0.15;
    const last = i === syllables - 1;
    let f = vc.low + Math.random() * (vc.high - vc.low) * (exclaim ? 1.15 : 1);
    if (vc.quantize) f = vc.low * vc.quantize[Math.floor(Math.random() * vc.quantize.length)]!;
    if (last && question) f *= 1.35;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = vc.wave;
    o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * (last && question ? 1.25 : vc.glide * (0.95 + Math.random() * 0.1)), t + vc.step * 0.8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + vc.step * 0.88);
    o.connect(g);
    if (vc.vowels) {
      // Two formant filters in parallel give the syllable its vowel.
      const [f1, f2] = VOWELS[Math.floor(Math.random() * VOWELS.length)]!;
      for (const [fq, q, gain] of [[f1, 5, 1], [f2, 7, 0.55]] as const) {
        const bp = a.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = fq;
        bp.Q.value = q;
        const fg = a.createGain();
        fg.gain.value = gain * 2.2;
        g.connect(bp).connect(fg).connect(out);
      }
    } else g.connect(out);
    o.start(t);
    o.stop(t + vc.step);
  }
  return syllables * vc.step;
}
