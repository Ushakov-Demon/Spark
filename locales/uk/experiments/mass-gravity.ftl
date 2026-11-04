## Сила тяжіння і маса (7 клас, тема 2 — зв’язок сили тяжіння і маси).
## $m1, $m2, $m3 — маси тіл («100 г», «2 кг»); $of — речовина бруска в родовому відмінку («деревини»); $mass — його маса.

mass-gravity-title = Сила тяжіння і маса
mass-gravity-ask = Як сила тяжіння залежить від маси тіла?
mass-gravity-question = На штативі висить динамометр. По черзі чіпляємо до нього тіла масою { $m1 }, { $m2 } і { $m3 } і щоразу дивимося, з якою силою Земля тягне тіло донизу. { mass-gravity-ask }
mass-gravity-setup = Штатив, динамометр, тіла різної маси, бруски з різних речовин

mass-gravity-choice-proportional = Удвічі більша маса — удвічі більша сила
mass-gravity-choice-slower = Сила росте, але повільніше, ніж маса
mass-gravity-choice-same = Земля тягне всі тіла з однаковою силою

mass-gravity-m1 = Перше тіло
mass-gravity-m2 = Друге тіло
mass-gravity-m3 = Третє тіло
mass-gravity-block-label = Брусок «а якщо…»
mass-gravity-optional = А якщо тіло з іншої речовини? Чіпляємо брусок { mass-gravity-of } — теж { $mass }.
## $block — речовина бруска (id), від неї — прийменник: зі скла, з алюмінію, із деревини.
mass-gravity-of = { $block ->
        [glass] зі
        [aluminium] з
       *[other] із
    } { $of }
