## hydrostatic-paradox
hydrostatic-paradox-vessel-command-apply = Посудини заввишки 12 см: воду наливають не вище.
hydrostatic-paradox-name-straight = пряму (циліндр)
hydrostatic-paradox-name-wide = ту, що розширюється догори
hydrostatic-paradox-name-narrow = ту, що звужується догори
hydrostatic-paradox-short-straight = пряма
hydrostatic-paradox-short-wide = розширюється
hydrostatic-paradox-short-narrow = звужується
hydrostatic-paradox-labvessel-say = Виміряй лінійкою діаметр дна — він однаковий в усіх трьох посудин.
hydrostatic-paradox-labvessel-button = 📏 Виміряти дно
hydrostatic-paradox-labvessel-plan = виміряти діаметр дна
hydrostatic-paradox-labvessel-say-2 = Закрути на підставку { $NAME } посудину й налий із мензурки води до висоти { $cm } см. Скільки води пішло і що показує манометр?
hydrostatic-paradox-labvessel-button-2 = 🫙 { $SHORT }{ $SHORT2 }: налити до { $cm } см
hydrostatic-paradox-ask = У якій посудині вода тисне на дно найсильніше?
hydrostatic-paradox-title = Гідростатичний парадокс: прилад Паскаля
hydrostatic-paradox-choices = Однаково в усіх трьох
hydrostatic-paradox-choices-2 = Найсильніше — у тій, що розширюється догори
hydrostatic-paradox-choices-3 = Найсильніше — у тій, що звужується догори
hydrostatic-paradox-height-label = Висота води в посудинах
hydrostatic-paradox-build-question = Прилад Паскаля: на підставку, дно якої — гумова плівка з трубкою до манометра, по черзі закручують три скляні посудини: пряму, ту, що розширюється догори, і ту, що звужується. Дно в усіх однакове — виміряємо його. У кожну наллємо з мензурки води до висоти { $cm } см, запишемо, скільки води пішло, і що показує манометр. У якій посудині вода тисне на дно найсильніше?
hydrostatic-paradox-answer-list = { $shape }: води { $V } (вага ≈ { $P }), манометр { $value }
hydrostatic-paradox-answer-why = Тиск рідини на якійсь глибині створює вага стовпчика рідини над цим місцем, p = ρ·g·h, — і він однаковий на тій самій глибині, хоч би якою широкою чи вузькою була посудина вище. На дні глибина однакова — отже, однаковий і тиск, і сила тиску на однакове дно. А куди ж дівається решта ваги води в широкій посудині? Її тримають похилі стінки: вода тисне на них, і вони — на підставку. У вузькій навпаки: похилі стінки самі тиснуть на воду вниз, тож на дно припадає більше, ніж важить вода.
hydrostatic-paradox-answer-say = Манометр щоразу показував те саме — на дно тисне ≈ { $F }, хоч води й різна кількість!
hydrostatic-paradox-answer-say-2 = Подивімося, що показав манометр.
hydrostatic-paradox-answer-text = {" "}однаковий
hydrostatic-paradox-answer-text-2 = {" "}в усіх трьох
hydrostatic-paradox-answer-text-3 = Дно { $value } у діаметрі, площа S ≈ { $S } см². { $l }. Тиск на дні p = ρ·g·Δh{ $value2 }, а сила тиску на дно F = p·S ≈ { $F }{ $value3 }. Води ж пішло в кілька разів різна кількість: у посудині, що розширюється, вода важить більше, ніж тисне на дно, а в тій, що звужується, — менше. Тиск на дно залежить від висоти води й площі дна, а не від форми посудини й не від того, скільки води налито, — це й є гідростатичний парадокс.
hydrostatic-paradox-setup = Прилад Паскаля: підставка з гумовим дном і три посудини різної форми з однаковим дном, рідинний (U-подібний) манометр, мензурка на 500 мл, вода, лінійка
hydrostatic-paradox-say = Дно — { $recs } у діаметрі, однакове в усіх посудин.
hydrostatic-paradox-say-2 = Пішло { $V } води, а манометр показує { $dh }.
hydrostatic-paradox-v-s-title = площа дна
hydrostatic-paradox-what-straight = пряма посудина
hydrostatic-paradox-what-wide = посудина, що розширюється
hydrostatic-paradox-what-narrow = посудина, що звужується
hydrostatic-paradox-board-title = { $what }: вага води
hydrostatic-paradox-board-title-2 = { $what }: сила тиску на дно
hydrostatic-paradox-fill-plan = налити воду до { $cm } см у посудину, що { $shape ->
        [straight] має прямі стінки
       *[other] { $short } догори
    }
