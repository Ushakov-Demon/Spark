## thermal-lab
thermal-lab-extra-label = Терморегулятор
thermal-lab-extra-label-2 = Захист від перегріву
thermal-lab-entities-label = Повітря в кімнаті
thermal-lab-setup-dry-immersion = Кип’ятильник вмикають лише в рідині: у сухій речовині він не віддає теплоту, перегрівається й перегорає.
thermal-lab-operation-context-where = у кімнаті
thermal-lab-subject-name = Вода з сіллю
thermal-lab-subject-name-2 = Розчин
thermal-lab-subject-where = {" "}з кришкою
thermal-lab-subject-by = {" "}у кімнаті
thermal-lab-cautions = У справжньому досліді — лише безпечна низька напруга: батарейка або лабораторний блок живлення. Ніколи не опускай у воду дроти від розетки 230 В — це смертельно небезпечно.
thermal-lab-crystal-note-short = Усі кристали розчинилися!
thermal-lab-crystal-note-long = Кристали { $what }, що лежали на дні ({ $c0 }), повністю розчинилися: при { $T1 } 100 г води розчиняє вже ≈ { $sol } г.
thermal-lab-crystal-note-short-2 = Частина кристалів розчинилася.
thermal-lab-crystal-note-long-2 = Частина кристалів { $what } розчинилася: на дні було { $c0 }, лишилося { $c1 }.
thermal-lab-crystal-note-short-3 = Випали кристали!
thermal-lab-crystal-note-long-3 = було { $c0 }, тепер
thermal-lab-crystal-note-long-4 = тепер
thermal-lab-crystal-note-long-5 = Розчин став насиченим, і { $what } почав виходити кристалами: на дні { $c0 } { $c1 }. При { $T1 } 100 г води утримує лише ≈ { $sol } г.
thermal-lab-crystal-note-short-4 = Кристали не випали — розчин пересичений!
thermal-lab-crystal-note-long-6 = Розчин охолов до { $T1 }, а кристали не випали, хоча вода при цій температурі утримує лише ≈ { $limit } { $what }, а в ній { $mass } — у { $mass2 } раза більше. Розчин пересичений: кристалам нема на чому почати рости.
thermal-lab-step-outcome-word = за
thermal-lab-headline-energy-line = Нагрівач виділив { $produced } енергії; у вміст посуду пішло { $pct } %.
thermal-lab-headline-lines = найвища
thermal-lab-headline-lines-2 = найнижча
thermal-lab-headline-lines-3 = { $subj } не { $notFuture }: { $value } температура, якої можна досягти, — приблизно { $limit }.
thermal-lab-headline-lines-4 = {" "}— а розжарене ще й випромінює її
thermal-lab-headline-lines-5 = Чому: що гарячіше тіло, то більше теплоти воно віддає повітрю{ $value }. При цій температурі втрати зрівнюються з теплотою від нагрівача — і нагрівання зупиняється.
thermal-lab-headline-lines-6 = Чому: тіло не може стати холоднішим за те, що його оточує.
thermal-lab-headline-first = { $subj } не { $notFuture }.
thermal-lab-headline-lines-7 = { $subj } не нагрівається. { $reason }
thermal-lab-headline-lines-8 = Нагрівач вимкнено (зараз { $temperature }).
thermal-lab-headline-lines-9 = Чому: піч гріє посуд ззовні, тож його стінки нагріваються першими — а цей посуд не розрахований на такий жар. У печі розжарюють лише порцеляновий тигель.
thermal-lab-headline-lines-10 = Чому: у посуді немає води, яка забирала б теплоту від стінок, а { $name } проводить її погано — тож гарячішим за все стає сам посуд. Для сильного нагрівання беруть порцеляновий тигель і пальник або муфельну піч.
## $gender — the Ukrainian name's gender (f, m, n).
thermal-lab-frozen = { $gender ->
        [f] Замерзла
       *[other] Замерзлий
    } { $name }
thermal-lab-caution-flame = Насправді { $name } не гріють на відкритому вогні: він легко займається, а пара вибухонебезпечна. У віртуальній лабораторії — можна, у справжній — ні.
thermal-lab-gave-heat = Для цього { $name } { $gender ->
        [f] віддала
        [n] віддало
       *[m] віддав
    } навколишньому { $heat } теплоти{ $note }.
thermal-lab-stopped = Дослід зупинено через { $after }: температура змінилася з { $from } до { $to }{ $solid ->
        [none] {""}
       *[other] {" "}(твердого — { $solid } %)
    }.
thermal-lab-would-reach = Якщо продовжити, { $subj } { $future } приблизно ще за { $after }.
thermal-lab-cut-out = { $heater } вимикається, щойно посуд нагрівається понад ≈ { $cut }: так спрацьовує захист від перегріву, коли посуд гріють майже порожнім.
thermal-lab-smokes = { $subj } не { $past }, а за { $at } { $gender ->
        [f] нагрілася до
        [n] нагрілося до
       *[m] нагрівся до
    } { $smoke }.
thermal-lab-smokes-why = При цій температурі { $name } не кипить, а починає димітися й розкладатися — далі гріти небезпечно.
thermal-lab-vessel-will-fail = Посуд ({ $vessel }) не витримає: приблизно за { $at } його стінки нагріються до { $limit }, а тоді { $what }. { $subj } до того часу не { $notFuture }.
thermal-lab-vessel-failed = Посуд ({ $vessel }) не витримав: за { $at } його стінки нагрілися до { $limit }, а тоді { $what }. { $subj } за цей час { $gender ->
        [f] нагрілася до
        [n] нагрілося до
       *[m] нагрівся до
    } { $reached }.
