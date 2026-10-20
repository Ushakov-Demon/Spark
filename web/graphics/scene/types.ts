/** What the lab scene can show: devices, vessel shapes, kinds of liquid. */
export type DeviceKind =
  | 'none'
  | 'hotplate'
  | 'induction'
  | 'gas'
  | 'bunsen'
  | 'spirit'
  | 'immersion'
  | 'fridge'
  | 'freezer'
  | 'ice-bath'
  | 'ice-salt-bath'
  | 'supply';
export type VesselShape = 'pot' | 'turka' | 'beaker' | 'calorimeter' | 'cylinder' | 'flask-conical' | 'flask-round' | 'test-tube';
export type LiquidKind = 'water' | 'salt' | 'alcohol' | 'acid' | 'oil' | 'other';
