import type { MeasureStatus, Opening, Pt, Room } from '@/components/plan'

export type Shape = 'rect' | 'L'

/** Raum in der Skizze. Alle Längen in mm, Position = linke obere Ecke der Innenkontur. */
export type SketchRoom = {
  id: string
  name: string
  x: number
  y: number
  shape: Shape
  /** Platzhaltergröße, solange nicht gemessen. */
  defaultW: number
  defaultH: number
  /** Eingegebene Wandlängen, Index = Wand (im Uhrzeigersinn ab oben links). */
  lengths: (number | null)[]
  openings: Opening[]
}

export const WALL_THICKNESS = 115

export const wallCount = (shape: Shape) => (shape === 'rect' ? 4 : 6)

/** Startgröße aus dem Namen – damit die Skizze gleich plausibel aussieht. */
export function defaultSize(name: string): [number, number] {
  const n = name.toLowerCase()
  const table: [string, [number, number]][] = [
    ['wohn', [4500, 5000]],
    ['schlaf', [3500, 4000]],
    ['kind', [3000, 3500]],
    ['küche', [3000, 3500]],
    ['kueche', [3000, 3500]],
    ['bad', [2000, 2500]],
    ['wc', [1000, 1800]],
    ['flur', [1400, 4000]],
    ['diele', [1400, 4000]],
    ['arbeit', [3000, 3000]],
    ['büro', [3000, 3000]],
    ['abstell', [1500, 1500]],
    ['balkon', [4000, 1500]],
  ]
  return table.find(([k]) => n.includes(k))?.[1] ?? [3000, 3000]
}

type Derived = {
  w: number
  h: number
  /** Innenkontur in Weltkoordinaten (mm), im Uhrzeigersinn */
  polygon: Pt[]
  /** Länge jeder Wand (gemessen, berechnet oder Platzhalter) */
  wallLengths: number[]
  status: MeasureStatus[]
  measured: boolean
  /** Gegenüberliegende Wände widersprechen sich (Rechteck): [Wand a, Wand b, Differenz] */
  conflict?: [number, number, number]
}

/** Leitet aus den eingegebenen Maßen Form, Größe und Status jeder Wand ab. */
export function derive(r: SketchRoom): Derived {
  const L = r.lengths
  const known = (i: number) => L[i] != null

  if (r.shape === 'rect') {
    const w = L[0] ?? L[2] ?? r.defaultW
    const h = L[1] ?? L[3] ?? r.defaultH
    const status: MeasureStatus[] = [0, 1, 2, 3].map((i) => (known(i) ? 'measured' : known((i + 2) % 4) ? 'computed' : 'open'))
    let conflict: Derived['conflict']
    for (const [a, b] of [
      [0, 2],
      [1, 3],
    ]) {
      if (known(a) && known(b) && Math.abs(L[a]! - L[b]!) >= 10) conflict = [a, b, Math.abs(L[a]! - L[b]!)]
    }
    return {
      w,
      h,
      polygon: [
        { x: r.x, y: r.y },
        { x: r.x + w, y: r.y },
        { x: r.x + w, y: r.y + h },
        { x: r.x, y: r.y + h },
      ],
      wallLengths: [w, h, w, h],
      status,
      measured: (known(0) || known(2)) && (known(1) || known(3)),
      conflict,
    }
  }

  // L-Form: Aussparung unten rechts. Wände: 0 oben, 1 rechts, 2 Absatz waagrecht, 3 Absatz senkrecht, 4 unten, 5 links.
  const W = L[0] ?? (L[4] != null && L[2] != null ? L[4] + L[2] : r.defaultW)
  const H = L[5] ?? (L[1] != null && L[3] != null ? L[1] + L[3] : r.defaultH)
  const nw = L[2] ?? (L[4] != null ? W - L[4] : Math.round(W * 0.4))
  const nh = L[3] ?? (L[1] != null ? H - L[1] : Math.round(H * 0.4))
  const lengths = [W, H - nh, nw, nh, W - nw, H]
  const W_ok = known(0) || (known(4) && known(2))
  const H_ok = known(5) || (known(1) && known(3))
  const nw_ok = known(2) || (known(4) && W_ok)
  const nh_ok = known(3) || (known(1) && H_ok)
  const ok = [W_ok, H_ok && nh_ok, nw_ok, nh_ok, W_ok && nw_ok, H_ok]
  return {
    w: W,
    h: H,
    polygon: [
      { x: r.x, y: r.y },
      { x: r.x + W, y: r.y },
      { x: r.x + W, y: r.y + H - nh },
      { x: r.x + W - nw, y: r.y + H - nh },
      { x: r.x + W - nw, y: r.y + H },
      { x: r.x, y: r.y + H },
    ],
    wallLengths: lengths,
    status: lengths.map((_, i) => (known(i) ? 'measured' : ok[i] ? 'computed' : 'open')),
    measured: W_ok && H_ok && nw_ok && nh_ok,
  }
}

/** Für die Zeichenkomponenten (PlanView-Teile) */
export function toPlanRoom(r: SketchRoom, d = derive(r)): Room {
  return { id: r.id, name: r.name, polygon: d.polygon, openings: r.openings, wallStatus: d.status }
}

/** Wandbezeichnung, wie man sie vor Ort sieht (Plan: oben = Norden der Skizze). */
export function wallName(shape: Shape, i: number) {
  const rect = ['oben', 'rechts', 'unten', 'links']
  const l = ['oben', 'rechts', 'Ecke waagrecht', 'Ecke senkrecht', 'unten', 'links']
  return `Wand ${(shape === 'rect' ? rect : l)[i]}`
}

/** Raum als Rechtecke (L-Form = 2 Rechtecke) – für die Überlappungsprüfung. */
export function rects(r: SketchRoom) {
  const d = derive(r)
  if (r.shape === 'rect') return [{ id: r.id, x: r.x, y: r.y, w: d.w, h: d.h }]
  const [W, right, nw, nh] = d.wallLengths
  return [
    { id: r.id, x: r.x, y: r.y, w: W, h: right },
    { id: r.id, x: r.x, y: r.y + right, w: W - nw, h: nh },
  ]
}

export const box = (r: SketchRoom) => {
  const d = derive(r)
  return { id: r.id, x: r.x, y: r.y, w: d.w, h: d.h }
}
