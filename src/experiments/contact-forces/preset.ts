import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { type TouchCase, touchPlan, touchSeen } from './bench.js';
import { tr } from '../../knowledge/i18n.js';

export const preset_contact_forces: Preset = {
  ask: { uk: 'Які сили діють без дотику?', en: 'Which forces act without touching?' },
  id: 'contact-forces',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Контактні й безконтактні сили', en: 'Contact and non-contact forces' },
  question: {
    uk: 'Тіла діють одне на одне — але чи завжди для цього треба торкатися? П’ять спостережень: магніт і скріпка на нитці через 2 см повітря, те саме крізь картонку, наелектризований гребінець над шматочками паперу, брусок, підвішений над столом (чи діє тертя?), і тягарець, який відпустили над столом. Які сили діють без дотику?',
    en: 'Bodies act on each other — but do they always have to touch? Five observations: a magnet and a paper clip on a thread across 2 cm of air, the same through a card, a rubbed comb over bits of paper, a block hung above the table (does friction act?), and a weight let go above the table. Which forces act without touching?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'touch',
  plan: (['magnet', 'card', 'comb', 'lifted', 'fall'] as const).map((c) => ({ kind: 'bench', command: { type: 'lab.touch', case: c } }) as const),
  choices: [ch('field', 'Магнітна, електрична й сила тяжіння; тертя й пружність — лише при дотику', 'Magnetic, electric and gravity; friction and elasticity — only when touching'), ch('none', 'Жодна: сили передаються лише через дотик (хоч би через повітря)', 'None: forces pass only by touching (through the air at least)'), ch('magnet', 'Лише магнітна', 'Only the magnetic one')],
  formulas: ['mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'контактних і безконтактних сил' },
  ],
  expect: 'reached',
};

export const answer_contact_forces = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.touch').map((x) => ({ c: String(x.command['case']) as TouchCase, acts: x.record.inputs?.['acts'] === 1, touch: x.record.inputs?.['touch'] === 1 }));
  const farOk = R.filter((x) => x.c !== 'lifted').every((x) => x.acts && !x.touch);
  const frictionNeedsTouch = R.some((x) => x.c === 'lifted' && !x.acts);
  return {
    ...(farOk && frictionNeedsTouch ? { correct: 'field' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Деякі сили діють на відстані: магніт притягує залізо через повітря й крізь картон, наелектризоване тіло — легкі папірці, а Земля притягує все довкола — тому тягарець і падає, хоч його ніщо не штовхає. Такі тіла діють одне на одне через поле — магнітне, електричне, гравітаційне. А сила тертя й сила пружності — контактні: вони з’являються лише тоді, коли тіла торкаються. Брусок, піднятий над столом, тертя об стіл не відчуває; пружина тягне лише те, що до неї причеплено. Повітря тут нічого не передає: магніт притягує скріпку й у вакуумі.'
        : 'Some forces act at a distance: a magnet pulls iron across air and through a card, a charged body — light bits of paper, and the Earth pulls everything around — so the weight falls, though nothing pushes it. Such bodies act on each other through a field — magnetic, electric, gravitational. But friction and the elastic force are contact forces: they appear only when bodies touch. The block lifted above the table feels no friction on it; a spring pulls only what is hooked on it. The air passes nothing here: a magnet pulls a clip in a vacuum too.',
    ),
    say: both((l) => (l === 'uk' ? 'Без дотику діяли магніт, гребінець і Земля; тертя без дотику зникло.' : 'Without touching acted the magnet, the comb and the Earth; friction vanished without touching.')),
    text: both((l) => {
      const s = `${R.map((x) => `${tr(touchPlan(x.c), l)} — ${tr(touchSeen(x.c), l)}`).join('; ')}.`;
      return s.charAt(0).toUpperCase() + s.slice(1);
    }),
  };
};
