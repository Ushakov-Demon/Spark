## Лічені речі: число й слово у формі, якої вимагає число ($n — число).

count-weights = { $n ->
        [one] { $n } тягарець
        [few] { $n } тягарці
       *[many] { $n } тягарців
    }
count-turns = { $n ->
        [one] { $n } оберт
        [few] { $n } оберти
        [many] { $n } обертів
       *[other] { $n } оберту
    }
count-frames = { $n ->
        [one] { $n } кадр
        [few] { $n } кадри
       *[many] { $n } кадрів
    }
count-days = { $n ->
        [one] { $n } доба
        [few] { $n } доби
        [many] { $n } діб
       *[other] { $n } доби
    }
count-days-calendar = { $n ->
        [one] { $n } день
        [few] { $n } дні
        [many] { $n } днів
       *[other] { $n } дня
    }
count-times = у { $v } { $k ->
        [one] раз
        [few] рази
        [many] разів
       *[other] раза
    }
count-records = { $n ->
        [one] { $n } запис
        [few] { $n } записи
       *[many] { $n } записів
    }
count-steps = { $n ->
        [one] { $n } крок
        [few] { $n } кроки
       *[many] { $n } кроків
    }
count-experiments = { $n ->
        [one] { $n } дослід
        [few] { $n } досліди
       *[many] { $n } дослідів
    }
count-entries = { $n ->
        [one] { $n } запис
        [few] { $n } записи
       *[many] { $n } записів
    }
