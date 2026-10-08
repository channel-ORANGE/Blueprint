import { AppWindow, DoorOpen, RectangleVertical } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PlanView, Pictogram, type Opening, type OpeningKind } from '@/components/plan'
import { edges } from '@/components/plan/geometry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cm, meters, parseLength } from '@/lib/format'
import { measuringRoom } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

const WALL = 0
const wallLength = edges(measuringRoom.polygon)[WALL].length

const kindText: Record<OpeningKind, string> = { door: 'Tür', window: 'Fenster', passage: 'Durchgang' }
const defaults: Record<OpeningKind, { width: string; height: string }> = {
  door: { width: '88,5', height: '201' },
  window: { width: '120', height: '130' },
  passage: { width: '100', height: '201' },
}

/**
 * Links/rechts gilt immer vom Rauminneren aus gesehen – wie man vor der Wand steht.
 * Die Piktogramme zeigen deshalb die Türwand oben, den Raum davor.
 */
const swings = [
  { value: 'end-in', hinge: 'end', swing: 'in', label: 'Bänder rechts', sub: 'nach innen' },
  { value: 'start-in', hinge: 'start', swing: 'in', label: 'Bänder links', sub: 'nach innen' },
  { value: 'end-out', hinge: 'end', swing: 'out', label: 'Bänder rechts', sub: 'nach außen' },
  { value: 'start-out', hinge: 'start', swing: 'out', label: 'Bänder links', sub: 'nach außen' },
] as const

/** Eingabefeld in cm mit Spiegelung in Metern. */
function CmField({
  id,
  label,
  value,
  onChange,
  invalid,
  hint,
  estimated,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  hint?: string
  estimated?: boolean
}) {
  const mm = parseLength(value)
  const error = mm === null || invalid
  return (
    <Field>
      <FieldLabel htmlFor={id} className="w-full justify-between">
        {label}
        {estimated && <Badge variant="outline">geschätzt</Badge>}
      </FieldLabel>
      <InputGroup className="h-10">
        <InputGroupInput id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error} className="tabular-nums" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>cm</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription className={error ? 'text-destructive' : undefined}>
        {mm === null ? 'Zahl in cm, z. B. 243' : hint ?? `= ${meters(mm)}`}
      </FieldDescription>
    </Field>
  )
}

export default function M5Oeffnung() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [kind, setKind] = useState<OpeningKind>('door')
  const [offset, setOffset] = useState('243')
  const [width, setWidth] = useState(defaults.door.width)
  const [height, setHeight] = useState(defaults.door.height)
  const [sill, setSill] = useState('90')
  const [dir, setDir] = useState<(typeof swings)[number]['value']>('end-in')

  const changeKind = (k: OpeningKind) => {
    setKind(k)
    setWidth(defaults[k].width)
    setHeight(defaults[k].height)
  }

  const offsetMm = parseLength(offset)
  const widthMm = parseLength(width)
  const fits = offsetMm !== null && widthMm !== null && offsetMm + widthMm <= wallLength
  const valid = offsetMm !== null && widthMm !== null && widthMm > 0 && fits
  const chosen = swings.find((s) => s.value === dir)!

  // Live-Vorschau: die bearbeitete Öffnung ersetzt die vorhandene Tür des Platzhalter-Raums.
  const previewWidth = Math.min(Math.max(widthMm ?? 885, 300), wallLength - 200)
  const previewOffset = Math.min(Math.max(offsetMm ?? 0, 0), wallLength - previewWidth)
  const opening: Opening = {
    id: 'neu',
    kind,
    wall: WALL,
    offset: previewOffset,
    width: previewWidth,
    status: 'estimated',
    ...(kind === 'door' ? { hinge: chosen.hinge, swing: chosen.swing } : {}),
  }
  const room = { ...measuringRoom, openings: [opening] }

  const close = () => navigate('/aufmass')

  return (
    <MobileShell>
      <AppHeader title="Schlafzimmer" subtitle="Aufmaß · Öffnung hinzufügen" back="/aufmass" />

      {/* Platz unter dem Drawer freihalten, damit die Vorschau sichtbar bleibt */}
      <div className={`flex min-h-0 flex-1 flex-col transition-[padding] ${open ? 'pb-[62dvh]' : ''}`}>
        <PlanView rooms={[room]} dimensions="all" highlightOpeningId="neu" className="min-h-0 flex-1" />
      </div>

      <Drawer
        open={open}
        modal={false}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) close()
        }}
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[62dvh]">
          <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle>Öffnung an Wand {WALL + 1}</DrawerTitle>
            <DrawerDescription>Nur Position und Breite sind Pflicht, der Rest ist vorausgefüllt. Links und rechts gelten von innen gesehen.</DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel>Art</FieldLabel>
                <ToggleGroup type="single" variant="outline" value={kind} onValueChange={(v) => v && changeKind(v as OpeningKind)} spacing={0} className="w-full">
                  <ToggleGroupItem value="door" className="flex-1 gap-1.5">
                    <DoorOpen /> Tür
                  </ToggleGroupItem>
                  <ToggleGroupItem value="window" className="flex-1 gap-1.5">
                    <AppWindow /> Fenster
                  </ToggleGroupItem>
                  <ToggleGroupItem value="passage" className="flex-1 gap-1.5">
                    <RectangleVertical /> Durchgang
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <CmField id="offset" label="Abstand links" value={offset} onChange={setOffset} invalid={!fits && offsetMm !== null && widthMm !== null} />
                <CmField
                  id="width"
                  label="Breite"
                  value={width}
                  onChange={setWidth}
                  invalid={!fits && offsetMm !== null && widthMm !== null}
                  hint={!fits && offsetMm !== null && widthMm !== null ? `Wand ist nur ${cm(wallLength)} cm lang` : undefined}
                />
              </div>

              {kind === 'door' && (
                <Field>
                  <FieldLabel>Öffnungsrichtung</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={dir}
                    onValueChange={(v) => v && setDir(v as typeof dir)}
                    spacing={2}
                    className="grid w-full grid-cols-4"
                  >
                    {swings.map((s) => (
                      <ToggleGroupItem
                        key={s.value}
                        value={s.value}
                        aria-label={`${s.label}, ${s.sub}`}
                        className="h-auto min-w-0 flex-col gap-1 px-0.5 py-1.5 text-xs leading-tight whitespace-nowrap [&_svg:not([class*='size-'])]:size-full"
                      >
                        <Pictogram variant="door" hinge={s.hinge} swing={s.swing} className="size-16" />
                        <span className="font-medium">{s.label}</span>
                        <span className="font-normal text-muted-foreground">{s.sub}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              )}

              <FieldSet>
                <FieldLegend variant="label">Weitere Maße</FieldLegend>
                <div className="grid grid-cols-2 gap-3">
                  <CmField id="height" label="Höhe" value={height} onChange={setHeight} estimated />
                  {kind === 'window' && <CmField id="sill" label="Brüstung" value={sill} onChange={setSill} estimated />}
                </div>
              </FieldSet>
            </FieldGroup>
          </div>

          <DrawerFooter className="flex-row-reverse border-t">
            <Button
              size="lg"
              className="h-11 flex-1"
              disabled={!valid}
              onClick={() => {
                toast(`${kindText[kind]} hinzugefügt`)
                navigate('/aufmass')
              }}
            >
              Hinzufügen
            </Button>
            <Button variant="outline" size="lg" className="h-11" onClick={close}>
              Abbrechen
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </MobileShell>
  )
}
