import { AppWindow, Camera, Check, ChevronRight, DoorOpen, Lightbulb, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { MiniMap, PlanView } from '@/components/plan'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Progress } from '@/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cm, meters, parseLength } from '@/lib/format'
import { measuringRoom } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

const walls = [
  { label: 'Wand 1', hint: 'Türwand', tip: 'Stell dich in die Tür und miss die Wand, in der sie sitzt – von Ecke zu Ecke.' },
  { label: 'Wand 2', hint: 'links von der Tür', tip: 'Auf Hüfthöhe messen, nicht an der Fußleiste – Sockel und Kabelkanäle verfälschen das Maß.' },
  { label: 'Wand 3', hint: 'gegenüber der Tür', tip: 'Ergibt sich beim Rechteck aus Wand 1. Nur messen, wenn du unsicher bist.' },
  { label: 'Wand 4', hint: 'rechts von der Tür', tip: 'Ergibt sich beim Rechteck aus Wand 2 – zur Kontrolle trotzdem kurz nachmessen.' },
]

export default function M4Aufmass() {
  const navigate = useNavigate()
  const [active, setActive] = useState(1)
  // Eingaben je Wand. Beim Rechteck ergeben sich Wand 3 und 4 aus Wand 1 und 2.
  const [values, setValues] = useState(['360', '345', '', ''])
  const value = values[active] || (active >= 2 ? values[active - 2] : '')
  const setValue = (v: string) => setValues((vs) => vs.map((x, i) => (i === active ? v : x)))
  const mm = parseLength(value)
  const implausible = mm !== null && (mm < 300 || mm > 15000)

  // Live-Vorschau: der Plan wächst beim Tippen mit.
  const clamp = (v: number | null, fallback: number) => Math.min(9000, Math.max(800, v ?? fallback))
  const W = clamp(parseLength(values[active === 2 ? 2 : 0] || values[0]), 3600)
  const H = clamp(parseLength(values[active === 3 ? 3 : 1] || values[1]), 3450)
  const room = {
    ...measuringRoom,
    polygon: [
      { x: W, y: H },
      { x: 0, y: H },
      { x: 0, y: 0 },
      { x: W, y: 0 },
    ],
    wallStatus: [0, 1, 2, 3].map((i) => (i === active ? 'open' : values[i] ? 'measured' : i >= 2 ? 'computed' : 'open')) as ('open' | 'measured' | 'computed')[],
    openings: measuringRoom.openings.map((o) => ({ ...o, offset: Math.max(100, Math.min(W - o.width - 100, W - 1170)) })),
  }

  return (
    <MobileShell>
      <AppHeader
        title="Schlafzimmer"
        subtitle="Aufmaß · Rechteck"
        back="/wohnung"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mehr">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate('/raumform')}>Raumform ändern</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/pruefung')}>Diagonale prüfen</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Raum löschen</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            Wand {active + 1} von {walls.length}
          </span>
          <span className="text-xs text-muted-foreground">Wand 3 + 4 ergeben sich</span>
        </div>
        <Progress value={((active + 1) / walls.length) * 100} />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={String(active)}
          onValueChange={(v) => v && setActive(Number(v))}
          className="w-full"
        >
          {walls.map((w, i) => (
            <ToggleGroupItem key={w.label} value={String(i)} className="flex-1 gap-1 tabular-nums">
              {values[i] && i !== active && <Check className="text-fit-ok" />}
              {i + 1}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <PlanView
        rooms={[room]}
        dimensions="all"
        activeWall={{ roomId: room.id, index: active, label: mm ? cm(mm) : '?' }}
        onWallClick={(_, i) => setActive(i)}
        className="min-h-0 flex-1"
      />

      <div className="flex shrink-0 flex-col gap-3 border-t bg-background px-4 pt-3 pb-4">
        <div className="flex items-start gap-3">
          <MiniMap room={room} activeWall={active} className="size-16 shrink-0 rounded-md border" />
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="wall-length">
              {walls[active].label} · {walls[active].hint}
            </FieldLabel>
            <InputGroup className="h-12">
              <InputGroupInput
                id="wall-length"
                inputMode="decimal"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={mm === null || implausible}
                className="text-2xl font-semibold tabular-nums"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>cm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription className={mm === null || implausible ? 'text-destructive' : undefined}>
              {mm === null
                ? 'Bitte eine Zahl eingeben, z. B. 345 oder 3,45 m'
                : implausible
                  ? `= ${meters(mm)} – ungewöhnlich ${mm < 300 ? 'kurz' : 'lang'}. Stimmt die Einheit?`
                  : `= ${meters(mm)}`}
            </FieldDescription>
          </Field>
        </div>

        <Alert className="py-2.5">
          <Lightbulb />
          <AlertDescription className="text-xs">{walls[active].tip}</AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/oeffnung')}>
            <DoorOpen /> Tür
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/oeffnung')}>
            <AppWindow /> Fenster
          </Button>
          <Button variant="outline" size="sm">
            <Camera /> Foto
          </Button>
        </div>

        <Button size="lg" className="h-11 w-full" disabled={mm === null} onClick={() => (active < walls.length - 1 ? setActive(active + 1) : navigate('/pruefung'))}>
          {active < walls.length - 1 ? `Weiter zu Wand ${active + 2}` : 'Raum abschließen'}
          <ChevronRight />
        </Button>
      </div>
    </MobileShell>
  )
}
