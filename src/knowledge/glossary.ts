import type { Locale, LocalizedText } from './i18n.js';
import { lawWhen, type LawSpec } from './types.js';

/**
 * Terms explained in a footnote wherever they appear in the lab's texts (explanations, the
 * Professor's lines, reference cards). `stems` match the word in any of its forms: a stem is followed
 * by any letters ("катод" → катода, катоді, катодом, катодний). Definitions are Spark's own short
 * texts; the lab grows — new terms are added here, nothing else changes. Laws are not written here:
 * every law of the lab's knowledge becomes a term by itself (`lawTerms`).
 */
export interface Term {
  readonly id: string;
  readonly name: LocalizedText;
  /**
   * Word stems in each language, matched at a word start; the longest stem wins. A stem starting with «=» is a whole word
   * (no other endings: «=розчин», «=розчину» — not «розчиняти»). «*» inside a stem takes any ending there: «закон* ома» —
   * «закону Ома», «законом Ома».
   */
  readonly stems: { readonly uk: readonly string[]; readonly en: readonly string[] };
  readonly text: LocalizedText;
  /** Made from a law of the lab's knowledge (its id there). */
  readonly law?: string;
}

const t = (id: string, uk: string, en: string, stemsUk: string[], stemsEn: string[], textUk: string, textEn: string): Term => ({ id, name: { uk, en }, stems: { uk: stemsUk, en: stemsEn }, text: { uk: textUk, en: textEn } });

export const GLOSSARY: readonly Term[] = [
  // ---------------------------------------------------------------- electricity and electrochemistry
  t('cathode', 'Катод', 'Cathode', ['катод'], ['cathode'],
    'Електрод, з’єднаний із «мінусом» джерела струму. До нього йдуть позитивні йони (катіони) й забирають електрони: тут відбувається відновлення — виділяється водень або осідає метал.',
    'The electrode joined to the “minus” of the power source. Positive ions (cations) move to it and take electrons: reduction happens here — hydrogen forms or a metal settles.'),
  t('anode', 'Анод', 'Anode', ['анод'], ['anode'],
    'Електрод, з’єднаний із «плюсом» джерела струму. Тут речовина віддає електрони (окиснюється): виділяється хлор чи кисень — або розчиняється сам металевий анод.',
    'The electrode joined to the “plus” of the power source. Here a substance gives up electrons (is oxidised): chlorine or oxygen forms — or a metal anode itself dissolves.'),
  t('electrode', 'Електрод', 'Electrode', ['електрод'], ['electrode'],
    'Провідник (пластинка, стрижень), через який струм входить у рідину або виходить з неї. Електроди бувають інертні (графіт) і розчинні (метал, що сам вступає в реакцію).',
    'A conductor (a plate, a rod) through which current enters or leaves a liquid. Electrodes are inert (graphite) or soluble (a metal that reacts itself).'),
  t('electrolysis', 'Електроліз', 'Electrolysis', ['електроліз'], ['electrolys'],
    'Розкладання речовини електричним струмом: на електродах утворюються нові речовини (гази, метали). Скільки речовини виділиться, визначає закон Фарадея.',
    'Breaking a substance down with an electric current: new substances (gases, metals) form at the electrodes. How much forms is given by Faraday’s law.'),
  t('electrolyte', 'Електроліт', 'Electrolyte', ['електроліт'], ['electrolyte'],
    'Речовина, розчин або розплав якої проводить струм, бо в ній є вільні йони: солі, кислоти, луги. Цукор і спирт — не електроліти.',
    'A substance whose solution or melt conducts current because it holds free ions: salts, acids, alkalis. Sugar and alcohol are not electrolytes.'),
  t('ion', 'Йон', 'Ion', ['йон', 'катіон', 'аніон'], ['ion', 'cation', 'anion'],
    'Атом або група атомів з електричним зарядом: позитивні (катіони, Na⁺, Cu²⁺) і негативні (аніони, Cl⁻, SO₄²⁻). У розчині солі йони вільно рухаються й переносять струм.',
    'An atom or a group of atoms with an electric charge: positive (cations, Na⁺, Cu²⁺) and negative (anions, Cl⁻, SO₄²⁻). In a salt solution ions move freely and carry the current.'),
  t('electrode-potential', 'Електродний потенціал', 'Electrode potential', ['потенціал'], ['potential'],
    'Число у вольтах (E°), яке показує, наскільки легко речовина віддає або забирає електрони. Чим нижчий потенціал металу, тим легше він окиснюється: залізо (−0,44 В) — легше за мідь (+0,34 В).',
    'A number in volts (E°) showing how easily a substance gives up or takes electrons. The lower a metal’s potential, the more easily it is oxidised: iron (−0.44 V) more easily than copper (+0.34 V).'),
  t('voltage', 'Напруга', 'Voltage', ['напруг'], ['voltage'],
    'Те, що «штовхає» заряди по колу; вимірюється у вольтах (В). Що більша напруга при тому самому опорі, то більший струм.',
    'What “pushes” charges round a circuit; measured in volts (V). The higher the voltage at the same resistance, the larger the current.'),
  t('current', 'Сила струму', 'Electric current', ['сила струму', 'струм'], ['current'],
    'Скільки заряду проходить через провідник за секунду; вимірюється в амперах (А). Струм — це впорядкований рух заряджених частинок: електронів у металі, йонів у розчині.',
    'How much charge passes through a conductor per second; measured in amperes (A). Current is an orderly flow of charged particles: electrons in a metal, ions in a solution.'),
  t('resistance', 'Опір', 'Resistance', ['опір', 'опор'], ['resistance'],
    'Як сильно провідник «заважає» струму; вимірюється в омах (Ом). За законом Ома I = U/R.',
    'How strongly a conductor “resists” the current; measured in ohms (Ω). By Ohm’s law I = U/R.'),
  // ---------------------------------------------------------------- heat
  t('specific-heat', 'Питома теплоємність', 'Specific heat capacity', ['питома теплоємн', 'питомої теплоємн', 'теплоємн'], ['specific heat', 'heat capacity'],
    'Скільки теплоти потрібно, щоб нагріти 1 кг речовини на 1 °C. У води вона дуже велика — ≈ 4200 Дж/(кг·°C), тому вода гріється й остигає повільно.',
    'How much heat it takes to warm 1 kg of a substance by 1 °C. Water’s is very large — ≈ 4200 J/(kg·°C), so water warms up and cools down slowly.'),
  t('latent-heat', 'Прихована теплота', 'Latent heat', ['приховану теплот', 'прихована теплот', 'прихованої теплот', 'питома теплота плавлення', 'питома теплота пароутворення'], ['latent heat'],
    'Теплота, яку речовина забирає, коли плавиться чи кипить (і віддає, коли твердне чи конденсується), — а її температура при цьому не змінюється. Звідси «полиця» на графіку.',
    'The heat a substance takes in while it melts or boils (and gives back while it sets or condenses) — its temperature stays the same meanwhile. Hence the flat “shelf” on the graph.'),
  t('thermal-equilibrium', 'Теплова рівновага', 'Thermal equilibrium', ['теплової рівноваг', 'теплова рівноваг', 'тепловий баланс', 'теплового балансу'], ['thermal equilibrium', 'heat balance'],
    'Стан, коли в тіл, що стикаються, температура однакова й теплота більше не переходить. Скільки теплоти віддало гаряче тіло, стільки отримало холодне (рівняння теплового балансу).',
    'The state when touching bodies have the same temperature and heat no longer flows. As much heat as the hot body gave, the cold one took (the heat-balance equation).'),
  t('efficiency', 'ККД', 'Efficiency', ['ККД'], ['efficiency'],
    'Коефіцієнт корисної дії: яка частка затраченої енергії пішла на корисну справу. η = Q/E; завжди менше за 100 %.',
    'How much of the energy spent did the useful job. η = Q/E; always below 100 %.'),
  t('conduction', 'Теплопровідність', 'Thermal conduction', ['теплопровідн'], ['thermal conduct', 'conducts heat'],
    'Передавання теплоти від гарячішої частини тіла до холоднішої без перенесення речовини. Метали проводять теплоту добре, повітря й порцеляна — погано.',
    'Heat passing from the hotter part of a body to the colder one without the substance moving. Metals conduct heat well, air and porcelain poorly.'),
  t('radiation', 'Випромінювання', 'Thermal radiation', ['випроміню'], ['radiat'],
    'Передавання теплоти світлом — і видимим, і невидимим інфрачервоним. Розжарене тіло віддає так більшість теплоти; так Сонце гріє Землю.',
    'Heat carried by light — visible and invisible infrared. A red-hot body loses most of its heat this way; this is how the Sun warms the Earth.'),
  // ---------------------------------------------------------------- states of matter
  t('evaporation', 'Випаровування', 'Evaporation', ['випаровув', 'випарув'], ['evaporat'],
    'Перехід рідини в пару з її поверхні — за будь-якої температури, не лише при кипінні. Що тепліше й що менше пари в повітрі, то швидше.',
    'A liquid turning into vapour from its surface — at any temperature, not only when boiling. The warmer and the drier the air, the faster.'),
  t('boiling', 'Кипіння', 'Boiling', ['кипінн', 'кипить', 'закип'], ['boil'],
    'Пароутворення в усьому об’ємі рідини: усередині з’являються бульбашки пари. Відбувається при температурі кипіння, яка залежить від тиску й від того, що розчинено.',
    'Vapour forming throughout the liquid: bubbles of vapour appear inside. It happens at the boiling point, which depends on the pressure and on what is dissolved.'),
  t('crystallisation', 'Кристалізація', 'Crystallisation', ['кристаліз', 'тверднен', 'тверднуч'], ['crystallis', 'crystalliz'],
    'Перехід рідини в твердий стан, коли частинки вишиковуються в кристалічну ґратку; так само — випадання кристалів із насиченого розчину.',
    'A liquid turning solid as its particles line up into a crystal lattice; also crystals coming out of a saturated solution.'),
  t('eutectic', 'Евтектика', 'Eutectic', ['евтект'], ['eutectic'],
    'Найнижча температура, за якої розчин ще може бути рідким: для солоної води — −21,1 °C. Нижче замерзає все — і вода, і сіль.',
    'The lowest temperature at which a solution can still be liquid: −21.1 °C for salt water. Below it everything sets — both water and salt.'),
  // ---------------------------------------------------------------- solutions
  t('solution', 'Розчин', 'Solution', ['=розчин', '=розчину', '=розчині', '=розчином', '=розчини', '=розчинів', '=розчинах', '=розчинам', '=розчинами'], ['=solution', '=solutions'],
    'Однорідна суміш: одна речовина (розчинена) рівномірно розподілена між частинками іншої (розчинника, найчастіше води). Частинки розчиненої речовини не видно навіть у мікроскоп.',
    'An even mixture: one substance (the solute) spread evenly among the particles of another (the solvent, most often water). The dissolved particles cannot be seen even under a microscope.'),
  t('solubility', 'Розчинність', 'Solubility', ['розчинн'], ['solubil'],
    'Скільки речовини може розчинитися в 100 г води за даної температури. Що більше — випадає кристалами на дно. Розчинність цукру сильно зростає з нагріванням, солі — майже ні.',
    'How much of a substance can dissolve in 100 g of water at a given temperature. Any more falls out as crystals. Sugar’s solubility grows strongly with heat, salt’s hardly at all.'),
  t('heat-of-solution', 'Теплота розчинення', 'Enthalpy of solution', ['теплота розчинення', 'теплоти розчинення', 'теплоту розчинення', 'теплотою розчинення'], ['heat of solution', 'enthalpy of solution'],
    'Теплота, яку речовина поглинає (+) чи виділяє (−), коли розчиняється: Q = n·ΔH. Амоній хлорид (+14,8 кДж/моль) охолоджує воду, натрій гідроксид (−44,5 кДж/моль) — нагріває. Коли речовина кристалізується, теплота повертається.',
    'The heat a substance takes in (+) or gives off (−) as it dissolves: Q = n·ΔH. Ammonium chloride (+14.8 kJ/mol) cools the water, sodium hydroxide (−44.5 kJ/mol) heats it. When the substance crystallises, the heat comes back.'),
  t('supersaturated', 'Пересичений розчин', 'Supersaturated solution', ['пересичен'], ['supersaturat'],
    'Розчин, у якому розчиненої речовини більше, ніж дозволяє розчинність при цій температурі. Буває, коли насичений гарячий розчин обережно охолодили: кристалам нема на чому почати рости. Досить кристалика-затравки — і зайва речовина швидко кристалізується. Трохи пересичуються всі розчини, але речовини зі складною решіткою й густим розчином (натрій ацетат, цукор) — дуже сильно, а мідний купорос чи кухонна сіль — лише трохи.',
    'A solution holding more dissolved substance than its solubility allows at that temperature. It happens when a hot saturated solution is cooled carefully: the crystals have nothing to start growing on. A seed crystal is enough — and the excess quickly crystallises. All solutions supersaturate a little, but substances with a complex lattice and a thick solution (sodium acetate, sugar) do so strongly, copper sulfate or table salt only slightly.'),
  t('mass-fraction', 'Масова частка', 'Mass fraction', ['масова частк', 'масової частк', 'масову частк', 'масовою частк', 'масових часток'], ['mass fraction'],
    'Яку частину маси суміші чи розчину становить речовина: w = m(речовини) / m(розчину). У 50 г розчину з 5 г солі w = 5/50 = 0,1, тобто 10 %. Ділять на масу всього розчину, а не лише води.',
    'What part of the mass of a mixture or solution a substance makes up: w = m(substance) / m(solution). In 50 g of solution with 5 g of salt w = 5/50 = 0.1, that is 10 %. Divide by the mass of the whole solution, not only the water.'),
  t('saturated', 'Насичений розчин', 'Saturated solution', ['насичен'], ['saturat'],
    'Розчин, у якому речовини розчинено стільки, скільки взагалі може розчинитися за цієї температури. Додана понад це речовина вже не розчиняється.',
    'A solution holding as much of a substance as can dissolve at that temperature. Anything added beyond it no longer dissolves.'),
  t('precipitate', 'Осад', 'Precipitate', ['осад'], ['precipitat', 'sludge'],
    'Нерозчинна речовина, що утворилася в розчині під час реакції й випала на дно або каламутить рідину.',
    'An insoluble substance formed in a solution by a reaction; it falls to the bottom or clouds the liquid.'),
  t('distillation', 'Перегонка', 'Distillation', ['перегон', 'дистиляц'], ['distil'],
    'Розділення суміші рідин кип’ятінням: легкокипляча речовина (спирт) переходить у пару першою, її збирають, охолоджуючи пару.',
    'Separating a mixture of liquids by boiling: the lower-boiling substance (alcohol) turns to vapour first and is collected by cooling the vapour.'),
  t('oxidation', 'Окиснення', 'Oxidation', ['окисн', 'окисл'], ['oxidi', 'oxidat'],
    'Реакція, у якій речовина віддає електрони. Іржавіння заліза й розчинення металевого анода — окиснення; протилежне — відновлення.',
    'A reaction in which a substance gives up electrons. Iron rusting and a metal anode dissolving are oxidation; the opposite is reduction.'),
  // ---------------------------------------------------------------- substances
  t('stearic-acid', 'Стеаринова кислота', 'Stearic acid', ['стеарин'], ['stearic'],
    'Жирна кислота C₁₈H₃₆O₂ — біла воскоподібна речовина, з неї роблять свічки й мило. Плавиться при 69,3 °C, а коли твердне, віддає ≈ 215 кДж/кг прихованої теплоти — тому її беруть для графіка охолодження з «полицею».',
    'A fatty acid, C₁₈H₃₆O₂ — a white waxy substance used for candles and soap. It melts at 69.3 °C and gives off ≈ 215 kJ/kg of latent heat as it sets — which is why it is used for a cooling graph with a flat “shelf”.'),
  // ---------------------------------------------------------------- mechanics
  t('density', 'Густина', 'Density', ['густин'], ['density'],
    'Маса одиниці об’єму речовини: ρ = m/V. Тіло густіше за рідину тоне, рідше — спливає.',
    'The mass of a unit volume of a substance: ρ = m/V. A body denser than the liquid sinks, a less dense one floats.'),
  t('buoyancy', 'Архімедова сила', 'Buoyant force', ['архімедов', 'виштовхувальн'], ['buoyan'],
    'Сила, з якою рідина виштовхує занурене тіло вгору; дорівнює вазі витісненої тілом рідини: F_A = ρ·g·V.',
    'The force with which a liquid pushes a submerged body up; it equals the weight of the liquid the body displaces: F_A = ρ·g·V.'),
];

/** A term by its id (`terms` — the lab's whole glossary, laws included). */
export const termById = (id: string, terms: readonly Term[] = GLOSSARY): Term | undefined => terms.find((x) => x.id === id);

// ---------------------------------------------------------------- laws as terms

/** The name as it is said in a sentence: without a qualifier («…: плавлення і кипіння», «… для електролізу»). */
const spokenName = (name: string): string => name.split(/:| для /)[0]!.trim().toLowerCase();

/**
 * Stems a law is found by in a text. Ukrainian: the first word changes («закон» → «закону», «законом»;
 * «рівняння» → «рівнянням»), the rest stays as it is («Ома», «Фарадея», «теплового балансу»). English:
 * «Faraday’s law of electrolysis» is said «Faraday’s law(s)».
 */
export function lawStems(name: LocalizedText): Term['stems'] {
  const uk = spokenName(name.uk).split(/\s+/);
  const first = uk[0]!.replace(/[аеєиіїоуюяьй]+$/u, '');
  const en = spokenName(name.en);
  const possessive = /^(.*?(?:[’']s|s[’']))\s+(law|principle)\b/u.exec(en);
  return { uk: [[`${first}*`, ...uk.slice(1)].join(' ')], en: [possessive ? `${possessive[1]} ${possessive[2]}` : en] };
}

/** «Відкрив Майкл Фарадей (1833–1834).» — from the law's own sourced history. */
function whoFound(law: LawSpec, l: Locale): string {
  const h = law.history;
  const names = h.people.map((p) => p.name[l]);
  if (!names.length) return '';
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} ${l === 'uk' ? 'і' : 'and'} ${names[names.length - 1]}` : names[0]!;
  const date = lawWhen(law, l);
  const when = date !== '—' ? ` (${date})` : '';
  if (h.role === 'associated') return l === 'uk' ? ` Пов’язують з ім${names.length > 1 ? 'енами' : 'ям'}: ${list}${when}.` : ` Associated with ${list}${when}.`;
  return l === 'uk' ? ` ${names.length > 1 ? 'Відкрили' : 'Відкрив'} ${list}${when}.` : ` Discovered by ${list}${when}.`;
}

/** Does the name start with a word some term of `terms` already explains (latent heat, heat balance)? */
function explainedBy(terms: readonly Term[], name: LocalizedText): boolean {
  return (['uk', 'en'] as const).some((l) => {
    const spoken = spokenName(name[l]);
    return terms.some((t) => t.stems[l].some((st) => !st.startsWith('=') && !st.includes('*') && spoken.startsWith(st.toLowerCase())));
  });
}

/**
 * Every law (not a definition or a model) as a glossary term: its name, its school statement and who found
 * it. A law whose name a written term already explains is left to that term.
 */
export function lawTerms(laws: readonly LawSpec[], terms: readonly Term[] = GLOSSARY): Term[] {
  return laws
    .filter((law) => law.kind === 'law' && !explainedBy(terms, law.name))
    .map((law) => ({
      id: `law-${law.id}`,
      law: law.id,
      name: law.name,
      stems: lawStems(law.name),
      text: { uk: law.statement.school.uk + whoFound(law, 'uk'), en: law.statement.school.en + whoFound(law, 'en') },
    }));
}

// ---------------------------------------------------------------- finding terms in a text

export interface TermMatcher {
  /** Every stem at a word start, then any letters (longest first); global, so reset `lastIndex`. */
  readonly re: RegExp;
  /** Which term a matched word is: by the longest stem it fits. */
  termOf(word: string): string | undefined;
}

const escRe = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
const ENDING = "[\\p{L}’'ʼ-]*";
/** A stem as a regular expression: «*» is any ending, a space any spaces, an apostrophe any apostrophe. */
function stemSource(stem: string): string {
  const exact = stem.startsWith('=');
  const body = [...(exact ? stem.slice(1) : stem).replace(/\s+/g, ' ')]
    .map((ch) => (ch === '*' ? ENDING : ch === ' ' ? '\\s+' : /[’'ʼ]/.test(ch) ? "[’'ʼ]" : escRe(ch)))
    .join('');
  return exact ? `${body}(?![\\p{L}])` : `${body}${ENDING}`;
}

/** The matcher for the terms in one language. */
export function termMatcher(terms: readonly Term[], l: Locale): TermMatcher {
  const stems: { id: string; len: number; re: RegExp; src: string }[] = [];
  for (const t of terms)
    for (const s of t.stems[l]) {
      const src = stemSource(s.toLowerCase());
      stems.push({ id: t.id, len: s.replace(/[=*]/g, '').length, re: new RegExp(`^${src}$`, 'iu'), src });
    }
  stems.sort((a, b) => b.len - a.len);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${stems.map((x) => x.src).join('|')})`, 'giu');
  return { re, termOf: (word) => stems.find((x) => x.re.test(word))?.id };
}
