## What the experiment says while it runs: steps, board, answer. These come with the experiment when it is opened; its card is in paper-cups.ftl.

paper-cups-command-mass = The mass must be more than zero.
paper-cups-command-cups = There must be at least one cup, and a whole number.
paper-cups-way-upright = standing
paper-cups-way-side = on its side
paper-cups-press-say = { $way ->
        [side] Now lay the cup on its side and press the same way till it flattens.
       *[upright] Stand the cup upside down and press it from above with the force gauge till it gives. How much will it bear?
    }
paper-cups-press-button = { $way ->
        [side] 🥤 Press — on its side
       *[upright] 🥤 Press — standing
    }
paper-cups-press-plan = { $way ->
        [side] press a cup lying on its side
       *[upright] press a standing cup
    }
paper-cups-weigh-say = Professor, onto the scales!
paper-cups-weigh-button = ⚖ Weigh the Professor
paper-cups-weigh-plan = weigh the Professor
paper-cups-stand-say = { $way ->
        [side] Now { $cups } cups on their sides, the board on them — and the Professor in the middle.
       *[upright] { $at ->
            [end] And now the Professor steps onto the board’s end — over the end cups.
           *[middle] { $cups } cups standing in two rows, a board on them — and the Professor ({ $m }) steps into the middle.
        }
    }
paper-cups-stand-button = { $way ->
        [side] 🧍 Onto cups on their sides
       *[upright] { $at ->
            [end] 🧍 Onto the board’s end
           *[middle] 🧍 Onto standing cups
        }
    }
paper-cups-stand-plan = { $way ->
        [side] the Professor on a board on cups on their sides
       *[upright] { $at ->
            [end] the Professor at the board’s end
           *[middle] the Professor in the middle of a board on standing cups
        }
    }
paper-cups-busy-press = Pressing…
paper-cups-busy-weigh = Onto the scales…
paper-cups-busy-stand = Stepping on carefully…
paper-cups-shown-stand = { $holds ->
        [yes] held
       *[no] crushed
    }: the most on a cup { $most }
paper-cups-say-press = { $way ->
        [side] On its side the cup flattened already at { $F }.
       *[upright] Standing, the cup gave only at { $F }!
    }
paper-cups-say-weigh = I weigh { $m }.
paper-cups-say-stand = { $holds ->
        [yes] They hold! The most on one cup is { $most }, and it bears { $bears }.
       *[no] Oops! The cups crushed ({ $crushed } of them): a cup got { $most }, and it bears only { $bears }.
    }
paper-cups-board-press = a cup { $way ->
        [side] on its side
       *[upright] standing
    } bears
paper-cups-board-weigh = the Professor’s weight
paper-cups-board-stand = on a cup { $way ->
        [side] on its side
       *[upright] standing
    }{ $at ->
        [end] , the Professor at the end
       *[middle] {""}
    }
paper-cups-asides = The paper cup was made not for tricks but for health. In the early 20th century in the USA people at school taps and at water barrels on trains drank from one shared glass or dipper. In 1908 the biologist Alvin Davison published an article with the loud title «Death in School Drinking Cups». And back in 1907 Lawrence Luellen, an inventor in Boston worried about germs from shared cups, developed a disposable paper cup. It was first called the «Health Kup», and from 1919 the «Dixie Cup», after a line of dolls. The Lackawanna Railroad began giving passengers paper cups in 1909.
paper-cups-answer-why =
    A standing cup presses on the board with all its rim, and its walls are squeezed along their length — that way thin paper bears a great deal: hundreds of newtons. Laid on its side, it holds with its round wall, which is easy to flatten — tens of times less. So it is not the area that matters but how the wall works.

    The board shares the Professor’s weight among all the cups: each carries only P/n. The pressure he makes is shared too — over all the rims together. The more cups and the more evenly they stand, the less falls on one.

    But step onto the end — and the board tilts: the end cups are squeezed harder and carry more than in the middle (the law of moments, as with a lever). That is why you stand in the middle.
paper-cups-answer-say = { $up ->
        [yes] Standing, the cups bore the Professor,
       *[no] Even standing, the cups crushed,
    } and { $side ->
        [yes] on their sides — too!
       *[no] on their sides — they crushed.
    }
paper-cups-answer-row = { $way ->
        [side] on their sides
       *[upright] standing
    }{ $at ->
        [end] , at the end
       *[middle] {""}
    }: { $most } on a cup — { $holds ->
        [yes] held
       *[no] crushed
    } (it bears { $bears })
paper-cups-answer-text = The Professor’s weight — { $P }. { $steps }
paper-cups-scene-scale = the Professor not to scale
