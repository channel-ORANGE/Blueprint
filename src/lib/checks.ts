import type { Apartment, Furniture } from '@/components/plan'

export type DoorCheck = {
  doorId: string
  doorName: string
  doorWidth: number
  /** 'flat' = liegend/normal getragen, 'upright' = nur hochkant/gekippt, 'no' = passt nicht */
  result: 'flat' | 'upright' | 'no'
}

/**
 * Passt ein Möbel durch die Türen auf dem Weg in seinen Raum? Vereinfachte Regel für den Prototyp:
 * Tiefe < lichte Breite → normal, sonst Höhe < Breite → hochkant/gekippt.
 * V1 rechnet zusätzlich mit Diagonale/Kippmaß und Flurbreite.
 */
export function doorChecks(apartment: Apartment, f: Furniture): DoorCheck[] {
  const margin = 20 // 2 cm Luft für Hände und Zarge
  // Prototyp: Weg = Wohnungstür + Türen des Zielraums. V1 sucht den echten Weg über den Türgraphen.
  return apartment.rooms.flatMap((r) =>
    r.openings
      .filter((o) => o.kind === 'door' && (o.id === 'd-eingang' || r.id === f.roomId))
      .map((o) => ({
        doorId: o.id,
        doorName: o.id === 'd-eingang' ? 'Wohnungstür' : `Tür ${r.name}`,
        doorWidth: o.width,
        result: f.d + margin < o.width ? 'flat' : Math.min(f.h, f.w) + margin < o.width ? 'upright' : 'no',
      })),
  )
}

/** Überschneiden sich zwei Möbel? (Grundflächen, achsparallel) */
export function overlaps(a: Furniture, b: Furniture) {
  const box = (f: Furniture) => {
    const swap = f.rot === 90 || f.rot === 270
    const w = (swap ? f.d : f.w) / 2
    const h = (swap ? f.w : f.d) / 2
    return { x0: f.cx - w, x1: f.cx + w, y0: f.cy - h, y1: f.cy + h }
  }
  const p = box(a)
  const q = box(b)
  return p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1
}
