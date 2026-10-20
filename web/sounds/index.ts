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
  if (!v) hush();
}
/** Stop reading out loud (a new line, the sound off, another voice). */
export function hush(): void {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
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
 * a source, a pitch range, a syllable length and, for the human-like ones, consonants and vowel
 * formants, so the syllables sound like "та-ко-лу-ме" in a made-up language. Or "speech": the
 * browser's own voice reads the line out in the page's language.
 */
export type VoiceId = 'speech' | 'mumble' | 'gruff' | 'chirp' | 'robot' | 'whistle' | 'none';
interface Voice {
  /** 'glottal' — a soft buzz like vocal folds (harmonics falling off); otherwise a plain wave. */
  readonly wave: OscillatorType | 'glottal';
  readonly low: number; // Hz
  readonly high: number;
  readonly step: number; // s per syllable
  /** Human-like: a consonant, a vowel with formants, a little tremble, the pitch falling over the line. */
  readonly human: boolean;
  readonly glide: number; // pitch change within a syllable (×)
  readonly volume: number;
  readonly quantize?: readonly number[]; // pitch ratios (a robot sings notes)
  /** Hoarseness, 0…1: breath noise through the vowels and an uneven rattle of the voice. */
  readonly rasp?: number;
  /** Formants moved up (×): "helium" — sound is faster in it, so the mouth's resonances rise too. */
  readonly formantShift?: number;
  /** How clearly the vowels come out, 0…1: lower — broader formants and more of the plain voice. */
  readonly clarity?: number;
}
const VOICES: Readonly<Record<Exclude<VoiceId, 'none' | 'speech'>, Voice>> = {
  mumble: { wave: 'glottal', low: 330, high: 430, step: 0.12, human: true, glide: 0.97, volume: 0.5, rasp: 0.45, formantShift: 1.5, clarity: 0.45 },
  gruff: { wave: 'glottal', low: 88, high: 112, step: 0.15, human: true, glide: 0.96, volume: 0.65, rasp: 0.35 },
  chirp: { wave: 'triangle', low: 420, high: 720, step: 0.062, human: false, glide: 1.25, volume: 0.2 },
  robot: { wave: 'square', low: 220, high: 220, step: 0.075, human: false, glide: 1, volume: 0.09, quantize: [1, 1.26, 1.5, 2] },
  whistle: { wave: 'sine', low: 950, high: 1500, step: 0.1, human: false, glide: 1.12, volume: 0.16 },
};
export const VOICE_IDS: readonly VoiceId[] = ['speech', 'mumble', 'gruff', 'chirp', 'robot', 'whistle', 'none'];
/** Formants (F1, F2, F3), Hz, of the vowels а, о, у, е, и. */
const VOWELS: readonly (readonly [number, number, number])[] = [[750, 1250, 2600], [520, 900, 2500], [340, 760, 2400], [480, 1850, 2600], [320, 2250, 2900]];
/** Consonants as short noise bursts: centre frequency, Hz, and length, s (с, ш, т, к, п/б, м/н — a soft hum). */
const CONSONANTS: readonly (readonly [number, number])[] = [[6000, 0.05], [3000, 0.05], [4000, 0.018], [1800, 0.02], [900, 0.015], [300, 0.03]];
let voice: VoiceId = 'mumble';
export const currentVoice = (): VoiceId => voice;
export function setVoice(v: VoiceId): void {
  voice = v;
  hush();
}

/** The line being burbled now: faded out when the next one starts. */
let speaking: GainNode | null = null;
function quiet(a: AudioContext): void {
  if (!speaking) return;
  const g = speaking;
  speaking = null;
  g.gain.cancelScheduledValues(a.currentTime);
  g.gain.setValueAtTime(g.gain.value, a.currentTime);
  g.gain.linearRampToValueAtTime(0, a.currentTime + 0.04);
  window.setTimeout(() => g.disconnect(), 120);
}

/** Half a second of white noise, made once: breath for a hoarse voice. */
let breathBuf: AudioBuffer | null = null;
function breathBuffer(a: AudioContext): AudioBuffer {
  if (breathBuf) return breathBuf;
  breathBuf = a.createBuffer(1, Math.ceil(a.sampleRate * 1), a.sampleRate);
  const d = breathBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  return breathBuf;
}

/** A soft "vocal folds" source: harmonics falling off like a human voice (≈ −12 dB per octave). */
let glottal: PeriodicWave | null = null;
function glottalWave(a: AudioContext): PeriodicWave {
  if (glottal) return glottal;
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = 1 / (k * k ** 0.5);
  glottal = a.createPeriodicWave(real, imag);
  return glottal;
}

/** The browser's own voice for this language, if it has one. */
function browserVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const all = speechSynthesis.getVoices();
  return all.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}
/** Can the "speech" voice speak this language here? (Otherwise it burbles.) */
export const canSpeak = (lang: string): boolean => browserVoice(lang) !== null;

/**
 * The Professor "speaking" a line. "speech" — the browser reads it out (a lower, slower voice); the
 * other voices burble: as many syllables as the line has words (two per long word), at most ≈ 1.6 s,
 * the voice going up at the end of a question. Returns how long it lasts, s.
 */
export function babble(text: string, v: VoiceId = voice, lang = 'uk'): number {
  if (v === 'none' || !text.trim()) return 0;
  if (v === 'speech') {
    const sv = on && woke ? browserVoice(lang) : null;
    if (sv) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = sv;
      u.lang = sv.lang;
      u.pitch = 0.8;
      u.rate = 1.02;
      speechSynthesis.speak(u);
      return Math.min(12, text.length * 0.065);
    }
    v = 'mumble';
  }
  const a = audio();
  if (!a) return 0;
  const vc = VOICES[v];
  // One line at a time: a new one cuts the one still playing (two at once sound like double speed).
  quiet(a);
  const words = text.split(/\s+/).filter(Boolean);
  const count = Math.min(Math.floor(1.6 / vc.step), Math.max(3, words.reduce((n, w) => n + (w.length > 6 ? 2 : 1), 0)));
  const question = /\?\s*$/.test(text);
  const exclaim = /!\s*$/.test(text);
  const out = a.createGain();
  out.gain.value = vc.volume;
  out.connect(a.destination);
  speaking = out;
  let t = a.currentTime + 0.03;
  const start = t;
  for (let i = 0; i < count; i++) {
    const last = i === count - 1;
    // A stressed syllable now and then: longer and a little higher.
    const stressed = vc.human && (i % 3 === 1 || last);
    const len = vc.step * (stressed ? 1.35 : 0.85 + Math.random() * 0.25);
    // Over the line the pitch falls a little (as speech does), and rises at the end of a question.
    const fall = vc.human ? 1 - 0.18 * (i / Math.max(1, count - 1)) : 1;
    let f = (vc.low + Math.random() * (vc.high - vc.low) * (exclaim ? 1.15 : 1)) * fall * (stressed ? 1.08 : 1);
    if (vc.quantize) f = vc.low * vc.quantize[Math.floor(Math.random() * vc.quantize.length)]!;
    if (last && question) f *= 1.3;
    if (vc.human) {
      const [cf, cl] = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]!;
      noise(a, out, t, cl, cf, 0.35);
      t += cl * 0.7;
    }
    const o = a.createOscillator();
    if (vc.wave === 'glottal') o.setPeriodicWave(glottalWave(a));
    else o.type = vc.wave;
    o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * (last && question ? 1.22 : vc.glide), t + len * 0.9);
    if (vc.human) {
      // A tremble of the voice: a slow vibrato of a few hertz.
      const lfo = a.createOscillator();
      const depth = a.createGain();
      lfo.frequency.value = 5 + Math.random() * 1.5;
      depth.gain.value = f * 0.025;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + len);
    }
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + (vc.human ? 0.03 : 0.012));
    g.gain.setValueAtTime(1, t + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.95);
    if (vc.rasp) {
      // Hoarse: the voice rattles unevenly (a fast irregular wobble of its loudness)…
      const rattle = a.createGain();
      rattle.gain.value = 1;
      const shake = a.createOscillator();
      shake.type = 'square';
      shake.frequency.setValueAtTime(28 + Math.random() * 18, t);
      shake.frequency.linearRampToValueAtTime(40 + Math.random() * 25, t + len);
      const depth = a.createGain();
      depth.gain.value = 0.35 * vc.rasp;
      shake.connect(depth).connect(rattle.gain);
      shake.start(t);
      shake.stop(t + len);
      o.connect(rattle).connect(g);
      // …and breath goes through the vowel with it.
      const breath = a.createBufferSource();
      breath.buffer = breathBuffer(a);
      const bg = a.createGain();
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.9 * vc.rasp, t + 0.04);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.95);
      breath.connect(bg).connect(g);
      breath.start(t, Math.random() * 0.5);
      breath.stop(t + len);
    } else o.connect(g);
    if (vc.human) {
      // Three formant filters give the syllable its vowel; the mouth moves a little from one vowel to the next.
      const [f1, f2, f3] = VOWELS[Math.floor(Math.random() * VOWELS.length)]!;
      const shift = vc.formantShift ?? 1;
      const clarity = vc.clarity ?? 1;
      for (const [fq0, q, gain] of [[f1, 6, 1], [f2, 9, 0.6], [f3, 12, 0.25]] as const) {
        const fq = fq0 * shift;
        const bp = a.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(fq * 0.9, t);
        bp.frequency.linearRampToValueAtTime(fq, t + len * 0.3);
        // Less clear: broader formants — the vowels blur into a murmur.
        bp.Q.value = q * (0.3 + 0.7 * clarity);
        const fg = a.createGain();
        fg.gain.value = gain * 3;
        g.connect(bp).connect(fg).connect(out);
      }
      if ((vc.clarity ?? 1) < 1) {
        // A little of the voice past the "mouth": muffles the vowels further.
        const dry = a.createBiquadFilter();
        dry.type = 'lowpass';
        dry.frequency.value = 1800 * (vc.formantShift ?? 1);
        const dg = a.createGain();
        dg.gain.value = 0.5 * (1 - (vc.clarity ?? 1));
        g.connect(dry).connect(dg).connect(out);
      }
    } else g.connect(out);
    o.start(t);
    o.stop(t + len);
    t += len;
  }
  return t - start;
}
