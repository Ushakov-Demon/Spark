/**
 * "About the project": who it is for, why, how it works, safety, the disclaimer, licences,
 * privacy and the developer — and "Found a mistake?", a report the user sends themselves.
 * Ukrainian first, then English. Opened from the header and the footer, or by the link #about.
 */
import type { Locale } from '../src/knowledge/i18n.js';

export const DEVELOPER = { name: 'Baza Developers', url: 'https://bazadevelopers.com/', company: 'Baza Production', companyUrl: 'https://bazaproduction.com/' } as const;
/** Where reports go: a new issue in the project's repository (the user needs a GitHub account). */
export const REPORT_URL = 'https://github.com/Ushakov-Demon/Spark/issues/new';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const link = (href: string, text: string) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;

/** The short safety line under the lab (also at the top of the "About" page). */
export const SAFETY_LINE: Record<Locale, string> = {
  uk: 'Повторення дослідів у реальних умовах може бути небезпечним для здоров’я і життя.',
  en: 'Repeating the experiments in real life can be dangerous to health and life.',
};

export const ABOUT_UI: Record<Locale, { about: string; bug: string; close: string; madeBy: string }> = {
  uk: { about: 'Про проєкт', bug: 'Знайшов помилку', close: 'Закрити', madeBy: 'Розроблено' },
  en: { about: 'About', bug: 'Found a mistake', close: 'Close', madeBy: 'Developed by' },
};

/** When the page's text was last brought up to date (change it with the text). */
export const ABOUT_UPDATED = '2026-10-29';
const updated = (l: Locale) => new Intl.DateTimeFormat(l === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ABOUT_UPDATED));

/** The page's first paragraph (also its description for search engines and link previews). */
export const ABOUT_INTRO: Record<Locale, string> = {
  uk: 'Тут можна поставити дослід і побачити, що відбувається і чому, — зі справжніми числами й формулами. Нагрівати й заморожувати, зважувати й міряти, котити кульки й розтягувати пружини, пропускати струм і вмикати електромагніт — у готових дослідах за шкільною програмою або в пісочниці, де дослід складаєш сам. Це лише початок.',
  en: 'An experiment you can do here — and see what happens and why, with real numbers and formulas. Heat and freeze, weigh and measure, roll balls and stretch springs, pass a current and switch on an electromagnet — in ready-made experiments that follow the school curriculum, or in the sandbox, where you build the experiment yourself. This is only the beginning.',
};

export function aboutHtml(l: Locale): string {
  const dev = link(DEVELOPER.url, DEVELOPER.name);
  const company = link(DEVELOPER.companyUrl, DEVELOPER.company);
  if (l === 'en') {
    return `<article class="about">
      <h2>Spark — a virtual science lab</h2>
      <p class="about-lead">${esc(ABOUT_INTRO.en)}</p>
      <div class="about-warning" role="note"><strong>⚠ ${esc(SAFETY_LINE.en)}</strong> Do not repeat them on your own: real experiments only under the supervision of a teacher, in a laboratory, with protective equipment and safety rules.</div>

      <h3>Who it is for</h3>
      <p>Mainly school students, above all in the upper grades. Also teachers, parents and anyone curious.</p>

      <h3>Why</h3>
      <ul>
        <li>To make the natural sciences popular among young people.</li>
        <li>To help get over the fear of physics and chemistry (“it is hard”, “it is not for me”) — through easy, clear examples in a playful form.</li>
        <li>To help learn the school curriculum (the ready-made experiments follow the Ukrainian programme by grade) — and to go beyond it.</li>
        <li>To let everyone use instruments and substances most schools and homes do not have — for example, a muffle furnace, laboratory balances, a power supply, a calorimeter.</li>
      </ul>

      <h3>How it works</h3>
      <p>Every experiment is computed by a model of the phenomena themselves (today: heat flow and changes of state, dissolving, mechanics — motion, forces, pressure, simple machines, energy — electric current and magnetism) — not drawn from a script. Every number comes with its source (press “i” next to an item); values we could only estimate are marked “estimate”. The model is simplified — for example, a body has one temperature throughout — so results are approximate, though they follow the same laws as reality.</p>

      <h3>Free, for everyone, for good</h3>
      <p>Spark is a social project. Everything in it is free and will stay free: no paid features, materials or options, no limits, no advertising. Nobody here will ever ask a student for money.</p>

      <h3>Spark is growing</h3>
      <p>What is here now is a start. Physics: grade 7 — all five topics of the programme (measuring, motion, forces, pressure, work and energy); grade 8 — heat and electricity; grade 9 — current in different media, magnetism and electromagnetic induction. Chemistry: grade 8 shares experiments with physics (salt on winter roads, electrolysis), grade 9 begins with solutions. And experiments beyond the programme — a model of the Solar System to scale, the calendars that drift, a root that knows which way is down.</p>
      <p>Around the experiments: the sandbox, where you put together your own; the reference book of terms and substances; the record of each experiment (one from the sandbox you can save and replay step by step); the board, where every reading is written down, as in a notebook; and the Professor's newspaper.</p>
      <p>Every new topic is built the same way — from sourced data and the laws behind it — and the lab keeps growing: next come the rest of grades 7–9, optics, more chemistry and new branches of physics, with new substances and instruments. The experiments you see are examples of what the lab can do, not its limits.</p>

      <h3>Safety</h3>
      <p>Spark is a virtual laboratory. Many of its experiments are dangerous in reality: burns from boiling water, hot oil and molten metal, electric shock, poisonous gases (chlorine in electrolysis), fire. In the lab you can do what must never be done at home. <strong>Never use mains voltage (230 V)</strong>, never heat flammable liquids over an open flame, never point a heated test tube at anyone.</p>

      <h3>Disclaimer</h3>
      <p>The materials are provided “as is” for educational purposes. We work to keep data and explanations accurate and cite our sources, but we do not guarantee that they are free of errors, complete or fit for any particular purpose. The results of the model are approximate and must not be used as the basis for real experiments, calculations or decisions. The developers accept no liability for any harm to health, property or other damage arising from the use of these materials or from attempts to repeat the experiments. Spark does not replace lessons, textbooks or safety instructions.</p>

      <h3>Licences and sources</h3>
      <p>Code — MIT License. Texts written for Spark — CC BY-SA 4.0. Data come from open sources (NIST, Wikipedia, Wikidata, OpenStax, handbooks, device data sheets) and keep their licences; each value names its source. Newspaper articles are taken live from Wikipedia (CC BY-SA 4.0), with the article named. The blackboard font is Caveat (SIL Open Font License 1.1).</p>

      <h3>Privacy</h3>
      <p>Spark has no sign-up, no advertising and no analytics, and collects no personal data. Your settings (language, level, voice, sound) and saved experiments are kept only in your browser and disappear when you clear the site’s data. The newspaper loads articles from Wikipedia, Wikidata and Wikimedia, so your browser contacts their servers. The Professor’s voice uses your browser’s voices; some browsers process speech on their own servers. A mistake report is sent by you yourself and contains only what you see in it.</p>

      <h3>Developer</h3>
      <p>Spark is developed by ${dev}, the technical department of the Slovak company ${company}. A non-commercial social project.</p>
      <p class="muted small">Text updated: ${updated('en')}</p>
    </article>`;
  }
  return `<article class="about">
    <h2>Spark — віртуальна лабораторія природничих наук</h2>
    <p class="about-lead">${esc(ABOUT_INTRO.uk)}</p>
    <div class="about-warning" role="note"><strong>⚠ ${esc(SAFETY_LINE.uk)}</strong> Не повторюй їх самостійно: справжні досліди — лише під наглядом учителя, у лабораторії, із засобами захисту й за правилами техніки безпеки.</div>

    <h3>Для кого</h3>
    <p>Насамперед для учнів школи, особливо старших класів. А ще для вчителів, батьків і всіх, кому цікаво.</p>

    <h3>Мета</h3>
    <ul>
      <li>Популяризувати природничі науки серед молоді.</li>
      <li>Допомогти подолати страх перед фізикою й хімією («це складно», «це не для мене») — на легких, зрозумілих прикладах в ігровій формі.</li>
      <li>Допомогти засвоїти шкільну програму (готові досліди відповідають програмі за класами) — і вийти за її межі.</li>
      <li>Дати кожному змогу працювати з приладами й речовинами, яких немає в більшості шкіл і вдома, — наприклад, з муфельною піччю, лабораторними вагами, блоком живлення, калориметром.</li>
    </ul>

    <h3>Як це працює</h3>
    <p>Кожен дослід рахує модель самих явищ (сьогодні це теплообмін і зміни агрегатного стану, розчинення, механіка — рух, сили, тиск, прості механізми, енергія, — електричний струм і магнітні явища), а не заздалегідь написаний сценарій. Кожне число має джерело (натисни «i» біля предмета); те, що вдалося лише оцінити, позначено «оцінка». Модель спрощена — наприклад, у кожного тіла одна температура на все тіло, — тож результати наближені, хоча підкоряються тим самим законам, що й у житті.</p>

    <h3>Безкоштовно, для всіх, назавжди</h3>
    <p>Spark — соціальний проєкт. Усе в ньому безкоштовне й таким залишиться: жодних платних функцій, матеріалів чи можливостей, жодних обмежень і реклами. Ніхто тут ніколи не проситиме в учня грошей.</p>

    <h3>Spark росте</h3>
    <p>Те, що є зараз, — лише початок. Фізика: 7 клас — усі п’ять тем програми (вимірювання, механічний рух, взаємодія тіл і сили, тиск, робота й енергія); 8 клас — теплові та електричні явища; 9 клас — струм у різних середовищах, магнітні явища й електромагнітна індукція. Хімія: у 8 класі — спільні з фізикою досліди (сіль на зимових дорогах, електроліз), у 9-му — розчини. А ще досліди поза програмою — модель Сонячної системи в масштабі, календарі, що збиваються з ліку, корінь, який знає, де низ.</p>
    <p>Навколо дослідів: пісочниця, де дослід складаєш сам; довідник термінів і речовин; протокол кожного досліду (дослід із пісочниці можна зберегти й повторити крок за кроком); дошка, на яку записується кожне показання, як у зошиті; газета Професора.</p>
    <p>Кожна нова тема будується так само — з даних із джерелами й законів, що за ними стоять, — і лабораторія росте далі: попереду решта програми 7–9 класів, оптика, більше хімії й нові розділи фізики, нові речовини й прилади. Досліди, які ти бачиш, — приклади того, що вміє лабораторія, а не її межі.</p>

    <h3>Безпека</h3>
    <p>Spark — віртуальна лабораторія. Багато її дослідів у реальності небезпечні: опіки окропом, розпеченою олією й розплавленим металом, ураження струмом, отруйні гази (хлор під час електролізу), пожежа. У лабораторії можна те, чого ніколи не можна робити вдома. <strong>Ніколи не використовуй мережеву напругу 230 В</strong>, не грій горючі рідини на відкритому вогні, не спрямовуй нагріту пробірку на людей.</p>

    <h3>Відмова від відповідальності</h3>
    <p>Матеріали надано «як є» з навчальною метою. Ми стараємося, щоб дані й пояснення були точними, і вказуємо джерела, проте не гарантуємо відсутності помилок, повноти чи придатності для будь-якої конкретної мети. Результати моделі наближені й не можуть бути основою для реальних дослідів, розрахунків чи рішень. Розробники не несуть відповідальності за будь-яку шкоду здоров’ю, майну чи іншу шкоду, що виникла внаслідок використання матеріалів або спроб повторити досліди. Spark не замінює уроків, підручників та інструктажу з техніки безпеки.</p>

    <h3>Ліцензії та джерела</h3>
    <p>Код — ліцензія MIT. Тексти, написані для Spark, — CC BY-SA 4.0. Дані — з відкритих джерел (NIST, Вікіпедія, Wikidata, OpenStax, довідники, паспорти приладів) і зберігають їхні ліцензії; кожне значення вказує своє джерело. Статті «Наукового вісника» завантажуються з Вікіпедії (CC BY-SA 4.0) із зазначенням статті. Шрифт дошки — Caveat (SIL Open Font License 1.1).</p>

    <h3>Конфіденційність</h3>
    <p>У Spark немає реєстрації, реклами й аналітики; персональних даних ми не збираємо. Налаштування (мова, рівень, голос, звук) і збережені досліди зберігаються лише у твоєму браузері й зникають, якщо очистити дані сайту. «Науковий вісник» завантажує статті з Вікіпедії, Wikidata та Wikimedia — для цього браузер звертається до їхніх серверів. Голос Професора — це голоси твого браузера; деякі браузери обробляють мовлення на своїх серверах. Повідомлення про помилку надсилаєш ти сам, і в ньому лише те, що ти бачиш.</p>

    <h3>Розробник</h3>
    <p>Spark розробляє ${dev} — технічний відділ словацької компанії ${company}. Некомерційний соціальний проєкт.</p>
    <p class="muted small">Текст оновлено: ${updated('uk')}</p>
  </article>`;
}

/** "Found a mistake?": what to write, and what is added by itself (shown in full before sending). */
export const BUG_TEXT: Record<Locale, { title: string; intro: string; placeholder: string; attach: string; send: string; copy: string; copied: string; note: string; empty: string }> = {
  uk: {
    title: 'Знайшов помилку?',
    intro: 'Дякуємо! Опиши, що сталося: що ти робив, що побачив і що очікував побачити. Неправильне число, дивна поведінка, помилка в тексті — усе важливо.',
    placeholder: 'Наприклад: налив 100 г води на сіль, а вона не розчинилася…',
    attach: 'Додати опис досліду (налаштування й кроки — без жодних особистих даних)',
    send: 'Надіслати через GitHub',
    copy: 'Скопіювати текст',
    copied: 'Скопійовано ✓',
    note: 'Для GitHub потрібен акаунт. Якщо його немає — скопіюй текст і передай учителю або розробникам.',
    empty: 'Спершу опиши, що сталося.',
  },
  en: {
    title: 'Found a mistake?',
    intro: 'Thank you! Describe what happened: what you did, what you saw and what you expected. A wrong number, odd behaviour, a typo — everything matters.',
    placeholder: 'For example: I poured 100 g of water onto salt and it did not dissolve…',
    attach: 'Attach the experiment (setup and steps — no personal data)',
    send: 'Send via GitHub',
    copy: 'Copy the text',
    copied: 'Copied ✓',
    note: 'GitHub needs an account. If you have none, copy the text and pass it to your teacher or to the developers.',
    empty: 'First describe what happened.',
  },
};

/** The report: the user's words, then (if allowed) the experiment as plain text. */
export function bugReport(what: string, context: string | null): { title: string; body: string } {
  const first = what.trim().split('\n')[0]!.slice(0, 70);
  return { title: `[Помилка] ${first}`, body: `${what.trim()}\n${context ? `\n---\n${context}\n` : ''}` };
}

export const bugUrl = (r: { title: string; body: string }) =>
  `${REPORT_URL}?title=${encodeURIComponent(r.title)}&body=${encodeURIComponent(r.body.slice(0, 6000))}&labels=bug`;
