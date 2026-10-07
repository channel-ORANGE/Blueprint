// Alle Längen in Millimetern. Koordinatensystem wie SVG: x nach rechts, y nach unten.

export type Pt = { x: number; y: number }

/** Herkunft eines Maßes – steuert die Darstellung (gemessen = durchgezogen, geschätzt = gestrichelt). */
export type MeasureStatus = 'measured' | 'estimated' | 'computed' | 'open'

export type OpeningKind = 'door' | 'window' | 'passage'

export type Opening = {
  id: string
  kind: OpeningKind
  /** Index der Wand im Raumpolygon (Wand i läuft von polygon[i] nach polygon[i+1]). */
  wall: number
  /** Abstand vom Wandanfang bis zur Öffnung. */
  offset: number
  width: number
  /** Tür: Band am Wandanfang ('start') oder -ende ('end'). */
  hinge?: 'start' | 'end'
  /** Tür: schlägt in diesen Raum ('in') oder in den Nachbarraum ('out'). */
  swing?: 'in' | 'out'
  status?: MeasureStatus
}

export type Room = {
  id: string
  name: string
  /** Innenkontur im Uhrzeigersinn (Bildschirmkoordinaten). */
  polygon: Pt[]
  openings: Opening[]
  /** Status je Wand, gleiche Reihenfolge wie die Wände. */
  wallStatus?: MeasureStatus[]
  ceiling?: number
}

export type FurnitureKind =
  | 'sofa'
  | 'bed'
  | 'table'
  | 'chair'
  | 'wardrobe'
  | 'shelf'
  | 'tv'
  | 'kitchen'
  | 'bathtub'
  | 'wc'
  | 'sink'
  | 'generic'

export type Fit = 'ok' | 'tight' | 'bad'

export type Furniture = {
  id: string
  roomId: string
  kind: FurnitureKind
  name: string
  /** Mittelpunkt */
  cx: number
  cy: number
  /** Breite (entlang der Vorderkante) und Tiefe */
  w: number
  d: number
  h: number
  /** Drehung in Grad, Vorderkante zeigt bei 0° nach unten (+y). */
  rot: 0 | 90 | 180 | 270
  /** Bewegungsfläche vor der Vorderkante (z. B. Schranktüren). */
  frontClearance?: number
  fit?: Fit
}

export type Apartment = {
  id: string
  name: string
  wallThickness: number
  rooms: Room[]
  furniture: Furniture[]
}

export type Side = 'left' | 'right' | 'top' | 'bottom'
