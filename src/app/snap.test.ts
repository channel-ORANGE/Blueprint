import { describe, expect, it } from 'vitest'

import { derive, type SketchRoom } from './rooms'
import { collisions, placeNew, pushNeighbors, snap, type Box } from './snap'

const gap = 115
const living: Box = { id: 'a', x: 0, y: 0, w: 4500, h: 5000 }

describe('snap', () => {
  it('rastet mit Wandstärke rechts an', () => {
    const hall: Box = { id: 'b', x: 4700, y: 100, w: 1400, h: 4000 }
    expect(snap(hall, [living], gap, 300)).toEqual({ x: 4615, y: 0 })
  })

  it('ignoriert weit entfernte Räume', () => {
    const far: Box = { id: 'b', x: 9000, y: 9000, w: 1000, h: 1000 }
    expect(snap(far, [living], gap, 300)).toEqual({ x: 9000, y: 9000 })
  })
})

describe('collisions', () => {
  it('meldet Räume, deren Wände sich überschneiden würden', () => {
    const tooClose: Box = { id: 'b', x: 4550, y: 0, w: 1000, h: 1000 }
    expect([...collisions([living, tooClose], gap)].sort()).toEqual(['a', 'b'])
  })

  it('erlaubt Räume im Abstand einer Wandstärke', () => {
    const ok: Box = { id: 'b', x: 4615, y: 0, w: 1000, h: 1000 }
    expect(collisions([living, ok], gap).size).toBe(0)
  })
})

describe('pushNeighbors', () => {
  it('schiebt angeklebte Räume rekursiv mit, lose Räume nicht', () => {
    const hall: Box = { id: 'b', x: 4615, y: 0, w: 1400, h: 4000 }
    const bath: Box = { id: 'c', x: 6130, y: 0, w: 2000, h: 2500 }
    const loose: Box = { id: 'd', x: 4615, y: 9000, w: 1000, h: 1000 }
    const shifts = pushNeighbors([living, hall, bath, loose], 'a', 300, 0, gap)
    expect(shifts.get('b')).toEqual({ dx: 300, dy: 0 })
    expect(shifts.get('c')).toEqual({ dx: 300, dy: 0 })
    expect(shifts.has('d')).toBe(false)
  })
})

describe('placeNew', () => {
  it('setzt den ersten Raum mittig, weitere rechts daneben', () => {
    expect(placeNew([], 3000, 2000)).toEqual({ x: -1500, y: -1000 })
    expect(placeNew([living], 3000, 2000)).toEqual({ x: 5500, y: 0 })
  })
})

describe('derive', () => {
  const base: SketchRoom = { id: 'r', name: 'Test', x: 0, y: 0, shape: 'rect', defaultW: 3000, defaultH: 3000, lengths: [null, null, null, null], openings: [] }

  it('Rechteck ist mit 2 Maßen fertig, die anderen beiden sind berechnet', () => {
    const d = derive({ ...base, lengths: [4800, 4500, null, null] })
    expect(d.measured).toBe(true)
    expect(d.status).toEqual(['measured', 'measured', 'computed', 'computed'])
    expect([d.w, d.h]).toEqual([4800, 4500])
  })

  it('meldet widersprüchliche gegenüberliegende Wände', () => {
    expect(derive({ ...base, lengths: [3600, 3450, 3570, null] }).conflict).toEqual([0, 2, 30])
  })

  it('L-Form braucht 4 Maße', () => {
    const l: SketchRoom = { ...base, shape: 'L', lengths: [5000, 2000, null, null, 3000, 4000] }
    const d = derive(l)
    expect(d.measured).toBe(true)
    expect(d.wallLengths).toEqual([5000, 2000, 2000, 2000, 3000, 4000])
  })
})
