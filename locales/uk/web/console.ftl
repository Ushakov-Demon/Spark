## Консоль команд лабораторії.

console-which-one = Уточни, яке саме
console-unknown-word = Не знаю «{ $what }». Спробуй команду без слів — побачиш список (наприклад, «substances»).
console-also-named = Інші назви
console-help-title = Команди (Tab доповнює, ↑/↓ — історія):
console-actions = Дії:
console-substances = Речовини:
console-substance-stays = Під час досліду речовину не міняють — спершу «reset».
console-vessels = Посуд:
console-vessel-stays = Під час досліду посуд не міняють — спершу «reset».
console-devices = Прилади:
console-setpoint-range = {" "}(діапазон { $min }…{ $max } °C)
console-no-heater = ✓ без нагрівача, у кімнаті
console-no-knob = Ручки тут немає.
console-no-target = Ця дія без цільової температури.
console-no-duration = Ця дія триває до мети, а не за часом.
console-running-already = Дослід уже йде — спершу «reset».
console-lid-on = ✓ з кришкою
console-lid-off = ✓ без кришки
console-voices = Голоси (voice <назва>):
console-started = ▶ пішло!
console-presets = Готові досліди (дослід <номер>):
console-grade = клас
console-report-below = ✓ розбір нижче
console-records = Записи (replay <номер>):
console-newspaper = 📰 Професор шукає газету…
console-scenes = Сценки (prof <назва>):
console-greet = Консоль лабораторії. Напиши «help», щоб побачити команди.
console-placeholder = наприклад: action freeze
console-no-command = Немає команди «{ $head }». Напиши «help».
console-help-usage = help [command]
console-help-about = список команд або опис однієї
console-actions-usage = actions
console-actions-about = що можна робити
console-action-usage = action <name>
console-action-about = вибрати дію: action freeze
console-substances-usage = substances
console-substances-about = речовини для вибраної дії
console-substance-usage = substance <name> [amount L|mL|g]
console-substance-about = налити речовину: substance sea 0.5 l
console-vessels-usage = vessels
console-vessels-about = посуд, що підходить до приладу
console-vessel-usage = vessel <name> [size L] [material]
console-vessel-about = поставити посуд: vessel beaker 0.25
console-devices-usage = devices
console-devices-about = прилади для вибраної дії
console-device-usage = device <name> [W | °C | V]
console-device-about = прилад і його налаштування: device freezer -22
console-knob-usage = knob <0…100 %>
console-knob-about = повернути ручку нагрівача чи блока живлення
console-target-usage = target <°C>
console-target-about = до якої температури гріти чи охолоджувати
console-duration-usage = duration <min>
console-duration-about = скільки хвилин іде дія (струм)
console-temp-usage = temp <°C>
console-temp-about = початкова температура речовини
console-room-usage = room <°C>
console-room-about = температура в кімнаті
console-lid-usage = lid on|off
console-lid-about = накрити посуд кришкою
console-add-usage = add <substance> <mass g> [°C] [frozen]
console-add-about = досипати чи долити: add salt 7 g
console-weigh-usage = weigh [kitchen | lab]
console-weigh-about = поставити посуд на ваги: weigh lab
console-voice-usage = voice [toon | speech | none]
console-voice-about = голос Професора: voice none
console-level-usage = level
console-level-about = подивитися на поділки: об’єм рідини (мірний циліндр)
console-hang-usage = hang <body> <mass g> [air | water]
console-hang-about = підвісити тіло на динамометр: hang aluminium 100 g water
console-start-usage = start
console-start-about = запустити (або продовжити) дослід
console-pause-usage = pause
console-pause-about = зупинити час
console-reset-usage = reset [settings [yes]]
console-reset-about = почати дослід заново; reset settings — усі налаштування як спочатку (мова, голос, звук, панелі, news, speaker, music, anim), записи дослідів лишаються
console-speed-usage = speed <1…3600>
console-speed-about = у скільки разів швидше за справжній час
console-status-usage = status
console-status-about = що зараз показують прилади
console-predict-usage = predict <min>
console-predict-about = мій прогноз: за скільки хвилин
console-info-usage = info <name>
console-info-about = довідка про речовину чи прилад
console-presets-usage = presets
console-presets-about = готові досліди з номерами
console-preset-usage = preset <number or name>
console-preset-about = запустити готовий дослід
console-explain-usage = explain
console-explain-about = розбір: що відбулося і чому
console-save-usage = save [name]
console-save-about = зберегти дослід (усі кроки) як запис
console-records-usage = records
console-records-about = мої записи з номерами
console-replay-usage = replay <number>
console-replay-about = повторити запис крок за кроком
console-news-usage = news [on|off]
console-news-about = газета зараз; news off — не приносити її самому, news on — знову приносити
console-prof-usage = prof [scene]
console-prof-about = сценки Професора: prof coffee
console-clear-usage = clear
console-clear-about = очистити консоль
console-speaker-usage = speaker [on|off]
console-speaker-about = ведучий на сцені: speaker off — без нього (його слова лишаються в рамці, без голосу й сценок)
console-music-usage = music [on|off]
console-music-about = музика у фоні (чути, коли звук увімкнено)
console-anim-usage = anim [on|off]
console-anim-about = anim off — без анімацій і без прогнозу: дослід іде сам, одразу готовий результат; кроки лишаються в протоколі
console-on-off = Напиши on або off.
console-news-state = { $on ->
        [true] ✓ газету приноситиме сам, коли тобі стане нудно
       *[other] ✓ газету сам не приноситиме (news — показати зараз)
    }
console-speaker-state = { $on ->
        [true] ✓ ведучий на сцені
       *[other] ✓ без ведучого: лише його слова в рамці
    }
console-music-state = { $on ->
        [true] ✓ музика у фоні грає (коли звук увімкнено)
       *[other] ✓ без музики
    }
console-motion-state = { $on ->
        [true] ✓ з анімаціями: кожен крок видно, прогноз — перед відповіддю
       *[other] ✓ без анімацій: дослід іде сам до відповіді
    }
console-reset-settings-ask = Повернути всі налаштування до типових? Сторінка перезавантажиться, поточний дослід почнеться спочатку. Записи дослідів і історія консолі лишаться. Напиши «reset settings yes».
console-reset-settings-done = ✓ налаштування типові — перезавантажую…
