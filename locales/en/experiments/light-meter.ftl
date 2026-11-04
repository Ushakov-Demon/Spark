## Measuring illuminance with a light meter (grade 7, introduction — measuring illuminance).
## $r — the distance from the lamp to the meter («30 cm», «1.5 m»); $tilt — the angle the meter is tilted by («60°»); $tilted — yes when tilted; $E — the meter's reading with its unit.

light-meter-title = Measuring illuminance with a light meter
light-meter-ask = How does illuminance change as the lamp moves away?
light-meter-question = Over the table, on a stand, is { $lamp ->
        [led] an LED lamp
       *[incandescent] a filament lamp
    } of { $power } without a shade (its luminous flux is about { $flux }); the curtains are drawn. Under it on the table lies a light meter. We set the lamp at different heights — the stand’s arm can be dragged up and down — and look at the meter each time. { light-meter-ask }
light-meter-setup = A lamp on a stand, a light meter, a ruler

light-meter-choice-linear = It falls as many times as the distance grew
light-meter-choice-square = It falls faster: twice as far — four times less
light-meter-choice-same = It hardly changes: the lamp is the same

light-meter-aside-bouguer = In 1729 the French scientist Pierre Bouguer published a book, «Essai d’optique sur la gradation de la lumière», and was the first to measure light with a number. By his measurements the Sun shines 300 000 times more strongly than the Moon.

light-meter-lamp = The lamp
light-meter-lamp-led = LED
light-meter-lamp-incandescent = filament
light-meter-power = The lamp’s power
light-meter-live-power = 💡 Power
light-meter-live-tilt = 📐 Tilt
light-meter-live-height = The lamp’s height over the meter
light-meter-tilt = The meter’s tilt
light-meter-optional-tilt = And if the meter is tilted? We tilt it by { $tilt } — or by as much as you like.

light-meter-bad-power = The lamp’s power must be more than zero.
light-meter-bad-r = The meter cannot be nearer to the lamp’s centre than its glass — { $min }.
light-meter-bad-tilt = The tilt goes from 0° (the meter facing the lamp) to less than 90°: edge-on or upside down it catches no light from the lamp.

light-meter-at-say = { $tilted ->
        [yes] We tilt the meter by { $tilt }. What will it show now?
       *[no] Set the lamp at some height — drag the stand’s arm — and measure. What will the meter show?
    }
light-meter-at-button = { $tilted ->
        [yes] 📐 Tilt by { $tilt }
       *[no] 💡 Measure
    }
light-meter-at-plan = { $tilted ->
        [yes] tilt the meter by { $tilt }
       *[no] measure the illuminance
    }
light-meter-at-busy = The lamp is moving…
light-meter-tilt-busy = Tilting the meter…
light-meter-at-shown = { $tilted ->
        [yes] tilted by { $tilt }: { $E }
       *[no] at { $r }: { $E }
    }
light-meter-at-said = { $tilted ->
        [yes] Tilted by { $tilt }, the meter shows { $E }.
       *[no] { $r } from the lamp, the meter shows { $E }.
    }
light-meter-board-at = { $tilted ->
        [yes] tilted by { $tilt }, at { $r }
       *[no] illuminance at { $r }
    }
light-meter-board-flux = the lamp’s luminous flux
light-meter-board-ratio = { $r } against { $r1 }

light-meter-why =
    A lamp with frosted glass shines alike in all directions, and its light spreads out as a ball. At a distance r it falls on the surface of a sphere of area 4πr², and illuminance is luminous flux per square metre: E = Φ / (4πr²). Twice as far, the sphere’s area is four times larger, and each square metre gets four times less light. Three times as far — nine times less. So illuminance falls as the square of the distance.

    A tilted meter catches less light: the same beam of rays falls on it slantwise, over a larger area, and the illuminance is cos α times smaller — at 60°, half. Office lighting is 320–500 lx: a { $flux } lamp gives 400 lx at about { $office }. And direct sunlight is 32 000 to 100 000 lx.
light-meter-say = { $same ->
        [yes] The distance did not change — and the meter showed the same.
       *[no] The lamp got { $rr } times farther, and the illuminance { $er } times less. That is nearly { $rr } squared: { $sq }.
    }
light-meter-row = { $tilted ->
        [yes] tilted by { $tilt }, at { $r }: { $E }
       *[no] at { $r }: { $E }
    }
light-meter-text = Measured:{ $rows }The lamp — { $flux }.
light-meter-scene-not-to-scale = height not to scale
