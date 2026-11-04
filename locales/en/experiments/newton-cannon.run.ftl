## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in newton-cannon.ftl.

newton-cannon-aside-sputnik = On 4 October 1957 the first artificial satellite of the Earth was put into orbit — a metal ball 58 cm across with a mass of 83.6 kg. It went round the Earth in 96.2 minutes at 215 to 939 km up, and three months later, after 1440 orbits, it burned up in the atmosphere. The launch was led by Sergei Korolev, born in Zhytomyr.

newton-cannon-bad-height = The mountain’s height cannot be negative.
newton-cannon-bad-speed = The shot’s speed cannot be negative.
newton-cannon-bad-angle = The angle to the horizon goes from −90° (straight down) to 90° (straight up).

newton-cannon-shot-say = We shoot { $level ->
        [yes] sideways
       *[no] at { $angle } to the horizon
    } at { $v }. What will happen to the ball?
newton-cannon-shot-button = 💥 { $v }
newton-cannon-shot-plan = a shot at { $v }{ $level ->
        [yes] {""}
       *[no] {" "}at { $angle }
    }
newton-cannon-shot-busy = The ball is flying…
newton-cannon-shot-shown = { $outcome ->
        [lands] { $v }: came down { $range } from the mountain
        [orbits] { $v }: went round the Earth in { $period }
       *[escapes] { $v }: flew away from the Earth
    }
newton-cannon-shot-said = { $outcome ->
        [lands] The ball came down { $range } from the mountain, { $time } after the shot.
        [orbits] { $round ->
            [yes] The ball went round the Earth in a circle and came back to the mountain after { $period }.
           *[no] The ball went round the Earth on a stretched orbit — from { $near } to { $far } over the surface — and came back to the mountain after { $period }.
        }
       *[escapes] The ball does not come back: it flies away from the Earth for good.
    }
newton-cannon-board-g = gravity { $h } up
newton-cannon-board-v1 = the speed to go round the Earth { $h } up
newton-cannon-board-shot = { $v }{ $level ->
        [yes] {""}
       *[no] , { $angle }
    }: { $outcome ->
        [lands] came down
        [orbits] went round the Earth
       *[escapes] flew away
    }
newton-cannon-scene-mountain = the mountain and the flight’s height not to scale

newton-cannon-why =
    Gravity pulls the ball down — and { $h } up it is nearly as strong as at the surface: { $g } N/kg instead of { $g0 } ({ $share } %). So «up there the Earth no longer pulls» is not true: the ball always falls. But as it falls it also goes sideways, and the Earth is round: the farther the ball goes, the lower the surface drops beneath it. A slow one falls near, a faster one farther. At { $v1 } it goes sideways just so much that the surface «runs away» beneath it as fast as it falls: the ball falls without end and goes round the Earth in a circle. That is the first cosmic speed, and that is how satellites fly: what keeps them in orbit is their speed, not engines.

    Faster than { $v1 } — the orbit stretches, and from { $v2 } (the second cosmic speed) the ball no longer comes back. That is why astronauts in orbit are weightless: together with their station they fall all the time, and nothing holds them up. There is gravity up there — there is no support.

    Newton himself thought this experiment up — in his head. His book «De mundi systemate» was published in 1728, after his death. In it he imagined a stone thrown from the top of a very high mountain. A slow one falls back to the Earth. Thrown at the orbital speed, it goes round the Earth in a circle «and returns to the mountain from which it was projected». A faster one flies on an ellipse, and a very fast one leaves the Earth altogether. So Newton argued that gravity is universal and is the very force that drives the planets. His drawing of the mountain and the circles of orbits now flies in space: it is on the Voyager Golden Record.
newton-cannon-board-low = { $v }: the orbit’s lowest point
newton-cannon-why-tilted =
    At { $angle } to the horizon this is no longer Newton’s shot, but the law is the same. Only gravity acts on the ball, F = G · M · m / r² — { $h } up that is { $g } N/kg. Under such a force a body flies along a conic with the Earth’s centre at its focus: a circle, an ellipse, a parabola or a hyperbola (Kepler’s first law). Its shape is set by the speed and the angle: the parameter p = (r₀ · v · cos γ)² / μ and the eccentricity e — the nearer it is to zero, the rounder the orbit.

    The ball comes down if the orbit’s lowest point r_min = p / (1 + e) lies under the surface (r_min < R = { $R }): then it meets the Earth before it goes round. If r_min > R, it goes round the Earth and comes back to the mountain. The angle only turns the orbit and moves its lowest point, while two things do not depend on it: the semi-major axis a = μ / (2μ / r₀ − v²), and with it the period T = 2π √(a³ / μ), and the speed from which the ball no longer comes back — v₂ = √(2μ / r₀) = { $v2 }.
newton-cannon-say-tilted = { $round ->
        [yes] At { $angle } the ball went round the Earth already at { $vRound }; the slower ones came down — the lowest point of their orbits was under the surface.
       *[no] At { $angle } no ball went round the Earth: the orbit’s lowest point was under the surface every time.
    } To fly away from the Earth for good takes { $v2 } — at any angle.
newton-cannon-say = { $round ->
        [yes] { $down ->
            [yes] The ball at { $vDown } still came down — { $range } from the mountain, and at { $vRound } it went round the Earth. Not to fall, at this height it takes at least about { $v1 }.
           *[no] The ball went round the Earth already at { $vRound }. Not to fall, at this height it takes at least about { $v1 }.
        }
       *[no] { $down ->
            [yes] All the balls came down — the farthest, at { $vDown }, { $range } from the mountain. To go round the Earth at this height takes about { $v1 }.
           *[no] The balls neither came down nor went round the Earth — they flew away. To go round the Earth at this height takes only { $v1 }.
        }
    }
newton-cannon-row = { $outcome ->
        [lands] { $v }: came down { $range } away
        [orbits] { $v }: went round the Earth in { $period }
       *[escapes] { $v }: flew away from the Earth
    }
newton-cannon-text = The mountain — { $h }. The shots:{ $rows }
