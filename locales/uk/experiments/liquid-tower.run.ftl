## Що каже дослід під час роботи: кроки, дошка, відповідь. Ці тексти приходять разом із дослідом, коли його відкривають; картка досліду — у liquid-tower.ftl.

liquid-tower-nut-name = сталева гайка
liquid-tower-nut-made = сталь
liquid-tower-acrylic-name = шматочок оргскла
liquid-tower-acrylic-made = оргскло
liquid-tower-hdpe-name = шматочок поліетилену
liquid-tower-hdpe-made = поліетилен
liquid-tower-pine-name = сосновий кубик
liquid-tower-pine-made = сосна
liquid-tower-glycerol-name = гліцерин
liquid-tower-glycerol-in = у гліцерині
liquid-tower-water-name = вода
liquid-tower-water-in = у воді
liquid-tower-sunflower-oil-name = олія
liquid-tower-sunflower-oil-in = в олії
liquid-tower-ethanol-name = спирт
liquid-tower-ethanol-in = у спирті
liquid-tower-labtower-say = Наливаємо в мірний циліндр по 50 мл: спершу гліцерин, потім воду, олію і спирт — повільно, по стінці. Воду й спирт підфарбуємо, щоб шари було видно.
liquid-tower-labtower-button = 🫗 Налити шари
liquid-tower-labtower-plan = налити чотири рідини шарами
liquid-tower-labtower-button-2 = ⬇ { $b }{ $b2 }
liquid-tower-labtower-plan-2 = опустити: { $b }
liquid-tower-trick = Більшість думає, що тіло, яке тоне у воді, неодмінно ляже на дно.
liquid-tower-answer-place = { $N } ({ $rho } кг/м³) густіша за всі рідини — лягла на дно.
liquid-tower-answer-place-2 = { $N } ({ $rho } кг/м³) легший за всі рідини — плаває у спирті, занурений на { $share }.
liquid-tower-answer-place-3 = { $N } ({ $rho } кг/м³) пройшов крізь легші рідини й зупинився на межі «{ $lw } — { $lw2 }»: { $share } його об’єму { $lw3 }, решта — { $lw4 }.
liquid-tower-answer-why =
    Рідини лягли шарами в порядку густини: важча рідина опускається під легшу, як і тверде тіло. Кожне тіло тоне, доки довкола нього рідина легша за нього, — сила тяжіння більша за архімедову. Щойно воно доходить до рідини, густішої за себе, архімедова сила стає більшою за вагу, і тіло спливає на ній. Тож тіло зупиняється на межі двох рідин: частково в нижній, частково у верхній — так, щоб архімедові сили від обох рідин разом урівноважили вагу. Що ближча густина тіла до густини нижньої рідини, то глибше воно в неї занурене. Тому «тоне у воді» ще не означає «ляже на дно»: оргскло тоне у воді, але гліцерин його тримає.

    Гліцерин і вода насправді змішуються: якщо наливати обережно, межа між ними тримається якийсь час, а потім розмивається. Спирт теж змішався б із водою, але між ними — олія. Об’єми рідин тут вважаємо такими, що просто додаються.
liquid-tower-answer-say = Кожне тіло зупинилося там, де рідина під ним густіша за нього!
liquid-tower-text-layers = Шари знизу вгору: гліцерин ({ $d } кг/м³), вода ({ $d2 }), олія ({ $d3 }), спирт ({ $d4 }).
liquid-tower-busy = Опускається… дивимося, де зупиниться…
liquid-tower-busy-2 = Наливаю повільно, по стінці…
liquid-tower-place = { $N } плаває { $TOWER_LIQUIDS }, на поверхні.
liquid-tower-say = Рідини лягли шарами: гліцерин унизу, над ним вода, олія, а вгорі — спирт. Межі шарів — на позначках 50, 100 і 150 мл.
liquid-tower-board-title = шари знизу вгору: гліцерин, вода, олія, спирт (по 50 мл)
liquid-tower-board-title-2 = { $made }: на дні
liquid-tower-board-formula = ρ_т > ρ_гл
liquid-tower-board-title-3 = { $made }: плаває в спирті, позначка { $value } { $ml }
liquid-tower-board-formula-2 = V_зан / V = ρ_т / ρ_сп
liquid-tower-board-title-4 = { $made }: межа «{ $lower } — { $lower2 }», { $value } { $ml }; частка в нижній
liquid-tower-board-formula-3 = V₁ / V = (ρ_т − ρ₂) / (ρ₁ − ρ₂)

## $what — the body: nut, acrylic, hdpe, pine (the words agree with it).
liquid-tower-place-bottom = { $N } { $what ->
        [nut] лягла
       *[other] ліг
    } на дно.
liquid-tower-place-boundary = { $N } { $what ->
        [nut] зупинилася
       *[other] зупинився
    } на межі «{ $below } — { $above }», біля позначки { $mark }.
liquid-tower-board-order = ρ_гл > ρ_в > ρ_ол > ρ_сп
liquid-tower-drop-say = Обережно опускаємо в циліндр { $body }. Де { $what ->
        [nut] вона
       *[other] він
    } зупиниться?
