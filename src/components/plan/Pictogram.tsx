import { PlanView } from './PlanView'
import type { Pt, Room } from './types'

export type RoomShape = 'rect' | 'L' | 'free'

const shapes: Record<RoomShape, Pt[]> = {
  rect: [
    { x: 0, y: 0 },
    { x: 1400, y: 0 },
    { x: 1400, y: 1000 },
    { x: 0, y: 1000 },
  ],
  L: [
    { x: 0, y: 0 },
    { x: 1400, y: 0 },
    { x: 1400, y: 600 },
    { x: 700, y: 600 },
    { x: 700, y: 1100 },
    { x: 0, y: 1100 },
  ],
  free: [
    { x: 0, y: 0 },
    { x: 900, y: 0 },
    { x: 900, y: 250 },
    { x: 1400, y: 250 },
    { x: 1400, y: 1100 },
    { x: 400, y: 1100 },
    { x: 400, y: 800 },
    { x: 0, y: 800 },
  ],
}

export type PictogramProps =
  | { variant: 'shape'; shape: RoomShape; className?: string }
  | { variant: 'door'; hinge: 'start' | 'end'; swing: 'in' | 'out'; className?: string }

/**
 * Mini-Plan als Piktogramm – gezeichnet mit derselben Komponente wie der Grundriss,
 * damit Auswahl und Ergebnis garantiert gleich aussehen.
 * Tür-Variante: Blick von innen auf die Türwand (unten), Raum liegt oberhalb.
 */
export function Pictogram(props: PictogramProps) {
  const room: Room =
    props.variant === 'shape'
      ? { id: 'p', name: '', polygon: shapes[props.shape], openings: [] }
      : {
          id: 'p',
          name: '',
          polygon: shapes.rect,
          openings: [{ id: 'd', kind: 'door', wall: 2, offset: 350, width: 700, hinge: props.hinge, swing: props.swing }],
        }
  return <PlanView rooms={[room]} wallThickness={110} padding={props.variant === 'door' ? 820 : 140} className={props.className} />
}
