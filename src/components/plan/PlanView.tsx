import { useDrag } from '@use-gesture/react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import { area, arcPoints, bounds, centroid, edges, furnitureDistances, footprint, mul, add, outset, sub, toPath } from './geometry'
import type { Furniture, MeasureStatus, Opening, Pt, Room, Side } from './types'
import { cm, sqm } from '@/lib/format'

// Farben kommen ausschließlich aus den Theme-Variablen (shadcn + Plan-Ergänzungen in index.css).
export const C = {
  floor: 'var(--plan-floor)',
  wall: 'var(--plan-wall)',
  line: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  furniture: 'var(--plan-furniture)',
  primary: 'var(--primary)',
  onPrimary: 'var(--primary-foreground)',
  ok: 'var(--fit-ok)',
  tight: 'var(--fit-tight)',
  bad: 'var(--fit-bad)',
}

export const NS = { vectorEffect: 'non-scaling-stroke' } as const

export type PlanViewProps = {
  rooms: Room[]
  furniture?: Furniture[]
  wallThickness?: number
  /** Maßketten für diese Räume zeigen ('all' = alle). */
  dimensions?: string[] | 'all'
  showRoomLabels?: boolean
  showClearance?: boolean
  /** Hervorgehobene Wand (Aufmaß). */
  activeWall?: { roomId: string; index: number; label?: string }
  /** Räume außer diesem werden abgeblendet. */
  focusRoomId?: string
  highlightOpeningId?: string
  selectedFurnitureId?: string
  onSelectFurniture?: (id: string | undefined) => void
  onMoveFurniture?: (id: string, cx: number, cy: number) => void
  onDistanceClick?: (side: Side, mm: number) => void
  onWallClick?: (roomId: string, index: number) => void
  /** Pan & Pinch-Zoom aktivieren. */
  interactive?: boolean
  /** Schriftgröße relativ (1 = Standard). */
  textScale?: number
  padding?: number
  className?: string
  children?: ReactNode
}

export function PlanView(props: PlanViewProps) {
  const {
    rooms,
    furniture = [],
    wallThickness = 115,
    dimensions = [],
    showRoomLabels = false,
    showClearance = false,
    activeWall,
    focusRoomId,
    highlightOpeningId,
    selectedFurnitureId,
    onSelectFurniture,
    onMoveFurniture,
    onDistanceClick,
    onWallClick,
    interactive = false,
    textScale = 1,
    className,
  } = props
  const svgRef = useRef<SVGSVGElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const box = useElementSize(boxRef)

  const b = bounds(rooms.flatMap((r) => outset(r.polygon, wallThickness)))
  const size = Math.max(b.w, b.h)
  const pad = props.padding ?? size * 0.08
  // Schrift in Bildschirm-Pixeln konstant halten (≈13 px), unabhängig von Raumgröße und Container.
  const pxPerMm = box ? Math.min(box.w / (b.w + 2 * pad), box.h / (b.h + 2 * pad)) : 0
  const fs = (pxPerMm > 0 ? 13 / pxPerMm : size / 38) * textScale
  const showDims = (id: string) => dimensions === 'all' || dimensions.includes(id)
  const selected = furniture.find((f) => f.id === selectedFurnitureId)
  const selectedRoom = selected && rooms.find((r) => r.id === selected.roomId)

  const svg = (
    <svg
      ref={svgRef}
      viewBox={`${b.minX - pad} ${b.minY - pad} ${b.w + 2 * pad} ${b.h + 2 * pad}`}
      preserveAspectRatio="xMidYMid meet"
      className="block size-full select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectFurniture?.(undefined)
      }}
      fontFamily="inherit"
    >
      {rooms.map((r) => (
        <g key={r.id} opacity={focusRoomId && focusRoomId !== r.id ? 0.35 : 1}>
          <path d={toPath(r.polygon)} fill={C.floor} onClick={() => onSelectFurniture?.(undefined)} />
        </g>
      ))}

      {showClearance &&
        rooms.flatMap((r) => r.openings.filter((o) => o.kind === 'door').map((o) => <DoorSwingArea key={o.id} room={r} o={o} t={wallThickness} />))}
      {showClearance &&
        furniture
          .filter((f) => f.frontClearance)
          .map((f) => (
            <g key={`fc-${f.id}`} transform={`translate(${f.cx} ${f.cy}) rotate(${f.rot})`}>
              <rect x={-f.w / 2} y={f.d / 2} width={f.w} height={f.frontClearance} fill={C.primary} fillOpacity={0.07} stroke={C.primary} strokeOpacity={0.4} strokeDasharray="4 3" strokeWidth={1} {...NS} />
            </g>
          ))}

      {rooms.map((r) => (
        <g key={`w-${r.id}`} opacity={focusRoomId && focusRoomId !== r.id ? 0.35 : 1}>
          <path d={`${toPath(outset(r.polygon, wallThickness))}${toPath(r.polygon)}`} fillRule="evenodd" fill={C.wall} />
          {r.openings.map((o) => (
            <OpeningShape key={o.id} room={r} o={o} t={wallThickness} highlight={false} />
          ))}
          {r.polygon.map((_, i) => {
            const status = r.wallStatus?.[i] ?? 'measured'
            const isActive = activeWall?.roomId === r.id && activeWall.index === i
            return <WallMark key={i} room={r} i={i} status={status} active={isActive} onClick={onWallClick && (() => onWallClick(r.id, i))} />
          })}
        </g>
      ))}

      {/* Hervorgehobene Öffnung über allem, auch wenn ihr Raum abgeblendet ist */}
      {highlightOpeningId &&
        rooms.flatMap((r) =>
          r.openings.filter((o) => o.id === highlightOpeningId).map((o) => <OpeningShape key={`hl-${o.id}`} room={r} o={o} t={wallThickness} highlight />),
        )}

      {rooms
        .filter((r) => showDims(r.id))
        .map((r) =>
          edges(r.polygon).map((e, i) => {
            const isActive = activeWall?.roomId === r.id && activeWall.index === i
            const status = r.wallStatus?.[i] ?? 'measured'
            const label = isActive && activeWall?.label ? activeWall.label : status === 'open' ? '?' : cm(e.length)
            return <Dim key={`${r.id}-${i}`} a={e.a} b={e.b} dir={e.dir} inward={e.inward} fs={fs} label={label} status={status} active={isActive} />
          }),
        )}

      {furniture.map((f) => (
        <FurnitureItem
          key={f.id}
          f={f}
          fs={fs}
          svgRef={svgRef}
          selected={f.id === selectedFurnitureId}
          dimmed={!!focusRoomId && focusRoomId !== f.roomId}
          onSelect={onSelectFurniture}
          onMove={onMoveFurniture}
        />
      ))}

      {showRoomLabels &&
        rooms.map((r) => {
          const c = centroid(r.polygon)
          return (
            <g key={`l-${r.id}`} opacity={focusRoomId && focusRoomId !== r.id ? 0.35 : 1} pointerEvents="none">
              <text x={c.x} y={c.y} textAnchor="middle" fontSize={fs * 0.95} fontWeight={600} fill={C.line} stroke={C.floor} strokeWidth={fs * 0.4} paintOrder="stroke">
                {r.name}
              </text>
              <text x={c.x} y={c.y + fs * 1.15} textAnchor="middle" fontSize={fs * 0.8} fill={C.muted} stroke={C.floor} strokeWidth={fs * 0.4} paintOrder="stroke">
                {sqm(area(r.polygon))}
              </text>
            </g>
          )
        })}

      {selected && selectedRoom && <Distances room={selectedRoom} f={selected} fs={fs} onClick={onDistanceClick} />}
      {props.children}
    </svg>
  )

  if (!interactive)
    return (
      <div ref={boxRef} className={className}>
        {svg}
      </div>
    )

  return (
    <div ref={boxRef} className={className}>
      <TransformWrapper minScale={0.6} maxScale={8} doubleClick={{ disabled: true }} panning={{ excluded: ['plan-draggable'] }} centerOnInit>
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
          {svg}
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/* ---------- Wände & Öffnungen ---------- */

function openingFrame(room: Room, o: Opening) {
  const e = edges(room.polygon)[o.wall]
  const p0 = add(e.a, mul(e.dir, o.offset))
  const p1 = add(p0, mul(e.dir, o.width))
  return { e, p0, p1 }
}

export function OpeningShape({ room, o, t, highlight }: { room: Room; o: Opening; t: number; highlight: boolean }) {
  const { e, p0, p1 } = openingFrame(room, o)
  const eps = 4
  const cut = [add(p0, mul(e.inward, eps)), add(p1, mul(e.inward, eps)), add(p1, mul(e.outward, t + eps)), add(p0, mul(e.outward, t + eps))]
  const stroke = highlight ? C.primary : C.line
  const dash = o.status === 'estimated' ? '5 4' : undefined
  const w = highlight ? 2.5 : 1.25

  if (o.kind === 'window') {
    const lines = [0.2, 0.5, 0.8].map((k) => [add(p0, mul(e.outward, t * k)), add(p1, mul(e.outward, t * k))])
    return (
      <g>
        <path d={toPath(cut)} fill={C.floor} />
        {lines.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={i === 1 ? w : 1} strokeDasharray={dash} {...NS} />
        ))}
        <line x1={p0.x} y1={p0.y} x2={add(p0, mul(e.outward, t)).x} y2={add(p0, mul(e.outward, t)).y} stroke={stroke} strokeWidth={1} {...NS} />
        <line x1={p1.x} y1={p1.y} x2={add(p1, mul(e.outward, t)).x} y2={add(p1, mul(e.outward, t)).y} stroke={stroke} strokeWidth={1} {...NS} />
      </g>
    )
  }
  if (o.kind === 'passage') return <path d={toPath(cut)} fill={C.floor} />

  const outside = o.swing === 'out'
  const base = outside ? e.outward : e.inward
  const shift = outside ? mul(e.outward, t) : { x: 0, y: 0 }
  const hinge = add(o.hinge === 'end' ? p1 : p0, shift)
  const jamb = add(o.hinge === 'end' ? p0 : p1, shift)
  const leafEnd = add(hinge, mul(base, o.width))
  const arc = arcPoints(hinge, jamb, leafEnd)
  return (
    <g>
      <path d={toPath(cut)} fill={C.floor} />
      <line x1={hinge.x} y1={hinge.y} x2={leafEnd.x} y2={leafEnd.y} stroke={stroke} strokeWidth={w + 0.5} {...NS} />
      <path d={`M${arc.map((p) => `${p.x},${p.y}`).join('L')}`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray={dash ?? '1 0'} {...NS} />
    </g>
  )
}

export function DoorSwingArea({ room, o, t }: { room: Room; o: Opening; t: number }) {
  const { e, p0, p1 } = openingFrame(room, o)
  const outside = o.swing === 'out'
  const shift = outside ? mul(e.outward, t) : { x: 0, y: 0 }
  const hinge = add(o.hinge === 'end' ? p1 : p0, shift)
  const jamb = add(o.hinge === 'end' ? p0 : p1, shift)
  const leafEnd = add(hinge, mul(outside ? e.outward : e.inward, o.width))
  const arc = arcPoints(hinge, jamb, leafEnd)
  return <path d={toPath([hinge, ...arc])} fill={C.primary} fillOpacity={0.08} />
}

export function WallMark({ room, i, status, active, onClick }: { room: Room; i: number; status: MeasureStatus; active: boolean; onClick?: () => void }) {
  const e = edges(room.polygon)[i]
  const showLine = active || status === 'open' || onClick
  if (!showLine) return null
  return (
    <g>
      {(active || status === 'open') && (
        <line
          x1={e.a.x}
          y1={e.a.y}
          x2={e.b.x}
          y2={e.b.y}
          stroke={active ? C.primary : C.muted}
          strokeWidth={active ? 5 : 2}
          strokeDasharray={active ? undefined : '6 5'}
          strokeLinecap="round"
          {...NS}
        />
      )}
      {onClick && <line x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="transparent" strokeWidth={28} onClick={onClick} className="cursor-pointer" {...NS} />}
    </g>
  )
}

/* ---------- Maßketten ---------- */

export function Dim({
  a,
  b,
  dir,
  inward,
  fs,
  label,
  status,
  active,
  level = 1,
}: {
  a: Pt
  b: Pt
  dir: Pt
  inward: Pt
  fs: number
  label: string
  status: MeasureStatus
  active: boolean
  /** Abstand der Maßkette von der Wand in Zeilen (1 = Wandmaß, 2 = Öffnungsmaß) */
  level?: number
}) {
  const off = fs * 1.6 * level
  const p = add(a, mul(inward, off))
  const q = add(b, mul(inward, off))
  const tick = mul(add(dir, inward), fs * 0.25)
  let angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI
  if (angle > 90 || angle <= -90) angle += 180
  const mid = mul(add(p, q), 0.5)
  const color = active ? C.primary : status === 'measured' ? C.line : C.muted
  const dash = status === 'estimated' || status === 'open' ? '5 4' : undefined
  return (
    <g pointerEvents="none">
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color} strokeWidth={active ? 1.5 : 0.75} strokeDasharray={dash} {...NS} />
      {[p, q].map((t, i) => (
        <line key={i} x1={sub(t, tick).x} y1={sub(t, tick).y} x2={add(t, tick).x} y2={add(t, tick).y} stroke={color} strokeWidth={1.25} {...NS} />
      ))}
      {active ? (
        <g transform={`translate(${mid.x} ${mid.y}) rotate(${angle})`}>
          <rect x={-fs * (0.4 + label.length * 0.33)} y={-fs * 0.75} width={fs * (0.8 + label.length * 0.66)} height={fs * 1.5} rx={fs * 0.75} fill={C.primary} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={fs * 0.85} fontWeight={600} fill={C.onPrimary}>
            {label}
          </text>
        </g>
      ) : (
        <text
          transform={`translate(${mid.x} ${mid.y}) rotate(${angle})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fs * 0.8}
          fontStyle={status === 'estimated' ? 'italic' : undefined}
          fill={color}
          stroke={C.floor}
          strokeWidth={fs * 0.35}
          paintOrder="stroke"
          className="tabular-nums"
        >
          {label}
        </text>
      )}
    </g>
  )
}

/* ---------- Möbel ---------- */

function FurnitureItem({
  f,
  fs,
  svgRef,
  selected,
  dimmed,
  onSelect,
  onMove,
}: {
  f: Furniture
  fs: number
  svgRef: RefObject<SVGSVGElement | null>
  selected: boolean
  dimmed: boolean
  onSelect?: (id: string | undefined) => void
  onMove?: (id: string, cx: number, cy: number) => void
}) {
  const bind = useDrag(
    ({ xy: [x, y], first, memo, event }) => {
      event.stopPropagation()
      const ctm = svgRef.current?.getScreenCTM()
      if (!ctm) return memo
      const pt = new DOMPoint(x, y).matrixTransform(ctm.inverse())
      if (first) {
        onSelect?.(f.id)
        return { dx: f.cx - pt.x, dy: f.cy - pt.y }
      }
      if (memo) onMove?.(f.id, Math.round((pt.x + memo.dx) / 10) * 10, Math.round((pt.y + memo.dy) / 10) * 10)
      return memo
    },
    { enabled: !!onMove, filterTaps: true },
  )

  const stroke = selected ? C.primary : f.fit === 'bad' ? C.bad : f.fit === 'tight' ? C.tight : C.line
  const fp = footprint(f)
  const vertical = fp.h > fp.w
  const labelFits = Math.min(fp.w, fp.h) > fs * 1.2 && Math.max(fp.w, fp.h) > fs * f.name.length * 0.45
  return (
    <g
      {...(onMove ? bind() : {})}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(f.id)
      }}
      opacity={dimmed ? 0.35 : 1}
      className={onMove || onSelect ? 'plan-draggable cursor-grab touch-none' : undefined}
    >
      <g transform={`translate(${f.cx} ${f.cy}) rotate(${f.rot})`}>
        <rect
          x={-f.w / 2}
          y={-f.d / 2}
          width={f.w}
          height={f.d}
          rx={Math.min(f.w, f.d) * 0.05}
          fill={selected ? 'color-mix(in oklab, var(--primary) 12%, var(--plan-furniture))' : f.fit === 'bad' ? 'color-mix(in oklab, var(--fit-bad) 14%, var(--plan-furniture))' : C.furniture}
          stroke={stroke}
          strokeWidth={selected || f.fit === 'bad' ? 2 : 1}
          {...NS}
        />
        <Glyph f={f} stroke={stroke} />
      </g>
      {labelFits && (
        <text
          transform={`translate(${f.cx} ${f.cy})${vertical ? ' rotate(-90)' : ''}`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fs * 0.7}
          fill={selected ? C.primary : C.muted}
          fontWeight={selected ? 600 : 400}
          pointerEvents="none"
        >
          {f.name}
        </text>
      )}
    </g>
  )
}

function Glyph({ f, stroke }: { f: Furniture; stroke: string }) {
  const { w, d } = f
  const x0 = -w / 2
  const y0 = -d / 2
  const p = { fill: 'none', stroke, strokeWidth: 0.75, ...NS }
  switch (f.kind) {
    case 'sofa':
      return (
        <g>
          <rect x={x0} y={y0} width={w} height={d * 0.25} {...p} />
          <rect x={x0} y={y0} width={w * 0.08} height={d} {...p} />
          <rect x={w / 2 - w * 0.08} y={y0} width={w * 0.08} height={d} {...p} />
        </g>
      )
    case 'chair':
      return <rect x={x0} y={y0} width={w} height={d * 0.22} {...p} />
    case 'bed': {
      const n = w > 1200 ? 2 : 1
      const pw = (w - 120 * (n + 1)) / n
      return (
        <g>
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} x={x0 + 120 + i * (pw + 120)} y={y0 + 80} width={pw} height={d * 0.16} rx={60} {...p} />
          ))}
          <line x1={x0} y1={y0 + d * 0.3} x2={-x0} y2={y0 + d * 0.3} {...p} />
        </g>
      )
    }
    case 'wardrobe':
      return <line x1={x0} y1={-y0} x2={-x0} y2={y0} {...p} />
    case 'shelf':
      return <line x1={x0} y1={0} x2={-x0} y2={0} {...p} />
    case 'tv':
      return <line x1={x0 + w * 0.1} y1={-y0 - d * 0.3} x2={-x0 - w * 0.1} y2={-y0 - d * 0.3} {...p} strokeWidth={2} />
    case 'kitchen': {
      const r = Math.min(d * 0.13, 110)
      return (
        <g>
          {[
            [0.12, 0.3],
            [0.27, 0.3],
            [0.12, 0.7],
            [0.27, 0.7],
          ].map(([kx, ky], i) => (
            <circle key={i} cx={x0 + w * kx} cy={y0 + d * ky} r={r} {...p} />
          ))}
          <rect x={x0 + w * 0.55} y={y0 + d * 0.18} width={w * 0.2} height={d * 0.64} rx={40} {...p} />
        </g>
      )
    }
    case 'bathtub':
      return <rect x={x0 + 70} y={y0 + 70} width={w - 140} height={d - 140} rx={d * 0.3} {...p} />
    case 'wc':
      return <ellipse cx={0} cy={d * 0.12} rx={w * 0.38} ry={d * 0.3} {...p} />
    case 'sink':
      return <ellipse cx={0} cy={d * 0.05} rx={w * 0.35} ry={d * 0.3} {...p} />
    default:
      return null
  }
}

/* ---------- Abstände des ausgewählten Möbels ---------- */

function Distances({ room, f, fs, onClick }: { room: Room; f: Furniture; fs: number; onClick?: (side: Side, mm: number) => void }) {
  const ds = furnitureDistances(room, f)
  const dirs: Record<Side, Pt> = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 } }
  return (
    <g>
      {(Object.keys(ds) as Side[]).map((side) => {
        const { from, d } = ds[side]
        if (d === null) return null
        const to = add(from, mul(dirs[side], d))
        const mid = mul(add(from, to), 0.5)
        const label = cm(d)
        const tight = d > 0 && d < 30
        const color = tight ? C.tight : C.primary
        const pw = fs * (0.9 + label.length * 0.55)
        const ph = fs * 1.35
        // Kurze Abstände: Etikett neben die Linie setzen, damit es das Möbel nicht verdeckt.
        const small = d < fs * 2.2
        const lp = small ? add(mid, mul(side === 'left' || side === 'right' ? { x: 0, y: 1 } : { x: 1, y: 0 }, fs * 1.4)) : mid
        return (
          <g key={side}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={1.25} strokeDasharray="4 3" {...NS} />
            <g
              transform={`translate(${lp.x} ${lp.y})`}
              className={onClick ? 'plan-draggable cursor-pointer' : undefined}
              onClick={(e) => {
                e.stopPropagation()
                onClick?.(side, d)
              }}
            >
              <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={ph / 2} fill={color} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={fs * 0.75} fontWeight={600} fill={C.onPrimary} className="tabular-nums">
                {label}
              </text>
            </g>
          </g>
        )
      })}
    </g>
  )
}
