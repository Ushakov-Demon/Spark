## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in solar-noon.ftl.

solar-noon-gnomon-command-apply = No such series in the experiment.
solar-noon-morning-say = Morning. With a tape we measure the metre stick's shadow from its foot to the shadow's end — at { $times }.
solar-noon-morning-button = 🌅 The shadow in the morning
solar-noon-morning-plan = the shadow at { $times }
solar-noon-what-say = Then — at { $times }.
solar-noon-what-button = ☀ The shadow about noon
solar-noon-afternoon-say = After noon — four more: at { $times }.
solar-noon-afternoon-button = 🌇 The shadow in the afternoon
solar-noon-answer-lon-text = E
solar-noon-answer-lon-text-2 = W
solar-noon-answer-why =
    The Sun goes round the sky in a day because the Earth turns: 360° in 24 hours, 1° in 4 minutes. The true noon comes when the Sun is highest over your very place — so each meridian has its own. Not to have a time of its own in every town, a whole zone's clocks keep one meridian: 15° for each hour from Greenwich. A town east of its meridian sees noon earlier, west of it later, by 4 minutes a degree. A few more minutes come from the equation of time: the Earth goes round the Sun unevenly (the orbit is an ellipse) and with its axis tilted, so the true solar day is a little longer or shorter than 24 hours through the year; in early spring the solar noon is 7–8 minutes late. And where the clocks go to summer time, noon by the clock comes an hour later still.

    The same shadow gives the latitude. At noon the Sun is highest: h = arctan(H/L). On an equinox it stands over the equator, and its noon height is 90° less the latitude; on other days, a correction for the declination δ. North of the tropics the noon shadow points north, in the southern hemisphere south. That is how sailors found their latitude by the noon Sun.
solar-noon-answer-say = The true noon ({ $name }) — at { $noon } by the clock!
solar-noon-text-lon-part = almost on it
solar-noon-text-lon-part-2 = east
solar-noon-text-lon-part-3 = west
solar-noon-text-lon-part-4 = earlier
solar-noon-text-lon-part-5 = later
solar-noon-text-lon-part-6 = { $value } of it by { $meridian } — noon { $value2 } by { $byLon }
solar-noon-answer-text = south
solar-noon-answer-text-2 = north
solar-noon-answer-text-3 = {" "}— summer time, an hour on
solar-noon-answer-text-4 = The shortest shadow — { $L } m, pointing { $value3 }. Equal shadows: { $t1 } and ≈ { $t2 } ({ $length } m), midway — { $t12 }; the mean of { $pairs } pairs puts noon at { $noon }. The clocks here keep { $zone }{ $value4 }; the zone's meridian is { $meridian }, and the town ({ $lon }) lies { $lonPart }. The equation of time on 20 March adds { $eq } more (NOAA's formula). Together: 12:00 { $value } { $total } ≈ { $value2 }. The Sun's noon height h = arctan(1 / { $L }) ≈ { $h }, the latitude ≈ { $phi } (δ ≈ { $d }); in fact { $lat }.
solar-noon-busy = The Sun moves across the sky — measuring the shadow…
solar-noon-say = The shadow: { $list }.
solar-noon-board-title = the metre stick’s shadow at { $times }
solar-noon-board-title-2 = noon — midway between equal shadows ({ $length } { $m })
solar-noon-board-numbers = ; the mean of { $pairs } pairs — { $noon }
solar-noon-board-title-3 = the Sun’s height at noon — from the shortest shadow (pointing { $value })
solar-noon-board-title-4 = ; south latitude — negative
solar-noon-board-title-5 = the latitude (the Sun’s declination δ ≈ { $d }° — by NOAA’s formula{ $value })
solar-noon-aside-bristol = Each town once lived by its own noon. Bristol in the west of England runs about 10 minutes behind Greenwich, and when trains on London time began reaching it in 1841, a second minute hand was added to the clock on the city’s Exchange. The city officially moved to London time only in 1852, and both hands are still on that clock.
