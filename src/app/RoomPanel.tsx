import { AppWindow, ChevronRight, DoorOpen, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Pictogram, type Opening, type OpeningKind } from '@/components/plan'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cm, parseLength } from '@/lib/format'
import type { derive } from './rooms'

type Derived = ReturnType<typeof derive>

const toText = (mm: number | null | undefined) => (mm == null ? '' : cm(mm))

/** Prüft eine Eingabe – Rückgabe: Maß in mm oder ein kurzer Hinweis, wenn etwas nicht stimmt. */
function check(text: string): { mm: number | null; warn?: string } {
  if (!text.trim()) return { mm: null }
  const mm = parseLength(text)
  if (mm === null) return { mm: null, warn: 'Keine gültige Zahl' }
  if (mm < 300) return { mm: null, warn: 'Sehr kurz – Meter statt Zentimeter?' }
  if (mm > 15000) return { mm: null, warn: 'Sehr lang – Millimeter statt Zentimeter?' }
  return { mm }
}

function LengthInput({ id, label, value, placeholder, autoFocus, onChange }: { id: string; label: string; value: string; placeholder?: string; autoFocus?: boolean; onChange: (v: string) => void }) {
  return (
    <Field className="min-w-0 flex-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup className="h-12">
        <InputGroupInput
          id={id}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="text-xl font-semibold tabular-nums"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>cm</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

const panelClass =
  'flex shrink-0 flex-col gap-3 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:absolute md:right-4 md:bottom-4 md:w-96 md:rounded-xl md:border md:shadow-lg'

/** Wandmaß eingeben; Tür/Fenster an dieser Wand hinzufügen. */
export function WallPanel({
  wall,
  value,
  derived,
  onChange,
  onNext,
  onAddOpening,
}: {
  wall: number
  value: number | null
  derived: Derived
  onChange: (mm: number | null) => void
  onNext: () => void
  onAddOpening: (kind: OpeningKind) => void
}) {
  const [text, setText] = useState(toText(value))
  const { warn } = check(text)
  const nextOpen = derived.status.some((s, i) => s === 'open' && i !== wall)
  const conflict = derived.conflict

  return (
    <div className={panelClass}>
      <div className="flex items-end gap-2">
        <LengthInput
          id="wall-length"
          label={`Wand ${wall + 1}`}
          value={text}
          autoFocus
          placeholder={derived.status[wall] === 'computed' ? cm(derived.wallLengths[wall]) : undefined}
          onChange={(v) => {
            setText(v)
            const r = check(v)
            if (!r.warn) onChange(r.mm)
          }}
        />
        <Button size="lg" className="h-12" onClick={onNext} disabled={!!warn}>
          {nextOpen ? 'Weiter' : 'Fertig'}
          <ChevronRight />
        </Button>
      </div>
      {warn && <p className="text-sm text-destructive">{warn}</p>}
      {!warn && conflict && (
        <p className="text-sm text-[color-mix(in_oklab,var(--fit-tight)_65%,black)]">
          Wand {conflict[0] + 1} und {conflict[1] + 1}: {cm(conflict[2])} cm Unterschied
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onAddOpening('door')}>
          <DoorOpen /> Tür
        </Button>
        <Button variant="outline" onClick={() => onAddOpening('window')}>
          <AppWindow /> Fenster
        </Button>
      </div>
    </div>
  )
}

const doorVariants = [
  { hinge: 'start', swing: 'in', label: 'Anschlag links, nach innen' },
  { hinge: 'end', swing: 'in', label: 'Anschlag rechts, nach innen' },
  { hinge: 'start', swing: 'out', label: 'Anschlag links, nach außen' },
  { hinge: 'end', swing: 'out', label: 'Anschlag rechts, nach außen' },
] as const

/** Neue Tür oder neues Fenster – der Plan zeigt die Vorschau samt Maßkette live. */
export function OpeningPanel({
  kind,
  wall,
  wallLength,
  onDraft,
  onCancel,
  onAdd,
}: {
  kind: OpeningKind
  wall: number
  wallLength: number
  onDraft: (o: Opening | undefined) => void
  onCancel: () => void
  onAdd: (o: Omit<Opening, 'id'>) => void
}) {
  const defaultWidth = kind === 'door' ? 885 : 1200
  const defaultOffset = Math.max(0, Math.round((wallLength - defaultWidth) / 2 / 50) * 50)
  const [offset, setOffset] = useState(toText(defaultOffset))
  const [width, setWidth] = useState(toText(defaultWidth))
  const [variant, setVariant] = useState('0')

  const offMm = parseLength(offset)
  const wid = check(width)
  const widMm = wid.mm
  const fits = offMm !== null && widMm !== null && offMm + widMm <= wallLength
  const dv = doorVariants[Number(variant)]
  const opening: Omit<Opening, 'id'> | undefined =
    offMm !== null && widMm !== null ? { kind, wall, offset: offMm, width: widMm, ...(kind === 'door' ? { hinge: dv.hinge, swing: dv.swing } : {}) } : undefined

  // Vorschau an die Zeichnung melden
  const draftKey = opening ? `${opening.offset}-${opening.width}-${variant}` : ''
  useEffect(() => {
    onDraft(opening ? { ...opening, id: 'draft' } : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])
  useEffect(() => () => onDraft(undefined), [onDraft])

  const warn =
    offMm === null && offset.trim() ? 'Keine gültige Zahl' : (wid.warn ?? (opening && !fits ? `Passt nicht in die Wand (${cm(wallLength)} cm)` : undefined))

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          {kind === 'door' ? 'Tür' : 'Fenster'} · Wand {wall + 1}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Abbrechen" onClick={onCancel}>
          <X />
        </Button>
      </div>
      <div className="flex gap-2">
        <LengthInput id="opening-offset" label="Abstand" value={offset} autoFocus onChange={setOffset} />
        <LengthInput id="opening-width" label="Breite" value={width} onChange={setWidth} />
      </div>
      {kind === 'door' && (
        <ToggleGroup type="single" variant="outline" value={variant} onValueChange={(v) => v && setVariant(v)} className="w-full">
          {doorVariants.map((d, i) => (
            <ToggleGroupItem key={d.label} value={String(i)} aria-label={d.label} className="h-14 flex-1 p-1">
              <Pictogram variant="door" hinge={d.hinge} swing={d.swing} className="size-12" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {warn && <p className="text-sm text-destructive">{warn}</p>}
      <Button size="lg" className="h-11" disabled={!opening || !fits} onClick={() => opening && onAdd(opening)}>
        Hinzufügen
      </Button>
    </div>
  )
}
