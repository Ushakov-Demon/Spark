/**
 * Sounds of the lab, synthesized in the browser (Web Audio) — no sound files.
 * A "plop" when a body goes into a liquid, a soft fizz while salt dissolves, a cannon's shot and its ball coming down,
 * a stopwatch's «пік», a ball rolling and hitting a stop, the wind, a camera's shutter and a stroboscope's flashes,
 * a windlass creaking, gears clicking tooth by tooth, a block dragged along a table, a weight landing, a body going into water and its bubbles.
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
  const wake = () => {
    woke = true;
    // (A phone's browser lets a page speak only once it has spoken within a touch: an empty line now, and the voices asked for.)
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.getVoices();
      speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
  };
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

/** A water "plop": a short tone that rises fast (the bubble), a second smaller one, a little splash of noise. `level` — how loud. */
export function plop(size = 1, level = 0.35): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = level;
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

/**
 * The sounds of a scene's event (a shot, a fall), a little louder than the background music (MUSIC_LEVEL): heard over
 * it, not startling.
 */
const EVENT_LEVEL = 0.14;

/** A cannon's «пуух»: a low thump falling in pitch under a burst of dull noise that dies away. */
export function boom(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL;
  out.connect(a.destination);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.65);
  noise(a, out, t, 0.7, 380, 1.4);
}

/** A stopwatch started: a short, high «пік». */
export function beep(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(2400, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(EVENT_LEVEL, t + 0.005);
  g.gain.setValueAtTime(EVENT_LEVEL, t + 0.07);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.12);
}

/** Two seconds of noise, round and round. */
function noiseLoop(a: AudioContext): AudioBufferSourceNode {
  const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const source = a.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  return source;
}
/** A raw tone, rich in overtones. */
function sawTone(a: AudioContext): OscillatorNode {
  const o = a.createOscillator();
  o.type = 'sawtooth';
  return o;
}

/**
 * A noise that lasts while something moves: called on every frame with how it sounds now. No frame for `gap` ms (the
 * thing has stopped, or the motion was cut short), and it dies away by itself.
 */
function sustained(type: BiquadFilterType, gap: number, pitched = false) {
  let now: { readonly source: AudioScheduledSourceNode; readonly tone: BiquadFilterNode; readonly level: GainNode; readonly shake: OscillatorNode; quiet: number } | null = null;
  const end = () => {
    const r = now;
    now = null;
    if (!r) return;
    const t = r.level.context.currentTime;
    r.level.gain.setTargetAtTime(0, t, gap / 4000);
    r.source.stop(t + gap / 500);
    r.shake.stop(t + gap / 500);
  };
  /** `hz` — its pitch (of the filter); `volume` — how loud; `flutter` — how fast it wavers, Hz; `note` — the tone itself, when pitched. */
  return (hz: number, volume: number, flutter: number, note = 0): void => {
    const a = audio();
    if (!a) return;
    if (!now) {
      const source = pitched ? sawTone(a) : noiseLoop(a);
      const tone = a.createBiquadFilter();
      tone.type = type;
      const wavering = a.createGain();
      wavering.gain.value = 0.7;
      const depth = a.createGain();
      depth.gain.value = 0.3;
      const shake = a.createOscillator();
      shake.connect(depth).connect(wavering.gain);
      const level = a.createGain();
      level.gain.value = 0;
      source.connect(tone).connect(wavering).connect(level).connect(a.destination);
      source.start();
      shake.start();
      now = { source, tone, level, shake, quiet: 0 };
    }
    const t = a.currentTime;
    now.tone.frequency.setTargetAtTime(hz, t, 0.05);
    if (now.source instanceof OscillatorNode) now.source.frequency.setTargetAtTime(note, t, 0.05);
    now.shake.frequency.setTargetAtTime(flutter, t, 0.05);
    now.level.gain.setTargetAtTime(volume, t, 0.05);
    window.clearTimeout(now.quiet);
    now.quiet = window.setTimeout(end, gap);
  };
}

const rollNoise = sustained('lowpass', 120);
/** A ball rolling down a groove: dull noise with a fast flutter, higher and louder the faster it goes. Every frame of its motion, `speed` from 0 to 1. */
export const rolling = (speed: number): void => rollNoise(300 + 900 * speed, EVENT_LEVEL * (0.5 + 0.7 * speed), 10 + 30 * speed);

const scrapeNoise = sustained('bandpass', 120);
/** A block dragged along a table: a dry rasp of wood on wood, with a quick shudder. Every frame of its motion, `speed` from 0 to 1. */
export const scraping = (speed: number): void => scrapeNoise(700 + 500 * speed, EVENT_LEVEL * (0.7 + 0.5 * speed), 18 + 14 * speed);

const windNoise = sustained('bandpass', 400);
/** The wind: a hollow rush that swells slowly, higher and louder the stronger it blows. Every frame it blows, `strength` from 0 to 1. */
export const blowing = (strength: number): void => windNoise(350 + 550 * strength, EVENT_LEVEL * (0.5 + 1.1 * strength), 0.4 + 0.5 * strength);

const flyTone = sustained('bandpass', 150, true);
/** A fly: a thin rasping tone that never holds still, higher and louder the nearer it is. Every frame it flies, `near` from 0 to 1. */
export const buzzing = (near: number): void => flyTone(1500 + 500 * near, EVENT_LEVEL * (0.15 + 0.85 * near), 9, 165 + 55 * near + 14 * Math.sin(performance.now() / 170));

const splashNoise = sustained('bandpass', 250);
/** Water falling into water: a bright, quickly wavering hiss, louder the stronger the stream. Every frame it falls, `strength` from 0 to 1. */
export const splashing = (strength: number): void => splashNoise(2400 + 1400 * strength, EVENT_LEVEL * (0.3 + 0.9 * strength), 13 + 9 * strength);

const carEngine = sustained('lowpass', 150, true);
const racerEngine = sustained('bandpass', 150, true);
/**
 * A car driving: an engine's low rumble, higher and louder the faster it goes; `racer` — a racing car's whine instead,
 * shrill at speed. Every frame it drives, `speed` from 0 to 1.
 */
export const driving = (speed: number, racer = false): void =>
  racer ? racerEngine(1200 + 2200 * speed, EVENT_LEVEL * (0.35 + 1.1 * speed), 30, 240 + 760 * speed) : carEngine(450 + 1000 * speed, EVENT_LEVEL * (0.35 + 0.9 * speed), 12, 55 + 115 * speed);

/** Something long and light cutting the air: a rush of noise that rises and falls in a moment. */
export function swish(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const source = noiseLoop(a);
  const tone = a.createBiquadFilter();
  tone.type = 'bandpass';
  tone.Q.value = 1.5;
  tone.frequency.setValueAtTime(500, t);
  tone.frequency.exponentialRampToValueAtTime(2600, t + 0.09);
  tone.frequency.exponentialRampToValueAtTime(700, t + 0.2);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(EVENT_LEVEL * 2, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  source.connect(tone).connect(g).connect(a.destination);
  source.start(t);
  source.stop(t + 0.25);
}

/** One creak of old wood and rope: quick stick-slip pulses that speed up through a narrow band, a little different each time. */
function creak(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const k = 0.85 + Math.random() * 0.3;
  const o = a.createOscillator();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(48 * k, t);
  o.frequency.linearRampToValueAtTime(92 * k, t + 0.22);
  f.type = 'bandpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(800 * k, t);
  f.frequency.linearRampToValueAtTime(1250 * k, t + 0.22);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(EVENT_LEVEL * 1.6, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  o.connect(f).connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.28);
}

const crankNoise = sustained('lowpass', 150);
/** The least time between two creaks, ms. */
const CREAK_GAP = 350;
/**
 * A well's windlass, a block: a low wooden rumble while it turns, and a creak now and then. Made for one motion; called on
 * every frame with the turns so far.
 */
export function cranking(): (turns: number) => void {
  let next = 0.15;
  let heard = 0;
  return (turns) => {
    crankNoise(240, EVENT_LEVEL * 0.6, 7);
    // (Turning fast, the creaks do not pile up on one another.)
    const now = performance.now();
    if (Math.abs(turns) < next || now - heard < CREAK_GAP) return;
    creak();
    heard = now;
    next = Math.abs(turns) + 0.45 + Math.random() * 0.3;
  };
}

/** One tooth of a gear going into another's: a small dry plastic «тік», at `at` (the audio clock), its pitch a touch off each time. */
function tick(a: AudioContext, at: number, volume: number): void {
  const out = a.createGain();
  out.gain.value = volume;
  out.connect(a.destination);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(2600 * (0.92 + Math.random() * 0.16), at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(1, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + 0.04);
  noise(a, out, at, 0.015, 4500, 0.6);
}

const gearWhir = sustained('bandpass', 150);
/** At most this many tooth clicks are heard in one frame: faster, they are a whir, not clicks one by one. */
const TICKS_PER_FRAME = 3;
/**
 * Gears meshing: a «тік» for each tooth that goes in, and a soft whir that grows with the speed. Made for one motion;
 * called on every frame with the teeth gone through the mesh so far (turns × teeth — the same at every mesh of a train).
 */
export function meshing(): (teeth: number) => void {
  let done = 0;
  let last = performance.now();
  return (teeth) => {
    const a = audio();
    if (!a) return;
    const now = performance.now();
    const dt = Math.max(1, now - last);
    last = now;
    const n = Math.floor(Math.abs(teeth)) - done;
    if (n <= 0) return;
    done += n;
    // (Teeth a second: the whir rises with them; the clicks are spread over the frame, as they came.)
    const rate = (n * 1000) / dt;
    gearWhir(500 + 20 * Math.min(rate, 60), EVENT_LEVEL * Math.min(0.5, rate / 120), 20);
    const heard = Math.min(n, TICKS_PER_FRAME);
    for (let i = 0; i < heard; i++) tick(a, a.currentTime + (i * dt) / 1000 / heard, EVENT_LEVEL * 0.9);
  };
}

/** A camera's shutter: a dry «клац», a click of noise over a small low knock. */
export function shutter(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL * 1.5;
  out.connect(a.destination);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t);
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.06);
  noise(a, out, t, 0.03, 1800, 1.2);
  noise(a, out, t + 0.045, 0.02, 2600, 0.7);
}

/** A stroboscope's flash: a tiny falling «цк». */
export function flash(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL * 0.7;
  out.connect(a.destination);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(3200, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.07);
  noise(a, out, t, 0.02, 6000, 0.6);
}

/** A steel ball hitting a stop: a short, hard «цок», two ringing tones and a click of noise. */
export function clack(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL;
  out.connect(a.destination);
  for (const [hz, vol] of [[1400, 0.8], [2300, 0.4]] as const) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(hz, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.1);
  }
  noise(a, out, t, 0.03, 3000, 0.8);
}

/** A ball falling into the sea: a big, low «бульк». */
export const splash = (): void => plop(1.8, EVENT_LEVEL);

/** Bubbles coming up after something sank: a few quick rising «буль», uneven in pitch and in time. */
export function bubbling(count = 5): void {
  const a = audio();
  if (!a) return;
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL * 1.6;
  out.connect(a.destination);
  let t = a.currentTime + 0.1;
  for (let i = 0; i < count; i++) {
    const hz = 420 + Math.random() * 500;
    const len = 0.05 + Math.random() * 0.04;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(hz, t);
    o.frequency.exponentialRampToValueAtTime(hz * 1.9, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1 - i / (count + 2), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.02);
    t += 0.07 + Math.random() * 0.09;
  }
}

/** A body going into water: a «бульк», its bubbles after it. */
export function plunge(size = 1): void {
  plop(size, EVENT_LEVEL * 2);
  bubbling();
}

/** A ball falling on land: a dull «тук». */
export function thud(): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL;
  out.connect(a.destination);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.15);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.25);
  noise(a, out, t, 0.12, 900, 0.6);
}

/**
 * A ball bouncing off something hard: a short knock at the ball's own ring (`pitch`, Hz — a hollow ping-pong ball
 * high and bright, a felt-covered tennis ball low and dull) with a click of the impact; `strength` 0…1 — how fast it hit.
 */
export function tock(pitch: number, strength = 1): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const s = Math.max(0.05, Math.min(1, strength));
  const out = a.createGain();
  out.gain.value = EVENT_LEVEL * (0.35 + 0.9 * s);
  out.connect(a.destination);
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(pitch * 1.15, t);
  o.frequency.exponentialRampToValueAtTime(pitch, t + 0.02);
  // (A high, hollow ball rings a little longer than a low, dull one.)
  const ring = Math.min(0.12, 0.03 + pitch / 40000);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + ring + 0.02);
  noise(a, out, t, 0.03, Math.min(6000, pitch * 2), 0.5);
}

/** A metal weight landing on something hard: a dull blow with a knock of metal in it. */
export function clunk(): void {
  thud();
  clack();
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
  /** How loud the voice stays at the join of two syllables, 0…1 (one breath, never silent: 0.4). */
  readonly join?: number;
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
// Silent unless a voice is chosen in the header.
let voice: VoiceId = 'none';
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
function breathBuffer(a: BaseAudioContext): AudioBuffer {
  if (breathBuf) return breathBuf;
  breathBuf = a.createBuffer(1, Math.ceil(a.sampleRate * 1), a.sampleRate);
  const d = breathBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  return breathBuf;
}

/** A "vocal folds" source: harmonics falling off as 1/kᶠ, like a human voice. */
const glottal = new Map<number, PeriodicWave>();
function glottalWave(a: BaseAudioContext, fall: number): PeriodicWave {
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
  // (Its language as «uk-UA», «uk_UA» or «uk»; one on the device first — it needs no network.)
  const mine = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === lang);
  return mine.find((v) => v.localService) ?? mine[0] ?? null;
}
/** The voice that reads lines in this language here: its name, or null — none in the browser's list. */
export const speechVoiceName = (lang: string): string | null => browserVoice(lang)?.name ?? null;
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
    voiceGain.gain.linearRampToValueAtTime(last ? 0.0001 : (vc.join ?? 0.4), t + len);
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
/** A page's language as speech wants it. */
const SPEECH_LANG: Readonly<Record<string, string>> = { uk: 'uk-UA', en: 'en-GB' };

/**
 * The Professor "speaking" a line. "speech" — the browser reads it out (a lower, slower voice);
 * otherwise he burbles it in cartoon gibberish, at most ≈ 1.6 s, the voice going up at the end of
 * a question. Returns how long it lasts, s.
 */
export function babble(text: string, v: VoiceId = voice, lang = 'uk'): number {
  if (v === 'none' || !text.trim()) return 0;
  if (v === 'speech') {
    if (!on || !woke) return 0;
    if (typeof speechSynthesis !== 'undefined') {
      // Read out in the page's language: by its voice when the browser lists one — and when it lists none, the
      // device may still have one (a phone's list comes late or short): asked for by the language alone. If it has
      // not begun to speak in a moment, there is no such voice — the cartoon voice says it instead.
      const sv = browserVoice(lang);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (sv) u.voice = sv;
      u.lang = sv?.lang ?? SPEECH_LANG[lang] ?? lang;
      u.pitch = 0.8;
      u.rate = 1.02;
      let began = false;
      u.onstart = () => (began = true);
      speechSynthesis.speak(u);
      if (!sv)
        window.setTimeout(() => {
          if (began) return;
          speechSynthesis.cancel();
          babble(text, 'toon', lang);
        }, 1200);
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

/** The Professor giggling — «хі-хі-хі» in his own voice (none when he is silent). Returns how long it lasts, s. */
export function giggle(): number {
  const a = audio();
  if (!a) return 0;
  quiet(a);
  const out = a.createGain();
  out.gain.value = 1;
  out.connect(a.destination);
  speaking = out;
  return giggling(a, out, a.currentTime + 0.03);
}

/** The vowel of a laugh, «і»: its formants (centre, Hz; sharpness; strength). */
const LAUGH_VOWEL: readonly (readonly [number, number, number])[] = [[290, 5, 0.7], [2650, 5, 2.6], [3400, 7, 1.7]];
const LAUGH_LEVEL = 0.5;
/**
 * A giggle, «хі-хі-хі-хі-хі», as a laugh is made: a run of short syllables some five a second, each a long soft breath
 * (the «х», wide noise that swells without an edge) going over into a voiced «і» that falls in pitch and dies away; the voice
 * starts high and sinks from syllable to syllable, and the last one is drawn out. Returns how long it lasts, s.
 */
export function giggling(a: BaseAudioContext, out: AudioNode, t0: number, random: () => number = Math.random): number {
  const mouth = a.createGain();
  mouth.gain.value = LAUGH_LEVEL;
  mouth.connect(out);
  const vowel = a.createGain();
  for (const [hz, q, strength] of LAUGH_VOWEL) {
    const band = a.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = hz;
    band.Q.value = q;
    const g = a.createGain();
    g.gain.value = strength;
    vowel.connect(band).connect(g).connect(mouth);
  }
  // The «х» is breath, wide: not the vowel's narrow bands, which would ring.
  const hiss = a.createBiquadFilter();
  hiss.type = 'bandpass';
  hiss.frequency.value = 3200;
  hiss.Q.value = 0.8;
  hiss.connect(mouth);
  const count = 5 + Math.round(random());
  const wave = glottalWave(a, 0.9);
  const breath = breathBuffer(a);
  let t = t0;
  for (let i = 0; i < count; i++) {
    const last = i === count - 1;
    const share = i / (count - 1);
    const hz = (365 - 95 * share) * (0.97 + 0.06 * random());
    // Louder at once, fading towards the end of the laugh.
    const loud = (i === 0 ? 0.8 : 1) * (1 - 0.45 * share);
    const puff = 0.07;
    const voiced = last ? 0.2 : 0.09;
    // «х»: a long soft breath with no edge to it (one that starts sharply is heard as «т»), wide in the mouth's upper band.
    const air = a.createBufferSource();
    air.buffer = breath;
    const airGain = a.createGain();
    airGain.gain.setValueAtTime(0, t);
    airGain.gain.linearRampToValueAtTime(0.5 * loud, t + puff * 0.75);
    airGain.gain.linearRampToValueAtTime(0.28 * loud, t + puff + 0.02);
    airGain.gain.linearRampToValueAtTime(0, t + puff + voiced * 0.8);
    air.connect(airGain).connect(hiss);
    air.start(t, random() * 0.7, puff + voiced + 0.02);
    // «і»: the voice swells in under the breath, a little lower at its end.
    const start = t + puff * 0.6;
    const o = a.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.setValueAtTime(hz * 1.05, start);
    o.frequency.exponentialRampToValueAtTime(hz * (last ? 0.78 : 0.9), start + voiced);
    const g = a.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(loud, start + 0.035);
    g.gain.exponentialRampToValueAtTime(0.5 * loud, start + 0.035 + voiced * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, start + voiced + 0.03);
    o.connect(g).connect(vowel);
    o.start(start);
    o.stop(start + voiced + 0.05);
    t += last ? puff + voiced : 0.2 + 0.03 * random();
  }
  return t - t0;
}

/**
 * Music in the background, made here and now (no recording): a slow round of four chords — A minor, F, C, G, two
 * bars each at 66 beats a minute — held softly over a low note, and now and then a note of the A minor pentatonic
 * scale above them (the same tune each round). Very quiet; it comes in slowly after the first click and goes away with
 * the sound (🔇), with the music turned off, or while the tab is hidden.
 */
const MUSIC_BPM = 66;
const MUSIC_LEVEL = 0.05;
/** The chords as MIDI note numbers (60 is middle C); the tune's notes: A C D E G A. */
const CHORDS: readonly (readonly number[])[] = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]];
const TUNE = [69, 72, 74, 76, 79, 81];
const music = { want: false, out: null as GainNode | null, timer: 0, next: 0, beat: 0 };
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** One soft note: it swells in over `attack`, holds, fades out after `len`. */
function softNote(a: AudioContext, out: AudioNode, f: number, at: number, len: number, vol: number, type: OscillatorType, attack: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + attack);
  g.gain.setValueAtTime(vol, at + len);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len + 1.2);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + len + 1.3);
}

function musicTick() {
  const a = music.want && !document.hidden ? audio() : null;
  if (!a) {
    // Out: a second's fade, then nothing more is played.
    const out = music.out;
    if (out && ctx) {
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      window.setTimeout(() => out.disconnect(), 1500);
    }
    music.out = null;
    return;
  }
  if (!music.out) {
    const out = a.createGain();
    const soft = a.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 1800;
    out.gain.setValueAtTime(0, a.currentTime);
    out.gain.linearRampToValueAtTime(MUSIC_LEVEL, a.currentTime + 4);
    out.connect(soft).connect(a.destination);
    music.out = out;
    music.next = a.currentTime + 0.1;
  }
  // A second and a half scheduled ahead, a beat at a time.
  const beat = 60 / MUSIC_BPM;
  while (music.next < a.currentTime + 1.5) {
    const b = music.beat;
    const chord = CHORDS[Math.floor(b / 8) % CHORDS.length]!;
    if (b % 8 === 0) {
      for (const m of chord) softNote(a, music.out, hz(m), music.next, 8 * beat, 0.2, 'triangle', 1.5);
      softNote(a, music.out, hz(chord[0]! - 12), music.next, 4 * beat, 0.3, 'sine', 0.3);
    }
    // The tune: on some beats (the same ones each round), now on the beat, now half a beat after.
    if ((b * 7919) % 13 < 6) softNote(a, music.out, hz(TUNE[(b * 5) % TUNE.length]!), music.next + (b % 3 === 1 ? beat / 2 : 0), beat * 1.5, 0.14, 'sine', 0.05);
    music.next += beat;
    music.beat++;
  }
}

/** The background music on or off (it waits for the first click, and for the sound to be on). */
export function setMusic(v: boolean): void {
  music.want = v;
  if (!music.timer && typeof window !== 'undefined') {
    music.timer = window.setInterval(musicTick, 250);
    document.addEventListener('visibilitychange', musicTick);
  }
  musicTick();
}
