import type { Furniture, Pt, Room, Side } from './types'

export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
export const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k })
export const len = (a: Pt) => Math.hypot(a.x, a.y)
export const norm = (a: Pt): Pt => {
  const l = len(a) || 1
  return { x: a.x / l, y: a.y / l }
}

export type Edge = { a: Pt; b: Pt; dir: Pt; length: number; inward: Pt; outward: Pt }

/** Wände eines Raums. Bei Uhrzeigersinn in Bildschirmkoordinaten liegt das Rauminnere rechts der Laufrichtung. */
export function edges(polygon: Pt[]): Edge[] {
  return polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length]
    const v = sub(b, a)
    const dir = norm(v)
    return {
      a,
      b,
      dir,
      length: len(v),
      inward: { x: -dir.y, y: dir.x },
      outward: { x: dir.y, y: -dir.x },
    }
  })
}

function intersectLines(p1: Pt, d1: Pt, p2: Pt, d2: Pt): Pt {
  const det = d1.x * d2.y - d1.y * d2.x
  if (Math.abs(det) < 1e-9) return p2
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / det
  return add(p1, mul(d1, t))
}

/** Polygon um `dist` nach außen versetzt (für Wandbänder). */
export function outset(polygon: Pt[], dist: number): Pt[] {
  const es = edges(polygon)
  return es.map((e, i) => {
    const prev = es[(i - 1 + es.length) % es.length]
    return intersectLines(add(prev.a, mul(prev.outward, dist)), prev.dir, add(e.a, mul(e.outward, dist)), e.dir)
  })
}

export const toPath = (pts: Pt[]) => `M${pts.map((p) => `${p.x},${p.y}`).join('L')}Z`

export function bounds(pts: Pt[]) {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }
}

/** Fläche in m² (Polygon in mm). */
export function area(polygon: Pt[]) {
  let s = 0
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]
    s += p.x * q.y - q.x * p.y
  })
  return Math.abs(s) / 2 / 1e6
}

export function centroid(polygon: Pt[]): Pt {
  let a = 0
  let cx = 0
  let cy = 0
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]
    const f = p.x * q.y - q.x * p.y
    a += f
    cx += (p.x + q.x) * f
    cy += (p.y + q.y) * f
  })
  a /= 2
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

/** Viertelkreis-Bogen als Punktliste (vermeidet Sweep-Flag-Fehler bei SVG-Arcs). */
export function arcPoints(center: Pt, from: Pt, to: Pt, steps = 16): Pt[] {
  const r = len(sub(from, center))
  const a0 = Math.atan2(from.y - center.y, from.x - center.x)
  let a1 = Math.atan2(to.y - center.y, to.x - center.x)
  let da = a1 - a0
  while (da > Math.PI) da -= 2 * Math.PI
  while (da < -Math.PI) da += 2 * Math.PI
  a1 = a0 + da
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = a0 + (da * i) / steps
    return { x: center.x + r * Math.cos(t), y: center.y + r * Math.sin(t) }
  })
}

/** Achsparallele Grundfläche eines Möbels nach Drehung. */
export function footprint(f: Furniture) {
  const swap = f.rot === 90 || f.rot === 270
  const w = swap ? f.d : f.w
  const h = swap ? f.w : f.d
  return { minX: f.cx - w / 2, maxX: f.cx + w / 2, minY: f.cy - h / 2, maxY: f.cy + h / 2, w, h }
}

/**
 * Abstand von einem Punkt in eine Achsrichtung bis zur nächsten Wand des Raums.
 * Reicht für V1, weil nur 90°-Winkel erlaubt sind.
 */
export function distanceToWall(room: Room, from: Pt, side: Side): number | null {
  let best: number | null = null
  for (const e of edges(room.polygon)) {
    const vertical = Math.abs(e.a.x - e.b.x) < 1
    const horizontal = Math.abs(e.a.y - e.b.y) < 1
    if ((side === 'left' || side === 'right') && vertical) {
      const [y0, y1] = [Math.min(e.a.y, e.b.y), Math.max(e.a.y, e.b.y)]
      if (from.y < y0 || from.y > y1) continue
      const d = side === 'left' ? from.x - e.a.x : e.a.x - from.x
      if (d >= -1 && (best === null || d < best)) best = d
    }
    if ((side === 'top' || side === 'bottom') && horizontal) {
      const [x0, x1] = [Math.min(e.a.x, e.b.x), Math.max(e.a.x, e.b.x)]
      if (from.x < x0 || from.x > x1) continue
      const d = side === 'top' ? from.y - e.a.y : e.a.y - from.y
      if (d >= -1 && (best === null || d < best)) best = d
    }
  }
  return best === null ? null : Math.max(0, best)
}

export function furnitureDistances(room: Room, f: Furniture) {
  const fp = footprint(f)
  const midY = (fp.minY + fp.maxY) / 2
  const midX = (fp.minX + fp.maxX) / 2
  return {
    left: { from: { x: fp.minX, y: midY }, d: distanceToWall(room, { x: fp.minX, y: midY }, 'left') },
    right: { from: { x: fp.maxX, y: midY }, d: distanceToWall(room, { x: fp.maxX, y: midY }, 'right') },
    top: { from: { x: midX, y: fp.minY }, d: distanceToWall(room, { x: midX, y: fp.minY }, 'top') },
    bottom: { from: { x: midX, y: fp.maxY }, d: distanceToWall(room, { x: midX, y: fp.maxY }, 'bottom') },
  } satisfies Record<Side, { from: Pt; d: number | null }>
}
