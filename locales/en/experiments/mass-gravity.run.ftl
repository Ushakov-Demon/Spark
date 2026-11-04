## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in mass-gravity.ftl.
## $body — weights (a body), block; $of — the block's substance; $mass — the mass; $F — the reading; $instrument — dynamometer, gauge (a force gauge).

mass-gravity-bad-mass = A body’s mass must be greater than zero.
mass-gravity-bad-body = There is no such body in the set.

mass-gravity-step-plan = { $body ->
        [block] Hang a block { mass-gravity-of }, { $mass }
       *[weights] Hang a body of { $mass }
    }
mass-gravity-step-button = { $body ->
        [block] ⚖️ Hang a block { mass-gravity-of }, { $mass }
       *[weights] ⚖️ Hang a body of { $mass }
    }
mass-gravity-step-say = { $body ->
        [block] We hook on a block { mass-gravity-of } — of the same mass, { $mass }.
       *[weights] We hook a body of { $mass } onto the hook.
    }
mass-gravity-busy = Hooking the body on…
mass-gravity-block = a block { mass-gravity-of }, { $mass }
mass-gravity-say = The { $instrument ->
        [gauge] force gauge
       *[dynamometer] dynamometer
    } shows { $F }: that is how hard the Earth pulls { $body ->
        [block] the block { mass-gravity-of }
       *[weights] the body of { $mass }
    }.
mass-gravity-board-ratio = The force on each kilogram: { $what }
mass-gravity-scene-scale = not to scale

mass-gravity-why =
    The Earth pulls every kilogram of matter alike — in our experiment about { $g } N on each kilogram. A body of 2 kg is as if two bodies of 1 kg were fastened together: each is pulled as hard, so together — twice as hard. So the force of gravity is proportional to the mass: F = m · g, with g ≈ 9.8 N/kg at the Earth’s surface. It does not depend on the body’s substance, size or shape — only on its mass.

    A dynamometer shows the body’s weight — the force with which the body pulls its support. While the body hangs still, its weight equals the force of gravity. But they are different forces: gravity acts on the body, the weight on the support. In a lift speeding up the weight changes, the force of gravity does not.
mass-gravity-answer-say = About { $g } N on each kilogram, whatever the body: the force of gravity is proportional to the mass. { $has ->
        [yes] { $same ->
            [yes] The block { mass-gravity-of } is bigger than the weights, and the force is the same: it is the mass that counts, not the substance.
           *[no] The instrument read the block { mass-gravity-of } a little differently — that is the instrument’s error.
        }
       *[no] { "" }
    }
mass-gravity-text = The readings: { $rows }. On each kilogram — about { $g } N.

mass-gravity-aside-newton = That the Earth pulls every kilogram alike, whatever the body is made of, Isaac Newton tested already. He compared the periods of pendulums of different materials and found them the same — to a thousandth. It is on the opening pages of his «Mathematical Principles of Natural Philosophy» (1687). Later the Hungarian physicist Loránd Eötvös tested the same on a torsion balance — from about 1885, and in 1906–1909 he raised the accuracy to one part in a hundred million.
mass-gravity-aside-poles = At a pole a body weighs about 0.5 % more than at the equator: g there is about 9.832 N/kg, at the equator 9.780. The Earth is slightly flattened, so at the equator a body is farther from its centre, and the Earth rotates — which also lessens the weight a little. And the 9.80665 N/kg taken as the «standard» g was agreed upon in 1901: it belongs to no place on the Earth.
