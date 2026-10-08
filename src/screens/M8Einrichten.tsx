import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  DoorOpen,
  Lock,
  MoreHorizontal,
  Plus,
  Redo2,
  RotateCw,
  Trash2,
  Undo2,
  PanelBottomClose,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PlanView, type Side } from '@/components/plan'
import { area, edges } from '@/components/plan/geometry'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { doorChecks } from '@/lib/checks'
import { cm, meters, parseLength, sqm } from '@/lib/format'
import { apartment, roomById } from '@/mock/apartment'
import { AppHeader, FitBadge, MobileShell, dims } from './shared'
import { sideLabel, useFurnishing } from './useFurnishing'

const room = roomById('wohnen')

export default function M8Einrichten() {
  const navigate = useNavigate()
  const f = useFurnishing(
    [room],
    apartment.furniture.filter((x) => x.roomId === room.id),
    'sofa',
  )
  const [showClearance, setShowClearance] = useState(true)
  const [step, setStep] = useState('10')
  const [distance, setDistance] = useState<{ side: Side; value: string } | null>(null)
  const [wallsOpen, setWallsOpen] = useState(false)

  const s = f.selected
  const checks = s ? doorChecks(apartment, s) : []
  const worst = checks.find((c) => c.result === 'no') ?? checks.find((c) => c.result === 'upright')
  const st = Number(step)
  const distMm = distance ? parseLength(distance.value) : null

  return (
    <MobileShell>
      <AppHeader
        title={room.name}
        subtitle={`Einrichten · ${sqm(area(room.polygon))}`}
        back="/wohnung"
        actions={
          <>
            <Button variant="ghost" size="icon" aria-label="Rückgängig" disabled={!f.canUndo} onClick={f.undo}>
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Wiederholen" disabled={!f.canRedo} onClick={f.redo}>
              <Redo2 />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Mehr">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem checked={showClearance} onCheckedChange={setShowClearance}>
                  Bewegungsflächen zeigen
                </DropdownMenuCheckboxItem>
                <DropdownMenuItem onSelect={() => setWallsOpen(true)}>Maß korrigieren …</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/desktop')}>Am großen Bildschirm öffnen</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <Tabs value="einrichten" onValueChange={(v) => navigate(v === 'aufmass' ? '/aufmass' : '/ergebnis')} className="shrink-0 border-b px-4 py-2">
        <TabsList className="w-full">
          <TabsTrigger value="aufmass">Aufmaß</TabsTrigger>
          <TabsTrigger value="einrichten">Einrichten</TabsTrigger>
          <TabsTrigger value="ergebnis">Ergebnis</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative min-h-0 flex-1">
        <PlanView
          rooms={[room]}
          furniture={f.items.map((x) => ({ ...x, fit: f.fitOf(x) }))}
          dimensions="all"
          showClearance={showClearance}
          selectedFurnitureId={f.selectedId}
          onSelectFurniture={f.select}
          onMoveFurniture={f.move}
          onDistanceClick={(side, mm) => setDistance({ side, value: cm(mm) })}
          interactive
          className="h-full"
        />
        <Button variant="secondary" size="xs" className="absolute top-2 left-2 shadow-sm" onClick={() => setWallsOpen(true)}>
          <Lock /> Wände gesperrt
        </Button>
      </div>

      {s ? (
        <div className="flex shrink-0 flex-col gap-3 border-t bg-background px-4 pt-3 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{dims(s)}</p>
            </div>
            <div className="flex items-center gap-1">
              <FitBadge fit={f.fitOf(s)} />
              <Button variant="ghost" size="icon-sm" aria-label="Auswahl aufheben" onClick={() => f.select(undefined)}>
                <PanelBottomClose />
              </Button>
            </div>
          </div>

          <Item size="xs" variant="muted">
            <ItemMedia variant="icon">
              <DoorOpen />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{worst?.result === 'no' ? `Passt nicht durch: ${worst.doorName}` : 'Passt durch alle Türen'}</ItemTitle>
              {worst?.result === 'upright' && (
                <ItemDescription>
                  {worst.doorName} ({cm(worst.doorWidth)} cm) nur hochkant
                </ItemDescription>
              )}
            </ItemContent>
          </Item>

          <div className="flex items-center justify-between gap-2">
            <ButtonGroup aria-label="Verschieben">
              <Button variant="outline" size="icon" aria-label="Nach links" onClick={() => f.nudge(-st, 0)}>
                <ArrowLeft />
              </Button>
              <Button variant="outline" size="icon" aria-label="Nach oben" onClick={() => f.nudge(0, -st)}>
                <ArrowUp />
              </Button>
              <Button variant="outline" size="icon" aria-label="Nach unten" onClick={() => f.nudge(0, st)}>
                <ArrowDown />
              </Button>
              <Button variant="outline" size="icon" aria-label="Nach rechts" onClick={() => f.nudge(st, 0)}>
                <ArrowRight />
              </Button>
            </ButtonGroup>
            <ToggleGroup type="single" variant="outline" size="sm" value={step} onValueChange={(v) => v && setStep(v)}>
              <ToggleGroupItem value="10">1 cm</ToggleGroupItem>
              <ToggleGroupItem value="100">10 cm</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={f.rotate}>
              <RotateCw /> Drehen
            </Button>
            <Button variant="outline" size="sm" onClick={() => f.toWall()}>
              An die Wand
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={f.remove}>
              <Trash2 /> Entfernen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Tipp: Blaues Maß antippen, um den Abstand zur Wand exakt einzugeben.</p>
        </div>
      ) : (
        <div className="flex shrink-0 flex-col gap-2 border-t px-4 pt-3 pb-4">
          <p className="text-sm text-muted-foreground">Möbel antippen zum Verschieben – oder ein neues hinzufügen.</p>
          <Button size="lg" className="h-11" onClick={() => navigate('/moebel')}>
            <Plus /> Möbel hinzufügen
          </Button>
        </div>
      )}

      {/* Abstand exakt eingeben */}
      <Drawer open={!!distance} onOpenChange={(o) => !o && setDistance(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Abstand zur Wand {distance && sideLabel[distance.side]}</DrawerTitle>
            <DrawerDescription>{s?.name} wird so verschoben, dass der Abstand genau stimmt.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4">
            <Field>
              <FieldLabel htmlFor="distance">Abstand</FieldLabel>
              <InputGroup className="h-12">
                <InputGroupInput
                  id="distance"
                  inputMode="decimal"
                  autoFocus
                  value={distance?.value ?? ''}
                  onChange={(e) => distance && setDistance({ ...distance, value: e.target.value })}
                  className="text-2xl font-semibold tabular-nums"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>cm</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>{distMm !== null ? `= ${meters(distMm)}` : 'Zahl in cm, z. B. 60'}</FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              {[
                ['1', 'An die Wand (Fußleiste)'],
                ['60', 'Durchgang 60'],
                ['90', 'Bequem 90'],
              ].map(([v, label]) => (
                <Button key={v} variant="outline" size="sm" onClick={() => distance && setDistance({ ...distance, value: v })}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <DrawerFooter>
            <Button
              size="lg"
              disabled={distMm === null}
              onClick={() => {
                if (distance && distMm !== null) f.setDistance(distance.side, distMm)
                setDistance(null)
              }}
            >
              Übernehmen
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Gesperrte Raummaße – Korrektur ohne Moduswechsel */}
      <Drawer open={wallsOpen} onOpenChange={setWallsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Maß korrigieren</DrawerTitle>
            <DrawerDescription>Beim Einrichten sind die gemessenen Wände gesperrt, damit nichts versehentlich verrutscht.</DrawerDescription>
          </DrawerHeader>
          <ItemGroup className="gap-2 px-4">
            {edges(room.polygon).map((e, i) => (
              <Item key={i} variant="outline" size="sm">
                <ItemMedia variant="icon">
                  <Lock />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Wand {i + 1}</ItemTitle>
                  <ItemDescription className="tabular-nums">{cm(e.length)} cm · gemessen</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm" onClick={() => toast('Im Prototyp nicht verfügbar', { description: 'Hier öffnet sich das Eingabefeld der Wand.' })}>
                    Ändern
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fertig</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </MobileShell>
  )
}
