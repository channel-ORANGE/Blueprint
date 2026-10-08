import { useState } from 'react'

import type { Fit, Furniture, Room, Side } from '@/components/plan'
import { furnitureDistances } from '@/components/plan/geometry'
import { overlaps } from '@/lib/checks'

/** Zustand & Aktionen fürs Einrichten (Prototyp: nur im Speicher, mit einfachem Undo/Redo). */
export function useFurnishing(rooms: Room[], initial: Furniture[], initialSelected?: string) {
  const [items, setItems] = useState(initial)
  const [past, setPast] = useState<Furniture[][]>([])
  const [future, setFuture] = useState<Furniture[][]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelected)

  const selected = items.find((f) => f.id === selectedId)
  const roomOf = (f: Furniture) => rooms.find((r) => r.id === f.roomId)!

  const commit = (next: Furniture[]) => {
    setPast((p) => [...p, items])
    setFuture([])
    setItems(next)
  }
  const update = (id: string, patch: Partial<Furniture>, record = true) => {
    const next = items.map((f) => (f.id === id ? { ...f, ...patch } : f))
    if (record) commit(next)
    else setItems(next)
  }

  const fitOf = (f: Furniture): Fit => (items.some((o) => o.id !== f.id && o.roomId === f.roomId && overlaps(o, f)) ? 'bad' : (f.fit ?? 'ok'))

  /** Abstand zu einer Wand exakt setzen – Möbel wird entsprechend verschoben. */
  const setDistance = (side: Side, mm: number) => {
    if (!selected) return
    const current = furnitureDistances(roomOf(selected), selected)[side].d ?? 0
    const delta = mm - current
    const patch =
      side === 'left'
        ? { cx: selected.cx + delta }
        : side === 'right'
          ? { cx: selected.cx - delta }
          : side === 'top'
            ? { cy: selected.cy + delta }
            : { cy: selected.cy - delta }
    update(selected.id, patch)
  }

  const nudge = (dx: number, dy: number) => selected && update(selected.id, { cx: selected.cx + dx, cy: selected.cy + dy })
  const rotate = () => selected && update(selected.id, { rot: ((selected.rot + 90) % 360) as Furniture['rot'] })

  /** An die nächste Wand schieben (mit 1 cm Fußleisten-Puffer). */
  const toWall = (buffer = 10) => {
    if (!selected) return
    const ds = furnitureDistances(roomOf(selected), selected)
    const [side] = (Object.keys(ds) as Side[]).filter((s) => ds[s].d !== null).sort((a, b) => ds[a].d! - ds[b].d!)
    if (side) setDistance(side, buffer)
  }

  const remove = () => {
    if (!selected) return
    commit(items.filter((f) => f.id !== selected.id))
    setSelectedId(undefined)
  }

  const undo = () => {
    const prev = past.at(-1)
    if (!prev) return
    setFuture((f) => [items, ...f])
    setPast((p) => p.slice(0, -1))
    setItems(prev)
  }
  const redo = () => {
    const [next, ...rest] = future
    if (!next) return
    setPast((p) => [...p, items])
    setFuture(rest)
    setItems(next)
  }

  return {
    items,
    selected,
    selectedId,
    select: (id: string | undefined) => {
      // Beim Anfassen eines Möbels Zustand merken, damit Ziehen rückgängig gemacht werden kann.
      if (id && id !== selectedId) setPast((p) => [...p, items])
      setSelectedId(id)
    },
    move: (id: string, cx: number, cy: number) => update(id, { cx, cy }, false),
    update: (id: string, patch: Partial<Furniture>) => update(id, patch),
    add: (item: Furniture) => {
      commit([...items, item])
      setSelectedId(item.id)
    },
    distances: selected ? furnitureDistances(roomOf(selected), selected) : undefined,
    fitOf,
    setDistance,
    nudge,
    rotate,
    toWall,
    remove,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}

export const sideLabel: Record<Side, string> = { left: 'links', right: 'rechts', top: 'oben', bottom: 'unten' }
