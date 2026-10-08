import { Download, Lock, MousePointerClick, Plus, QrCode, Redo2, RotateCw, Trash2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PlanView, type Furniture, type FurnitureKind, type Side } from '@/components/plan'
import { area } from '@/components/plan/geometry'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { doorChecks } from '@/lib/checks'
import { cm, parseLength, sqm } from '@/lib/format'
import { apartment, roomById } from '@/mock/apartment'
import { FitBadge, PrototypeBar, dims } from './shared'
import { sideLabel, useFurnishing } from './useFurnishing'

type CatalogEntry = { name: string; kind: FurnitureKind; w: number; d: number; h: number; frontClearance?: number }

const catalog: Record<string, CatalogEntry[]> = {
  Wohnzimmer: [
    { name: 'Sofa 3-Sitzer', kind: 'sofa', w: 2200, d: 950, h: 850 },
    { name: 'Sofa 2-Sitzer', kind: 'sofa', w: 1600, d: 900, h: 850 },
    { name: 'Sessel', kind: 'chair', w: 800, d: 800, h: 900 },
    { name: 'Couchtisch', kind: 'table', w: 1100, d: 600, h: 420 },
    { name: 'TV-Board', kind: 'tv', w: 1800, d: 400, h: 500 },
    { name: 'Regal', kind: 'shelf', w: 800, d: 350, h: 1900 },
  ],
  Schlafzimmer: [
    { name: 'Bett 140×200', kind: 'bed', w: 1400, d: 2000, h: 450 },
    { name: 'Bett 160×200', kind: 'bed', w: 1600, d: 2000, h: 450 },
    { name: 'Bett 180×200', kind: 'bed', w: 1800, d: 2000, h: 450 },
    { name: 'Kleiderschrank', kind: 'wardrobe', w: 2000, d: 600, h: 2200, frontClearance: 700 },
    { name: 'Kommode', kind: 'shelf', w: 1000, d: 500, h: 800 },
  ],
  Arbeiten: [
    { name: 'Schreibtisch', kind: 'table', w: 1400, d: 700, h: 750 },
    { name: 'Bürostuhl', kind: 'chair', w: 650, d: 650, h: 1100 },
  ],
  Essen: [
    { name: 'Esstisch', kind: 'table', w: 1200, d: 800, h: 750 },
    { name: 'Stuhl', kind: 'chair', w: 450, d: 500, h: 900 },
  ],
}

export default function D1Desktop() {
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('wohnen')
  const room = roomById(roomId)
  const f = useFurnishing(apartment.rooms, apartment.furniture, 'sofa')
  const [showClearance, setShowClearance] = useState(true)
  const [baseboard, setBaseboard] = useState(true)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState({ name: 'Klavier', w: '150', d: '60', h: '125' })

  const s = f.selected
  const addToRoom = (e: CatalogEntry) => {
    const c = room.polygon.reduce((a, p) => ({ x: a.x + p.x / room.polygon.length, y: a.y + p.y / room.polygon.length }), { x: 0, y: 0 })
    f.add({ id: `${e.kind}-${Date.now()}`, roomId, cx: Math.round(c.x / 10) * 10, cy: Math.round(c.y / 10) * 10, rot: 0, fit: 'ok', ...e })
    toast(`${e.name} hinzugefügt`, { description: `Mitten im ${room.name} – jetzt verschieben oder Abstände eintragen.` })
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <PrototypeBar />
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/start">Meine Wohnungen</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/wohnung">{apartment.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{room.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Tabs value="einrichten" onValueChange={(v) => navigate(v === 'aufmass' ? '/aufmass' : '/ergebnis')}>
          <TabsList>
            <TabsTrigger value="aufmass">Aufmaß</TabsTrigger>
            <TabsTrigger value="einrichten">Einrichten</TabsTrigger>
            <TabsTrigger value="ergebnis">Ergebnis</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Rückgängig" disabled={!f.canUndo} onClick={f.undo}>
                <Undo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rückgängig (Strg+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Wiederholen" disabled={!f.canRedo} onClick={f.redo}>
                <Redo2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Wiederholen (Strg+Umschalt+Z)</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="outline" onClick={() => navigate('/ergebnis')}>
            <QrCode /> Aufs Handy
          </Button>
          <Button onClick={() => navigate('/ergebnis')}>
            <Download /> PDF exportieren
          </Button>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Bibliothek & Räume */}
        <ResizablePanel defaultSize={300} minSize={240} maxSize={420} className="flex flex-col">
          <Tabs defaultValue="moebel" className="flex min-h-0 flex-1 flex-col gap-0">
            <div className="border-b p-3">
              <TabsList className="w-full">
                <TabsTrigger value="moebel">Möbel</TabsTrigger>
                <TabsTrigger value="raeume">Räume</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="moebel" className="flex min-h-0 flex-1 flex-col">
              <Command className="min-h-0 flex-1 rounded-none">
                <CommandInput placeholder="Suchen, z. B. Bett 160 …" />
                <CommandList className="max-h-none flex-1">
                  {Object.entries(catalog).map(([group, entries]) => (
                    <CommandGroup key={group} heading={group}>
                      {entries.map((e) => (
                        <CommandItem key={e.name} value={`${group} ${e.name}`} onSelect={() => addToRoom(e)}>
                          {e.name}
                          <CommandShortcut className="tabular-nums">
                            {cm(e.w)} × {cm(e.d)}
                          </CommandShortcut>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
              <div className="border-t p-3">
                <Button variant="outline" className="w-full" onClick={() => setCustomOpen(true)}>
                  <Plus /> Eigenes Möbel
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="raeume" className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <ItemGroup className="gap-2 p-3">
                  {apartment.rooms.map((r) => (
                    <Item
                      key={r.id}
                      variant={r.id === roomId ? 'outline' : 'default'}
                      size="sm"
                      asChild
                      className={r.id === roomId ? 'border-primary/50 bg-primary/5' : undefined}
                    >
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setRoomId(r.id)
                          f.select(undefined)
                        }}
                      >
                        <ItemMedia>
                          <PlanView rooms={[r]} wallThickness={250} padding={300} className="size-10" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{r.name}</ItemTitle>
                          <ItemDescription>
                            {sqm(area(r.polygon))} · {apartment.furniture.filter((x) => x.roomId === r.id).length} Möbel
                          </ItemDescription>
                        </ItemContent>
                      </a>
                    </Item>
                  ))}
                </ItemGroup>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Plan */}
        <ResizablePanel className="relative bg-muted/20">
          <PlanView
            rooms={apartment.rooms}
            furniture={f.items.map((x) => ({ ...x, fit: f.fitOf(x) }))}
            dimensions={[roomId]}
            focusRoomId={roomId}
            showRoomLabels
            showClearance={showClearance}
            selectedFurnitureId={f.selectedId}
            onSelectFurniture={(id) => {
              const hit = f.items.find((x) => x.id === id)
              if (hit) setRoomId(hit.roomId)
              f.select(id)
            }}
            onMoveFurniture={f.move}
            onDistanceClick={(side) => document.getElementById(`dist-${side}`)?.focus()}
            interactive
            textScale={0.95}
            className="h-full"
          />
          <Button variant="secondary" size="xs" className="absolute top-3 left-3 shadow-sm" onClick={() => toast('Wände sind beim Einrichten gesperrt', { description: 'Zum Ändern in den Tab „Aufmaß“ wechseln.' })}>
            <Lock /> Wände gesperrt
          </Button>
          <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-px w-5 bg-foreground" /> gemessen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 border-t border-dashed border-muted-foreground" /> geschätzt
            </span>
            <Separator orientation="vertical" className="h-3" />
            <FitBadge fit="ok" />
            <FitBadge fit="tight" />
            <FitBadge fit="bad" />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Eigenschaften */}
        <ResizablePanel defaultSize={330} minSize={280} maxSize={460}>
          <ScrollArea className="h-full">
            {s ? (
              <div className="flex flex-col gap-5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{s.name}</h2>
                    <p className="text-sm text-muted-foreground tabular-nums">{dims(s)}</p>
                  </div>
                  <FitBadge fit={f.fitOf(s)} />
                </div>

                <FieldGroup className="gap-5">
                  <FieldSet>
                    <FieldLegend variant="label">Maße</FieldLegend>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ['w', 'Breite'],
                          ['d', 'Tiefe'],
                          ['h', 'Höhe'],
                        ] as const
                      ).map(([key, label]) => (
                        <LengthField key={`${s.id}-${key}-${s[key]}`} id={`dim-${key}`} label={label} mm={s[key]} onCommit={(mm) => f.update(s.id, { [key]: mm })} />
                      ))}
                    </div>
                  </FieldSet>

                  <FieldSet>
                    <FieldLegend variant="label">Abstand zur Wand</FieldLegend>
                    <div className="grid grid-cols-2 gap-2">
                      {(['left', 'right', 'top', 'bottom'] as Side[]).map((side) => {
                        const d = f.distances?.[side].d
                        return (
                          <LengthField
                            key={`${s.id}-${side}-${d}`}
                            id={`dist-${side}`}
                            label={sideLabel[side]}
                            mm={d ?? 0}
                            disabled={d === null || d === undefined}
                            onCommit={(mm) => f.setDistance(side, mm)}
                          />
                        )
                      })}
                    </div>
                  </FieldSet>

                  <Field>
                    <FieldLabel>Drehung</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={String(s.rot)}
                      onValueChange={(v) => v && f.update(s.id, { rot: Number(v) as Furniture['rot'] })}
                      className="w-full"
                    >
                      {[0, 90, 180, 270].map((r) => (
                        <ToggleGroupItem key={r} value={String(r)} className="flex-1 tabular-nums">
                          {r}°
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>

                  <ButtonGroup className="w-full">
                    <Button variant="outline" className="flex-1" onClick={() => f.toWall(baseboard ? 10 : 0)}>
                      An die Wand
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={f.rotate}>
                      <RotateCw /> Drehen
                    </Button>
                    <Button variant="outline" size="icon" aria-label="Entfernen" className="text-destructive" onClick={f.remove}>
                      <Trash2 />
                    </Button>
                  </ButtonGroup>
                </FieldGroup>

                <Separator />

                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Passt es durch?</h3>
                  <ItemGroup className="gap-1.5">
                    {doorChecks(apartment, s).map((c) => (
                      <Item key={c.doorId} size="xs" variant="muted">
                        <ItemContent>
                          <ItemTitle>{c.doorName}</ItemTitle>
                          <ItemDescription className="tabular-nums">{cm(c.doorWidth)} cm lichte Breite</ItemDescription>
                        </ItemContent>
                        <FitBadge fit={c.result === 'flat' ? 'ok' : c.result === 'upright' ? 'tight' : 'bad'} />
                      </Item>
                    ))}
                  </ItemGroup>
                  <p className="text-xs text-muted-foreground">„Knapp“ = nur hochkant bzw. gekippt tragbar.</p>
                </div>

                <Separator />

                <FieldGroup className="gap-3">
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="clearance" className="flex-1">
                      Bewegungsflächen zeigen
                    </FieldLabel>
                    <Switch id="clearance" checked={showClearance} onCheckedChange={setShowClearance} />
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="baseboard" className="flex-1">
                      1 cm Fußleisten-Puffer
                    </FieldLabel>
                    <Switch id="baseboard" checked={baseboard} onCheckedChange={setBaseboard} />
                  </Field>
                </FieldGroup>
              </div>
            ) : (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MousePointerClick />
                  </EmptyMedia>
                  <EmptyTitle>Kein Möbel ausgewählt</EmptyTitle>
                  <EmptyDescription>
                    Klick ein Möbel im Plan an oder wähl eins aus der Bibliothek. {room.name}: {sqm(area(room.polygon))}.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eigenes Möbel</DialogTitle>
            <DialogDescription>Maße stehen meist im Produktdatenblatt als B × T × H.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="custom-name">Name</FieldLabel>
              <Input id="custom-name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['w', 'Breite'],
                  ['d', 'Tiefe'],
                  ['h', 'Höhe'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`custom-${key}`}>{label}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput id={`custom-${key}`} inputMode="decimal" value={custom[key]} onChange={(e) => setCustom({ ...custom, [key]: e.target.value })} className="tabular-nums" />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>cm</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              ))}
            </div>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button
              onClick={() => {
                const [w, d, h] = [custom.w, custom.d, custom.h].map(parseLength)
                if (!w || !d || !h) return toast.error('Bitte alle drei Maße eingeben')
                addToRoom({ name: custom.name || 'Eigenes Möbel', kind: 'generic', w, d, h })
                setCustomOpen(false)
              }}
            >
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Maßfeld in cm, übernimmt beim Verlassen oder mit Enter. */
function LengthField({ id, label, mm, disabled, onCommit }: { id: string; label: string; mm: number; disabled?: boolean; onCommit: (mm: number) => void }) {
  const [draft, setDraft] = useState(disabled ? '–' : cm(mm))
  const commit = () => {
    const v = parseLength(draft)
    if (v !== null && v !== mm) onCommit(v)
    else setDraft(cm(mm))
  }
  return (
    <Field>
      <FieldLabel htmlFor={id} className="text-xs text-muted-foreground capitalize">
        {label}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          inputMode="decimal"
          disabled={disabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
          className="tabular-nums"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>cm</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
