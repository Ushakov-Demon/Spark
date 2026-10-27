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
  if (!v) {
    hush();
    hum(0);
  }
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

/**
 * The power supply humming while a current flows — its transformer: mostly 100 Hz (twice the 50 Hz of the
 * mains: the iron core is squeezed twice a period, magnetostriction), a little of the 50 Hz itself, and a
 * buzz of the higher harmonics, so that small speakers, which hardly play 100 Hz, still give it. `level`
 * 0…1 (with the current); 0 — quiet. With `seconds`: a moment of it (a key closed for a reading), then quiet.
 */
let humming: { readonly out: GainNode; readonly stop: (at: number) => void } | null = null;
let humOff = 0;
export function hum(level: number, seconds?: number): void {
  window.clearTimeout(humOff);
  const a = level > 0 ? audio() : ctx;
  if (!a) return;
  const t = a.currentTime;
  if (level <= 0) {
    if (!humming) return;
    const h = humming;
    humming = null;
    h.out.gain.cancelScheduledValues(t);
    h.out.gain.setTargetAtTime(0, t, 0.06);
    h.stop(t + 0.4);
    return;
  }
  if (!humming) {
    const out = a.createGain();
    out.gain.value = 0;
    out.connect(a.destination);
    const sources: OscillatorNode[] = [];
    const tone = (f: number, type: OscillatorType, vol: number, through?: AudioNode) => {
      const o = a.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = a.createGain();
      g.gain.value = vol;
      o.connect(g).connect(through ?? out);
      o.start(t);
      sources.push(o);
    };
    tone(100, 'sine', 1);
    tone(50, 'sine', 0.3);
    // The buzz: a sawtooth at 100 Hz, its harmonics rounded off above a few hundred hertz.
    const buzz = a.createBiquadFilter();
    buzz.type = 'lowpass';
    buzz.frequency.value = 900;
    buzz.connect(out);
    tone(100, 'sawtooth', 0.6, buzz);
    humming = { out, stop: (at) => sources.forEach((o) => o.stop(at)) };
  }
  humming.out.gain.setTargetAtTime(0.05 + 0.1 * Math.min(1, level), t, 0.08);
  if (seconds) humOff = window.setTimeout(() => hum(0), seconds * 1000);
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
 * The Professor's voice: a cartoon gibberish, synthesized — no recordings. A recipe: a pitch range,
 * a syllable length, a mouth (formants) wandering between the vowels, a hoarse breath, a bright
 * ring of the throat. Or "speech": the browser's own voice reads the line out in the page's language.
 */
export type VoiceId = 'speech' | 'toon' | 'none';
interface Voice {
  readonly low: number; // Hz
  readonly high: number;
  readonly step: number; // s per syllable
  readonly glide: number; // where the pitch settles at a syllable's end (×)
  readonly volume: number;
  /** Hoarseness, 0…1: breath noise through the voice. */
  readonly rasp: number;
  /** Formants moved up (×): a smaller, cartoonish mouth. */
  readonly formantShift: number;
  /** How clearly the vowels come out, 0…1: lower — broader formants, the vowels blur. */
  readonly clarity: number;
  /** How the pitch goes over the line (×, from the first syllable to the last): below 1 it falls a touch, as speech does. */
  readonly contour: number;
  /** Within a syllable the pitch bends up to about this (×) in the middle and comes back: a sing-song. */
  readonly arc: number;
  /** A bright ring high in the voice, Hz (≈ 4 kHz): the resonance that makes a cartoon voice cut through. */
  readonly ring: number;
  /** A pressed, brighter voice: its harmonics fall off as 1/kᵇ (−6·b dB per octave). */
  readonly bright: number;
}
// Matched by spectrogram to a cartoon voice the author liked (not copied: no recording is used) —
// ≈ 150…290 Hz (set lower here, ≈ 120…195), little at 2–2.5 kHz, a strong band near 4 kHz — and made
// gibberish on purpose: a lively tune and no words, as cartoon characters chatter, slowly. The pitch
// jumps about but stays level over the line (the sample climbed; line after line that sounded like a
// voice forever going up).
const TOON: Voice = { low: 120, high: 195, step: 0.2, glide: 1.04, volume: 0.55, rasp: 0.15, formantShift: 1.2, clarity: 0.45, contour: 0.95, arc: 1.15, ring: 3900, bright: 0.8 };
export const VOICE_IDS: readonly VoiceId[] = ['toon', 'speech', 'none'];
/** Consonants as short noise bursts: centre frequency, Hz, and length, s (с, ш, т, к, п/б, м/н — a soft hum). */
const CONSONANTS: readonly (readonly [number, number])[] = [[6000, 0.05], [3000, 0.05], [4000, 0.018], [1800, 0.02], [900, 0.015], [300, 0.03]];
let voice: VoiceId = 'toon';
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

/** A second of white noise, made once: breath for a hoarse voice. */
let breathBuf: AudioBuffer | null = null;
function breathBuffer(a: AudioContext): AudioBuffer {
  if (breathBuf) return breathBuf;
  breathBuf = a.createBuffer(1, Math.ceil(a.sampleRate * 1), a.sampleRate);
  const d = breathBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  return breathBuf;
}

/** A "vocal folds" source: harmonics falling off as 1/kᶠ, like a human voice. */
const glottal = new Map<number, PeriodicWave>();
function glottalWave(a: AudioContext, fall: number): PeriodicWave {
  const made = glottal.get(fall);
  if (made) return made;
  const n = 40;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = 1 / k ** fall;
  const w = a.createPeriodicWave(real, imag);
  glottal.set(fall, w);
  return w;
}

/** The browser's own voice for this language, if it has one. */
function browserVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null;
  const all = speechSynthesis.getVoices();
  return all.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}
/**
 * A line in one breath: one source for the whole line, its pitch gliding from syllable to syllable,
 * the loudness dipping between them, the mouth (formants) wandering, a short consonant at some of
 * the joins. Returns how long it lasts, s.
 */
function flowing(a: AudioContext, out: GainNode, vc: Voice, count: number, question: boolean, exclaim: boolean, t0: number): number {
  // Gibberish is uneven: some syllables run together, some are drawn out.
  const lens = Array.from({ length: count }, (_, i) => vc.step * (i === count - 1 ? 1.5 : 0.6 + Math.random() * 0.8));
  const end = t0 + lens.reduce((x, y) => x + y, 0);
  const o = a.createOscillator();
  o.setPeriodicWave(glottalWave(a, vc.bright));
  const voiceGain = a.createGain();
  voiceGain.gain.setValueAtTime(0.0001, t0);
  // The mouth: formant filters that move from vowel to vowel, the throat's ring that stays put.
  // A small mouth: little of the low hum gets out.
  const mouthIn = a.createGain();
  const mouth = a.createBiquadFilter();
  mouth.type = 'highpass';
  mouth.frequency.value = 500;
  mouthIn.connect(mouth);
  const shift = vc.formantShift;
  const clarity = vc.clarity;
  const formants = ([[6, 1], [8, 0.8], [12, 0.04]] as const).map(([q, gain]) => {
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = q * (0.3 + 0.7 * clarity);
    const fg = a.createGain();
    fg.gain.value = gain * 3;
    mouth.connect(bp).connect(fg);
    return { bp, fg };
  });
  // Above ≈ 5 kHz a voice has little left; the lips round it off.
  const lips = a.createBiquadFilter();
  lips.type = 'lowpass';
  lips.frequency.value = 5200;
  // Between the mouth and the ring the voice is thin (≈ 2–2.5 kHz).
  const hollow = a.createBiquadFilter();
  hollow.type = 'peaking';
  hollow.frequency.value = 2300;
  hollow.Q.value = 1.2;
  hollow.gain.value = -14;
  lips.connect(hollow).connect(out);
  for (const f of formants) f.fg.connect(lips);
  {
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = vc.ring;
    bp.Q.value = 8;
    const rg = a.createGain();
    rg.gain.value = 6;
    mouth.connect(bp).connect(rg).connect(lips);
  }
  o.connect(voiceGain).connect(mouthIn);
  {
    const breath = a.createBufferSource();
    breath.buffer = breathBuffer(a);
    breath.loop = true;
    const bg = a.createGain();
    bg.gain.value = 0.5 * vc.rasp;
    breath.connect(bg).connect(voiceGain);
    breath.start(t0);
    breath.stop(end);
  }
  // A slow tremble of the whole line.
  const lfo = a.createOscillator();
  const depth = a.createGain();
  lfo.frequency.value = 5 + Math.random() * 1.5;
  depth.gain.value = vc.low * 0.03;
  lfo.connect(depth).connect(o.frequency);
  let t = t0;
  for (let i = 0; i < count; i++) {
    const len = lens[i]!;
    const last = i === count - 1;
    const along = i / Math.max(1, count - 1);
    let f = (vc.low + Math.random() * (vc.high - vc.low) * (exclaim ? 1.15 : 1)) * (1 + (vc.contour - 1) * along);
    if (last && question) f *= 1.15;
    // The pitch slides to the syllable's note, bends up in its middle and settles.
    if (i === 0) o.frequency.setValueAtTime(f, t);
    else o.frequency.linearRampToValueAtTime(f, t + 0.03);
    // Not every syllable bends the same way: up, flat or a little down.
    const bend = 1 + (vc.arc - 1) * (Math.random() * 1.4 - 0.3);
    o.frequency.linearRampToValueAtTime(f * bend, t + len * 0.45);
    o.frequency.linearRampToValueAtTime(f * (last && question ? 1.25 : vc.glide), t + len * 0.95);
    // Loud in the vowel, a dip at the join (never silent: one breath).
    voiceGain.gain.linearRampToValueAtTime(1, t + Math.min(0.04, len * 0.3));
    voiceGain.gain.setValueAtTime(1, t + len * 0.7);
    voiceGain.gain.linearRampToValueAtTime(last ? 0.0001 : 0.4, t + len);
    // Gibberish: no real vowels — the mouth is somewhere between them, and somewhere else again by the
    // end of the syllable, so nothing sounds like a word; only the tune of the line is left.
    const mouthAt = () => [450 + Math.random() * 500, 1000 + Math.random() * 700] as const;
    const [a1, a2] = mouthAt();
    const [b1, b2] = mouthAt();
    formants[0]!.bp.frequency.linearRampToValueAtTime(a1 * shift, t + len * 0.3);
    formants[1]!.bp.frequency.linearRampToValueAtTime(a2 * shift, t + len * 0.3);
    formants[0]!.bp.frequency.linearRampToValueAtTime(b1 * shift, t + len * 0.9);
    formants[1]!.bp.frequency.linearRampToValueAtTime(b2 * shift, t + len * 0.9);
    formants[2]!.bp.frequency.setValueAtTime(2500 * shift, t);
    if (i > 0 && Math.random() < 0.6) {
      const [cf, cl] = CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)]!;
      noise(a, out, t - cl * 0.3, cl, cf, 0.12);
    }
    t += len;
  }
  o.start(t0);
  o.stop(end + 0.02);
  lfo.start(t0);
  lfo.stop(end);
  return end - t0;
}

/** Can the "speech" voice speak this language here? (Otherwise it burbles.) */
export const canSpeak = (lang: string): boolean => browserVoice(lang) !== null;

/**
 * The Professor "speaking" a line. "speech" — the browser reads it out (a lower, slower voice);
 * otherwise he burbles it in cartoon gibberish, at most ≈ 1.6 s, the voice going up at the end of
 * a question. Returns how long it lasts, s.
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
    v = 'toon';
  }
  const a = audio();
  if (!a) return 0;
  const vc = TOON;
  // One line at a time: a new one cuts the one still playing (two at once sound like double speed).
  quiet(a);
  // About a syllable per three letters (but within ≈ 1.6 s).
  const count = Math.min(Math.floor(1.6 / vc.step), Math.max(3, Math.round(text.replace(/[^\p{L}]/gu, '').length / 3)));
  const out = a.createGain();
  out.gain.value = vc.volume;
  out.connect(a.destination);
  speaking = out;
  return flowing(a, out, vc, count, /\?\s*$/.test(text), /!\s*$/.test(text), a.currentTime + 0.03);
}
