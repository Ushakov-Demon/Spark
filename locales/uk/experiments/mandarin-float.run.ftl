## Що каже дослід під час роботи: кроки, дошка, відповідь. Ці тексти приходять разом із дослідом, коли його відкривають; картка досліду — у mandarin-float.ftl.

mandarin-float-command-diameter = Діаметр мандарина має бути більшим за нуль.
mandarin-float-command-peel = Шкірка має бути тоншою за половину діаметра: усередині ще має бути м’якуш.
mandarin-float-command-salt = Солі не може бути менше за нуль.
mandarin-float-part-whole = мандарин
mandarin-float-part-flesh = м’якуш
mandarin-float-part-peel = шкірка
mandarin-float-weigh-say = Мандарин { $d } завширшки, шкірка { $peel }. Зваж його.
mandarin-float-weigh-button = ⚖ Зважити мандарин
mandarin-float-weigh-plan = зважити мандарин
mandarin-float-peel-say = Тепер очисть мандарин і зваж окремо м’якуш і шкірку.
mandarin-float-peel-button = 🍊 Очистити й зважити
mandarin-float-peel-plan = очистити; зважити м’якуш і шкірку
mandarin-float-dunk-say-whole = Опусти мандарин у склянку з водою на терезах (їх обнулили зі склянкою) і притисни паличкою під воду.
mandarin-float-dunk-button-whole = 💧 Мандарин у воду
mandarin-float-dunk-plan-whole = мандарин у воду — і під воду паличкою
mandarin-float-dunk-say-flesh = { $liquid ->
        [salt] Тепер очищений мандарин — у солону воду.
       *[water] Опусти очищений мандарин у воду — на нитці, щоб не торкався дна.
    }
mandarin-float-dunk-button-flesh = { $liquid ->
        [salt] 🧂 М’якуш у солону воду
       *[water] 💧 М’якуш у воду
    }
mandarin-float-dunk-plan-flesh = { $liquid ->
        [salt] м’якуш у солону воду
       *[water] м’якуш у воду
    }
mandarin-float-dunk-say-peel = Тепер шкірку — у воду, і теж притисни її паличкою.
mandarin-float-dunk-button-peel = 💧 Шкірку у воду
mandarin-float-dunk-plan-peel = шкірку у воду — і під воду паличкою
mandarin-float-busy-weigh = Кладемо на терези…
mandarin-float-busy-peel = Чистимо…
mandarin-float-busy-dunk = Опускаємо у воду…
mandarin-float-shown-peel = м’якуш { $flesh }, шкірка { $peel }
mandarin-float-shown-dunk = { $floats ->
        [yes] плаває
       *[no] тоне
    }; V ≈ { $V }, ρ ≈ { $rho }
mandarin-float-say-weigh = Мандарин важить { $m }.
mandarin-float-say-peel = М’якуш — { $flesh }, шкірка — { $peel }.
mandarin-float-say-dunk = { $floats ->
        [yes] Плаває: під водою { $share } % { $part ->
            [peel] її
           *[other] його
        } об’єму.
       *[no] Тоне!
    } Повністю під водою терези показали { $dm } — стільки рідини { $part ->
        [peel] вона витісняє: її
       *[other] він витісняє: його
    } об’єм { $V }, густина ≈ { $rho } (у рідини — { $liquid }).
mandarin-float-board-mass = маса мандарина
mandarin-float-board-parts = маса м’якуша й шкірки
mandarin-float-board-volume = об’єм: { $part } ({ $liquid ->
        [salt] у солоній воді
       *[water] у воді
    })
mandarin-float-board-density = густина: { $part }
mandarin-float-asides = Шкірка мандарина тримає його на воді так само, як пробка — рятувальний жилет. Пробковий жилет продавали ще 1804 року: його рекламував журнал «The Sporting Magazine». А сучасний рятувальний жилет приписують капітанові Джону Россу Ворду, інспекторові рятувальних човнів британського товариства RNLI: 1854 року він зробив для екіпажів рятувальних човнів коричневий пробковий жилет — і від негоди, і щоб тримав на воді. 1904 року тверду пробку замінили водонепроникними мішечками з капоком — легким рослинним волокном.
mandarin-float-answer-why =
    Тіло плаває, коли його середня густина менша за густину рідини: тоді виштовхувальна сила ρ_р·g·V, ще до повного занурення, урівноважує його вагу. Тому важливо, яка густина у всього мандарина разом — м’якуша й шкірки.

    М’якуш — це переважно сік, розчин цукру у воді, і він трохи щільніший за воду: очищений мандарин тоне. А шкірка губчаста: її білий шар повний повітря, і вона значно легша за воду. Разом із нею мандарин має більший об’єм за майже ту саму масу — і його середня густина стає меншою за густину води. Шкірка для мандарина — наче рятувальний жилет.

    Так само можна змусити плавати й очищений мандарин: досить розчинити у воді досить солі, щоб вона стала щільнішою за м’якуш. А мандарин із дуже тонкою шкіркою може втонути й цілим — повітря в шкірці замало, щоб урівноважити важчий м’якуш.
mandarin-float-answer-say = { $whole ->
        [yes] Мандарин зі шкіркою плаває,
       *[no] Мандарин навіть зі шкіркою тоне,
    } а { $flesh ->
        [yes] очищений — теж плаває!
       *[no] очищений — тоне: тримала його шкірка.
    }
mandarin-float-answer-row = { $part } { $liquid ->
        [salt] у солоній воді
       *[water] у воді
    }: ρ ≈ { $rho } — { $floats ->
        [yes] плаває
       *[no] тоне
    }
mandarin-float-answer-text = Густина мандарина зі шкіркою ≈ { $whole }, м’якуша ≈ { $flesh }, шкірки ≈ { $peel }; води — { $water }. { $steps }
