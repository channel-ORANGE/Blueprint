import type { Apartment, Room } from '@/components/plan/types'

/**
 * Beispielwohnung „Lindenstraße 12, 2. OG“ – alle Maße in mm.
 * Innenwände 11,5 cm; Räume sind über Türen aneinander „angebaut“.
 */
export const apartment: Apartment = {
  id: 'linden12',
  name: 'Lindenstraße 12',
  wallThickness: 115,
  rooms: [
    {
      id: 'wohnen',
      name: 'Wohnzimmer',
      ceiling: 2600,
      polygon: [
        { x: 0, y: 0 },
        { x: 4800, y: 0 },
        { x: 4800, y: 4500 },
        { x: 0, y: 4500 },
      ],
      wallStatus: ['measured', 'measured', 'measured', 'measured'],
      openings: [
        { id: 'd-wohnen', kind: 'door', wall: 1, offset: 3590, width: 885, hinge: 'end', swing: 'in', status: 'estimated' },
        { id: 'w-wohnen-1', kind: 'window', wall: 0, offset: 700, width: 1600, status: 'measured' },
        { id: 'w-wohnen-2', kind: 'window', wall: 0, offset: 3000, width: 1200, status: 'measured' },
      ],
    },
    {
      id: 'kueche',
      name: 'Küche',
      ceiling: 2600,
      polygon: [
        { x: 0, y: 4615 },
        { x: 4800, y: 4615 },
        { x: 4800, y: 6100 },
        { x: 2600, y: 6100 },
        { x: 2600, y: 7300 },
        { x: 0, y: 7300 },
      ],
      wallStatus: ['measured', 'measured', 'measured', 'measured', 'measured', 'computed'],
      openings: [
        { id: 'd-kueche', kind: 'door', wall: 1, offset: 300, width: 885, hinge: 'start', swing: 'in', status: 'measured' },
        { id: 'w-kueche-1', kind: 'window', wall: 5, offset: 900, width: 1200, status: 'measured' },
        { id: 'w-kueche-2', kind: 'window', wall: 4, offset: 600, width: 1000, status: 'estimated' },
      ],
    },
    {
      id: 'schlafen',
      name: 'Schlafzimmer',
      ceiling: 2600,
      polygon: [
        { x: 4915, y: 0 },
        { x: 8515, y: 0 },
        { x: 8515, y: 3450 },
        { x: 4915, y: 3450 },
      ],
      wallStatus: ['measured', 'measured', 'measured', 'measured'],
      openings: [
        { id: 'd-schlafen', kind: 'door', wall: 2, offset: 2430, width: 885, hinge: 'end', swing: 'in', status: 'measured' },
        { id: 'w-schlafen', kind: 'window', wall: 0, offset: 1100, width: 1400, status: 'measured' },
      ],
    },
    {
      id: 'flur',
      name: 'Flur',
      ceiling: 2600,
      polygon: [
        { x: 4915, y: 3565 },
        { x: 6315, y: 3565 },
        { x: 6315, y: 7300 },
        { x: 4915, y: 7300 },
      ],
      wallStatus: ['measured', 'measured', 'measured', 'measured'],
      openings: [{ id: 'd-eingang', kind: 'door', wall: 2, offset: 200, width: 1010, hinge: 'start', swing: 'in', status: 'measured' }],
    },
    {
      id: 'bad',
      name: 'Bad',
      ceiling: 2500,
      polygon: [
        { x: 6430, y: 3565 },
        { x: 8515, y: 3565 },
        { x: 8515, y: 5765 },
        { x: 6430, y: 5765 },
      ],
      wallStatus: ['measured', 'measured', 'measured', 'estimated'],
      openings: [
        { id: 'd-bad', kind: 'door', wall: 3, offset: 380, width: 785, hinge: 'start', swing: 'in', status: 'estimated' },
        { id: 'w-bad', kind: 'window', wall: 1, offset: 700, width: 800, status: 'measured' },
      ],
    },
  ],
  furniture: [
    // Wohnzimmer
    { id: 'sofa', roomId: 'wohnen', kind: 'sofa', name: 'Sofa', cx: 2100, cy: 3875, w: 2200, d: 950, h: 850, rot: 180, fit: 'ok' },
    { id: 'couchtisch', roomId: 'wohnen', kind: 'table', name: 'Couchtisch', cx: 2100, cy: 2850, w: 1100, d: 600, h: 420, rot: 0, fit: 'ok' },
    { id: 'tv', roomId: 'wohnen', kind: 'tv', name: 'TV-Board', cx: 200, cy: 2600, w: 1800, d: 400, h: 500, rot: 270, fit: 'ok' },
    { id: 'regal', roomId: 'wohnen', kind: 'shelf', name: 'Regal', cx: 4625, cy: 1300, w: 800, d: 350, h: 1900, rot: 90, fit: 'ok' },
    { id: 'sessel', roomId: 'wohnen', kind: 'chair', name: 'Sessel', cx: 3950, cy: 2900, w: 800, d: 800, h: 900, rot: 90, fit: 'tight' },
    // Schlafzimmer
    { id: 'bett', roomId: 'schlafen', kind: 'bed', name: 'Bett 160×200', cx: 7515, cy: 1725, w: 1600, d: 2000, h: 450, rot: 90, fit: 'ok' },
    { id: 'schrank', roomId: 'schlafen', kind: 'wardrobe', name: 'Kleiderschrank', cx: 5215, cy: 1400, w: 2000, d: 600, h: 2200, rot: 270, frontClearance: 700, fit: 'ok' },
    // Küche
    { id: 'zeile', roomId: 'kueche', kind: 'kitchen', name: 'Küchenzeile', cx: 1400, cy: 4915, w: 2800, d: 600, h: 900, rot: 0, fit: 'ok' },
    { id: 'esstisch', roomId: 'kueche', kind: 'table', name: 'Esstisch', cx: 1300, cy: 6350, w: 1200, d: 800, h: 750, rot: 0, fit: 'ok' },
    // Bad
    { id: 'wanne', roomId: 'bad', kind: 'bathtub', name: 'Badewanne', cx: 7280, cy: 3940, w: 1700, d: 750, h: 600, rot: 0, fit: 'ok' },
    { id: 'wc', roomId: 'bad', kind: 'wc', name: 'WC', cx: 8000, cy: 5440, w: 400, d: 650, h: 400, rot: 180, fit: 'ok' },
    { id: 'waschtisch', roomId: 'bad', kind: 'sink', name: 'Waschtisch', cx: 8290, cy: 4700, w: 600, d: 450, h: 850, rot: 90, fit: 'ok' },
    // Flur – Garderobe ragt in den Schwenkbereich der Wohnungstür
    { id: 'garderobe', roomId: 'flur', kind: 'shelf', name: 'Garderobe', cx: 5090, cy: 6600, w: 1200, d: 350, h: 1800, rot: 270, fit: 'bad' },
  ],
}

export const roomById = (id: string) => apartment.rooms.find((r) => r.id === id)!

/**
 * Raum im Aufmaß (Vorlage „Rechteck“). Wand 1 ist die Türwand, danach im Uhrzeigersinn.
 * Wand 1 gemessen, Wand 2 wird gerade eingegeben, Wand 3 ergibt sich aus Wand 1.
 */
export const measuringRoom: Room = {
  id: 'schlafen-aufmass',
  name: 'Schlafzimmer',
  ceiling: 2600,
  polygon: [
    { x: 3600, y: 3450 },
    { x: 0, y: 3450 },
    { x: 0, y: 0 },
    { x: 3600, y: 0 },
  ],
  wallStatus: ['measured', 'open', 'computed', 'open'],
  openings: [{ id: 'd-aufmass', kind: 'door', wall: 0, offset: 2430, width: 885, hinge: 'end', swing: 'in', status: 'estimated' }],
}
