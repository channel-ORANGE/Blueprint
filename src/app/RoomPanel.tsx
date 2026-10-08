import { AppWindow, ChevronRight, DoorOpen, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Pictogram, type Opening, type OpeningKind } from '@/components/plan'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cm, meters, parseLength } from '@/lib/format'
import type { derive } from './rooms'

type Derived = ReturnType<typeof derive>

const toText = (mm: number | null | undefined) => (mm == null ? '' : cm(mm))

type Check = { mm: number | null; warn?: string; suggest?: number }

/** Prüft eine Eingabe: Maß in mm, oder ein kurzer Hinweis samt Vorschlag, wenn etwas nicht stimmt. */
function check(text: string): Check {
  const t = text.trim()
  if (!t || /[.,+]$/.test(t)) return { mm: null } // leer oder noch beim Tippen
  const mm = parseLength(t)
  if (mm === null) return { mm: null, warn: 'Keine gültige Zahl' }
  const plain = /^\d+([.,]\d+)?$/.test(t)
  if (mm < 300) return plain && mm * 100 <= 15000 ? { mm: null, warn: `Meinst du ${meters(mm * 100)}?`, suggest: mm * 100 } : { mm: null, warn: 'Sehr kurz' }
  if (mm > 15000) return plain && mm / 10 >= 300 ? { mm: null, warn: `Meinst du ${meters(mm / 10)}?`, suggest: mm / 10 } : { mm: null, warn: 'Sehr lang' }
  return { mm }
}

function LengthInput({
  id,
  label,
  value,
  placeholder,
  autoFocus,
  onChange,
  onEnter,
}: {
  id: string
  label: string
  value: string
  placeholder?: string
  autoFocus?: boolean
  onChange: (v: string) => void
  onEnter?: () => void
}) {
  return (
    <Field className="min-w-0 flex-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup className="h-12">
        <InputGroupInput
          id={id}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
          className="text-xl font-semibold tabular-nums"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>cm</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

/** Hinweis mit optionaler Ein-Tipp-Korrektur */
function Warning({ text, actions }: { text: string; actions?: { label: string; onClick: () => void }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-destructive">{text}</span>
      {actions?.map((a) => (
        <Button key={a.label} variant="outline" size="xs" onClick={a.onClick}>
          {a.label}
        </Button>
      ))}
    </div>
  )
}

const panelClass =
  'flex shrink-0 flex-col gap-3 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:absolute md:right-4 md:bottom-4 md:w-96 md:rounded-xl md:border md:shadow-lg'

/** Wandmaß eingeben; Tür/Fenster an dieser Wand hinzufügen. */
export function WallPanel({
  label,
  value,
  entered,
  wall,
  derived,
  wallLabel,
  onChange,
  onResolve,
  onNext,
  onAddOpening,
}: {
  label: string
  value: number | null
  /** Alle eingegebenen Wandlängen des Raums */
  entered: (number | null)[]
  wall: number
  derived: Derived
  wallLabel: (i: number) => string
  onChange: (mm: number | null) => void
  /** Widerspruch gegenüberliegender Wände auflösen: beide auf diesen Wert */
  onResolve: (walls: [number, number], mm: number) => void
  onNext: () => void
  onAddOpening: (kind: OpeningKind) => void
}) {
  const [text, setText] = useState(toText(value))
  const c = check(text)
  const nextOpen = derived.status.some((s, i) => s === 'open' && i !== wall)
  const conflict = derived.conflict
  const apply = (v: string) => {
    setText(v)
    const r = check(v)
    if (!r.warn && !/[.,+]$/.test(v.trim())) onChange(r.mm)
  }

  return (
    <div className={panelClass}>
      <div className="flex items-end gap-2">
        <LengthInput
          id="wall-length"
          label={label}
          value={text}
          autoFocus
          placeholder={derived.status[wall] === 'computed' ? cm(derived.wallLengths[wall]) : undefined}
          onChange={apply}
          onEnter={() => !c.warn && onNext()}
        />
        <Button size="lg" className="h-12" onClick={onNext} disabled={!!c.warn}>
          {nextOpen ? 'Weiter' : 'Fertig'}
          <ChevronRight />
        </Button>
      </div>
      {c.warn && <Warning text={c.warn} actions={c.suggest ? [{ label: 'Übernehmen', onClick: () => apply(cm(c.suggest!)) }] : undefined} />}
      {!c.warn && conflict && (
        <Warning
          text={`${wallLabel(conflict[0])} und ${wallLabel(conflict[1]).replace('Wand ', '')} weichen ${cm(conflict[2])} cm ab`}
          actions={[conflict[0], conflict[1]].map((i) => ({
            label: `${cm(entered[i]!)} cm`,
            onClick: () => onResolve([conflict[0], conflict[1]], entered[i]!),
          }))}
        />
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

/** Tür oder Fenster anlegen bzw. bearbeiten – der Plan zeigt die Vorschau samt Maßkette live. */
export function OpeningPanel({
  kind,
  wallLabel,
  wallLength,
  wall,
  initial,
  onDraft,
  onCancel,
  onSave,
  onRemove,
}: {
  kind: OpeningKind
  wallLabel: string
  wallLength: number
  wall: number
  /** Vorhandene Öffnung bearbeiten */
  initial?: Opening
  onDraft: (o: Opening | undefined) => void
  onCancel: () => void
  onSave: (o: Omit<Opening, 'id'>) => void
  onRemove?: () => void
}) {
  const defaultWidth = kind === 'door' ? 885 : 1200
  const defaultOffset = Math.max(0, Math.round((wallLength - defaultWidth) / 2 / 50) * 50)
  const [offset, setOffset] = useState(toText(initial?.offset ?? defaultOffset))
  const [width, setWidth] = useState(toText(initial?.width ?? defaultWidth))
  const initialVariant = initial ? doorVariants.findIndex((d) => d.hinge === initial.hinge && d.swing === initial.swing) : 0
  const [variant, setVariant] = useState(String(Math.max(0, initialVariant)))

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
    onDraft(opening ? { ...opening, id: initial?.id ?? 'draft' } : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])
  useEffect(() => () => onDraft(undefined), [onDraft])

  const warn =
    offMm === null && offset.trim() && !/[.,+]$/.test(offset.trim())
      ? 'Keine gültige Zahl'
      : (wid.warn ?? (opening && !fits ? `Passt nicht in die Wand (${cm(wallLength)} cm)` : undefined))

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          {kind === 'door' ? 'Tür' : 'Fenster'} · {wallLabel}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Abbrechen" onClick={onCancel}>
          <X />
        </Button>
      </div>
      <div className="flex gap-2">
        <LengthInput id="opening-offset" label="Abstand zur Ecke" value={offset} autoFocus={!initial} onChange={setOffset} />
        <LengthInput id="opening-width" label="Breite" value={width} onChange={setWidth} onEnter={() => opening && fits && onSave(opening)} />
      </div>
      {kind === 'door' && (
        <ToggleGroup type="single" variant="outline" value={variant} onValueChange={(v) => v && setVariant(v)} className="w-full">
          {doorVariants.map((d, i) => (
            <ToggleGroupItem key={d.label} value={String(i)} aria-label={d.label} className="h-16 flex-1 p-1">
              <Pictogram variant="door" hinge={d.hinge} swing={d.swing} className="size-14" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {warn && <Warning text={warn} />}
      <div className="flex gap-2">
        {onRemove && (
          <Button variant="outline" size="lg" className="h-11 text-destructive" aria-label="Löschen" onClick={onRemove}>
            <Trash2 />
          </Button>
        )}
        <Button size="lg" className="h-11 flex-1" disabled={!opening || !fits} onClick={() => opening && onSave(opening)}>
          {initial ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>
    </div>
  )
}
