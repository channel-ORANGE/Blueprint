import { DoorOpen, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PlanView, type Furniture, type FurnitureKind, type Room } from '@/components/plan'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { doorChecks } from '@/lib/checks'
import { cm, parseLength } from '@/lib/format'
import { cn } from '@/lib/utils'
import { apartment } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

/** Maße in cm: Breite × Tiefe × Höhe */
const library: { group: string; items: { name: string; w: number; d: number; h: number }[] }[] = [
  {
    group: 'Wohnzimmer',
    items: [
      { name: 'Sofa 3-Sitzer', w: 220, d: 95, h: 85 },
      { name: 'Sofa 2-Sitzer', w: 160, d: 90, h: 85 },
      { name: 'Sessel', w: 80, d: 80, h: 90 },
      { name: 'Couchtisch', w: 110, d: 60, h: 42 },
      { name: 'TV-Board', w: 180, d: 40, h: 50 },
      { name: 'Regal', w: 80, d: 35, h: 190 },
    ],
  },
  {
    group: 'Schlafzimmer',
    items: [
      { name: 'Bett 140', w: 140, d: 200, h: 45 },
      { name: 'Bett 160', w: 160, d: 200, h: 45 },
      { name: 'Bett 180', w: 180, d: 200, h: 45 },
      { name: 'Kleiderschrank', w: 200, d: 60, h: 220 },
      { name: 'Nachttisch', w: 45, d: 40, h: 55 },
      { name: 'Kommode', w: 100, d: 50, h: 80 },
    ],
  },
  {
    group: 'Küche',
    items: [
      { name: 'Esstisch', w: 120, d: 80, h: 75 },
      { name: 'Stuhl', w: 45, d: 50, h: 90 },
      { name: 'Kühlschrank', w: 60, d: 65, h: 180 },
    ],
  },
  {
    group: 'Arbeiten',
    items: [
      { name: 'Schreibtisch', w: 140, d: 70, h: 75 },
      { name: 'Bürostuhl', w: 65, d: 65, h: 110 },
    ],
  },
  { group: 'Bad', items: [{ name: 'Waschmaschine', w: 60, d: 60, h: 85 }] },
]

const kinds: { value: string; label: string; kind: FurnitureKind }[] = [
  { value: 'sofa', label: 'Sofa', kind: 'sofa' },
  { value: 'bed', label: 'Bett', kind: 'bed' },
  { value: 'wardrobe', label: 'Schrank', kind: 'wardrobe' },
  { value: 'table', label: 'Tisch', kind: 'table' },
  { value: 'shelf', label: 'Regal', kind: 'shelf' },
  { value: 'generic', label: 'Sonstiges', kind: 'generic' },
]

const MARGIN = 400 // 40 cm Rand um das Möbel in der Vorschau

function CmInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const invalid = parseLength(value) === null
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup className="h-10">
        <InputGroupInput id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} className="tabular-nums" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>cm</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

export default function M9Moebel() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [w, setW] = useState('120')
  const [d, setD] = useState('60')
  const [h, setH] = useState('200')
  const [kind, setKind] = useState('wardrobe')
  const [clearance, setClearance] = useState(true)
  const [clearanceDepth, setClearanceDepth] = useState('60')

  const add = (n: string) => {
    toast(`${n} hinzugefügt`)
    navigate('/einrichten')
  }

  const wMm = parseLength(w)
  const dMm = parseLength(d)
  const hMm = parseLength(h)
  const cMm = clearance ? parseLength(clearanceDepth) : 0
  const valid = !!wMm && !!dMm && !!hMm && cMm !== null

  // Vorschau: Raum umschließt das Möbel mit 40 cm Rand (plus Bewegungsfläche davor).
  const pw = wMm || 1000
  const pd = dMm || 500
  const fc = cMm ?? 0
  const furniture: Furniture = {
    id: 'neu',
    roomId: 'vorschau',
    kind: kinds.find((k) => k.value === kind)?.kind ?? 'generic',
    name: name || 'Eigenes Möbel',
    cx: MARGIN + pw / 2,
    cy: MARGIN + pd / 2,
    w: pw,
    d: pd,
    h: hMm || 800,
    rot: 0,
    frontClearance: fc || undefined,
  }
  const roomW = pw + 2 * MARGIN
  const roomH = pd + MARGIN + Math.max(fc, MARGIN)
  const room: Room = {
    id: 'vorschau',
    name: '',
    polygon: [
      { x: 0, y: 0 },
      { x: roomW, y: 0 },
      { x: roomW, y: roomH },
      { x: 0, y: roomH },
    ],
    openings: [],
  }

  const checks = doorChecks(apartment, { ...furniture, roomId: 'wohnen' })
  const worst = checks.find((c) => c.result === 'no') ?? checks.find((c) => c.result === 'upright')
  const door = worst ?? checks.find((c) => c.doorId === 'd-eingang')
  const status = worst?.result ?? 'flat'
  const doorText = {
    flat: 'Passt durch die Wohnungstür',
    upright: `Nur hochkant durch: ${worst?.doorName}`,
    no: `Passt nicht durch: ${worst?.doorName}`,
  }[status]

  return (
    <MobileShell>
      <AppHeader title="Möbel hinzufügen" subtitle="Wohnzimmer" back="/einrichten" />

      <Tabs defaultValue="bibliothek" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 border-b px-4 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="bibliothek">Bibliothek</TabsTrigger>
            <TabsTrigger value="eigenes">Eigenes Möbel</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bibliothek" className="min-h-0 flex-1">
          <Command className="h-full rounded-none! bg-background p-2">
            <CommandInput placeholder="Suchen, z. B. Sofa, Bett 160 …" />
            <CommandList className="max-h-none min-h-0 flex-1 pt-1">
              <CommandEmpty>Nichts gefunden – leg ein eigenes Möbel an.</CommandEmpty>
              {library.map((g) => (
                <CommandGroup key={g.group} heading={g.group}>
                  {g.items.map((m) => (
                    <CommandItem key={m.name} value={`${m.name} ${g.group}`} onSelect={() => add(m.name)} className="py-2.5">
                      <span className="truncate">{m.name}</span>
                      <CommandShortcut className="tracking-normal tabular-nums">
                        {m.w} × {m.d} × {m.h}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </TabsContent>

        <TabsContent value="eigenes" className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Sideboard" className="h-10" />
              </Field>

              <div className="grid grid-cols-3 gap-2">
                <CmInput id="w" label="Breite" value={w} onChange={setW} />
                <CmInput id="d" label="Tiefe" value={d} onChange={setD} />
                <CmInput id="h" label="Höhe" value={h} onChange={setH} />
              </div>

              <Field>
                <FieldLabel htmlFor="kind">Art</FieldLabel>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger id="kind" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kinds.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <label htmlFor="clearance">Bewegungsfläche davor</label>
                  </FieldTitle>
                  <FieldDescription>z. B. Schranktüren</FieldDescription>
                </FieldContent>
                <Switch id="clearance" checked={clearance} onCheckedChange={setClearance} />
              </Field>

              {clearance && <CmInput id="clearance-depth" label="Tiefe der Fläche" value={clearanceDepth} onChange={setClearanceDepth} />}

              <PlanView rooms={[room]} furniture={[furniture]} showClearance className="h-36 rounded-md border" />

              <Item variant="outline" size="sm">
                <ItemMedia variant="icon" className={cn(status === 'no' && 'text-fit-bad', status === 'upright' && 'text-fit-tight', status === 'flat' && 'text-fit-ok')}>
                  <DoorOpen />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{doorText}</ItemTitle>
                  {door && (
                    <ItemDescription>
                      {door.doorName} ist {cm(door.doorWidth)} cm breit{dMm ? ` · Möbel ${cm(dMm)} cm tief` : ''}
                    </ItemDescription>
                  )}
                </ItemContent>
              </Item>

              <Item variant="muted" size="xs">
                <ItemMedia variant="icon">
                  <Lightbulb />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription>Tipp: Maße stehen im Produktdatenblatt meist als B × T × H.</ItemDescription>
                </ItemContent>
              </Item>
            </FieldGroup>
          </div>

          <div className="shrink-0 border-t bg-background px-4 pt-3 pb-4">
            <Button size="lg" className="h-11 w-full" disabled={!valid} onClick={() => add(name.trim() || 'Eigenes Möbel')}>
              Hinzufügen
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </MobileShell>
  )
}
