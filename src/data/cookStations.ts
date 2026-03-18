// src/data/cookStations.ts

export interface CookStation {
  name: string
  x: number    // center X of the station art in the background
  workX: number // X where a cook stands when "at" this station
  workY: number // Y where a cook stands when "at" this station
}

// Back counter stations (y≈210 work position, in front of the counter)
// Middle island stations (y≈295 work position, south face of island)
// Floor/wall stations (y≈330 work position)
export const COOK_STATIONS: CookStation[] = [
  { name: 'stove_left',    x: 80,   workX: 80,   workY: 210 },
  { name: 'sink',          x: 240,  workX: 240,  workY: 210 },
  { name: 'spice_rack',    x: 420,  workX: 420,  workY: 210 },
  { name: 'herb_bundles',  x: 580,  workX: 580,  workY: 210 },
  { name: 'fridge',        x: 760,  workX: 760,  workY: 210 },
  { name: 'stove_right',   x: 920,  workX: 920,  workY: 210 },
  { name: 'cauldron',      x: 300,  workX: 300,  workY: 295 },
  { name: 'cutting_board', x: 560,  workX: 560,  workY: 295 },
  { name: 'mortar_pestle', x: 820,  workX: 820,  workY: 295 },
  { name: 'barrel_rack',   x: 160,  workX: 160,  workY: 330 },
  { name: 'oven',          x: 1100, workX: 1100, workY: 330 },
]
