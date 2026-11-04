## lab-board
lab-board-lines-ice-name = льоду
lab-board-lines-what = розчину{ $of }
lab-board-lines-title = нагрівання { $what }
lab-board-lines-title-2 = охолодження { $what }
lab-board-lines-title-3 = змішування: температура суміші
lab-board-lines-name = тіло
lab-board-lines-title-4 = охолодження
lab-board-lines-title-5 = нагрівання
lab-board-balance-lines-title = тепловий баланс: скільки віддали — стільки й отримали (різниця — посуд і повітря)
lab-board-boil-lines-title = : википіло { $steam } г
lab-board-boil-lines-title-2 = кипіння{ $steam }
lab-board-ohm-lines-title = струм у рідині
lab-board-joule-lines-title = теплота від струму
lab-board-heater-lines-title = нагрівач віддав
lab-board-efficiency-lines-title = ККД: скільки дісталося речовині
lab-board-weigh-lines-title = зважування: посуд + вміст
lab-board-dissolving-heat-lines-title = поглинуто
lab-board-dissolving-heat-lines-title-2 = виділено
lab-board-dissolving-heat-lines-title-3 = розчинення { $what }: теплоту { $value }
lab-board-dissolving-heat-lines-numbers = моль
lab-board-dissolving-heat-lines-numbers-2 = кДж/моль
lab-board-mass-fraction-lines-title = масова частка { $what } в розчині
lab-board-mass-fraction-lines-formula = w = m(речовини) / m(розчину)
lab-board-liquid-density-line-title = густина рідини
lab-board-measured-lines-title = опір котушки за { $t } °C
lab-board-measured-lines-title-2 = температурний коефіцієнт опору (нагріли на { $dt } °C)
lab-board-measured-lines-title-3 = маса катода до досліду
lab-board-measured-lines-title-4 = маса катода після досліду
lab-board-measured-lines-title-5 = маса міді, що осіла на катоді
lab-board-measured-lines-title-6 = електрохімічний еквівалент (I ≈ { $I } А, t = { $t } хв)
lab-board-measured-lines-numbers = мг/Кл
lab-board-measured-lines-title-7 = рівень після того, як опустили тіло
lab-board-measured-lines-title-8 = рівень рідини за поділками
lab-board-measured-lines-title-9 = на скільки піднялася рідина — об’єм витісненої води
lab-board-measured-lines-title-10 = як змінився рівень
lab-board-measured-lines-title-11 = покази терезів разом із доданою речовиною
lab-board-measured-lines-title-12 = покази терезів разом із тілом
lab-board-measured-lines-title-13 = покази терезів
lab-board-measured-lines-title-14 = маса доданої речовини — на скільки збільшилися покази терезів
lab-board-measured-lines-title-15 = маса тіла — на скільки збільшилися покази терезів
lab-board-measured-lines-title-16 = вага тіла у повітрі
lab-board-measured-lines-numbers-2 = динамометр
lab-board-measured-lines-title-17 = тіло плаває: архімедова сила зрівнялася з вагою
lab-board-measured-lines-title-18 = архімедова сила — за показами динамометра
lab-board-measured-lines-title-19 = архімедова сила — за законом Архімеда
lab-board-measured-lines-title-20 = середня густина тіла
lab-board-measured-lines-title-21 = густина речовини тіла
## $grams — how much froze or melted (none: nothing yet); $melt — a metal or salt (yes) or ice (no).
lab-board-freezing = кристалізація{ $grams ->
        [none] {""}
       *[other] : { $melt ->
            [yes] затверділо
           *[no] замерзло
        } { $grams } г
    }
lab-board-melting = плавлення{ $grams ->
        [none] {""}
       *[other] : { $melt ->
            [yes] розплавилося
           *[no] розтануло
        } { $grams } г
    }
