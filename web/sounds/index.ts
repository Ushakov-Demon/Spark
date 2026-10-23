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
export type VoiceId = 'speech' | 'toon' | 'mumble' | 'gruff' | 'chirp' | 'robot' | 'whistle' | 'none';
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
  /** How the pitch goes over the line (×, from the first syllable to the last): below 1 it falls, as plain speech does; above 1 it climbs, as an excited cartoon voice. */
  readonly contour?: number;
  /** Within a syllable the pitch goes up to this (×) in the middle and comes back: a sing-song. */
  readonly arc?: number;
  /** A bright ring high in the voice, Hz (≈ 4 kHz): the resonance that makes a cartoon voice cut through. */
  readonly ring?: number;
  /** One breath for the whole line: the syllables flow into each other (the voice only dips between them), not a string of beeps. */
  readonly legato?: boolean;
  /** A pressed, brighter voice: its harmonics fall off slower (−6·`bright` dB per octave instead of −9). */
  readonly bright?: number;
  /**
   * Gibberish: no real vowels — the mouth wanders anywhere between them, even within a syllable,
   * so nothing sounds like a word, only the tune of the line is left.
   */
  readonly gibberish?: boolean;
}
const VOICES: Readonly<Record<Exclude<VoiceId, 'none' | 'speech'>, Voice>> = {
  // Matched by spectrogram to a cartoon voice the author liked (not copied: no recording is used) —
  // the pitch climbing from ≈ 150 to ≈ 290 Hz over the line, little at 2–2.5 kHz, a strong band near 4 kHz —
  // and made gibberish on purpose: a lively tune and no words, as cartoon characters chatter.
  toon: { wave: 'glottal', low: 140, high: 180, step: 0.15, human: true, glide: 1.04, volume: 0.55, rasp: 0.15, formantShift: 1.2, clarity: 0.45, contour: 1.8, arc: 1.15, ring: 3900, legato: true, bright: 0.8, gibberish: true },
  mumble: { wave: 'glottal', low: 330, high: 430, step: 0.12, human: true, glide: 0.97, volume: 0.5, rasp: 0.45, formantShift: 1.5, clarity: 0.45 },
  gruff: { wave: 'glottal', low: 88, high: 112, step: 0.15, human: true, glide: 0.96, volume: 0.65, rasp: 0.35 },
  chirp: { wave: 'triangle', low: 420, high: 720, step: 0.062, human: false, glide: 1.25, volume: 0.2 },
  robot: { wave: 'square', low: 220, high: 220, step: 0.075, human: false, glide: 1, volume: 0.09, quantize: [1, 1.26, 1.5, 2] },
  whistle: { wave: 'sine', low: 950, high: 1500, step: 0.1, human: false, glide: 1.12, volume: 0.16 },
};
export const VOICE_IDS: readonly VoiceId[] = ['speech', 'toon', 'mumble', 'gruff', 'chirp', 'robot', 'whistle', 'none'];
/** Formants (F1, F2, F3), Hz, of the vowels а, о, у, е, и. */
const VOWELS: readonly (readonly [number, number, number])[] = [[750, 1250, 2600], [520, 900, 2500], [340, 760, 2400], [480, 1850, 2600], [320, 2250, 2900]];
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

/** Half a second of white noise, made once: breath for a hoarse voice. */
let breathBuf: AudioBuffer | null = null;
function breathBuffer(a: AudioContext): AudioBuffer {
  if (breathBuf) return breathBuf;
  breathBuf = a.createBuffer(1, Math.ceil(a.sampleRate * 1), a.sampleRate);
  const d = breathBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  return breathBuf;
}

/** A soft "vocal folds" source: harmonics falling off like a human voice (≈ −9 dB per octave); a pressed voice, slower. */
const glottal = new Map<number, PeriodicWave>();
function glottalWave(a: AudioContext, fall = 1.5): PeriodicWave {
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
 * A line in one breath (a `legato` voice): one source for the whole line, its pitch gliding from syllable
 * to syllable, the loudness dipping between them, the mouth (formants) moving from vowel to vowel,
 * a short consonant at some of the joins. Returns how long it lasts, s.
 */
function flowing(a: AudioContext, out: GainNode, vc: Voice, count: number, question: boolean, exclaim: boolean, t0: number): number {
  // Gibberish is uneven: some syllables run together, some are drawn out.
  const spread = vc.gibberish ? 0.8 : 0.3;
  const lens = Array.from({ length: count }, (_, i) => vc.step * (i === count - 1 ? 1.5 : 1 - spread / 2 + Math.random() * spread));
  const end = t0 + lens.reduce((x, y) => x + y, 0);
  const o = a.createOscillator();
  o.setPeriodicWave(glottalWave(a, vc.bright ?? 1.5));
  const voiceGain = a.createGain();
  voiceGain.gain.setValueAtTime(0.0001, t0);
  // The mouth: formant filters that move from vowel to vowel, the throat's ring that stays put.
  // A small mouth: little of the low hum gets out.
  const mouthIn = a.createGain();
  const mouth = a.createBiquadFilter();
  mouth.type = 'highpass';
  mouth.frequency.value = 500;
  mouthIn.connect(mouth);
  const shift = vc.formantShift ?? 1;
  const clarity = vc.clarity ?? 1;
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
  if (vc.ring) {
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = vc.ring;
    bp.Q.value = 8;
    const rg = a.createGain();
    rg.gain.value = 6;
    mouth.connect(bp).connect(rg).connect(lips);
  }
  o.connect(voiceGain).connect(mouthIn);
  if (vc.rasp) {
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
    let f = (vc.low + Math.random() * (vc.high - vc.low) * (exclaim ? 1.15 : 1)) * (1 + ((vc.contour ?? 1) - 1) * along);
    if (last && question) f *= 1.15;
    // The pitch slides to the syllable's note, bends up in its middle and settles.
    if (i === 0) o.frequency.setValueAtTime(f, t);
    else o.frequency.linearRampToValueAtTime(f, t + 0.03);
    // Not every syllable bends the same way: up, flat or a little down.
    const bend = vc.arc ? 1 + (vc.arc - 1) * (Math.random() * 1.4 - 0.3) : 1;
    o.frequency.linearRampToValueAtTime(f * bend, t + len * 0.45);
    o.frequency.linearRampToValueAtTime(f * (last && question ? 1.25 : vc.glide), t + len * 0.95);
    // Loud in the vowel, a dip at the join (never silent: one breath).
    voiceGain.gain.linearRampToValueAtTime(1, t + Math.min(0.04, len * 0.3));
    voiceGain.gain.setValueAtTime(1, t + len * 0.7);
    voiceGain.gain.linearRampToValueAtTime(last ? 0.0001 : 0.4, t + len);
    if (vc.gibberish) {
      // Somewhere between the vowels, and somewhere else again by the end of the syllable.
      const mouthAt = () => [450 + Math.random() * 500, 1000 + Math.random() * 700, 2500] as const;
      const [a1, a2] = mouthAt();
      const [b1, b2] = mouthAt();
      formants[0]!.bp.frequency.linearRampToValueAtTime(a1 * shift, t + len * 0.3);
      formants[1]!.bp.frequency.linearRampToValueAtTime(a2 * shift, t + len * 0.3);
      formants[0]!.bp.frequency.linearRampToValueAtTime(b1 * shift, t + len * 0.9);
      formants[1]!.bp.frequency.linearRampToValueAtTime(b2 * shift, t + len * 0.9);
      formants[2]!.bp.frequency.setValueAtTime(2500 * shift, t);
    } else {
      const [f1, f2, f3] = VOWELS[Math.floor(Math.random() * VOWELS.length)]!;
      [f1, f2, f3].forEach((fq, k) => formants[k]!.bp.frequency.linearRampToValueAtTime(fq * shift, t + len * 0.35));
    }
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
    v = 'toon';
  }
  const a = audio();
  if (!a) return 0;
  const vc = VOICES[v];
  // One line at a time: a new one cuts the one still playing (two at once sound like double speed).
  quiet(a);
  const words = text.split(/\s+/).filter(Boolean);
  // Gibberish chatters: about a syllable per three letters (but still within ≈ 1.6 s).
  const syllables = vc.gibberish ? Math.round(text.replace(/[^\p{L}]/gu, '').length / 3) : words.reduce((n, w) => n + (w.length > 6 ? 2 : 1), 0);
  const count = Math.min(Math.floor(1.6 / vc.step), Math.max(3, syllables));
  const question = /\?\s*$/.test(text);
  const exclaim = /!\s*$/.test(text);
  const out = a.createGain();
  out.gain.value = vc.volume;
  out.connect(a.destination);
  speaking = out;
  let t = a.currentTime + 0.03;
  const start = t;
  if (vc.legato) return flowing(a, out, vc, count, question, exclaim, t);
  for (let i = 0; i < count; i++) {
    const last = i === count - 1;
    // A stressed syllable now and then: longer and a little higher.
    const stressed = vc.human && (i % 3 === 1 || last);
    const len = vc.step * (stressed ? 1.35 : 0.85 + Math.random() * 0.25);
    // Over the line the pitch falls a little (as speech does), and rises at the end of a question.
    // A voice with its own contour goes from 1 to `contour` (a cartoon voice climbs instead).
    const fall = vc.human ? 1 + ((vc.contour ?? 0.82) - 1) * (i / Math.max(1, count - 1)) : 1;
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
    if (vc.arc) o.frequency.linearRampToValueAtTime(f * vc.arc, t + len * 0.45);
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
      const bands: (readonly [number, number, number, boolean?])[] = [[f1, 6, 1], [f2, 9, 0.6], [f3, 12, 0.25]];
      if (vc.ring) bands.push([vc.ring, 5, 0.9, true]);
      for (const [fq0, q, gain, fixed] of bands) {
        // The ring stays where it is: it is a resonance of the throat, not of the vowel.
        const fq = fixed ? fq0 : fq0 * shift;
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
