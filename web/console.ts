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
import { isDrySample, LAB_ACTIONS, OPERATIONS, PRESETS, substancesFor, vesselsFor, type LabAction, type LabParams, type Preset } from '../src/scenarios/index.js';
import { SUBSTANCES, type SubstanceId, type SubstanceItem } from '../src/substances/index.js';
import { COMPONENTS } from '../src/components/index.js';
import { MATERIALS } from '../src/domains/thermal/materials.js';

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

interface Cmd {
  readonly names: readonly string[];
  readonly usage: LocalizedText;
  readonly about: LocalizedText;
  run(args: string[], api: ConsoleApi): string[];
}

const L = (uk: string, en: string): LocalizedText => ({ uk, en });
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
  const uk = () => loc() === 'uk';
  const ambiguous = (items: readonly { name: LocalizedText }[]) => [`${uk() ? 'Уточни, яке саме' : 'Which one'}: ${items.map((x) => T(x.name)).join(', ')}`];
  const notFound = (what: string) => [uk() ? `Не знаю «${what}». Спробуй команду без слів — побачиш список (наприклад, «substances»).` : `I don't know "${what}". Run the command without words to see the list.`];
  const list = (title: string, items: readonly string[]) => [title, ...items.map((x) => `  • ${x}`)];

  const COMMANDS: Cmd[] = [
    {
      names: ['help', '?', 'допомога'],
      usage: L('help [command]', 'help [command]'),
      about: L('список команд або опис однієї', 'the list of commands or one of them'),
      run(args) {
        if (args[0]) {
          const c = COMMANDS.find((x) => x.names.includes(norm(args[0]!)));
          return c ? [`${T(c.usage)} — ${T(c.about)}`, ...(c.names.length > 1 ? [`${uk() ? 'Інші назви' : 'Also'}: ${c.names.slice(1).join(', ')}`] : [])] : notFound(args[0]!);
        }
        return [uk() ? 'Команди (Tab доповнює, ↑/↓ — історія):' : 'Commands (Tab completes, ↑/↓ — history):', ...COMMANDS.map((c) => `  ${T(c.usage).padEnd(36)} ${T(c.about)}`)];
      },
    },
    {
      names: ['actions', 'дії'],
      usage: L('actions', 'actions'),
      about: L('що можна робити', 'what can be done'),
      run: () => list(uk() ? 'Дії:' : 'Actions:', LAB_ACTIONS.map((a) => `${T(OPERATIONS[a].label)}${a === api.params().action ? ' ◀' : ''}`)),
    },
    {
      names: ['action', 'do', 'дія'],
      usage: L('action <name>', 'action <name>'),
      about: L('вибрати дію: action freeze', 'choose an action: action freeze'),
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
      usage: L('substances', 'substances'),
      about: L('речовини для вибраної дії', 'substances for the chosen action'),
      run: () => list(uk() ? 'Речовини:' : 'Substances:', substancesFor(api.params().action).map((x) => `${T(x.name)}${x.id === api.params().substance ? ' ◀' : ''}`)),
    },
    {
      names: ['substance', 'речовина'],
      usage: L('substance <name> [amount L|mL|g]', 'substance <name> [amount L|mL|g]'),
      about: L('налити речовину: substance sea 0.5 l', 'pour a substance: substance sea 0.5 L'),
      run(args) {
        if (api.started()) return [uk() ? 'Під час досліду речовину не міняють — спершу «reset».' : 'The substance stays during an experiment — "reset" first.'];
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
        return [`✓ ${T(f.name)}, ${dry ? `${sig(amount * f.liquid.density.value, 3, loc())} ${uk() ? 'г' : 'g'}` : `${sig(amount, 3, loc())} ${uk() ? 'л' : 'L'}`}`];
      },
    },
    {
      names: ['vessels', 'посуд'],
      usage: L('vessels', 'vessels'),
      about: L('посуд, що підходить до приладу', 'vessels that fit the device'),
      run: () => list(uk() ? 'Посуд:' : 'Vessels:', vesselsFor(api.params()).map((f) => `${T(f.vessel.name)} (${f.sizes.join(', ')} ${uk() ? 'л' : 'L'})${f.vessel.id === api.params().vessel ? ' ◀' : ''}`)),
    },
    {
      names: ['vessel', 'посудина'],
      usage: L('vessel <name> [size L] [material]', 'vessel <name> [size L] [material]'),
      about: L('поставити посуд: vessel beaker 0.25', 'choose a vessel: vessel beaker 0.25'),
      run(args) {
        if (api.started()) return [uk() ? 'Під час досліду посуд не міняють — спершу «reset».' : 'The vessel stays during an experiment — "reset" first.'];
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
        return [`✓ ${T(f.vessel.name)}, ${sig(size, 3, loc())} ${uk() ? 'л' : 'L'}, ${mName}`];
      },
    },
    {
      names: ['devices', 'прилади'],
      usage: L('devices', 'devices'),
      about: L('прилади для вибраної дії', 'devices for the chosen action'),
      run() {
        const uses = OPERATIONS[api.params().action].uses;
        const items = uses === 'supply' ? Object.values(SUPPLIES) : uses === 'cooler' ? Object.values(COOLERS).filter((x) => !x.spec.hot) : [...Object.values(HEATERS), ...(uses === 'either' ? Object.values(COOLERS).filter((x) => x.spec.hot) : [])];
        return list(uk() ? 'Прилади:' : 'Devices:', items.map((x) => T(x.name)));
      },
    },
    {
      names: ['device', 'прилад'],
      usage: L('device <name> [W | °C | V]', 'device <name> [W | °C | V]'),
      about: L('прилад і його налаштування: device freezer -22', 'a device and its setting: device freezer -22'),
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
          return [`✓ ${T(f.name)}, ${sig(supplyVoltage(f, knob), 3, loc())} ${uk() ? 'В' : 'V'}`];
        }
        // A furnace (hot surroundings) for melting; for cooling — only cold ones.
        const furnace = uses === 'either' ? find(Object.values(COOLERS).filter((x) => x.spec.hot), names, words(args)) : undefined;
        if (uses === 'cooler' || (furnace && !Array.isArray(furnace))) {
          const f = furnace && !Array.isArray(furnace) ? furnace : find(Object.values(COOLERS).filter((x) => !x.spec.hot), names, words(args));
          if (!f || Array.isArray(f)) return f ? ambiguous(f) : notFound(words(args));
          const s = f.spec.setpoint;
          const setpoint = q ? Math.max(s.min, Math.min(s.max, q.value)) : s.default;
          api.choose({ ...strip(p), cooler: { id: f.id as CoolerId, setpoint } }, 'step');
          return [`✓ ${T(f.name)}, ${setpoint} °C${q && setpoint !== q.value ? (uk() ? ` (діапазон ${s.min}…${s.max} °C)` : ` (range ${s.min}…${s.max} °C)`) : ''}`];
        }
        if (uses === 'either' && /^(кімнат|room|без|none)/.test(norm(words(args)))) {
          api.choose(strip(p), 'step');
          return [uk() ? '✓ без нагрівача, у кімнаті' : '✓ no heater, in the room'];
        }
        const f = find(Object.values(HEATERS), names, words(args));
        if (!f || Array.isArray(f)) return f ? ambiguous(f) : notFound(words(args));
        const rating = q ? f.spec.ratings.reduce((a, b) => (Math.abs(b - q.value) < Math.abs(a - q.value) ? b : a)) : f.spec.defaultRating;
        api.choose({ ...strip(p), heater: { id: f.id as HeaterId, rating, knob: f.spec.control === 'switch' ? 1 : (p.heater?.knob ?? 1) } }, 'step');
        return [`✓ ${T(f.name)}, ${rating} ${uk() ? 'Вт' : 'W'}`];
      },
    },
    {
      names: ['knob', 'ручка'],
      usage: L('knob <0…100 %>', 'knob <0…100 %>'),
      about: L('повернути ручку нагрівача чи блока живлення', 'turn the heater or power supply knob'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        const knob = Math.max(0, Math.min(1, q.value > 1 ? q.value / 100 : q.value));
        if (!api.setKnob(knob)) return [uk() ? 'Ручки тут немає.' : 'There is no knob here.'];
        return [`✓ ${Math.round(knob * 100)} %`];
      },
    },
    {
      names: ['target', 'ціль'],
      usage: L('target <°C>', 'target <°C>'),
      about: L('до якої температури гріти чи охолоджувати', 'the temperature to heat or cool to'),
      run(args) {
        const p = api.params();
        const op = OPERATIONS[p.action];
        const q = quantities(args)[0];
        if (!op.target) return [uk() ? 'Ця дія без цільової температури.' : 'This action has no target temperature.'];
        if (!q) return [T(this.usage)];
        api.choose({ ...p, target: Math.max(op.target.min, Math.min(op.target.max, q.value)) }, 'step');
        return [`✓ ${q.value} °C`];
      },
    },
    {
      names: ['duration', 'час'],
      usage: L('duration <min>', 'duration <min>'),
      about: L('скільки хвилин іде дія (струм)', 'how many minutes the action runs (current)'),
      run(args) {
        const p = api.params();
        const op = OPERATIONS[p.action];
        const q = quantities(args)[0];
        if (!op.duration) return [uk() ? 'Ця дія триває до мети, а не за часом.' : 'This action runs to its goal, not by time.'];
        if (!q) return [T(this.usage)];
        api.choose({ ...p, duration: Math.max(op.duration.min, Math.min(op.duration.max, q.value)) }, 'step');
        return [`✓ ${q.value} ${uk() ? 'хв' : 'min'}`];
      },
    },
    {
      names: ['temp', 'температура'],
      usage: L('temp <°C>', 'temp <°C>'),
      about: L('початкова температура речовини', 'starting temperature of the substance'),
      run(args) {
        if (api.started()) return [uk() ? 'Дослід уже йде — спершу «reset».' : 'The experiment is running — "reset" first.'];
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        api.choose({ ...api.params(), startTemp: Math.max(-30, Math.min(300, q.value)) }, 'experiment');
        return [`✓ ${q.value} °C`];
      },
    },
    {
      names: ['room', 'кімната'],
      usage: L('room <°C>', 'room <°C>'),
      about: L('температура в кімнаті', 'room temperature'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        api.choose({ ...api.params(), roomTemp: Math.max(-20, Math.min(45, q.value)) }, 'experiment');
        return [`✓ ${q.value} °C`];
      },
    },
    {
      names: ['lid', 'кришка'],
      usage: L('lid on|off', 'lid on|off'),
      about: L('накрити посуд кришкою', 'put a lid on'),
      run(args) {
        const on = /^(так|yes|on|1|є)/.test(norm(args[0] ?? 'так'));
        api.choose({ ...api.params(), lid: on }, 'experiment');
        return [on ? (uk() ? '✓ з кришкою' : '✓ with a lid') : uk() ? '✓ без кришки' : '✓ no lid'];
      },
    },
    {
      names: ['add', 'додати'],
      usage: L('add <substance> <mass g> [°C] [frozen]', 'add <substance> <mass g> [°C] [frozen]'),
      about: L('досипати чи долити: add salt 7 g', 'add something: add salt 7 g'),
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
        return err ? [`✗ ${err}`] : [`✓ ${T(f.name)}, ${grams} ${uk() ? 'г' : 'g'}`];
      },
    },
    {
      names: ['weigh', 'scales', 'зважити', 'ваги'],
      usage: L('weigh [kitchen | lab]', 'weigh [kitchen | lab]'),
      about: L('поставити посуд на ваги: weigh lab', 'put the vessel on the scales: weigh lab'),
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
      usage: L('voice [toon | speech | none]', 'voice [toon | speech | none]'),
      about: L('голос Професора: voice none', 'the Professor’s voice: voice none'),
      run(args) {
        if (!args[0]) return list(uk() ? 'Голоси (voice <назва>):' : 'Voices (voice <name>):', api.voices());
        return api.voice(norm(args[0])) ? ['✓'] : notFound(args[0]);
      },
    },
    {
      names: ['level', 'volume', 'об’єм', 'рівень'],
      usage: L('level', 'level'),
      about: L('подивитися на поділки: об’єм рідини (мірний циліндр)', 'read the marks: the volume of the liquid (measuring cylinder)'),
      run: () => [api.level()],
    },
    {
      names: ['hang', 'dynamometer', 'динамометр', 'підвісити'],
      usage: L('hang <body> <mass g> [air | water]', 'hang <body> <mass g> [air | water]'),
      about: L('підвісити тіло на динамометр: hang aluminium 100 g water', 'hang a body on the dynamometer: hang aluminium 100 g water'),
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
      usage: L('start', 'start'),
      about: L('запустити (або продовжити) дослід', 'start (or continue) the experiment'),
      run() {
        if (!api.isRunning()) api.toggleStart();
        return [uk() ? '▶ пішло!' : '▶ running!'];
      },
    },
    {
      names: ['pause', 'stop', 'пауза'],
      usage: L('pause', 'pause'),
      about: L('зупинити час', 'stop the clock'),
      run() {
        if (api.isRunning()) api.toggleStart();
        return ['⏸'];
      },
    },
    {
      names: ['reset', 'спочатку'],
      usage: L('reset', 'reset'),
      about: L('почати дослід заново', 'start the experiment over'),
      run() {
        api.reset();
        return ['↺'];
      },
    },
    {
      names: ['speed', 'швидкість'],
      usage: L('speed <1…3600>', 'speed <1…3600>'),
      about: L('у скільки разів швидше за справжній час', 'how many times faster than real time'),
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
      usage: L('status', 'status'),
      about: L('що зараз показують прилади', 'what the readouts show now'),
      run: () => api.status(),
    },
    {
      names: ['predict', 'прогноз'],
      usage: L('predict <min>', 'predict <min>'),
      about: L('мій прогноз: за скільки хвилин', 'my prediction: in how many minutes'),
      run(args) {
        const q = quantities(args)[0];
        if (!q) return [T(this.usage)];
        api.predict(q.value);
        return [`✓ ${q.value} ${uk() ? 'хв' : 'min'}`];
      },
    },
    {
      names: ['info', 'ref', 'довідка'],
      usage: L('info <name>', 'info <name>'),
      about: L('довідка про речовину чи прилад', 'reference card of a substance or device'),
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
      usage: L('presets', 'presets'),
      about: L('готові досліди з номерами', 'ready-made experiments with numbers'),
      run: () => list(uk() ? 'Готові досліди (дослід <номер>):' : 'Ready-made experiments (preset <number>):', PRESETS.map((p, i) => `${i + 1}. ${T(p.title)}${p.grade ? ` — ${p.grade} ${uk() ? 'клас' : 'grade'}` : ''}`)),
    },
    {
      names: ['preset', 'дослід'],
      usage: L('preset <number or name>', 'preset <number or name>'),
      about: L('запустити готовий дослід', 'start a ready-made experiment'),
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
      usage: L('explain', 'explain'),
      about: L('розбір: що відбулося і чому', 'what happened and why'),
      run() {
        api.explain();
        return [uk() ? '✓ розбір нижче' : '✓ see the report below'];
      },
    },
    {
      names: ['save', 'record', 'зберегти'],
      usage: L('save [name]', 'save [name]'),
      about: L('зберегти дослід (усі кроки) як запис', 'save the experiment (all steps) as a recording'),
      run: (args) => [api.save(args.join(' '))],
    },
    {
      names: ['records', 'recordings', 'записи'],
      usage: L('records', 'records'),
      about: L('мої записи з номерами', 'my recordings with numbers'),
      run: () => list(uk() ? 'Записи (replay <номер>):' : 'Recordings (replay <number>):', api.records().map((r, i) => `${i + 1}. ${r}`)),
    },
    {
      names: ['replay', 'повтор'],
      usage: L('replay <number>', 'replay <number>'),
      about: L('повторити запис крок за кроком', 'replay a recording step by step'),
      run(args) {
        const n = quantities(args)[0];
        if (!n) return [T(this.usage)];
        return api.replay(n.value) ? ['▶'] : notFound(String(n.value));
      },
    },
    {
      names: ['news', 'paper', 'btw', 'кстати', 'дореч', 'газета'],
      usage: L('news', 'news'),
      about: L('«До речі!..» — газета Професора: цікавий факт або історична довідка', '"By the way!.." — the Professor\'s newspaper: a curious fact or a page of history'),
      run() {
        api.news();
        return [uk() ? '📰 Професор шукає газету…' : '📰 The Professor is looking for a newspaper…'];
      },
    },
    {
      names: ['prof', 'professor', 'проф'],
      usage: L('prof [scene]', 'prof [scene]'),
      about: L('сценки Професора: prof coffee', 'the Professor\'s scenes: prof coffee'),
      run(args) {
        const scenes = api.scenes();
        if (!args[0]) return list(uk() ? 'Сценки (prof <назва>):' : 'Scenes (prof <name>):', scenes);
        const f = scenes.find((x) => x.startsWith(norm(args[0]!)));
        if (!f) return notFound(args[0]!);
        api.playScene(f);
        return [`✓ ${f}`];
      },
    },
    {
      names: ['clear', 'cls', 'очистити'],
      usage: L('clear', 'clear'),
      about: L('очистити консоль', 'clear the console'),
      run: () => [],
    },
  ];

  // ---- the element ----
  const root = document.createElement('div');
  root.className = 'console';
  root.innerHTML = `<div class="console-out" role="log" aria-live="polite"></div><label class="console-in"><span aria-hidden="true">›</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off"/></label>`;
  const out = root.querySelector<HTMLElement>('.console-out')!;
  const input = root.querySelector<HTMLInputElement>('input')!;
  const history: string[] = [];
  let at = 0;
  const print = (lines: readonly string[], cls = '') => {
    for (const l of lines) {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.textContent = l;
      out.append(d);
    }
    out.scrollTop = out.scrollHeight;
  };
  const greet = () => print([uk() ? 'Консоль лабораторії. Напиши «help», щоб побачити команди.' : 'Lab console. Type "help" to see the commands.'], 'muted');
  greet();
  input.placeholder = uk() ? 'наприклад: action freeze' : 'e.g. action freeze';

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const line = input.value.trim();
      input.value = '';
      if (!line) return;
      history.push(line);
      at = history.length;
      print([`› ${line}`], 'cmd');
      const [head, ...args] = line.split(/\s+/);
      const c = COMMANDS.find((x) => x.names.includes(norm(head!)));
      if (!c) return print(uk() ? [`Немає команди «${head}». Напиши «help».`] : [`No command "${head}". Type "help".`], 'err');
      if (c.names[0] === 'clear') {
        out.innerHTML = '';
        return greet();
      }
      try {
        print(c.run(args, api));
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
  return root;
}
