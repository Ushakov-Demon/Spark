## How plants move: how fast bamboo grows (grade 7, topic 1 — modelling the movements of animals and plants).
## $t — the time since the first photo («6 h», «2 days»); $first — yes for the first photo; $h — the tip's height by the pole; $fps — frames a second; $n — frames.

plant-motion-title = How plants move: how fast bamboo grows
plant-motion-ask = Which is faster: a growing bamboo shoot or a snail?
plant-motion-question = Moso bamboo is one of the fastest plants. By a young shoot we stand a red-and-white pole, and a camera on a tripod photographs it now, then after { $t1 } and after { $t2 }. From the photos we find how much it has grown. And the garden snail in the snail experiment crawled across a plastic sheet at { $snail }. { plant-motion-ask }
plant-motion-setup = A bamboo shoot in a tub, a measuring pole, a camera on a tripod
plant-motion-days = { $n } { $n ->
        [one] day
       *[other] days
    }

plant-motion-choice-snail = The snail: a plant grows too slowly for the eye to see it
plant-motion-choice-bamboo = The bamboo: it grows more than a metre a day
plant-motion-choice-same = About the same

plant-motion-aside-darwin = In 1880 Charles Darwin, together with his son, the botanist Francis, published a book, «The Power of Movement in Plants». They described how the tips of stems slowly trace circles and ellipses, and, comparing grass seedlings with covered and uncovered tips, showed that it is the tip that turns a seedling towards the light.

plant-motion-t1 = Second photo: after
plant-motion-t2 = Third photo: after
plant-motion-fps = Slow motion, frames a second
plant-motion-optional-trap = And the quickest movement of plants? A Venus flytrap: its trap filmed in slow motion, and its closing timed by the frames.

plant-motion-bad-time = A time cannot be negative.
plant-motion-too-tall = A shoot does not grow at this speed for so long: the tallest moso is { $max }.
plant-motion-bad-fps = The camera must take more than zero frames a second.
plant-motion-too-slow-camera = The trap shuts in { $t }: a camera taking { $fps } frames a second will not catch it.

plant-motion-shoot-say = { $first ->
        [yes] The first photo: we mark where the shoot’s tip is on the pole.
       *[no] A photo { $t } after the first. Where is the tip now?
    }
plant-motion-shoot-button = { $first ->
        [yes] 📷 First photo
       *[no] 📷 After { $t }
    }
plant-motion-shoot-plan = { $first ->
        [yes] the first photo
       *[no] a photo after { $t }
    }
plant-motion-shoot-busy = Time-lapse: the shoot is growing…
plant-motion-shoot-shown = { $first ->
        [yes] at the start: { $h }
       *[no] after { $t }: { $h }
    }
plant-motion-shoot-said = { $first ->
        [yes] The shoot’s tip is at the { $h } mark.
       *[no] After { $t } the tip is at the { $h } mark.
    }
plant-motion-trap-say = A fly lands on the trap and touches its hairs — what happens?
plant-motion-trap-button = 🎞 The flytrap
plant-motion-trap-plan = the flytrap in slow motion
plant-motion-trap-busy = Slow motion…
plant-motion-trap-shown = shut in { $n } { $n ->
        [one] frame
       *[other] frames
    }: { $T }
plant-motion-trap-said = The trap shut in { $n } { $n ->
        [one] frame
       *[other] frames
    } at { $fps } frames a second — that is { $T }.
plant-motion-board-shoot = the shoot’s speed over { $t }
plant-motion-board-trap-time = the closing time by the frames
plant-motion-board-trap = the speed of the trap’s edge
plant-motion-scene-frame = frame { $f } / { $n }
plant-motion-scene-magnified = magnified

plant-motion-why =
    A plant moves as it grows: the tip of a shoot gets a little higher every minute. The speed of its movement is found just as a snail’s or a car’s: v = Δh / Δt — how much the height changed, divided by the time. Only for a plant the time is taken long: hours, days. In a few seconds a bamboo tip moves by hundredths of a millimetre — the eye will not see it, but in photos taken hours apart it shows at once. That is how a time-lapse is made: a frame every few minutes, then shown quickly.

    Even one of the fastest bamboos grows slower than a snail crawling at { $snail }: moso bamboo grows up to { $day } a day — about { $bamboo }, { $ratio } times slower. Plants have quick movements too: a Venus flytrap’s trap shuts in about { $trap }.
plant-motion-say = { $grew ->
        [no] The photos were taken at the same moment — the shoot had no time to grow.
       *[yes] The bamboo’s tip moved up at { $v }, and the snail crawled at { $snail }. { $who ->
            [snail] The snail is { $times } times faster.
            [bamboo] The bamboo is { $times } times faster.
           *[same] Nearly the same.
        }
    }{ $trap ->
        [yes] { " " }And the edge of the flytrap’s trap moved at { $trapV } — { $trapTimes } times faster than the snail.
       *[no] {""}
    }
plant-motion-row = after { $t }: { $h }
plant-motion-row-trap = the trap — { $n } frames, { $v }
plant-motion-text = Measured:{ $rows }The shoot’s speed — { $v }.
