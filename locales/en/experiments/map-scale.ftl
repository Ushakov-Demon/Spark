## A distance by the map: the scale (grade 7, mechanical motion).
## $scale — «1 : 2,000,000»; $from, $to — the towns' names; lengths come with their units.

map-scale-title = A distance by the map: the scale
map-scale-ask = On which map does the distance between the towns come out more precisely?
map-scale-question = Two maps: { $scale1 } and { $scale2 }. On each we measure the distance from { $from } to { $to } with a ruler and convert it to kilometres by the scale, then compare with the real distance — by the towns’ coordinates. { map-scale-ask }
map-scale-setup = Two maps of different scales, a ruler

map-scale-choice-large = On the larger-scale map (smaller N): a millimetre of the ruler is fewer kilometres there
map-scale-choice-small = On the smaller-scale map: the towns are closer there, easier to measure
map-scale-choice-same = The same: the scale converts exactly anyway

map-scale-aside-beauplan = In 1648 the French engineer and cartographer Guillaume Le Vasseur de Beauplan published the «General Map of the Wild Fields, in common speech Ukraine», with its borders drawn in detail. Later the Dutchman Willem Hondius engraved two of his maps — at scales of 1 : 452,000 and 1 : 1,800,000. And in 1660 Beauplan published his book «Description d’Ukranie».

map-scale-from = From
map-scale-to = To
map-scale-scale1 = The first map, 1 :
map-scale-scale2 = The second map, 1 :

map-scale-no-towns = Choose two towns.
map-scale-bad-scale = A scale of 1 : N — N is at least 1.
map-scale-same-place = That is the same place — choose two different towns.

map-scale-step-say = A map at { $scale }: lay the ruler from { $from } to { $to }. How many millimetres?
map-scale-step-button = 📏 The map at { $scale }
map-scale-step-plan = measure on the map at { $scale }
map-scale-busy = Laying the ruler on…
map-scale-said = On the map — { $onMap }, that is ≈ { $ground } on the ground (a millimetre of the ruler is { $mm } here, an error of ± { $error }).
map-scale-board = the map at { $scale }

map-scale-why =
    A scale of 1 : N means everything on the map is N times smaller than on the ground, so the distance L = l·N. The conversion itself is exact — but the ruler is not: by eye we read it to a millimetre, so we are off by half a millimetre one way or the other. On the map this error is multiplied by N too. On a 1 : 2,000,000 map a millimetre is 2 km, on 1 : 10,000,000 already 10 km. So the larger the scale (the smaller N), the more precise the distance — and the more detail the map holds. But a small-scale map holds more ground.

    The real distance between towns is reckoned from their latitudes and longitudes — as an arc on the ball of the Earth. The way by road is longer: roads do not run straight.
map-scale-say = The real distance { $towns } is { $truth }: the { $nearer ->
        [first] first
       *[second] second
    } map comes nearer.
map-scale-row = { $scale }: { $onMap } on the map → { $ground } ± { $error }
map-scale-text = { $towns }:{ $rows }. The real distance by the coordinates is { $truth } (over the Earth’s surface, a mean radius of { $radius } km; the map’s distortions left out).
