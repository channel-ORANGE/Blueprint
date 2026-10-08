// Reine Geometrie für die Skizze: Einrasten, Überlappung, Nachbarn mitschieben.
// Räume werden dafür als achsparallele Boxen (Innenmaße, mm) betrachtet.

export type Box = { id: string; x: number; y: number; w: number; h: number }

const overlap1d = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0)

/**
 * Rastet eine Box an Nachbarn ein: Abstand = Wandstärke (Raum an Raum) oder bündige Kanten.
 * Kandidaten gelten nur, wenn die Boxen sich in der anderen Achse (fast) überdecken.
 */
export function snap(moving: Box, others: Box[], gap: number, tol: number): { x: number; y: number } {
  let bestX: { v: number; d: number } | null = null
  let bestY: { v: number; d: number } | null = null
  const { x, y, w, h } = moving
  for (const o of others) {
    if (o.id === moving.id) continue
    if (overlap1d(y, y + h, o.y, o.y + o.h) > -tol) {
      for (const v of [o.x + o.w + gap, o.x - gap - w, o.x, o.x + o.w - w]) {
        const d = Math.abs(v - x)
        if (d <= tol && (!bestX || d < bestX.d)) bestX = { v, d }
      }
    }
    if (overlap1d(x, x + w, o.x, o.x + o.w) > -tol) {
      for (const v of [o.y + o.h + gap, o.y - gap - h, o.y, o.y + o.h - h]) {
        const d = Math.abs(v - y)
        if (d <= tol && (!bestY || d < bestY.d)) bestY = { v, d }
      }
    }
  }
  return { x: bestX?.v ?? x, y: bestY?.v ?? y }
}

/** Kommen sich zwei Räume näher als eine Wandstärke? (Wände würden sich überschneiden) */
export function collides(a: Box, b: Box, gap: number) {
  const eps = 5
  return overlap1d(a.x, a.x + a.w, b.x, b.x + b.w) > -gap + eps && overlap1d(a.y, a.y + a.h, b.y, b.y + b.h) > -gap + eps
}

export function collisions(boxes: Box[], gap: number): Set<string> {
  const hit = new Set<string>()
  boxes.forEach((a, i) =>
    boxes.slice(i + 1).forEach((b) => {
      if (collides(a, b, gap)) {
        hit.add(a.id)
        hit.add(b.id)
      }
    }),
  )
  return hit
}

/**
 * Ein Raum ändert seine Größe (verankert oben links). Räume, die rechts bzw. unten an ihm
 * „kleben“, rücken um die Differenz mit – und alles, was wiederum an ihnen klebt.
 * Gibt die Verschiebung je Raum-ID zurück.
 */
export function pushNeighbors(boxes: Box[], id: string, dw: number, dh: number, gap: number, tol = 20): Map<string, { dx: number; dy: number }> {
  const shifts = new Map<string, { dx: number; dy: number }>()
  const byId = new Map(boxes.map((b) => [b.id, b]))
  const add = (bid: string, dx: number, dy: number) => {
    const s = shifts.get(bid) ?? { dx: 0, dy: 0 }
    shifts.set(bid, { dx: s.dx + dx, dy: s.dy + dy })
  }

  const propagate = (axis: 'x' | 'y', delta: number) => {
    if (!delta) return
    const visited = new Set<string>([id])
    // Quelle: rechte bzw. untere Kante des Raums vor der Änderung
    const queue: Box[] = [byId.get(id)!]
    while (queue.length) {
      const src = queue.shift()!
      for (const o of boxes) {
        if (visited.has(o.id)) continue
        const attached =
          axis === 'x'
            ? Math.abs(o.x - (src.x + src.w + gap)) <= tol && overlap1d(src.y, src.y + src.h, o.y, o.y + o.h) > 0
            : Math.abs(o.y - (src.y + src.h + gap)) <= tol && overlap1d(src.x, src.x + src.w, o.x, o.x + o.w) > 0
        if (attached) {
          visited.add(o.id)
          add(o.id, axis === 'x' ? delta : 0, axis === 'y' ? delta : 0)
          queue.push(o)
        }
      }
    }
  }
  propagate('x', dw)
  propagate('y', dh)
  return shifts
}

/** Freier Platz für einen neuen Raum: rechts neben allem, oben bündig. */
export function placeNew(boxes: Box[], w: number, h: number, spacing = 1000): { x: number; y: number } {
  if (!boxes.length) return { x: -Math.round(w / 2), y: -Math.round(h / 2) }
  const right = Math.max(...boxes.map((b) => b.x + b.w))
  const top = Math.min(...boxes.map((b) => b.y))
  return { x: right + spacing, y: top }
}
