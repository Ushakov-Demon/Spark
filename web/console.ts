/**
 * The lab console: type what you would otherwise click. Commands in Ukrainian
 * with English synonyms; names can be shortened ("морська", "плит"); Tab
 * completes, ↑/↓ walk the history. Every command goes through the same
 * functions the page uses, so the console can do nothing the lab cannot.
 */
import { COOLERS, type CoolerId } from '../src/equipment/coolers.js';
import { HEATERS, type HeaterId } from '../src/equipment/heaters.js';
import { SUPPLIES, supplyVoltage, type SupplyId } from '../src/equipment/supplies.js';
import type { VesselId } from '../src/equipment/vessels.js';
import { MASS_SCALE_IDS, SCALES, type ScaleId } from '../src/equipment/scales.js';
import { sig } from '../src/explain/format.js';
import { tr, type Locale, type LocalizedText } from '../src/knowledge/i18n.js';
import { msg, t } from '../src/knowledge/messages.js';
import { isDrySample, LAB_ACTIONS, OPERATIONS, PRESETS, substancesFor, vesselsFor, type LabAction, type LabParams, type Preset } from '../src/scenarios/index.js';
import { SUBSTANCES, type SubstanceId, type SubstanceItem } from '../src/substances/index.js';
import { COMPONENTS } from '../src/components/index.js';
import { MATERIALS } from '../src/domains/thermal/materials.js';
import { isOn, moving, resetSettings, store, type Switch } from './prefs.js';

export interface ConsoleApi {
  locale(): Locale;
  params(): LabParams;
  /** Has anything happened yet (then the substance and the vessel stay)? */
  started(): boolean;
  setAction(a: LabAction): void;
  /** Apply a new setup: 'experiment' — substance or vessel changed (a new experiment); 'step' — action or device. */
  choose(next: LabParams, kind: 'experiment' | 'step'): void;
  setSpeed(x: number): void;
  /** Turn the knob (heater power or supply voltage), 0…1; false if there is none. */
  setKnob(x: number): boolean;
  toggleStart(): void;
  isRunning(): boolean;
  reset(): void;
  add(id: SubstanceId, grams: number, tempC: number, frozen: boolean): string | null;
  addable(): readonly SubstanceItem[];
  predict(minutes: number): void;
  status(): string[];
  explain(): void;
  openRef(key: string): boolean;
  startPreset(p: Preset): void;
  /** The Professor's idle scenes by name, and playing one now. */
  scenes(): readonly string[];
  /** "By the way!..": the Professor's newspaper at once. */
  news(): void;
  /** A setting of the user's (kept in the browser) turned on or off; it takes effect at once. */
  setting(k: Switch, on: boolean): void;
  /** Weigh the vessel on these scales (none — the ones chosen on the page); returns what the Professor says. */
  weigh(scale?: ScaleId): string;
  voices(): readonly string[];
  /** Choose the Professor's voice (he says a line in it); false if there is no such voice. */
  voice(id: string): boolean;
  /** Read the level by the vessel's marks; returns what the Professor says. */
  level(): string;
  /** Hang a body on the dynamometer in the air or in the liquid. */
  hang(substance: SubstanceId, grams: number, into: 'air' | 'liquid'): string;
  /** Save the experiment so far as a recording; returns a note. */
  save(name: string): string;
  records(): readonly string[];
  /** Replay recording number n (1-based); false if there is none. */
  replay(n: number): boolean;
  playScene(name: string): void;
}

/** The console types its answer out at this many characters a second — or faster, to be done in TYPE_SECONDS. */
const TYPE_RATE = 60;
const TYPE_SECONDS = 2;
/** The hint over the line is erased and typed at this many characters a second at least, within HINT_SECONDS. */
const HINT_RATE = 240;
const HINT_SECONDS = 0.4;
/** How many commands the hint over the line offers at most. */
const HINTS_SHOWN = 6;
/** How many typed commands the console remembers. */
const HISTORY_KEPT = 100;

interface Cmd {
  readonly names: readonly string[];
  readonly usage: LocalizedText;
  readonly about: LocalizedText;
  run(args: string[], api: ConsoleApi): Out;
}
/** What a command prints: its lines — or how to word them, so that they are worded again in another language. */
type Out = readonly string[] | (() => readonly string[]);

const norm = (s: string) => s.toLowerCase().replace(/[’'ʼ`]/g, '').replace(/ё/g, 'е').trim();

/** Best match of a (possibly shortened) name among items: exact id, then a word starting with it, then a substring. */
function find<T>(items: readonly T[], keys: (x: T) => readonly string[], query: string): T | T[] | null {
  const q = norm(query);
  if (!q) return null;
  const exact = items.filter((x) => keys(x).some((k) => norm(k) === q));
  if (exact.length === 1) return exact[0]!;
  // A word that starts with the query — or shares a stem of 5+ letters with it ("морозилка" ~ "морозильна").
  const stem = (w: string) => {
    let i = 0;
    while (i < w.length && i < q.length && w[i] === q[i]) i++;
    return w.startsWith(q) || (i >= 5 && i >= q.length * 0.6);
  };
  const word = items.filter((x) => keys(x).some((k) => norm(k).startsWith(q) || norm(k).split(/[\s()«»,.-]+/).some(stem)));
  if (word.length === 1) return word[0]!;
  if (word.length > 1) return word;
  const sub = items.filter((x) => keys(x).some((k) => norm(k).includes(q)));
  return sub.length === 1 ? sub[0]! : sub.length ? sub : null;
}

/** Numbers in the arguments with their units: "0.5 л", "500мл", "-22", "24 В", "7 г", "60%". */
function quantities(args: readonly string[]): { value: number; unit: string }[] {
  const out: { value: number; unit: string }[] = [];
  const text = args.join(' ');
  for (const m of text.matchAll(/(-?\d+(?:[.,]\d+)?)\s*(мл|ml|л|l|г|g|кг|kg|вт|w|в|v|°c|°|c|хв|min|%|×|x)?/gi)) {
    out.push({ value: Number(m[1]!.replace(',', '.')), unit: norm(m[2] ?? '') });
  }
  return out;
}
/** The words of the arguments without numbers and units. */
const words = (args: readonly string[]) => args.filter((a) => !/^-?\d/.test(a) && !/^(мл|ml|л|l|г|g|кг|kg|вт|w|в|v|°c|°|хв|min|%)$/i.test(a)).join(' ');
const names = (x: { name: LocalizedText; id: string }) => [x.id, x.name.uk, x.name.en];

export function createConsole(api: ConsoleApi): HTMLElement {
  const loc = () => api.locale();
  const T = (x: LocalizedText) => tr(x, loc());
  const ambiguous = (items: readonly { name: LocalizedText }[]) => [`${t(loc(), 'console-which-one')}: ${items.map((x) => T(x.name)).join(', ')}`];
  const notFound = (what: string) => [t(loc(), 'console-unknown-word', { what })];
  const list = (title: string, items: readonly string[]) => [title, ...items.map((x) => `  • ${x}`)];
  /** «on» / «off» (or «увімк» / «вимк»): the setting turned so; nothing — how it stands now. */
  const toggle = (k: Switch, arg: string | undefined): Out => {
    const a = norm(arg ?? '');
    const on = ['on', '1', 'увімк', 'увімкнути', 'так'].includes(a) ? true : ['off', '0', 'вимк', 'вимкнути', 'ні'].includes(a) ? false : undefined;
    if (arg && on === undefined) return () => [t(loc(), 'console-on-off')];
    if (on !== undefined) api.setting(k, on);
    const now = String(on ?? isOn(k));
    return () => [t(loc(), `console-${k}-state`, { on: now })];
  };

  const COMMANDS: Cmd[] = [
    {
      names: ['help', '?', 'допомога'],
      usage: msg('console-help-usage'),
      about: msg('console-help-about'),
      run(args) {
        if (args[0]) {
          const c = COMMANDS.find((x) => x.names.includes(norm(args[0]!)));
          return () => (c ? [`${T(c.usage)} — ${T(c.about)}`, ...(c.names.length > 1 ? [`${t(loc(), 'console-also-named')}: ${c.names.slice(1).join(', ')}`] : [])] : notFound(args[0]!));
        }
        return () => [t(loc(), 'console-help-title'), ...COMMANDS.map((c) => `  ${T(c.usage).padEnd(36)} ${T(c.about)}`)];
      },
    },
    {
      names: ['actions', 'дії'],
      usage: msg('console-actions-usage'),
      about: msg('console-actions-about'),
      run: () => () => list(t(loc(), 'console-actions'), LAB_ACTIONS.map((a) => `${T(OPERATIONS[a].label)}${a === api.params().action ? ' ◀' : ''}`)),
    },
    {
      names: ['action', 'do', 'дія'],
      usage: msg('console-action-usage'),
      about: msg('console-action-about'),
      run(args) {
        const f = find(LAB_ACTIONS, (a) => [a, OPERATIONS[a].label.uk, OPERATIONS[a].label.en], words(args));
        if (!f) return notFound(words(args));
        if (Array.isArray(f)) return ambiguous(f.map((a) => ({ name: OPERATIONS[a].label })));
        api.setAction(f);
        return [`✓ ${T(OPERATIONS[f].label)}`];
      },
    },
    {
      names: ['substances', 'речовини'],
      usage: msg('console-substances-usage'),
      about: msg('console-substances-about'),
      run: () => () => list(t(loc(), 'console-substances'), substancesFor(api.params().action).map((x) => `${T(x.name)}${x.id === api.params().substance ? ' ◀' : ''}`)),
    },
    {
      names: ['substance', 'речовина'],
      usage: msg('console-substance-usage'),
      about: msg('console-substance-about'),
      run(args) {
        if (api.started()) return [t(loc(), 'console-substance-stays')];
        const p = api.params();
        const f = find(substancesFor(p.action), names, words(args));
        if (!f) return notFound(words(args));
        if (Array.isArray(f)) return ambiguous(f);
        const q = quantities(args)[0];
        // A solid is taken by mass (50 g of tin); a liquid by volume.
        const dry = isDrySample(f);
        const grams = q && (q.unit === 'г' || q.unit === 'g') ? q.value : q && (q.unit === 'кг' || q.unit === 'kg') ? q.value * 1000 : undefined;
        const liters = grams !== undefined ? grams / f.liquid.density.value : q ? (q.unit === 'мл' || q.unit === 'ml' ? q.value / 1000 : q.value) : dry ? 50 / f.liquid.density.value : p.liters;
        const amount = Math.min(liters, p.size);
        api.choose({ ...p, substance: f.id as SubstanceId, liters: amount, startTemp: OPERATIONS[p.action].startTemp(f) }, 'experiment');
        return [`✓ ${T(f.name)}, ${dry ? `${sig(amount * f.liquid.density.value, 3, loc())} ${t(loc(), 'unit-sym-g')}` : `${sig(amount, 3, loc())} ${t(loc(), 'unit-sym-L')}`}`];
      },
    },
    {
      names: ['vessels', 'посуд'],
      usage: msg('console-vessels-usage'),
      about: msg('console-vessels-about'),
      run: () => () => list(t(loc(), 'console-vessels'), vesselsFor(api.params()).map((f) => `${T(f.vessel.name)} (${f.sizes.join(', ')} ${t(loc(), 'unit-sym-L')})${f.vessel.id === api.params().vessel ? ' ◀' : ''}`)),
    },
    {
      names: ['vessel', 'посудина'],
      usage: msg('console-vessel-usage'),
      about: msg('console-vessel-about'),
      run(args) {
        if (api.started()) return [t(loc(), 'console-vessel-stays')];
        const p = api.params();
        const fits = vesselsFor(p);
        const text = words(args);
        const f = find(fits, (x) => [x.vessel.id, x.vessel.name.uk, x.vessel.name.en], text.split(' ')[0] ?? '');
        if (!f) return notFound(text);
        if (Array.isArray(f)) return ambiguous(f.map((x) => x.vessel));
        const q = quantities(args)[0];
        const want = q ? (q.unit === 'мл' || q.unit === 'ml' ? q.value / 1000 : q.value) : f.vessel.spec.defaultSize;
        const size = f.sizes.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
        const mat = text.split(' ').slice(1).join(' ');
        const material = (mat && f.materials.find((m) => norm(m).startsWith(norm(mat)))) || (f.materials.includes(f.vessel.spec.defaultMaterial) ? f.vessel.spec.defaultMaterial : f.materials[0]!);
        api.choose({ ...p, vessel: f.vessel.id as VesselId, size, material, lid: false, liters: Math.min(p.liters, size) }, 'experiment');
        const mName = material in MATERIALS ? T(MATERIALS[material as keyof typeof MATERIALS].name).toLowerCase() : material;
        return [`✓ ${T(f.vessel.name)}, ${sig(size, 3, loc())} ${t(loc(), 'unit-sym-L')}, ${mName}`];
      },
    },
    {
      names: ['devices', 'прилади'],
      usage: msg('console-devices-usage'),
      about: msg('console-devices-about'),
      run() {
        const uses = OPERATIONS[api.params().action].uses;
        const items = uses === 'supply' ? Object.values(SUPPLIES) : uses === 'cooler' ? Object.values(COOLERS).filter((x) => !x.spec.hot) : [...Object.values(HEATERS), ...(uses === 'either' ? Object.values(COOLERS).filter((x) => x.spec.hot) : [])];
        return list(t(loc(), 'console-devices'), items.map((x) => T(x.name)));
      },
    },
    {
      names: ['device', 'прилад'],
      usage: msg('console-device-usage'),
      about: msg('console-device-about'),
      run(args) {
        const p = api.params();
        const uses = OPERATIONS[p.action].uses;
        const q = quantities(args)[0];
        const strip = (x: LabParams) => {
          const { heater: _h, cooler: _c, supply: _s, ...rest } = x;
          void _h;
          void _c;
          void _s;
          return rest;
        };
        if (uses === 'supply') {
          const f = find(Object.values(SUPPLIES), names, words(args));
          if (!f || Array.isArray(f)) return f ? ambiguous(f) : notFound(words(args));
          const v = f.spec.voltage;
          const knob = q && v.max > v.min ? Math.max(0, Math.min(1, (q.value - v.min) / (v.max - v.min))) : (p.supply?.knob ?? 0.4);
          api.choose({ ...strip(p), supply: { id: f.id as SupplyId, knob } }, 'step');
          return [`✓ ${T(f.name)}, ${sig(supplyVoltage(f, knob), 3, loc())} ${t(loc(), 'unit-sym-V')}`];
        }
        // A furnace (hot surroundings) for melting; for cooling — only cold ones.
        const furnace = uses === 'either' ? find(Object.values(COOLERS).filter((x) => x.spec.hot), names, words(args)) : undefined;
        if (uses === 'cooler' || (furnace && !Array.isArray(furnace))) {
          const f = furnace && !Array.isArray(furnace) ? furnace : find(Object.values(COOLERS).filter((x) => !x.spec.hot), names, words(args));
          if (!f || Array.isArray(f)) return f ? ambiguous(f) : notFound(words(args));
          const s = f.spec.setpoint;
          const setpoint = q ? Math.max(s.min, Math.min(s.max, q.value)) : s.default;
          api.choose({ ...strip(p), cooler: { id: f.id as CoolerId, setpoint } }, 'step');
          return [`✓ ${T(f.name)}, ${setpoint} °C${q && setpoint !== q.value ? (t(loc(), 'console-setpoint-range', { min: String(s.min), max: String(s.max) })) : ''}`];
        }
        if (uses === 'either' && /^(кімнат|room|без|none)/.test(norm(words(args)))) {
          api.choose(strip(p), 'step');
          return [t(loc(), 'console-no-heater')];
        }
        const f = find(Object.values(HEATERS), names, words(args));
        if (!f || Array.isArray(f)) return f ? ambiguous(f) : notFound(words(args));
        const rating = q ? f.spec.ratings.reduce((a, b) => (Math.abs(b - q.value) < Math.abs(a - q.value) ? b : a)) : f.spec.defaultRating;
        api.choose({ ...strip(p), heater: { id: f.id as HeaterId, rating, knob: f.spec.control === 'switch' ? 1 : (p.heater?.knob ?? 1) } }, 'step');
        return [`✓ ${T(f.name)}, ${rating} ${t(loc(), 'unit-sym-W')}`];
      },
    },
    {
      names: ['knob', 'ручка'],
      usage: msg('console-knob-usage'),
      about: msg('console-knob-about'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        const knob = Math.max(0, Math.min(1, q.value > 1 ? q.value / 100 : q.value));
        if (!api.setKnob(knob)) return [t(loc(), 'console-no-knob')];
        return [`✓ ${Math.round(knob * 100)} %`];
      },
    },
    {
      names: ['target', 'ціль'],
      usage: msg('console-target-usage'),
      about: msg('console-target-about'),
      run(args) {
        const p = api.params();
        const op = OPERATIONS[p.action];
        const q = quantities(args)[0];
        if (!op.target) return [t(loc(), 'console-no-target')];
        if (!q) return [T(this.usage)];
        api.choose({ ...p, target: Math.max(op.target.min, Math.min(op.target.max, q.value)) }, 'step');
        return [`✓ ${q.value} °C`];
      },
    },
    {
      names: ['duration', 'час'],
      usage: msg('console-duration-usage'),
      about: msg('console-duration-about'),
      run(args) {
        const p = api.params();
        const op = OPERATIONS[p.action];
        const q = quantities(args)[0];
        if (!op.duration) return [t(loc(), 'console-no-duration')];
        if (!q) return [T(this.usage)];
        api.choose({ ...p, duration: Math.max(op.duration.min, Math.min(op.duration.max, q.value)) }, 'step');
        return [`✓ ${q.value} ${t(loc(), 'unit-sym-min')}`];
      },
    },
    {
      names: ['temp', 'температура'],
      usage: msg('console-temp-usage'),
      about: msg('console-temp-about'),
      run(args) {
        if (api.started()) return [t(loc(), 'console-running-already')];
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        api.choose({ ...api.params(), startTemp: Math.max(-30, Math.min(300, q.value)) }, 'experiment');
        return [`✓ ${q.value} °C`];
      },
    },
    {
      names: ['room', 'кімната'],
      usage: msg('console-room-usage'),
      about: msg('console-room-about'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        api.choose({ ...api.params(), roomTemp: Math.max(-20, Math.min(45, q.value)) }, 'experiment');
        return [`✓ ${q.value} °C`];
      },
    },
    {
      names: ['lid', 'кришка'],
      usage: msg('console-lid-usage'),
      about: msg('console-lid-about'),
      run(args) {
        const on = /^(так|yes|on|1|є)/.test(norm(args[0] ?? 'так'));
        api.choose({ ...api.params(), lid: on }, 'experiment');
        return [on ? (t(loc(), 'console-lid-on')) : t(loc(), 'console-lid-off')];
      },
    },
    {
      names: ['add', 'додати'],
      usage: msg('console-add-usage'),
      about: msg('console-add-about'),
      run(args) {
        const frozen = args.some((a) => /^(лід|льод|frozen|ice)/.test(norm(a)));
        const text = args.filter((a) => !/^(лід|льод|frozen|ice)/.test(norm(a)));
        const f = find(api.addable(), names, words(text));
        if (!f) return notFound(words(text));
        if (Array.isArray(f)) return ambiguous(f);
        const qs = quantities(text);
        const mass = qs.find((q) => q.unit === 'г' || q.unit === 'g' || q.unit === '') ?? qs.find((q) => q.unit === 'кг' || q.unit === 'kg');
        const grams = mass ? (mass.unit === 'кг' || mass.unit === 'kg' ? mass.value * 1000 : mass.value) : 10;
        const tq = qs.find((q) => q.unit === '°c' || q.unit === '°' || q.unit === 'c');
        // A metal block comes out of boiling water unless told otherwise.
        const metal = SUBSTANCES[f.id as SubstanceId]?.category === 'solid.metal';
        const err = api.add(f.id as SubstanceId, grams, tq?.value ?? (metal ? 100 : frozen ? -18 : 20), frozen);
        return err ? [`✗ ${err}`] : [`✓ ${T(f.name)}, ${grams} ${t(loc(), 'unit-sym-g')}`];
      },
    },
    {
      names: ['weigh', 'scales', 'зважити', 'ваги'],
      usage: msg('console-weigh-usage'),
      about: msg('console-weigh-about'),
      run(args) {
        if (!args.length) return [api.weigh()];
        const f = find(MASS_SCALE_IDS, (id) => [id, SCALES[id].name.uk, SCALES[id].name.en], words(args));
        if (!f) return notFound(words(args));
        if (Array.isArray(f)) return ambiguous(f.map((id) => ({ name: SCALES[id].name })));
        return [api.weigh(f)];
      },
    },
    {
      names: ['voice', 'голос'],
      usage: msg('console-voice-usage'),
      about: msg('console-voice-about'),
      run(args) {
        if (!args[0]) return () => list(t(loc(), 'console-voices'), api.voices());
        return api.voice(norm(args[0])) ? ['✓'] : notFound(args[0]);
      },
    },
    {
      names: ['level', 'volume', 'об’єм', 'рівень'],
      usage: msg('console-level-usage'),
      about: msg('console-level-about'),
      run: () => [api.level()],
    },
    {
      names: ['hang', 'dynamometer', 'динамометр', 'підвісити'],
      usage: msg('console-hang-usage'),
      about: msg('console-hang-about'),
      run(args) {
        const liquid = args.some((a) => /^(water|liquid|вод|рідин|у)/.test(norm(a)));
        const text = args.filter((a) => !/^(water|liquid|air|вод|рідин|повітр|у|в)$/.test(norm(a)) && !/^(water|liquid|air|вод|рідин|повітр)/.test(norm(a)));
        const solids = Object.values(SUBSTANCES).filter((s) => s.category.startsWith('solid.') && s.category !== 'solid.salt');
        const f = find(solids, names, words(text));
        if (!f) return notFound(words(text));
        if (Array.isArray(f)) return ambiguous(f);
        const q = quantities(text).find((x) => x.unit === 'г' || x.unit === 'g' || x.unit === '');
        return [api.hang(f.id as SubstanceId, q?.value ?? 100, liquid ? 'liquid' : 'air')];
      },
    },
    {
      names: ['start', 'go', 'continue', 'старт', 'продовжити'],
      usage: msg('console-start-usage'),
      about: msg('console-start-about'),
      run() {
        if (!api.isRunning()) api.toggleStart();
        return [t(loc(), 'console-started')];
      },
    },
    {
      names: ['pause', 'stop', 'пауза'],
      usage: msg('console-pause-usage'),
      about: msg('console-pause-about'),
      run() {
        if (api.isRunning()) api.toggleStart();
        return ['⏸'];
      },
    },
    {
      names: ['reset', 'спочатку'],
      usage: msg('console-reset-usage'),
      about: msg('console-reset-about'),
      run(args) {
        // «reset settings»: every setting back to its default. Loading the page again ends the experiment on the table:
        // said first, done on «yes».
        if (['settings', 'налаштування', 'prefs'].includes(norm(args[0] ?? ''))) {
          if (!['yes', 'так', 'y'].includes(norm(args[1] ?? ''))) return () => [t(loc(), 'console-reset-settings-ask')];
          resetSettings();
          window.setTimeout(() => location.reload(), 600);
          return [t(loc(), 'console-reset-settings-done')];
        }
        api.reset();
        return ['↺'];
      },
    },
    {
      names: ['speed', 'швидкість'],
      usage: msg('console-speed-usage'),
      about: msg('console-speed-about'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        const allowed = [1, 10, 60, 300, 600, 3600];
        const x = allowed.reduce((a, b) => (Math.abs(b - q.value) < Math.abs(a - q.value) ? b : a));
        api.setSpeed(x);
        return [`✓ ×${x}`];
      },
    },
    {
      names: ['status', 'стан'],
      usage: msg('console-status-usage'),
      about: msg('console-status-about'),
      run: () => api.status(),
    },
    {
      names: ['predict', 'прогноз'],
      usage: msg('console-predict-usage'),
      about: msg('console-predict-about'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        api.predict(q.value);
        return [`✓ ${q.value} ${t(loc(), 'unit-sym-min')}`];
      },
    },
    {
      names: ['info', 'ref', 'довідка'],
      usage: msg('console-info-usage'),
      about: msg('console-info-about'),
      run(args) {
        const text = words(args);
        const sub = find(Object.values(SUBSTANCES), names, text);
        if (sub && !Array.isArray(sub)) return api.openRef(`substance:${sub.id}`) ? [`✓ ${T(sub.name)}`] : notFound(text);
        const eq = find([...Object.values(HEATERS), ...Object.values(COOLERS), ...Object.values(SUPPLIES)], names, text);
        if (eq && !Array.isArray(eq)) return api.openRef(`equipment:${eq.id}`) ? [`✓ ${T(eq.name)}`] : notFound(text);
        // Components too: sodium chloride, oxygen, iron…
        const comp = find(Object.values(COMPONENTS), (c) => [c.id, c.name.uk, c.name.en, c.formula ?? ''], text);
        if (comp && !Array.isArray(comp)) return api.openRef(`component:${comp.id}`) ? [`✓ ${T(comp.name)}`] : notFound(text);
        return Array.isArray(sub) ? ambiguous(sub) : Array.isArray(eq) ? ambiguous(eq) : Array.isArray(comp) ? ambiguous(comp) : notFound(text);
      },
    },
    {
      names: ['presets', 'досліди'],
      usage: msg('console-presets-usage'),
      about: msg('console-presets-about'),
      run: () => () => list(t(loc(), 'console-presets'), PRESETS.map((p, i) => `${i + 1}. ${T(p.title)}${p.grade ? ` — ${p.grade} ${t(loc(), 'console-grade')}` : ''}`)),
    },
    {
      names: ['preset', 'дослід'],
      usage: msg('console-preset-usage'),
      about: msg('console-preset-about'),
      run(args) {
        const n = quantities(args)[0];
        const p = n && Number.isInteger(n.value) ? PRESETS[n.value - 1] : (() => {
          const f = find(PRESETS, (x) => [x.id, x.title.uk, x.title.en], words(args));
          return f && !Array.isArray(f) ? f : undefined;
        })();
        if (!p) return notFound(args.join(' '));
        api.startPreset(p);
        return [`✓ ${T(p.title)}`, T(p.question)];
      },
    },
    {
      names: ['explain', 'пояснити'],
      usage: msg('console-explain-usage'),
      about: msg('console-explain-about'),
      run() {
        api.explain();
        return [t(loc(), 'console-report-below')];
      },
    },
    {
      names: ['save', 'record', 'зберегти'],
      usage: msg('console-save-usage'),
      about: msg('console-save-about'),
      run: (args) => [api.save(args.join(' '))],
    },
    {
      names: ['records', 'recordings', 'записи'],
      usage: msg('console-records-usage'),
      about: msg('console-records-about'),
      run: () => () => list(t(loc(), 'console-records'), api.records().map((r, i) => `${i + 1}. ${r}`)),
    },
    {
      names: ['replay', 'повтор'],
      usage: msg('console-replay-usage'),
      about: msg('console-replay-about'),
      run(args) {
        const n = quantities(args)[0];
        if (!n) return [T(this.usage)];
        return api.replay(n.value) ? ['▶'] : notFound(String(n.value));
      },
    },
    {
      names: ['news', 'paper', 'btw', 'кстати', 'дореч', 'газета'],
      usage: msg('console-news-usage'),
      about: msg('console-news-about'),
      run(args) {
        if (!args[0]) {
          api.news();
          return () => [t(loc(), 'console-newspaper')];
        }
        return toggle('news', args[0]);
      },
    },
    {
      names: ['speaker', 'спікер', 'ведучий'],
      usage: msg('console-speaker-usage'),
      about: msg('console-speaker-about'),
      run: (args) => toggle('speaker', args[0]),
    },
    {
      names: ['music', 'музика'],
      usage: msg('console-music-usage'),
      about: msg('console-music-about'),
      run: (args) => toggle('music', args[0]),
    },
    {
      names: ['anim', 'animations', 'motion', 'анімації', 'анімація'],
      usage: msg('console-anim-usage'),
      about: msg('console-anim-about'),
      run: (args) => toggle('motion', args[0]),
    },
    {
      names: ['prof', 'professor', 'проф'],
      usage: msg('console-prof-usage'),
      about: msg('console-prof-about'),
      run(args) {
        const scenes = api.scenes();
        if (!args[0]) return () => list(t(loc(), 'console-scenes'), scenes);
        const f = scenes.find((x) => x.startsWith(norm(args[0]!)));
        if (!f) return notFound(args[0]!);
        api.playScene(f);
        return [`✓ ${f}`];
      },
    },
    {
      names: ['clear', 'cls', 'очистити'],
      usage: msg('console-clear-usage'),
      about: msg('console-clear-about'),
      run: () => [],
    },
  ];

  // ---- the element ----
  const root = document.createElement('div');
  root.className = 'console';
  root.innerHTML = `<canvas class="console-rain" aria-hidden="true"></canvas><div class="console-out" role="log" aria-live="polite"></div><div class="console-hint" hidden></div><label class="console-in"><span aria-hidden="true">›</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off"/></label>`;
  const out = root.querySelector<HTMLElement>('.console-out')!;
  const input = root.querySelector<HTMLInputElement>('input')!;
  const hint = root.querySelector<HTMLElement>('.console-hint')!;
  // The commands typed before (↑/↓), kept in the browser between visits.
  const history: string[] = (() => {
    try {
      const x = JSON.parse(store.get('console-history') ?? '[]') as unknown;
      return Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : [];
    } catch {
      return [];
    }
  })();
  let at = history.length;
  // The answer is typed out, a character after another, behind a block cursor (what was typed in comes at once).
  const queue: { readonly el: HTMLElement; readonly text: string; shown: number }[] = [];
  const caret = document.createElement('span');
  caret.className = 'console-caret';
  let typing = 0;
  let typedAt = 0;
  /** Characters owed by the time passed (a fraction carried to the next frame). */
  let owed = 0;
  /** Characters a second for what is queued now: set when lines come, so a long answer ends in TYPE_SECONDS. */
  let rate = TYPE_RATE;
  /** Everything still being typed, written out at once (a new command, no motion). */
  const flush = () => {
    for (const q of queue.splice(0)) q.el.textContent = q.text;
    caret.remove();
    cancelAnimationFrame(typing);
    typing = 0;
    typedAt = 0;
    owed = 0;
    out.scrollTop = out.scrollHeight;
  };
  const type = (now: number) => {
    owed += (Math.min(0.1, (now - (typedAt || now)) / 1000) || 1 / 60) * rate;
    typedAt = now;
    let n = Math.floor(owed);
    owed -= n;
    while (n > 0 && queue.length) {
      const q = queue[0]!;
      const k = Math.min(n, q.text.length - q.shown);
      q.shown += k;
      n -= k;
      q.el.textContent = q.text.slice(0, q.shown);
      q.el.append(caret);
      if (q.shown >= q.text.length) queue.shift();
    }
    out.scrollTop = out.scrollHeight;
    if (queue.length) typing = requestAnimationFrame(type);
    else {
      caret.remove();
      typing = 0;
      typedAt = 0;
      owed = 0;
    }
  };
  /** What was printed in words that can be worded again: re-worded when the page's language changes. */
  let reworded: { els: HTMLElement[]; word: () => readonly string[]; cls: string }[] = [];
  /** The lines of the list of commands printed by «help» (its title left out), each with its command. */
  let helpLines: { el: HTMLElement; c: Cmd }[] = [];
  const print = (what: Out, cls = '', at = false, help = false) => {
    const lines = typeof what === 'function' ? what() : what;
    const els: HTMLElement[] = [];
    for (const l of lines) {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      out.append(d);
      els.push(d);
      if (at || !moving()) d.textContent = l;
      else queue.push({ el: d, text: l, shown: 0 });
    }
    if (typeof what === 'function') reworded.push({ els, word: what, cls });
    if (help) helpLines.push(...COMMANDS.map((c, i) => ({ el: els[i + 1]!, c })));
    // The more there is to type, the faster: a short reply goes at TYPE_RATE, a long one (the whole «help») in TYPE_SECONDS.
    rate = Math.max(TYPE_RATE, queue.reduce((k, q) => k + q.text.length - q.shown, 0) / TYPE_SECONDS);
    if (queue.length && !typing) typing = requestAnimationFrame(type);
    out.scrollTop = out.scrollHeight;
  };
  const greet = () => print(() => [t(loc(), 'console-greet')], 'muted');
  greet();
  input.placeholder = t(loc(), 'console-placeholder');

  /**
   * As a command is typed: the list of «help» in sight — the commands it cannot be fade; no list in sight — the
   * commands it can be are offered over the line (and the one chosen, with its arguments, once a space follows it).
   */
  const suggest = () => {
    const [head = '', ...rest] = input.value.trimStart().split(/\s+/);
    const q = norm(head);
    const fits = (c: Cmd) => c.names.some((n) => norm(n).startsWith(q));
    const top = out.scrollTop;
    const inSight = helpLines.filter((x) => x.el.isConnected && x.el.offsetTop + x.el.offsetHeight > top && x.el.offsetTop < top + out.clientHeight);
    for (const x of helpLines) x.el.classList.toggle('dim', !!q && !fits(x.c));
    const chosen = rest.length ? COMMANDS.find((c) => c.names.includes(q)) : undefined;
    const offered = !q || inSight.length ? [] : chosen ? [chosen] : COMMANDS.filter(fits);
    setHint(offered.length ? offered.slice(0, HINTS_SHOWN).map((c) => `${T(c.usage).padEnd(36)} ${T(c.about)}`).join('\n') + (offered.length > HINTS_SHOWN ? `\n… +${offered.length - HINTS_SHOWN}` : '') : '');
  };
  // The hint is typed too: what no longer fits is erased from its end (as with Backspace), then the rest typed on.
  let hintWant = '';
  let hintShown = '';
  let hintFrame = 0;
  let hintAt = 0;
  let hintOwed = 0;
  let hintRate = HINT_RATE;
  const hintCaret = document.createElement('span');
  hintCaret.className = 'console-caret';
  const hintStep = (now: number) => {
    hintOwed += (Math.min(0.1, (now - (hintAt || now)) / 1000) || 1 / 60) * hintRate;
    hintAt = now;
    for (; hintOwed >= 1 && hintShown !== hintWant; hintOwed--) hintShown = hintWant.startsWith(hintShown) ? hintWant.slice(0, hintShown.length + 1) : hintShown.slice(0, -1);
    hint.textContent = hintShown;
    if (hintShown !== hintWant) {
      hint.append(hintCaret);
      hintFrame = requestAnimationFrame(hintStep);
      return;
    }
    hint.hidden = !hintShown;
    hintFrame = hintAt = hintOwed = 0;
  };
  const setHint = (text: string) => {
    if (text === hintWant) return;
    hintWant = text;
    if (!moving()) {
      cancelAnimationFrame(hintFrame);
      hintFrame = 0;
      hintShown = text;
      hint.textContent = text;
      hint.hidden = !text;
      return;
    }
    // Erased and typed within HINT_SECONDS, however much changes (at HINT_RATE at the least).
    let common = 0;
    while (common < hintShown.length && hintShown[common] === text[common]) common++;
    hintRate = Math.max(HINT_RATE, (hintShown.length - common + text.length - common) / HINT_SECONDS);
    hint.hidden = false;
    if (!hintFrame) hintFrame = requestAnimationFrame(hintStep);
  };
  input.addEventListener('input', suggest);
  input.addEventListener('keyup', (e) => {
    // (After Enter, Tab and the history's ↑/↓ the line was changed by the console itself.)
    if (['Enter', 'Tab', 'ArrowUp', 'ArrowDown'].includes(e.key)) suggest();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const line = input.value.trim();
      input.value = '';
      if (!line) return;
      if (history[history.length - 1] !== line) history.push(line);
      history.splice(0, history.length - HISTORY_KEPT);
      store.set('console-history', JSON.stringify(history));
      at = history.length;
      flush();
      print([`› ${line}`], 'cmd', true);
      const [head, ...args] = line.split(/\s+/);
      const c = COMMANDS.find((x) => x.names.includes(norm(head!)));
      if (!c) return print(() => [t(loc(), 'console-no-command', { head })], 'err');
      if (c.names[0] === 'clear') {
        flush();
        out.innerHTML = '';
        reworded = [];
        helpLines = [];
        return greet();
      }
      try {
        print(c.run(args, api), '', false, c.names[0] === 'help' && !args.length);
      } catch (err) {
        print([String(err)], 'err');
      }
    } else if (e.key === 'ArrowUp' && history.length) {
      at = Math.max(0, at - 1);
      input.value = history[at]!;
      e.preventDefault();
    } else if (e.key === 'ArrowDown' && history.length) {
      at = Math.min(history.length, at + 1);
      input.value = history[at] ?? '';
      e.preventDefault();
    } else if (e.key === 'Tab') {
      // Complete the command, then a name from the lists the command works with.
      e.preventDefault();
      const parts = input.value.split(/\s+/);
      if (parts.length <= 1) {
        const opts = COMMANDS.flatMap((c) => c.names).filter((n) => /^[a-z?]/.test(n) || /[^\x00-\x7f]/.test(norm(parts[0] ?? ''))).filter((n) => n.startsWith(norm(parts[0] ?? '')));
        if (opts.length === 1) input.value = `${opts[0]} `;
        else if (opts.length) print([opts.join('  ')], 'muted');
        return;
      }
      const last = norm(parts[parts.length - 1]!);
      const pool = [...LAB_ACTIONS.map((a) => T(OPERATIONS[a].label)), ...Object.values(SUBSTANCES).map((x) => T(x.name)), ...Object.values(HEATERS).map((x) => T(x.name)), ...Object.values(COOLERS).map((x) => T(x.name)), ...Object.values(SUPPLIES).map((x) => T(x.name))]
        .flatMap((n) => n.split(/[\s()«»,]+/))
        .map((w) => w.toLowerCase().replace(/[.…]+$/, ''))
        .filter((w, i, a) => w.length > 2 && a.indexOf(w) === i && norm(w).startsWith(last));
      if (pool.length === 1) input.value = [...parts.slice(0, -1), pool[0]].join(' ') + ' ';
      else if (pool.length) print([pool.slice(0, 12).join('  ')], 'muted');
    }
  });
  rain(root.querySelector<HTMLCanvasElement>('.console-rain')!, root);
  // The page's language changed: the placeholder and every answer that can be worded again, in the new one
  // (what an action did stays as it was printed: the action is not done again).
  new MutationObserver(() => {
    flush();
    input.placeholder = t(loc(), 'console-placeholder');
    for (const r of reworded) {
      const lines = r.word();
      const els = lines.map((l, i) => {
        const d = r.els[i] ?? document.createElement('div');
        if (r.cls) d.className = r.cls;
        d.textContent = l;
        return d;
      });
      r.els.at(-1)?.after(...els.slice(r.els.length));
      for (const d of r.els.slice(lines.length)) d.remove();
      r.els = els;
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  return root;
}

/** The glyphs that fall behind the console's text: katakana, as on the film's screens, digits and physics' signs. */
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789=+−×÷√∑∫λΩμπΔ';
/** Columns of glyphs falling behind the text ("Matrix"): drawn only while the console is open and things may move. */
function rain(canvas: HTMLCanvasElement, root: HTMLElement) {
  const g = canvas.getContext('2d');
  if (!g) return;
  const size = 14;
  let drops: number[] = [];
  let last = 0;
  const tick = (now: number) => {
    requestAnimationFrame(tick);
    const shown = !!root.closest('.open') && moving() && !document.hidden;
    if (!shown) {
      if (drops.length) {
        g.clearRect(0, 0, canvas.width, canvas.height);
        drops = [];
      }
      return;
    }
    // About 20 frames a second: a slow fall, little work.
    if (now - last < 50) return;
    last = now;
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      drops = [];
    }
    const columns = Math.ceil(w / size);
    if (drops.length !== columns) drops = Array.from({ length: columns }, () => Math.floor((Math.random() * -h) / size));
    // The trail fades: each frame darkens what was drawn before.
    g.fillStyle = 'rgba(0, 0, 0, 0.12)';
    g.fillRect(0, 0, w, h);
    g.font = `${size}px ui-monospace, Menlo, Consolas, monospace`;
    for (let i = 0; i < columns; i++) {
      const y = drops[i]! * size;
      g.fillStyle = Math.random() < 0.08 ? '#d8ffe0' : '#00ff41';
      g.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!, i * size, y);
      drops[i] = y > h && Math.random() > 0.975 ? 0 : drops[i]! + 1;
    }
  };
  requestAnimationFrame(tick);
}
