## Що каже дослід під час роботи: кроки, дошка, відповідь. Ці тексти приходять разом із дослідом, коли його відкривають; картка досліду — у carts-mass.ftl.

carts-mass-command-apply = На візок — до трьох тягарців.
carts-mass-labcarts-say = Підвісимо перший візок на динамометр. Яка сила тяжіння на нього діє?
carts-mass-labcarts-button = ⚖ Динамометр: візок 2
carts-mass-labcarts-button-2 = ⚖ Динамометр: візок 1
carts-mass-labcarts-plan = візок 2 на динамометрі
carts-mass-labcarts-plan-2 = візок 1 на динамометрі
carts-mass-labcarts-say-2 = Візки однакові. Перепалюємо нитку — пружина розштовхує їх. За кадрами відео міряємо, хто скільки проїхав за 0,5 с.
carts-mass-labcarts-button-3 = 🔥 Однакові візки
carts-mass-labcarts-plan-3 = однакові візки
carts-mass-labcarts-say-3 = На другий візок — { $weights } по 100 г. Знову стискаємо пружину й перепалюємо нитку.
carts-mass-labcarts-button-4 = 🔥 Візок 2 + { $weights }
carts-mass-labcarts-plan-4 = візок 2 + { $weights }
carts-mass-answer-why = Пружина діє на обидва візки однаково, але важчий візок інертніший — він повільніше набирає швидкість, тож розганяється менше. Тому в скільки разів його швидкість менша, у стільки разів його маса більша: m₂ / m₁ = v₁ / v₂. Візки рушили одночасно й їхали однаковий час, тож відношення шляхів — це відношення швидкостей. Так масу можна виміряти без терезів — за інертністю. А динамометр показує, що й сила тяжіння в стільки ж разів більша: P = m·g. Тож маса — міра і інертності тіла, і його притягання до Землі. Тертя коліс за ці 0,5 с не враховано.
carts-mass-answer-say = Візок утричі важчий проїхав { $last } менше — і сила тяжіння на нього { $P2 } більша.
carts-mass-text-parts = один тягарець
carts-mass-text-parts-2 = два тягарці
carts-mass-text-parts-3 = візок 2 + { $value }
carts-mass-text-parts-4 = { $value }: { $a } і { $b }, l₁ / l₂ ≈ { $a2 }
carts-mass-text-weigh = ; на динамометрі: візок 1 — { $P1 }, візок 2 з двома тягарцями — { $P2 }, { $P22 } більше
carts-mass-answer-text = {" "}(2,9 Н, а не 3,0 — бо динамометр показує до десятих: 2,94 Н.)
carts-mass-busy = Нитка перегоріла — візки роз’їжджаються…
carts-mass-cm = ,
carts-mass-say = Динамометр показує { $value }.
carts-mass-say-2 = За 0,5 с: перший візок — { $recs }, другий — { $recs2 }.
carts-mass-board-title = візок { $cart } на динамометрі
carts-mass-board-title-2 = візок 2 + { $w } × 100 г
carts-mass-board-title-3 = { $value }: за 0,5 с
carts-mass-board-title-4 = у скільки разів повільніший — у стільки разів важчий
carts-mass-view-slow = уповільнено
carts-mass-weights = { $n ->
        [1] один тягарець
        [2] два тягарці
       *[other] { count-weights }
    }
carts-mass-second-say = А тепер другий візок із { $n ->
        [2] двома тягарцями
       *[other] { carts-mass-weights }
    }. У скільки разів більша сила тяжіння?
carts-mass-times = у { $x } { $whole ->
        [yes] рази
       *[no] раза
    }
