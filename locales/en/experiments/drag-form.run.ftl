## What the experiment says as it runs: its steps, board and answer. These texts come with the experiment when it opens; its card is in drag-form.ftl.

drag-form-command-apply = No such body or medium in the experiment.
drag-form-ball-name = the ball
drag-form-cube-name = the cube
drag-form-plate-name = the plate
drag-form-labdrag-say = And now the same ball is let go in the air — past the same marks — and filmed the same way.
drag-form-labdrag-button = ⚫ The ball in the air
drag-form-labdrag-plan = the ball in the air
drag-form-say-ball = Roll 5 g of plasticine into a ball and let it go at the water’s surface. We film it: the video’s frames will tell how long it takes between the marks.
drag-form-say-cube = The same lump of plasticine is moulded into a cube and let go the same way.
drag-form-say-plate = Now it is pressed into a flat square plate and let go lying flat.
drag-form-labdrag-button-2 = { $icon } { $n }{ $n2 } in water
drag-form-labdrag-plan-2 = { $n } in water
drag-form-answer-why =
    Moving, a body has to push the water in front of it aside, and behind it eddies swirl. The faster the body, the greater the drag — at these speeds it grows as the square of the speed. The body speeds up until the drag equals its weight less the buoyant force, and then goes steadily. The three bodies have the same mass and volume, so they go steadily under the same drag — only the speed at which it is reached differs. The ball is streamlined: the water flows smoothly round it, few eddies behind it, and its cross-section is small. The cube, a flat face first, breaks the flow at its edges, and there are more eddies: it shows the water even less area than the ball, and yet it is slower — here the form alone decides. The plate, lying flat, shows the water the largest area — so it is the slowest. The medium is another matter: the denser it is, the more mass the body has to push aside each second, so at the same speed water resists ≈ { $ratio } times more than air — as many times as it is denser.

    The model is simplified: in truth the plate rocks and slides aside, and the cube may tip over, so in a real experiment the times come out a little different. The drag coefficients were measured for smooth bodies; hand-moulded plasticine ones will differ.
drag-form-answer-say = The same mass — different speeds: the form and the medium decide!
drag-form-text-a = {" "}In the air the same ball covered 20 cm in { $air } — nearly as in free fall ({ $value }): the air hardly resists here.
drag-form-answer-text = In water between the marks: { $parts }. All bodies weigh the same, the buoyant force too, so moving steadily each meets the same drag: F = m·g − ρ·g·V ≈ { $Fd } N. But the plate reaches it at a low speed already, the ball only at the highest.{ $a } The drag F = C·ρ·v²·S / 2 depends on the body’s form (the drag coefficient C: ball { $value }, cube { $value2 }, plate { $value3 }), the area S it shows to the oncoming flow, and the medium’s density ρ.
drag-form-busy = The body sinks — the phone is filming…
drag-form-board-title = in the air
drag-form-board-title-2 = in water
drag-form-board-title-3 = { $shape } { $value }: { $frames } between the marks
drag-form-board-title-4 = the speed between the marks
drag-form-board-title-5 = the body goes steadily: the drag = the weight − the buoyant force
drag-form-board-formula = F_d = m·g − ρ_w·g·V
drag-form-view-air = air
drag-form-view-slow = slowed

## $medium — air, water; $shape — cube and the rest (feminine in Ukrainian).
drag-form-say-passed = { $name } { $medium ->
        [air] in the air
       *[water] in water
    } went between the marks in { $frames } — { $time }.
