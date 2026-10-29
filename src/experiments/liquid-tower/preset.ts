import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { TOWER_BODIES, TOWER_LIQUIDS, type TowerBody, towerLiquidDensity, towerLiquidIn, towerLiquidName } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_liquid_tower: Preset = {
  ask: { uk: 'Де в циліндрі з чотирма рідинами зупиниться шматочок оргскла?', en: 'Where in a cylinder of four liquids does a piece of acrylic glass stop?' },
  id: 'liquid-tower',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Тіла й рідини різної густини в одному циліндрі', en: 'Bodies and liquids of different densities in one cylinder' },
  question: {
    uk: 'У мірний циліндр по черзі наливаємо по 50 мл гліцерину, води, соняшникової олії та спирту — повільно, по стінці. Потім опускаємо сталеву гайку, шматочок оргскла, шматочок поліетилену й сосновий кубик. Оргскло у воді тоне. Де воно зупиниться в нашому циліндрі?',
    en: 'Into a measuring cylinder we pour in turn 50 mL each of glycerol, water, sunflower oil and ethanol — slowly, down the wall. Then we let in a steel nut, a piece of acrylic glass, a piece of polyethylene and a pine cube. Acrylic glass sinks in water. Where will it stop in our cylinder?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'tower',
  plan: [
    { kind: 'bench', command: { type: 'lab.tower', step: 'pour' } },
    ...(['nut', 'acrylic', 'hdpe', 'pine'] as const).map((body) => ({ kind: 'bench', command: { type: 'lab.tower', step: 'drop', body } }) as const),
  ],
  choices: [ch('bottom', 'На дні: у воді ж воно тоне', 'On the bottom: it sinks in water after all'), ch('glycerol', 'На межі гліцерину й води', 'At the boundary of glycerol and water'), ch('oil', 'На межі води й олії', 'At the boundary of water and oil')],
  trick: { uk: 'Більшість думає, що тіло, яке тоне у воді, неодмінно ляже на дно.', en: 'Most people think a body that sinks in water is bound to end up on the bottom.' },
  formulas: ['mechanics.density', 'mechanics.submerged-share'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'взаємного розташуванням тіл і рідин різної густини у циліндричному посуді' },
  ],
  expect: 'reached',
};

export const answer_liquid_tower = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.tower' && x.command['step'] === 'drop' && x.record.value !== null);
  const at = (b: TowerBody) => recs.find((x) => x.command['body'] === b)?.record ?? null;
  const acr = at('acrylic');
  const lower = acr?.inputs?.['lower'];
  const correct = acr ? (lower === -1 ? 'bottom' : lower === 0 ? 'glycerol' : lower === 1 ? 'oil' : undefined) : undefined;
  const d = TOWER_LIQUIDS.map(towerLiquidDensity);
  const R = (x: number) => String(Math.round(x));
  const pc = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
  const place = (b: TowerBody, l: Locale) => {
    const r = at(b);
    if (!r) return '';
    const uk = l === 'uk';
    const lw = r.inputs?.['lower'] ?? -1;
    const share = r.inputs?.['share'] ?? 0;
    const nm = (k: number) => tr(towerLiquidName(TOWER_LIQUIDS[k]!), l);
    const inn = (k: number) => tr(towerLiquidIn(TOWER_LIQUIDS[k]!), l);
    const name = tr(TOWER_BODIES[b].name, l);
    const N = name.charAt(0).toUpperCase() + name.slice(1);
    const rho = R(r.inputs?.['density'] ?? 0);
    if (lw < 0) return uk ? `${N} (${rho} кг/м³) густіша за всі рідини — лягла на дно.` : `${N} (${rho} kg/m³) is denser than every liquid — it went to the bottom.`;
    if (r.inputs?.['top'] === 1) return uk ? `${N} (${rho} кг/м³) легший за всі рідини — плаває у спирті, занурений на ${pc(share, l)}.` : `${N} (${rho} kg/m³) is lighter than every liquid — it floats in the ethanol, ${pc(share, l)} under.`;
    return uk ? `${N} (${rho} кг/м³) пройшов крізь легші рідини й зупинився на межі «${nm(lw)} — ${nm(lw + 1)}»: ${pc(share, l)} його об’єму ${inn(lw)}, решта — ${inn(lw + 1)}.` : `${N} (${rho} kg/m³) went through the lighter liquids and stopped at the ${nm(lw)} — ${nm(lw + 1)} boundary: ${pc(share, l)} of it ${inn(lw)}, the rest ${inn(lw + 1)}.`;
  };
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? `Рідини лягли шарами в порядку густини: важча рідина опускається під легшу, як і тверде тіло. Кожне тіло тоне, доки довкола нього рідина легша за нього, — сила тяжіння більша за архімедову. Щойно воно доходить до рідини, густішої за себе, архімедова сила стає більшою за вагу, і тіло спливає на ній. Тож тіло зупиняється на межі двох рідин: частково в нижній, частково у верхній — так, щоб архімедові сили від обох рідин разом урівноважили вагу. Що ближча густина тіла до густини нижньої рідини, то глибше воно в неї занурене. Тому «тоне у воді» ще не означає «ляже на дно»: оргскло тоне у воді, але гліцерин його тримає.\n\nГліцерин і вода насправді змішуються: якщо наливати обережно, межа між ними тримається якийсь час, а потім розмивається. Спирт теж змішався б із водою, але між ними — олія. Об’єми рідин тут вважаємо такими, що просто додаються.`
        : `The liquids lay in layers by density: a denser liquid goes under a lighter one, as a solid body does. Each body sinks while the liquid round it is lighter than itself — gravity outweighs the buoyant force. As soon as it reaches a liquid denser than itself, the buoyant force exceeds the weight, and the body floats on it. So the body stops at the boundary of two liquids: partly in the lower, partly in the upper — so that the buoyant forces of both together balance the weight. The closer the body's density to the lower liquid's, the deeper it sits in it. That is why "sinks in water" does not yet mean "goes to the bottom": acrylic glass sinks in water, but the glycerol holds it up.\n\nGlycerol and water do mix: poured with care, the boundary between them holds for a while and then blurs. Ethanol would mix with water too, but the oil is between them. The liquids' volumes are taken to simply add up.`,
    ),
    say: both((l) => (l === 'uk' ? 'Кожне тіло зупинилося там, де рідина під ним густіша за нього!' : 'Every body stopped where the liquid beneath it is denser than itself!')),
    text: both((l) => {
      const uk = l === 'uk';
      const layers = uk ? `Шари знизу вгору: гліцерин (${R(d[0]!)} кг/м³), вода (${R(d[1]!)}), олія (${R(d[2]!)}), спирт (${R(d[3]!)}).` : `Layers from the bottom: glycerol (${R(d[0]!)} kg/m³), water (${R(d[1]!)}), oil (${R(d[2]!)}), ethanol (${R(d[3]!)}).`;
      return [layers, ...(['nut', 'acrylic', 'hdpe', 'pine'] as const).map((b) => place(b, l))].filter(Boolean).join(' ');
    }),
  };
};
