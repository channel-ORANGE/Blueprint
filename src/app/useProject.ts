import { useEffect, useState } from 'react'

import type { Opening } from '@/components/plan'
import { box, defaultSize, derive, rects, WALL_THICKNESS, wallCount, type Shape, type SketchRoom } from './rooms'
import { collisions, placeNew, pushNeighbors, snap } from './snap'

type Project = { name: string; rooms: SketchRoom[] }

const STORAGE_KEY = 'blueprint.project.v2'
const empty: Project = { name: 'Meine Wohnung', rooms: [] }

function load(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Project) : empty
  } catch {
    return empty
  }
}

const uid = () => Math.random().toString(36).slice(2, 9)

/** Projektzustand der Skizze inkl. Undo/Redo und lokaler Speicherung. */
export function useProject() {
  const [project, setProject] = useState<Project>(load)
  const [past, setPast] = useState<Project[]>([])
  const [future, setFuture] = useState<Project[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    } catch {
      // Speichern ist hier nur Komfort – ohne Speicher läuft die App trotzdem.
    }
  }, [project])

  /** Aktuellen Stand als Undo-Schritt merken (vor einer Änderung aufrufen). */
  const snapshot = () => {
    setPast((p) => [...p.slice(-49), project])
    setFuture([])
  }
  const commit = (next: Project) => {
    snapshot()
    setProject(next)
  }
  const updateRoom = (id: string, fn: (r: SketchRoom) => SketchRoom) => (p: Project) => ({ ...p, rooms: p.rooms.map((r) => (r.id === id ? fn(r) : r)) })

  const addRoom = (rawName: string) => {
    const base = rawName.trim()
    const taken = new Set(project.rooms.map((r) => r.name))
    let name = base
    for (let i = 2; taken.has(name); i++) name = `${base} ${i}`
    const [w, h] = defaultSize(base)
    const pos = placeNew(project.rooms.map(box), w, h)
    const room: SketchRoom = { id: uid(), name, ...pos, shape: 'rect', defaultW: w, defaultH: h, lengths: Array(4).fill(null), openings: [] }
    commit({ ...project, rooms: [...project.rooms, room] })
    return room.id
  }

  /** Verschieben ohne Undo-Schritt (der wird beim Start des Ziehens gesetzt). Rastet an Nachbarn ein. */
  const moveRoom = (id: string, x: number, y: number, tolMm: number) => {
    setProject((p) => {
      const r = p.rooms.find((q) => q.id === id)!
      const b = { ...box(r), x, y }
      const pos = snap(b, p.rooms.filter((q) => q.id !== id).map(box), WALL_THICKNESS, tolMm)
      return updateRoom(id, (q) => ({ ...q, x: Math.round(pos.x), y: Math.round(pos.y) }))(p)
    })
  }

  /** Wandmaß setzen (null = löschen). Angeklebte Nachbarn rücken mit. Ohne Undo-Schritt. */
  const setLength = (id: string, wall: number, mm: number | null) => {
    setProject((p) => {
      const r = p.rooms.find((q) => q.id === id)!
      const before = derive(r)
      const next = { ...r, lengths: r.lengths.map((v, i) => (i === wall ? mm : v)) }
      const after = derive(next)
      const shifts = pushNeighbors(p.rooms.map(box), id, after.w - before.w, after.h - before.h, WALL_THICKNESS)
      return {
        ...p,
        rooms: p.rooms.map((q) => {
          if (q.id === id) return next
          const sh = shifts.get(q.id)
          return sh ? { ...q, x: q.x + sh.dx, y: q.y + sh.dy } : q
        }),
      }
    })
  }

  const addOpening = (id: string, o: Omit<Opening, 'id'>) => commit(updateRoom(id, (r) => ({ ...r, openings: [...r.openings, { ...o, id: uid() }] }))(project))
  const updateOpening = (id: string, o: Opening) => commit(updateRoom(id, (r) => ({ ...r, openings: r.openings.map((x) => (x.id === o.id ? o : x)) }))(project))
  const removeOpening = (id: string, openingId: string) => commit(updateRoom(id, (r) => ({ ...r, openings: r.openings.filter((x) => x.id !== openingId) }))(project))
  const renameRoom = (id: string, name: string) => commit(updateRoom(id, (r) => ({ ...r, name: name.trim() || r.name }))(project))
  const removeRoom = (id: string) => commit({ ...project, rooms: project.rooms.filter((r) => r.id !== id) })
  const setShape = (id: string, shape: Shape) =>
    commit(updateRoom(id, (r) => (r.shape === shape ? r : { ...r, shape, lengths: Array(wallCount(shape)).fill(null), openings: [] }))(project))
  const renameProject = (name: string) => commit({ ...project, name: name.trim() || project.name })

  const undo = () => {
    const prev = past.at(-1)
    if (!prev) return
    setFuture((f) => [project, ...f])
    setPast((p) => p.slice(0, -1))
    setProject(prev)
  }
  const redo = () => {
    const [next, ...rest] = future
    if (!next) return
    setPast((p) => [...p, project])
    setFuture(rest)
    setProject(next)
  }

  return {
    name: project.name,
    rooms: project.rooms,
    conflicts: collisions(project.rooms.flatMap(rects), WALL_THICKNESS),
    snapshot,
    addRoom,
    moveRoom,
    setLength,
    addOpening,
    updateOpening,
    removeOpening,
    renameRoom,
    removeRoom,
    setShape,
    renameProject,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
