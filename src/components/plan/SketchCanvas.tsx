import { useDrag, useGesture } from '@use-gesture/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { derive, toPlanRoom, WALL_THICKNESS, type SketchRoom } from '@/app/rooms'
import { area, centroid, edges, add, mul, outset, toPath } from './geometry'
import { C, Dim, NS, OpeningShape, WallMark } from './PlanView'
import type { Opening, Room } from './types'
import { cm, sqm } from '@/lib/format'

type Camera = { cx: number; cy: number; s: number } // Weltmittelpunkt (mm) + Pixel pro mm

export type SketchCanvasProps = {
  rooms: SketchRoom[]
  /** Raum in der Detailansicht */
  focusId?: string
  activeWall?: number
  /** Beschriftung der aktiven Wand (live aus der Eingabe) */
  activeLabel?: string
  /** Vorschau einer neuen Öffnung im fokussierten Raum */
  draftOpening?: Opening
  conflicts?: Set<string>
  /** Bedienfläche unten bzw. rechts (px) – der Raum wird im freien Bereich zentriert */
  bottomInset?: number
  rightInset?: number
  onMoveStart?: (id: string) => void
  /** tolMm = Einrast-Toleranz passend zum Zoom */
  onMove?: (id: string, x: number, y: number, tolMm: number) => void
  onTapRoom?: (id: string) => void
  onTapWall?: (index: number) => void
  onTapOpening?: (id: string) => void
  onTapBackground?: () => void
  /** Erhöhen = Ansicht neu auf alle Räume (bzw. den fokussierten Raum) ausrichten */
  fitToken?: number
  className?: string
}

const MIN_S = 0.004
const MAX_S = 1.5
const clampS = (s: number) => Math.min(MAX_S, Math.max(MIN_S, s))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function SketchCanvas(props: SketchCanvasProps) {
  const { rooms, focusId, activeWall, activeLabel, draftOpening, conflicts, bottomInset = 0, rightInset = 0, onMoveStart, onMove, onTapRoom, onTapWall, onTapOpening, onTapBackground, fitToken = 0, className } = props
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [cam, setCam] = useState<Camera>({ cx: 0, cy: 0, s: 0.06 })
  const camRef = useRef(cam)
  camRef.current = cam
  const anim = useRef<number>(0)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const animateTo = useCallback((target: Camera, ms = 420) => {
    cancelAnimationFrame(anim.current)
    const from = camRef.current
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      const k = ease(t)
      setCam({
        cx: from.cx + (target.cx - from.cx) * k,
        cy: from.cy + (target.cy - from.cy) * k,
        s: Math.exp(Math.log(from.s) + (Math.log(target.s) - Math.log(from.s)) * k),
      })
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }, [])

  // Kamera auf Räume ausrichten: beim Hinein-/Herauszoomen, neuem Raum, Wandwechsel, geänderter Bedienfläche.
  const derived = rooms.map((r) => ({ r, d: derive(r) }))
  const target = focusId ? derived.filter((x) => x.r.id === focusId) : derived
  const bb = target.length
    ? target.reduce(
        (a, { r, d }) => ({ x0: Math.min(a.x0, r.x), y0: Math.min(a.y0, r.y), x1: Math.max(a.x1, r.x + d.w), y1: Math.max(a.y1, r.y + d.h) }),
        { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
      )
    : { x0: -3000, y0: -3000, x1: 3000, y1: 3000 }
  // Im Raum: mitwachsen, während Maße eingetippt werden.
  const focusSize = focusId ? `${Math.round(bb.x1 - bb.x0)}x${Math.round(bb.y1 - bb.y0)}` : ''
  const [dragEnd, setDragEnd] = useState(0)
  const fitKey = `${focusId}|${rooms.length}|${activeWall}|${bottomInset}|${rightInset}|${size.w}x${size.h}|${focusSize}|${fitToken}|${dragEnd}`
  const firstFit = useRef(true)
  const afterDrag = useRef(false)
  useEffect(() => {
    if (!size.w || !size.h) return
    const pad = focusId ? 56 : 72
    // Nach dem Ziehen nur nachführen, wenn ein Raum aus dem Bild ragt
    if (afterDrag.current) {
      afterDrag.current = false
      const c = camRef.current
      const inView = (x: number, y: number) => Math.abs((x - c.cx) * c.s) < size.w / 2 - 16 && Math.abs((y - c.cy) * c.s) < size.h / 2 - 16
      if (inView(bb.x0, bb.y0) && inView(bb.x1, bb.y1)) return
    }
    const t = WALL_THICKNESS
    const bw = bb.x1 - bb.x0 + 2 * t
    const bh = bb.y1 - bb.y0 + 2 * t
    const availH = Math.max(120, size.h - bottomInset - 2 * pad)
    const availW = Math.max(160, size.w - rightInset - 2 * pad)
    const s = clampS(Math.min(availW / bw, availH / bh, focusId ? MAX_S : 0.12))
    const next = { cx: (bb.x0 + bb.x1) / 2 + rightInset / 2 / s, cy: (bb.y0 + bb.y1) / 2 + bottomInset / 2 / s, s }
    if (!focusId) minS.current = s * 0.35
    if (firstFit.current) {
      firstFit.current = false
      setCam(next)
    } else animateTo(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  // Nicht so weit herauszoomen, dass die Wohnung verschwindet
  const minS = useRef(MIN_S)
  const clampZoom = (v: number) => Math.min(MAX_S, Math.max(minS.current, v))

  // Ein Klick direkt nach dem Hineinzoomen darf keine Wand treffen
  const focusAt = useRef(0)
  useEffect(() => {
    focusAt.current = performance.now()
  }, [focusId])

  const toWorld = (clientX: number, clientY: number) => {
    const rect = boxRef.current!.getBoundingClientRect()
    const c = camRef.current
    return { x: c.cx + (clientX - rect.left - rect.width / 2) / c.s, y: c.cy + (clientY - rect.top - rect.height / 2) / c.s }
  }

  // Fläche: ein Finger/Maus verschiebt die Ansicht, zwei Finger bzw. Mausrad zoomen.
  useGesture(
    {
      onDrag: ({ delta: [dx, dy], tap, event, first, cancel, pinching }) => {
        if (pinching) return cancel()
        const onRoom = (event.target as Element).closest?.('[data-room], [data-wall]')
        if (first && onRoom) return cancel()
        if (tap) {
          if (!onRoom) onTapBackground?.()
          return
        }
        cancelAnimationFrame(anim.current)
        setCam((c) => ({ ...c, cx: c.cx - dx / c.s, cy: c.cy - dy / c.s }))
      },
      onPinch: ({ origin: [ox, oy], movement: [ms], first, memo }) => {
        cancelAnimationFrame(anim.current)
        const m = first || !memo ? { cam: camRef.current, at: toWorld(ox, oy), ox, oy } : memo
        const s = clampZoom(m.cam.s * ms)
        const rect = boxRef.current!.getBoundingClientRect()
        setCam({ s, cx: m.at.x - (m.ox - rect.left - rect.width / 2) / s, cy: m.at.y - (m.oy - rect.top - rect.height / 2) / s })
        return m
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault()
        cancelAnimationFrame(anim.current)
        const at = toWorld(event.clientX, event.clientY)
        const rect = boxRef.current!.getBoundingClientRect()
        setCam((c) => {
          const s = clampZoom(c.s * Math.exp(-dy * 0.0015))
          return { s, cx: at.x - (event.clientX - rect.left - rect.width / 2) / s, cy: at.y - (event.clientY - rect.top - rect.height / 2) / s }
        })
      },
    },
    { target: boxRef, drag: { filterTaps: true, pointer: { touch: true } }, eventOptions: { passive: false } },
  )

  const s = cam.s
  const fs = 13 / s
  const vb = size.w ? `${cam.cx - size.w / 2 / s} ${cam.cy - size.h / 2 / s} ${size.w / s} ${size.h / s}` : '0 0 1 1'
  const t = WALL_THICKNESS
  const plan = derived.map(({ r, d }) => ({ r, d, room: toPlanRoom(r, d) }))
  const focus = plan.find((p) => p.r.id === focusId)
  const dim = (id: string) => (focusId && id !== focusId ? 0.3 : 1)

  // Neue Öffnung als Vorschau im fokussierten Raum
  const withDraft = (room: Room): Room =>
    draftOpening && room.id === focusId ? { ...room, openings: [...room.openings.filter((o) => o.id !== draftOpening.id), draftOpening] } : room

  return (
    <div ref={boxRef} className={className} style={{ touchAction: 'none' }}>
      <svg viewBox={vb} className="block size-full select-none" fontFamily="inherit">
        <defs>
          <pattern id="grid" width={1000} height={1000} patternUnits="userSpaceOnUse">
            <circle cx={0} cy={0} r={1.2 / s} fill="var(--border)" />
          </pattern>
        </defs>
        {s > 0.012 && <rect x={cam.cx - size.w / s} y={cam.cy - size.h / s} width={(2 * size.w) / s} height={(2 * size.h) / s} fill="url(#grid)" />}

        {/* Böden: gemessen = hell, ungemessen = getönt und gestrichelt */}
        {plan.map(({ r, d }) => (
          <RoomFloor
            key={r.id}
            id={r.id}
            polygon={toPath(d.polygon)}
            measured={d.measured}
            conflict={!!conflicts?.has(r.id)}
            opacity={dim(r.id)}
            draggable={!focusId}
            toWorld={toWorld}
            origin={{ x: r.x, y: r.y }}
            tolMm={25 / s}
            onMoveStart={onMoveStart}
            onMove={onMove}
            onMoveEnd={() => {
              afterDrag.current = true
              setDragEnd((n) => n + 1)
            }}
            onTap={onTapRoom}
          />
        ))}

        {/* Erst alle Wandbänder, dann alle Öffnungen – so durchbricht eine Tür auch die Wand des Nachbarraums. */}
        {plan
          .filter((p) => p.d.measured)
          .map(({ r, d }) => (
            <path key={`w-${r.id}`} d={`${toPath(outset(d.polygon, t))}${toPath(d.polygon)}`} fillRule="evenodd" fill={C.wall} opacity={dim(r.id)} pointerEvents="none" />
          ))}
        {plan.map(({ r, room }) => (
          <g key={`o-${r.id}`} opacity={dim(r.id)} pointerEvents="none">
            {withDraft(room).openings.map((o) => (
              <OpeningShape key={o.id} room={withDraft(room)} o={o} t={t} highlight={o === draftOpening} />
            ))}
          </g>
        ))}

        {/* Raumnamen */}
        {plan
          .filter((p) => p.r.id !== focusId)
          .map(({ r, d }) => {
            const c = centroid(d.polygon)
            // Name an die Raumbreite anpassen, in winzigen Räumen weglassen
            const ls = Math.min(fs, (d.w * 0.85) / (r.name.length * 0.58), d.h * 0.4)
            if (ls < fs * 0.6) return null
            const showArea = d.measured && d.h > ls * 4
            return (
              <g key={`l-${r.id}`} opacity={dim(r.id)} pointerEvents="none">
                <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontSize={ls} fontWeight={600} fill={d.measured ? C.line : C.muted}>
                  {r.name}
                </text>
                {showArea && (
                  <text x={c.x} y={c.y + ls * 1.2} textAnchor="middle" dominantBaseline="central" fontSize={ls * 0.85} fill={C.muted}>
                    {sqm(area(d.polygon))}
                  </text>
                )}
              </g>
            )
          })}

        {/* Detailansicht: Maße an jeder Wand, Wände antippbar */}
        {focus && (
          <g>
            {edges(focus.d.polygon).map((e, i) => {
              const status = focus.d.status[i]
              const isActive = i === activeWall
              const label = isActive && activeLabel ? activeLabel : status === 'open' ? '?' : cm(focus.d.wallLengths[i])
              return <Dim key={i} a={e.a} b={e.b} dir={e.dir} inward={e.inward} fs={fs} label={label} status={status} active={isActive} />
            })}
            {focus.d.polygon.map((_, i) => (
              <g key={i} data-wall="">
                <WallMark
                  room={focus.room}
                  i={i}
                  status="measured"
                  active={i === activeWall}
                  onClick={() => performance.now() - focusAt.current > 450 && onTapWall?.(i)}
                />
              </g>
            ))}
            {/* Türen/Fenster antippbar */}
            {!draftOpening &&
              focus.room.openings.map((o) => {
                const e = edges(focus.room.polygon)[o.wall]
                if (!e) return null
                const p0 = add(e.a, mul(e.dir, o.offset))
                const p1 = add(p0, mul(e.dir, o.width))
                const hit = [add(p0, mul(e.inward, fs * 1.2)), add(p1, mul(e.inward, fs * 1.2)), add(p1, mul(e.outward, t + fs)), add(p0, mul(e.outward, t + fs))]
                return (
                  <path
                    key={o.id}
                    data-wall=""
                    d={toPath(hit)}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => performance.now() - focusAt.current > 450 && onTapOpening?.(o.id)}
                  />
                )
              })}
            {draftOpening && <OpeningDims room={focus.room} o={draftOpening} fs={fs} />}
          </g>
        )}
      </svg>
    </div>
  )
}

/** Maßkette „Ecke → Öffnung“ und Öffnungsbreite entlang der Wand */
function OpeningDims({ room, o, fs }: { room: Room; o: Opening; fs: number }) {
  const e = edges(room.polygon)[o.wall]
  if (!e) return null
  const p0 = add(e.a, mul(e.dir, o.offset))
  const p1 = add(p0, mul(e.dir, o.width))
  return (
    <g>
      <circle cx={e.a.x} cy={e.a.y} r={fs * 0.4} fill={C.primary} />
      {o.offset > 0 && <Dim a={e.a} b={p0} dir={e.dir} inward={e.inward} fs={fs} label={cm(o.offset)} status="measured" active={false} level={2.4} />}
      <Dim a={p0} b={p1} dir={e.dir} inward={e.inward} fs={fs} label={cm(o.width)} status="measured" active level={2.4} />
    </g>
  )
}

function RoomFloor({
  id,
  polygon,
  measured,
  conflict,
  opacity,
  draggable,
  toWorld,
  origin,
  tolMm,
  onMoveStart,
  onMove,
  onMoveEnd,
  onTap,
}: {
  id: string
  polygon: string
  measured: boolean
  conflict: boolean
  opacity: number
  draggable: boolean
  toWorld: (x: number, y: number) => { x: number; y: number }
  origin: { x: number; y: number }
  tolMm: number
  onMoveStart?: (id: string) => void
  onMove?: (id: string, x: number, y: number, tolMm: number) => void
  onMoveEnd?: () => void
  onTap?: (id: string) => void
}) {
  const bind = useDrag(
    ({ xy: [x, y], tap, first, last, memo, event, pinching, cancel }) => {
      event.stopPropagation()
      if (pinching) return cancel()
      if (tap) {
        onTap?.(id)
        return memo
      }
      if (!draggable) return memo
      const p = toWorld(x, y)
      if (first || !memo) return { dx: origin.x - p.x, dy: origin.y - p.y, started: false }
      if (!memo.started) onMoveStart?.(id)
      onMove?.(id, p.x + memo.dx, p.y + memo.dy, tolMm)
      if (last) onMoveEnd?.()
      return { ...memo, started: true }
    },
    { filterTaps: true, pointer: { touch: true } },
  )
  const stroke = conflict ? C.bad : measured ? 'none' : C.muted
  return (
    <path
      {...bind()}
      data-room={id}
      d={polygon}
      opacity={opacity}
      fill={measured ? C.floor : 'color-mix(in oklab, var(--primary) 6%, var(--background))'}
      stroke={stroke}
      strokeWidth={conflict ? 2.5 : 1.5}
      strokeDasharray={measured || conflict ? undefined : '6 5'}
      className={draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
      style={{ touchAction: 'none' }}
      {...NS}
    />
  )
}
