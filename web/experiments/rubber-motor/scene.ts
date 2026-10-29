import { readingsOf, formatMeasured } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, PLASTICINE, springSvg, STEEL, THREAD, weightsSvg, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { BENCH_SPRING_K } from '../../../src/scenarios/bench-kit.js';
import { turnsText } from '../../../src/experiments/rubber-motor/bench.js';
import { dynoSvg, type DynoView } from '../dyno-diy/scene.js';

import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The rubber motor: the band on the home-made dynamometer (`band` — the dynamometer's view); or the car in the
 * corridor — at `x` m along the tape, its back axle `wound` turns wound (the band's coil), its wheels turned by
 * `spin` turns; the earlier runs' stops (`stops`); the tape shows `range` m.
 */
export type RubberView = { readonly mode: 'band' | 'car'; readonly band?: DynoView; readonly x: number; readonly wound: number; readonly spin: number; readonly stops: readonly { readonly x: number; readonly label: string }[]; readonly range: number; readonly unit: string; readonly read?: string; /** The step just done, to be played: the band; the car's run of so many turns. */ readonly anim?: 'band' | 'run'; readonly turns?: number };

function view({ log, command, plan, locale }: SceneContext): RubberView {
  const uk = locale === 'uk';
  const done = log.filter((e) => e.ok && e.command.type === 'lab.rubber');
  const cr = command?.type === 'lab.rubber' ? (command as unknown as { step: 'band' | 'run'; turns?: number }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.rubber');
  const step = cr?.step ?? (next?.kind === 'bench' ? (next.command as unknown as { step: 'band' | 'run' }).step : 'run');
  const m = (x: number) => `${new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 2 }).format(x)} ${uk ? 'м' : 'm'}`;
  const runs = done.filter((e) => (e.command as unknown as { step: string }).step === 'run').map((e) => ({ n: Number((e.command as unknown as { turns: number }).turns), s: readingsOf([e])[0]?.record.value ?? 0 }));
  const unit = uk ? 'м' : 'm';
  if (step === 'band') {
    const bandRec = done.length ? readingsOf([done[0]!])[0]?.record : undefined;
    const F = bandRec?.value ?? 0;
    const band = { weights: 0, hang: 'band' as const, stretch: F / BENCH_SPRING_K.value, marks: [], newton: 1 / BENCH_SPRING_K.value, unit: uk ? 'Н' : 'N', ...(bandRec ? { read: formatMeasured('force', bandRec.value, 0.1, locale) } : {}) };
    return { mode: 'band', band, x: 0, wound: 0, spin: 0, stops: [], range: 4, unit, ...(cr ? { anim: 'band' } : {}) };
  }
  const last = cr && runs.length ? runs[runs.length - 1]! : undefined;
  const stops = runs.slice(0, last ? -1 : undefined).map((r) => ({ x: r.s, label: `${turnsText(r.n, uk)}: ${m(r.s)}` }));
  return { mode: 'car', x: last?.s ?? 0, wound: 0, spin: 0, stops, range: 4, unit, ...(last ? { read: `${turnsText(last.n, uk)}: ${m(last.s)}`, anim: 'run', turns: last.n } : {}) };
}

/**
 * The rubber-motor car in a corridor: the floor with a tape from the start, the car (not to scale) with bottle-cap
 * wheels, the band from the front axle to the coil on the back one; chalk marks where the earlier runs stopped.
 */
function rubberSvg(r: RubberView): string {
  if (!r) return '';
  // (The floor well above the table's edge: the buttons under the scene cover its bottom.)
  const floor = TABLE - 60;
  const x0 = 200;
  const x1 = 530;
  const at = (m: number) => x0 + (m / r.range) * (x1 - x0);
  const metres = Array.from({ length: Math.floor(r.range) + 1 }, (_, k) => `<path d="M${at(k)},${floor + 1} v6" style="stroke:#5a4a14;stroke-width:0.8"/><text x="${at(k)}" y="${floor + 17}" text-anchor="middle" style="font:600 9px system-ui,sans-serif;fill:#f1d36b">${k} ${r.unit}</text>`).join('');
  const tape = `<rect x="${x0}" y="${floor + 1}" width="${x1 - x0}" height="5" style="fill:#f1d36b;stroke:#a88a2c;stroke-width:0.5"/>${metres}`;
  const stops = r.stops.map((s, k) => `<path d="M${at(s.x)},${floor - 60} v60" style="stroke:#ffffff;stroke-width:1.4;stroke-dasharray:3 2"/><text class="bench-label" x="${at(s.x)}" y="${floor - 66 - 14 * (k % 2)}" text-anchor="middle">${s.label}</text>`).join('');
  // The car: its back axle at the car's place; 56 units long.
  const cx = at(r.x);
  const back = cx - 6;
  const front = cx + 60;
  const wr = 14;
  const wy = floor - wr;
  const wheel = (x: number, turns: number) => {
    const a = turns * 2 * Math.PI;
    return `<circle cx="${x}" cy="${wy}" r="${wr}" style="fill:#e8e2d5;stroke:#5a636c;stroke-width:1.4"/><path d="M${x - wr * Math.cos(a)},${wy - wr * Math.sin(a)} L${x + wr * Math.cos(a)},${wy + wr * Math.sin(a)}" style="stroke:#5a636c;stroke-width:1.2"/>`;
  };
  const body = `<rect x="${back - 14}" y="${wy - 26}" width="${front - back + 28}" height="18" rx="3" style="fill:#d9b26a;stroke:#9a6b33"/><path d="M${back},${wy} H${front}" style="stroke:${DARK};stroke-width:1"/>`;
  const coil = Math.min(9, 2.5 + r.wound * 0.7);
  const band = `<path d="M${back},${wy - coil} L${front},${wy}" style="stroke:#b5651d;stroke-width:1.8"/><circle cx="${back}" cy="${wy}" r="${coil}" style="fill:none;stroke:#b5651d;stroke-width:${r.wound > 0.1 ? 2.2 : 0}"/>`;
  const car = `${body}${wheel(back, r.spin)}${wheel(front, r.spin * 1)}${band}`;
  return `${tape}${stops}${car}${r.read ? `<text class="bench-reading" x="${cx + 27}" y="${wy - 36}" text-anchor="middle">${r.read}</text>` : ''}`;
}

/**
 * The rubber motor: the band pulled down on the dynamometer (1.5 s); or the car — wound (the back wheels turned back,
 * the coil growing, 1.5 s), then let go: it speeds off and slows to its stop (constant slowing, 2.5 s), the band
 * unwinding on the way.
 */
function rubberRun(next: RubberView, draw: (v: RubberView) => void): Motion | null {
  const r = next;
  if (!r.anim) return null;
  const anim = r.anim!;
  const length = anim === 'band' ? 1.5 : 4.4;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = r;
  const wheelR = 0.03;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...rest, ...(r.read ? { read: r.read } : {}) });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'band') {
        const { read: _b, ...b } = r.band!;
        const u = Math.min(1, t / 1.2);
        return draw({ ...rest, band: { ...b, stretch: b.stretch * u } });
      }
      const N = r.turns ?? 0;
      if (t < 1.5) return draw({ ...rest, x: 0, wound: (N * t) / 1.5, spin: (-N * t) / 1.5 });
      // Let go: s(u) = S·(1 − (1 − u)²) — fast at first, slowing to the stop.
      const u = Math.min(1, (t - 1.5) / 2.5);
      const x = r.x * (1 - (1 - u) ** 2);
      draw({ ...rest, x, wound: Math.max(0, N * (1 - u * 2)), spin: -N + x / (2 * Math.PI * wheelR) });
    },
  };
}

export const rubberMotorScene = defineScene({ kind: 'rubber', view, svg: (v: RubberView) => (v.mode === 'band' ? (v.band ? dynoSvg(v.band) : '') : rubberSvg(v)), motion: rubberRun });
