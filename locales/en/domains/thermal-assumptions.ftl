## thermal-assumptions
thermal-assumptions-thermal-lumped-text-novice = We assume all the water in the vessel has the same temperature — as if it were stirred all the time.
thermal-assumptions-thermal-lumped-text-school = Each body has a single temperature throughout. In reality the water near the bottom of the vessel is hotter than at the top.
thermal-assumptions-thermal-lumped-text-advanced = Each body is one point with one temperature. Works well for small or well-mixed bodies.
thermal-assumptions-thermal-lumped-text-expert = Lumped-capacitance model. Valid for Biot number Bi = hL/k ≲ 0.1; large solids need a mesh (distributed temperature field).
thermal-assumptions-thermal-phases-text-novice = The evaporation rate in the model is approximate: the real one also depends on how the air moves.
thermal-assumptions-thermal-phases-text-school = Pressure is normal atmospheric (the boiling point depends on it). The evaporation rate is an order-of-magnitude estimate. The latent heat of vaporisation changes with temperature; the model interpolates between two table points.
thermal-assumptions-thermal-phases-text-expert = Enthalpy model with phase plateaus; boiling from the enthalpy excess over the liquid at the boiling point; evaporation via the Chilton–Colburn analogy (Le^(2/3) ≈ 0.9), constant air density; condensation from humid air onto the liquid is ignored.
thermal-assumptions-thermal-constant-properties-text-school = Heat capacity and conductivity are treated as constants, although in reality they change slightly with temperature.
thermal-assumptions-thermal-constant-properties-text-expert = c and k are constants at ~20–25 °C (see the materials table); their temperature dependence is ignored.
thermal-assumptions-thermal-linear-transfer-text-school = Heat loss to the air is described by one number, the heat transfer coefficient. Evaporation and radiation are not counted separately.
thermal-assumptions-thermal-linear-transfer-text-expert = Convection and radiation are lumped into a linear conductance G = hA; h is an estimate independent of the temperature difference (real natural convection is non-linear).
thermal-assumptions-thermal-numerics-text-school = The computer does not calculate continuously but in very small time steps — just as a video is made of frames.
thermal-assumptions-thermal-numerics-text-expert = Explicit Euler with automatic sub-stepping h ≤ 0.5·min(Cᵢ/ΣGᵢⱼ) (stability condition). Link flows are antisymmetric, so energy is conserved to machine precision; time error is O(h).
