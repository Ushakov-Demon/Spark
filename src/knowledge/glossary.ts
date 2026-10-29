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
  /** More about it — shown in the glossary, while a footnote keeps to `text`. */
  readonly more?: LocalizedText;
  /** Where the facts of the text come from (a source of the lab's knowledge): linked under the footnote and in the glossary. */
  readonly source?: string;
  /** A photograph of it (a source too): linked beside the source. */
  readonly photo?: string;
}

const t = (id: string, uk: string, en: string, stemsUk: string[], stemsEn: string[], textUk: string, textEn: string): Term => ({ id, name: { uk, en }, stems: { uk: stemsUk, en: stemsEn }, text: { uk: textUk, en: textEn } });

/** A piece of equipment: a short footnote, and more about it in the glossary. */
const eq = (id: string, uk: string, en: string, stemsUk: string[], stemsEn: string[], textUk: string, textEn: string, moreUk: string, moreEn: string): Term => ({ ...t(id, uk, en, stemsUk, stemsEn, textUk, textEn), more: { uk: moreUk, en: moreEn } });

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
  { ...t('airship', 'Дирижабль', 'Airship', ['дирижабл'], ['airship', 'zeppelin nt'],
    'Керований літальний апарат, легший за повітря: його оболонку наповнюють газом, легшим за повітря, і тримає його архімедова сила; рушії й кермо ведуть його, куди треба. Сучасні дирижаблі, як Zeppelin NT, наповнюють негорючим гелієм; зазвичай вони летять на висоті 300 м.',
    'A steerable aircraft lighter than air: its envelope is filled with a gas lighter than air, and the buoyant force holds it up; engines and rudders take it where it should go. Airships today, like the Zeppelin NT, are filled with non-flammable helium; they usually fly 300 m up.'), source: 'wikipedia-zeppelin-nt' },
  { ...t('pale-blue-dot', '«Блідо-блакитна цятка»', 'Pale Blue Dot', ['блакитна цятка', 'блідо-блакитна цятка', 'pale blue dot'], ['pale blue dot'],
    'Знімок Землі, який зонд «Вояджер-1» зробив 14 лютого 1990 року з відстані понад 6 мільярдів кілометрів — за ідеєю астронома Карла Сагана. Земля на ньому займає 0,12 пікселя: крихітна цятка в промені розсіяного сонячного світла.',
    'The picture of the Earth that the Voyager 1 probe took on 14 February 1990 from over 6 billion kilometres — on the astronomer Carl Sagan’s idea. The Earth fills 0.12 of a pixel in it: a tiny dot in a beam of scattered sunlight.'), source: 'wikipedia-pale-blue-dot', photo: 'nasa-pale-blue-dot-photo' },
  { ...t('hindenburg', '«Гінденбург»', 'The Hindenburg', ['гінденбург'], ['hindenburg'],
    'Пасажирський дирижабль, наповнений воднем. 6 травня 1937 року під час посадки в Лейкгерсті (США) він спалахнув і згорів приблизно за пів хвилини.',
    'A passenger airship filled with hydrogen. On 6 May 1937, landing at Lakehurst (USA), it caught fire and burned in about half a minute.'), source: 'wikipedia-hindenburg-disaster', photo: 'commons-hindenburg-photo' },
  { ...t('led-zeppelin', 'Led Zeppelin', 'Led Zeppelin', ['led zeppelin'], ['led zeppelin'],
    'Рок-гурт. На обкладинці його першого альбому (1969) — малюнок Джорджа Гарді за фотографією палаючого «Гінденбурга», яку зробив Сем Шир 6 травня 1937 року. А сама назва — жарт: «злетить, як свинцевий дирижабль» (lead — свинець).',
    'A rock band. The cover of its first album (1969) is George Hardie’s drawing of Sam Shere’s photograph of the burning Hindenburg, taken on 6 May 1937. The name itself is a joke: “it would go over like a lead balloon”.'), source: 'wikipedia-led-zeppelin-album' },
  t('density', 'Густина', 'Density', ['густин'], ['density'],
    'Маса одиниці об’єму речовини: ρ = m/V. Тіло густіше за рідину тоне, рідше — спливає.',
    'The mass of a unit volume of a substance: ρ = m/V. A body denser than the liquid sinks, a less dense one floats.'),
  t('buoyancy', 'Архімедова сила', 'Buoyant force', ['архімедов', 'виштовхувальн'], ['buoyan'],
    'Сила, з якою рідина виштовхує занурене тіло вгору; дорівнює вазі витісненої тілом рідини: F_A = ρ·g·V.',
    'The force with which a liquid pushes a submerged body up; it equals the weight of the liquid the body displaces: F_A = ρ·g·V.'),
  // ---------------------------------------------------------------- equipment
  eq("resistor", "Резистор", "Resistor", ["резистор"], ["resistor"],
    "Деталь кола зі сталим опором: обмежує струм. На корпусі опір позначають кольоровими смужками або цифрами.",
    "A circuit part with a fixed resistance: it limits the current. Its resistance is marked by coloured bands or figures.",
    "Найпростіший резистор — дріт зі сплаву з великим питомим опором (ніхром, константан), намотаний на керамічну основу; у сучасній електроніці — тонка плівка вуглецю чи металу на керамічному циліндрику. Опір вимірюють в омах (Ом). Через резистор, як і через будь-який провідник, струм проходить за законом Ома: I = U / R. Струм нагріває резистор (закон Джоуля — Ленца), тому для кожного вказують ще й найбільшу потужність, яку він витримує. Кольорові смужки читають зліва направо: перші цифри опору, потім множник і точність.",
    "The simplest resistor is a wire of an alloy with a high resistivity (nichrome, constantan) wound on a ceramic core; in modern electronics — a thin film of carbon or metal on a ceramic cylinder. Resistance is measured in ohms (Ω). Current goes through a resistor, as through any conductor, by Ohm’s law: I = U / R. The current warms it (Joule–Lenz), so each is also rated for the most power it can take. The coloured bands are read left to right: the first digits of the resistance, then a multiplier and the tolerance."),
  eq("rheostat", "Реостат", "Rheostat", ["реостат"], ["rheostat"],
    "Резистор, опір якого можна плавно змінювати повзунком, — щоб регулювати силу струму в колі.",
    "A resistor whose resistance can be changed smoothly with a slider — to adjust the current in a circuit.",
    "Шкільний повзунковий реостат — дріт, намотаний на керамічну трубу; повзунок ковзає по витках і вмикає в коло більшу чи меншу їх частину. Що довша увімкнена частина дроту, то більший опір і менший струм. Реостатом регулюють яскравість лампи чи швидкість двигуна; вмикають його послідовно з приладом.",
    "A school slide rheostat is a wire wound on a ceramic tube; a slider moves over the turns and puts more or fewer of them into the circuit. The longer the part of the wire in use, the higher the resistance and the smaller the current. A rheostat sets a lamp’s brightness or a motor’s speed; it is connected in series with the device."),
  eq("ammeter", "Амперметр", "Ammeter", ["амперметр"], ["ammeter"],
    "Прилад для вимірювання сили струму. Вмикають послідовно — так, щоб через нього йшов увесь струм, який вимірюють.",
    "An instrument that measures current. It is connected in series — so that all the current being measured goes through it.",
    "Амперметр має дуже малий власний опір, щоб майже не змінювати струм у колі; тому його ніколи не вмикають безпосередньо до джерела без навантаження — струм буде величезним і прилад зіпсується. На шкалі є найбільше значення (межа вимірювання) і ціна поділки — від неї залежить, наскільки точно можна прочитати покази. Затискачі позначені «+» і «−»: «+» з’єднують із плюсом джерела. Шкільні прилади цієї лабораторії: межа 2 А, ціна поділки 0,05 А (оцінка).",
    "An ammeter has a very small resistance of its own, so as to barely change the current; that is why it is never connected straight to a source with nothing else — the current would be huge and spoil it. Its scale has a largest value (the range) and a division — which sets how precisely it can be read. Its terminals are marked “+” and “−”: “+” goes to the source’s plus. The school instruments of this lab: a 2 A range, 0.05 A per division (an estimate)."),
  eq("voltmeter", "Вольтметр", "Voltmeter", ["вольтметр"], ["voltmeter"],
    "Прилад для вимірювання напруги. Вмикають паралельно до тієї ділянки кола, напругу на якій вимірюють.",
    "An instrument that measures voltage. It is connected in parallel with the part of the circuit whose voltage is measured.",
    "Вольтметр має дуже великий власний опір, тож крізь нього йде мізерний струм і він майже не змінює коло. Його затискачі приєднують до двох кінців ділянки — наприклад, резистора; «+» — ближче до плюса джерела. Як і в амперметра, на шкалі є межа вимірювання й ціна поділки. Шкільні прилади цієї лабораторії: межа 6 В, ціна поділки 0,2 В (оцінка).",
    "A voltmeter has a very large resistance of its own, so a tiny current goes through it and it barely changes the circuit. Its terminals go to the two ends of the part — a resistor, for example; “+” nearer the source’s plus. Like an ammeter, its scale has a range and a division. The school instruments of this lab: a 6 V range, 0.2 V per division (an estimate)."),
  eq("power-source", "Джерело струму", "Power source", ["джерел* струм", "блок* живлення"], ["power source", "power supply"],
    "Пристрій, що підтримує напругу між своїми полюсами і змушує заряди рухатися по колу: батарейка, акумулятор, блок живлення.",
    "A device that keeps a voltage between its terminals and makes charges move round a circuit: a battery, an accumulator, a power supply.",
    "Усередині джерела сторонні сили — хімічні в батарейці, електричні в блоці живлення від мережі — розділяють заряди: на одному полюсі «плюс», на другому «мінус». Замкнеш коло — і заряди підуть від полюса до полюса через прилади. Лабораторний блок живлення дає безпечну низьку напругу, яку можна встановити ручкою. Джерело має й власний (внутрішній) опір, тож під навантаженням напруга на його полюсах трохи менша.",
    "Inside a source, outside forces — chemical in a battery, electric in a mains power supply — separate charges: “plus” at one terminal, “minus” at the other. Close the circuit and the charges go from terminal to terminal through the devices. A lab power supply gives a safe low voltage set with a knob. A source also has a resistance of its own (internal), so under load the voltage at its terminals is a little lower."),
  eq("switch", "Ключ (вимикач)", "Switch (key)", ["=ключ", "вимикач"], ["switch"],
    "Деталь, що замикає або розмикає коло. Замкнутий ключ — струм іде, розімкнутий — струму немає.",
    "A part that closes or opens a circuit. Closed — the current flows; open — there is no current.",
    "У шкільних колах ключ — металева пластинка-важілець на ізолювальній основі: опущена, вона з’єднує два затискачі. Коло збирають при розімкнутому ключі й замикають його лише тоді, коли все перевірено, — це правило безпеки. Вимикач у кімнаті — той самий ключ, тільки в корпусі.",
    "In school circuits the key is a small metal lever on an insulating base: pressed down, it joins two terminals. A circuit is built with the key open, and it is closed only once everything is checked — a safety rule. The light switch in a room is the same key in a case."),
  eq("multimeter", "Мультиметр", "Multimeter", ["мультиметр"], ["multimeter"],
    "Прилад «усе в одному»: перемикачем обирають, що міряти, — напругу, силу струму чи опір.",
    "An “all-in-one” instrument: a dial chooses what to measure — voltage, current or resistance.",
    "Цифровий мультиметр у режимі «Ω» сам пропускає крізь провідник маленький відомий струм і ділить напругу на ньому на цей струм — показує опір R = U / I. Діапазон обирають з запасом: на «200 Ω» прилад показує до 200 Ом із сотими. Опір вимірюють лише у знеструмленому колі: власне джерело приладу заважатиме.",
    "A digital multimeter set to “Ω” passes a small known current through the conductor itself and divides the voltage across it by that current — it shows the resistance R = U / I. The range is chosen with room to spare: on “200 Ω” it reads up to 200 Ω in hundredths. Resistance is measured only in a circuit with no power on: another source would spoil the reading."),
  eq("diode", "Діод", "Diode", ["діод"], ["diode"],
    "Деталь, що пропускає струм лише в один бік — як клапан для струму.",
    "A part that lets current through in one direction only — like a valve for current.",
    "Сучасний діод — кристал напівпровідника (кремнію), дві частини якого мають різну провідність: на межі між ними утворюється шар, що пропускає заряди лише в одному напрямку. Увімкнений «у прямому напрямку», діод має малий опір, «у зворотному» — величезний. Діоди перетворюють змінний струм на постійний (у зарядних пристроях), а світлодіоди ще й світяться, коли через них іде струм.",
    "A modern diode is a crystal of a semiconductor (silicon) whose two parts conduct differently: a layer forms at the boundary that lets charges through one way only. Connected “forward”, a diode has a small resistance; “in reverse”, a huge one. Diodes turn alternating current into direct (in chargers), and light-emitting diodes also glow when current goes through them."),
  eq("transistor", "Транзистор", "Transistor", ["транзистор"], ["transistor"],
    "Напівпровідникова деталь, у якій малий струм чи напруга керує великим струмом: підсилювач і перемикач.",
    "A semiconductor part in which a small current or voltage controls a large current: an amplifier and a switch.",
    "Транзистор має три виводи: через два йде основний струм, а третій керує ним — як кран, що відкривається слабким дотиком. Так транзистор підсилює слабкі сигнали (у навушниках, радіо) і вмикає та вимикає струм мільярди разів за секунду. Сучасний процесор — це мільярди мікроскопічних транзисторів на одному кристалі кремнію.",
    "A transistor has three leads: the main current flows through two, and the third controls it — like a tap opened by a light touch. So a transistor amplifies weak signals (in headphones, radios) and switches current on and off billions of times a second. A modern processor is billions of tiny transistors on one silicon chip."),
  eq("dynamometer", "Динамометр", "Dynamometer", ["динамометр"], ["dynamometer", "spring balance"],
    "Прилад для вимірювання сили: пружина, що розтягується тим більше, чим більша сила, і шкала в ньютонах.",
    "An instrument that measures force: a spring that stretches the more, the larger the force, and a scale in newtons.",
    "Динамометр працює за законом Гука: видовження пружини пропорційне силі, тож шкалу можна розмітити рівномірно. Підвісивши тіло, ним вимірюють вагу; тягнучи брусок рівномірно — силу тертя. Перед вимірюванням стрілку ставлять на нуль, а дивляться на шкалу прямо, щоб не помилитися. Шкільний динамометр цієї лабораторії: до 5 Н, ціна поділки 0,1 Н.",
    "A dynamometer works by Hooke’s law: the spring’s extension is proportional to the force, so the scale can be marked evenly. Hanging a body on it measures its weight; pulling a block steadily — the friction. Before measuring the pointer is set to zero, and the scale is read straight on. The school dynamometer of this lab: up to 5 N, 0.1 N per division."),
  eq("measuring-cylinder", "Мензурка (мірний циліндр)", "Measuring cylinder", ["мензурк", "мірн* циліндр"], ["measuring cylinder", "graduated cylinder"],
    "Скляна посудина з поділками для вимірювання об’єму рідини — а ще об’єму тіла, зануреного в неї.",
    "A glass vessel with marks for measuring the volume of a liquid — and of a body put into it.",
    "Рівень читають по нижньому краю меніска (увігнутої поверхні води), тримаючи очі на його висоті. Об’єм тіла неправильної форми — різниця рівнів до й після занурення: V = V₂ − V₁. Перед вимірюванням визначають ціну поділки: різницю двох підписаних позначок ділять на кількість поділок між ними. Мензурку не нагрівають.",
    "The level is read at the bottom of the meniscus (the curved water surface), with the eyes at its height. The volume of an odd-shaped body is the difference of the levels before and after: V = V₂ − V₁. Before measuring, find the division: the difference of two labelled marks over the number of divisions between them. A cylinder is never heated."),
  eq("calorimeter", "Калориметр", "Calorimeter", ["калориметр"], ["calorimeter"],
    "Посудина, що майже не обмінюється теплотою з повітрям, — для дослідів із тепловим балансом.",
    "A vessel that hardly exchanges heat with the air — for heat-balance experiments.",
    "Шкільний калориметр — дві металеві склянки, вставлені одна в одну з повітряним проміжком і ізолювальною підставкою: повітря погано проводить теплоту, тож те, що всередині, довго зберігає температуру. Завдяки цьому теплота, віддана одним тілом, майже вся дістається іншому, і з рівняння теплового балансу можна знайти теплоємність чи теплоту плавлення.",
    "A school calorimeter is two metal cups one inside the other with an air gap and an insulating stand: air conducts heat poorly, so what is inside keeps its temperature for long. Thanks to that, the heat given by one body almost all goes to another, and the heat balance gives a specific heat or a latent heat."),
  eq("stopwatch", "Секундомір", "Stopwatch", ["секундомір"], ["stopwatch"],
    "Прилад для вимірювання проміжків часу: вмикають на початку руху, зупиняють наприкінці.",
    "An instrument for measuring time intervals: started at the beginning of a motion, stopped at its end.",
    "Електронний секундомір (зокрема в телефоні) показує соті частки секунди, але людина вмикає й зупиняє його із запізненням близько 0,1–0,2 с. Тому короткі проміжки міряють за багатьма повтореннями — наприклад, час 20 коливань маятника, — і ділять на їхнє число: похибка руки ділиться теж.",
    "An electronic stopwatch (in a phone too) shows hundredths of a second, but a person starts and stops it about 0.1–0.2 s late. So short intervals are timed over many repeats — say, 20 swings of a pendulum — and divided by their number: the hand’s error is divided too."),
  eq("stand", "Штатив", "Lab stand", ["штатив"], ["lab stand", "retort stand"],
    "Підставка з вертикальним стрижнем, до якого кріплять лапки, кільця й муфти — щоб тримати прилади на потрібній висоті.",
    "A base with an upright rod to which clamps, rings and bosses are fixed — to hold apparatus at the right height.",
    "Важка основа не дає штативу перекинутися, а муфта дозволяє закріпити лапку чи кільце на будь-якій висоті. На штативі підвішують пружину й маятник, закріплюють жолоб, пробірку над спиртівкою чи кінець похилої дошки.",
    "A heavy base keeps the stand from tipping over, and a boss lets a clamp or a ring be fixed at any height. A spring and a pendulum hang from it; a groove, a test tube over a spirit lamp or the end of a sloping board are clamped to it."),
  eq("lever-balance", "Важільні терези", "Lever balance", ["важільн* терез"], ["lever balance", "beam balance"],
    "Терези з коромислом на осі й двома шальками: тіло зрівноважують набором важків.",
    "A balance with a beam on an axis and two pans: a body is balanced with a set of weights.",
    "Це рівноплечий важіль: коли маси на шальках однакові, коромисло стоїть рівно. Тіло кладуть на ліву шальку, важки пінцетом — на праву, від більших до менших; маса тіла — сума важків. Терези порівнюють маси, тому показали б те саме й на Місяці. Найменший важок набору задає точність зважування.",
    "It is an equal-armed lever: when the masses on the pans are equal, the beam is level. The body goes on the left pan, the weights with tweezers on the right, from larger to smaller; the body’s mass is the sum of the weights. A balance compares masses, so it would show the same on the Moon. The smallest weight of the set sets the precision."),
  eq("thermometer", "Термометр", "Thermometer", ["термометр"], ["thermometer"],
    "Прилад для вимірювання температури.",
    "An instrument that measures temperature.",
    "Рідинний термометр — тонка скляна трубка з рідиною (спиртом, раніше ртуттю), що розширюється під час нагрівання і піднімається по шкалі. Щоб показати температуру тіла, термометр має з ним зрівнятися температурою — тому його тримають у воді, поки стовпчик не перестане рухатися. Спиртові термометри годяться й для сильного морозу: спирт замерзає лише при −114 °C.",
    "A liquid thermometer is a thin glass tube with a liquid (alcohol, mercury in the past) that expands when warmed and climbs the scale. To show a body’s temperature, the thermometer must come to the same temperature — so it is held in the water until the column stops. Alcohol thermometers work in hard frost too: alcohol freezes only at −114 °C."),
  eq("test-tube", "Пробірка", "Test tube", ["пробірк"], ["test tube"],
    "Вузька скляна трубка, закрита з одного кінця, — для дослідів із малими кількостями речовин.",
    "A narrow glass tube closed at one end — for experiments with small amounts of substances.",
    "Пробірки роблять з термостійкого (боросилікатного) скла, тож їх можна нагрівати над полум’ям, тримаючи тримачем і повернувши отвором від себе й інших. Закрита корком, пробірка стає герметичним тілом сталого об’єму — у досліді з плаванням у неї насипають пісок, змінюючи масу.",
    "Test tubes are made of heat-resistant (borosilicate) glass, so they can be heated over a flame, held in a holder with the mouth turned away from everyone. Stoppered, a tube becomes a sealed body of fixed volume — in the floating experiment sand is poured in to change its mass."),
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
