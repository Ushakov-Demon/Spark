import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const preset_coin_inertia: Preset = {
  ask: { uk: 'Чому монета падає в склянку, коли картку різко висмикнути?', en: 'Why does the coin drop into the glass when the card is snatched away?' },
  id: 'coin-inertia',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Інерція: монета на картці', en: 'Inertia: a coin on a card' },
  question: {
    uk: 'Склянку накрито листівкою, на листівці над отвором склянки — монета. Виймаємо листівку вбік чотирма способами: тягнемо повільно й плавно, штовхаємо пальцем, штовхаємо різко й клацаємо по ній. Знімаємо на телефон і за кадрами міряємо, на скільки зсунулася монета, поки листівка виходила з-під неї. Чому монета падає в склянку, коли картку різко висмикнути?',
    en: 'A glass is covered with a postcard, a coin on the card over the glass’s mouth. We take the card out sideways in four ways: draw it slowly and smoothly, push it with a finger, push it sharply and flick it. We film it on a phone and measure by the frames how far the coin moved while the card went from under it. Why does the coin drop into the glass when the card is snatched away?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'coin',
  plan: (['slow', 'push', 'flick', 'snap'] as const).map((pull) => ({ kind: 'bench', command: { type: 'lab.coin', pull } }) as const),
  choices: [ch('inertia', 'Монета зберігає свій стан спокою: картка виходить так швидко, що тертя не встигає зрушити монету', 'The coin keeps its state of rest: the card goes so fast that friction has no time to move the coin'), ch('heavy', 'Монета важча за картку, тому одразу падає вниз', 'The coin is heavier than the card, so it drops straight down'), ch('air', 'Монету притискає до склянки повітря', 'The air presses the coin to the glass')],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження • інерції' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: 'Явище інерції. Інертність і маса тіла', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 15 «Явище інерції»: «Інерція — це явище зберігання швидкості руху тіла за відсутності або скомпенсованості дії на нього інших тіл»' } },
  ],
  expect: 'reached',
};

export const answer_coin_inertia = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.coin' && x.record.value !== null).map((x) => ({ pull: String(x.command['pull']), s: x.record.value!, v: x.record.inputs?.['speed'] ?? 0, t: x.record.inputs?.['time'] ?? 0, slipped: x.record.inputs?.['slipped'] === 1, inGlass: x.record.inputs?.['inGlass'] === 1 }));
  const fastIn = R.filter((x) => x.v >= 1).every((x) => x.inGlass);
  const slowOut = R.some((x) => !x.inGlass);
  const mm = (x: number) => Math.round(x * 1000);
  const where = (x: (typeof R)[number], l: Locale) => (l === 'uk' ? (x.inGlass ? 'монета впала в склянку' : x.slipped ? 'монета вдарилася об край склянки й упала поруч' : 'монета поїхала разом із карткою') : x.inGlass ? 'the coin dropped into the glass' : x.slipped ? 'the coin hit the rim and fell beside' : 'the coin went with the card');
  return {
    ...(fastIn && slowOut ? { correct: 'inertia' } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Інерція — це явище зберігання швидкості руху тіла за відсутності або скомпенсованості дії на нього інших тіл. Монета лежала нерухомо, і щоб вона поїхала, її має розігнати картка — силою тертя. Але тертя слабке й не може розігнати монету швидко. Коли картку тягнуть повільно, тертя встигає: монета їде разом із карткою. Коли картку висмикують, вона виходить з-під монети за соті частки секунди — тертя за цей час ледь зрушує монету, і та, залишившись майже на місці, падає в склянку. Що швидше рух картки, то менше зсувається монета. Так само, коли автобус різко рушає, пасажири відхиляються назад.'
        : 'Inertia is the keeping of a body’s speed when no other bodies act on it, or their actions balance. The coin lay still, and for it to move the card has to speed it up — by friction. But friction is weak and cannot speed the coin up fast. When the card is drawn slowly, friction keeps up: the coin goes with the card. When the card is snatched, it leaves from under the coin in hundredths of a second — in that time friction hardly moves the coin, and it, staying almost where it was, drops into the glass. The faster the card goes, the less the coin moves. In the same way, when a bus starts sharply, the passengers lean back.',
    ),
    say: both((l) => {
      const snap = R.find((x) => x.pull === 'snap');
      return snap ? (l === 'uk' ? `Клацання: картка вийшла за ${sig(snap.t, 2, l)} с, монета зсунулася лише на ${mm(snap.s)} мм — і впала в склянку.` : `The flick: the card went in ${sig(snap.t, 2, l)} s, the coin moved just ${mm(snap.s)} mm — and dropped into the glass.`) : '';
    }),
    text: both((l) => {
      const uk = l === 'uk';
      const how: Record<string, string> = uk ? { slow: 'повільно', push: 'штовхнули (0,5 м/с)', flick: 'різко (1 м/с)', snap: 'клацнули (3 м/с)' } : { slow: 'slowly', push: 'pushed (0.5 m/s)', flick: 'sharply (1 m/s)', snap: 'flicked (3 m/s)' };
      const s = `${R.map((x) => `${how[x.pull] ?? x.pull}: ${uk ? 'зсув' : 'moved'} ${mm(x.s)} ${uk ? 'мм' : 'mm'} — ${where(x, l)}`).map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + (uk ? ' Щоб упасти в склянку, монета мала зсунутися менш ніж на 19 мм.' : ' To drop into the glass, the coin had to move less than 19 mm.');
    }),
  };
};
