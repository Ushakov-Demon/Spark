## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in calendars.ftl.

calendars-egypt-name = The Egyptian calendar
calendars-julian-name = The Julian calendar
calendars-gregorian-name = The Gregorian calendar
calendars-calendar-command-apply = No such step in the model.
calendars-trick = Most people think the same date is the same day.
calendars-answer-why =
    The Sun does not fit itself to a calendar: its year is 365.24219 days, and a calendar counts whole days. A 365-day calendar falls a quarter of a day short each year — and the seasons slowly float through its months. The Julian one adds a day every four years and overshoots a little: by 11 minutes a year, a day in 128 years. The Gregorian one drops three leap years in four hundred — and is a day off only in over three thousand years.

    So the same date in different calendars is a different day. In 1616 Spain already lived by the Gregorian calendar and England by the Julian, so Shakespeare died 11 days after Cervantes. It is 23 April that UNESCO made World Book Day in 1995. And calendars still change: the Orthodox Church of Ukraine moved from the Julian to the Revised Julian calendar on 1 September 2023 — with a year of 365.242 days.
calendars-answer-say = The same date is not the same day: { $gap } between Cervantes and Shakespeare.
calendars-answer-text = { $name }: in { $years } years the spring equinox moved { $value } later — from 21 March to { $EQUINOX }.
calendars-answer-text-2 = The Julian: from 325 to 1582 — { $value } earlier, to { $EQUINOX }.
calendars-egypt-say = The ancient Egyptians had a calendar of 365 days — with no leap years. And the Sun comes back to the spring equinox in 365.24219 days. We run such a calendar for 120 years: where will the equinox move?
calendars-egypt-button = 🏺 The Egyptian calendar: 365 days
calendars-egypt-plan = the Egyptian calendar for 120 years
calendars-julian-say = In 46 BC Julius Caesar brought in a calendar (in force from 45 BC) in which every fourth year is a leap year: 365.25 days on average. In 325 the spring equinox was reckoned on 21 March. We run the Julian calendar on to 1582.
calendars-julian-button = 🏛 The Julian calendar: 365¼ days
calendars-julian-plan = the Julian calendar from 325 to 1582
calendars-gregorian-say = In 1582 the calendar was mended — under Pope Gregory XIII. First the extra days were struck out: Thursday 4 October was followed by Friday 15 October. Then the rule changed: a year divisible by 100 is not a leap year unless it is divisible by 400 too. So 1900 was not a leap year, and 2000 was. How much builds up over the same 1257 years?
calendars-gregorian-button = ✂ The Gregorian reform
calendars-gregorian-plan = the Gregorian reform
calendars-bard-say = Miguel de Cervantes died on 22 April 1616 and was buried on the 23rd — the date that is remembered. William Shakespeare died on 23 April 1616. But Spain already lived by the new calendar, and England still by the Julian: it changed over only in 1752. We put both dates into one calendar.
calendars-bard-button = ✒ Shakespeare and Cervantes
calendars-bard-plan = Shakespeare and Cervantes: into one calendar
calendars-busy = Striking the days out of October 1582…
calendars-busy-2 = Carrying the London date over to the Gregorian calendar…
calendars-busy-3 = The years run on — watching where the equinox falls…
calendars-slide-when = later
calendars-slide-when-2 = earlier
calendars-shown-slide = in { $years } years the equinox — { $v } { $when }, { $EQUINOX }
calendars-shown = Cervantes — 22 April, Shakespeare — { $month } by the Gregorian: { $value }
calendars-drift-title = { $name }, { $N } years
calendars-board-title = 1582: Thu 4 October → Fri 15 October
calendars-board-formula = struck out 5 … 14 October
calendars-board-title-2 = Cervantes — 22.04 (Greg.), Shakespeare — 23.04 (Jul.)
calendars-board-formula-2 = Shakespeare
calendars-board-formula-3 = Gregorian
calendars-view-months = Jan
calendars-view-months-2 = Feb
calendars-view-months-3 = Mar
calendars-view-months-4 = Apr
calendars-view-months-5 = May
calendars-view-months-6 = Jun
calendars-view-months-7 = Jul
calendars-view-months-8 = Aug
calendars-view-months-9 = Sep
calendars-view-months-10 = Oct
calendars-view-months-11 = Nov
calendars-view-months-12 = Dec
calendars-view-weekdays = Mo
calendars-view-weekdays-2 = Tu
calendars-view-weekdays-3 = We
calendars-view-weekdays-4 = Th
calendars-view-weekdays-5 = Fr
calendars-view-weekdays-6 = Sa
calendars-view-weekdays-7 = Su
calendars-view-names = Cervantes
calendars-view-sheets = Madrid · Gregorian
calendars-view-sheets-2 = London · Julian
calendars-view-strip = 1616 by the Gregorian calendar
calendars-view-year-fmt = year{" "}
calendars-view-year-fmt-2 ={""}
calendars-view-sub = a year of
calendars-view-month = October 1582
calendars-answer-reform = The 1582 reform struck out { $skip }; over the same { $years } years the Gregorian calendar moves the equinox only { $drift }, and a whole day — in about { $oneDay } years.
calendars-answer-bard = Cervantes died on 22 April by the Gregorian calendar; Shakespeare on 23 April by the Julian, which is { $date } by the Gregorian. { $Gap } between them.
calendars-shown-gregorian = { $skip } struck out; { $slide }
calendars-view-year = { calendars-view-sub } { NUMBER($y, maximumFractionDigits: 4) } { $y ->
        [one] day
       *[other] days
    }
calendars-aside-ukraine-1918 = In Ukraine the Gregorian calendar was brought in by the Central Rada. Under its law, 16 February 1918 (old style) became 1 March, so the last days of that February simply dropped out. The church kept to the Julian calendar for a long time afterwards.
