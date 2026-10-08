import { ChevronLeft, Fullscreen, MoreHorizontal, Plus, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Pictogram, type Opening, type OpeningKind } from '@/components/plan'
import { SketchCanvas } from '@/components/plan/SketchCanvas'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NameDialog } from './AddRoomDialog'
import { ResponsiveDialog, useIsDesktop } from './ResponsiveDialog'
import { OpeningPanel, WallPanel } from './RoomPanel'
import { derive, wallName, type Shape } from './rooms'
import { useProject } from './useProject'

type Dialog = 'add' | 'rename-room' | 'rename-project' | 'shape' | null
type OpeningEdit = { kind: OpeningKind; initial?: Opening }

export default function App() {
  const p = useProject()
  const latest = useRef(p)
  latest.current = p
  const desktop = useIsDesktop()
  const [focusId, setFocusId] = useState<string>()
  const [wall, setWall] = useState(0)
  const [opening, setOpening] = useState<OpeningEdit>()
  const [draft, setDraft] = useState<Opening>()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [fitToken, setFitToken] = useState(0)
  // Undo-Schritt erst bei der ersten Maßänderung im Raum, nicht schon beim Öffnen
  const changedInRoom = useRef(false)

  const focus = p.rooms.find((r) => r.id === focusId)
  const focusDerived = focus && derive(focus)
  const label = (i: number) => (focus ? wallName(focus.shape, i) : '')

  const openRoom = (id: string) => {
    if (id === focusId) return
    const d = derive(p.rooms.find((x) => x.id === id)!)
    changedInRoom.current = false
    setFocusId(id)
    setOpening(undefined)
    setWall(Math.max(0, d.status.findIndex((s) => s === 'open')))
  }
  const closeRoom = () => {
    setFocusId(undefined)
    setOpening(undefined)
  }
  const nextWall = () => {
    if (!focusDerived) return
    const n = focusDerived.status.length
    const next = [...Array(n).keys()].map((k) => (wall + 1 + k) % n).find((i) => focusDerived.status[i] === 'open' && i !== wall)
    if (next === undefined) closeRoom()
    else setWall(next)
  }
  const beforeChange = () => {
    if (changedInRoom.current) return
    changedInRoom.current = true
    p.snapshot()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusId && !dialog) closeRoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const removeFocused = () => {
    if (!focus) return
    const name = focus.name
    p.removeRoom(focus.id)
    closeRoom()
    toast(`${name} gelöscht`, { action: { label: 'Rückgängig', onClick: () => latest.current.undo() } })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2">
        {focus ? (
          <>
            <Button variant="ghost" size="icon" aria-label="Zurück zur Wohnung" onClick={closeRoom}>
              <ChevronLeft />
            </Button>
            <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{focus.name}</h1>
          </>
        ) : (
          <div className="min-w-0 flex-1">
            <Button variant="ghost" className="max-w-full px-2 text-base font-semibold" onClick={() => setDialog('rename-project')}>
              <span className="truncate">{p.name}</span>
            </Button>
          </div>
        )}
        <Button variant="ghost" size="icon" aria-label="Rückgängig" disabled={!p.canUndo} onClick={p.undo}>
          <Undo2 />
        </Button>
        {focus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mehr">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialog('shape')}>Form ändern</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog('rename-room')}>Umbenennen</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={removeFocused}>
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col">
        {p.rooms.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia>
                <Pictogram variant="shape" shape="rect" className="size-16 opacity-60" />
              </EmptyMedia>
              <EmptyTitle>Noch keine Räume</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button size="lg" className="h-11" onClick={() => setDialog('add')}>
                <Plus /> Raum hinzufügen
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <SketchCanvas
            rooms={p.rooms}
            focusId={focusId}
            activeWall={focus && !opening ? wall : undefined}
            draftOpening={draft}
            conflicts={p.conflicts}
            rightInset={desktop && focusId ? 416 : 0}
            fitToken={fitToken}
            onMoveStart={() => p.snapshot()}
            onMove={p.moveRoom}
            onTapRoom={openRoom}
            onTapWall={(i) => {
              setOpening(undefined)
              setWall(i)
            }}
            onTapOpening={(id) => {
              const o = focus?.openings.find((x) => x.id === id)
              if (!o) return
              setWall(o.wall)
              setOpening({ kind: o.kind, initial: o })
            }}
            onTapBackground={closeRoom}
            className="min-h-0 flex-1"
          />
        )}

        {!focus && p.rooms.length > 0 && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="Alles zeigen"
                  className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 rounded-full bg-background shadow-md"
                  onClick={() => setFitToken((n) => n + 1)}
                >
                  <Fullscreen />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alles zeigen</TooltipContent>
            </Tooltip>
            <Button size="lg" className="absolute right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] h-12 rounded-full px-5 shadow-lg" onClick={() => setDialog('add')}>
              <Plus /> Raum
            </Button>
          </>
        )}

        {focus && focusDerived && !opening && (
          <WallPanel
            key={`${focus.id}-${wall}-${focus.shape}`}
            label={label(wall)}
            wall={wall}
            value={focus.lengths[wall]}
            entered={focus.lengths}
            derived={focusDerived}
            wallLabel={label}
            onChange={(mm) => {
              beforeChange()
              p.setLength(focus.id, wall, mm)
            }}
            onResolve={([a, b], mm) => {
              beforeChange()
              p.setLength(focus.id, a, mm)
              p.setLength(focus.id, b, mm)
            }}
            onNext={nextWall}
            onAddOpening={(kind) => setOpening({ kind })}
          />
        )}
        {focus && focusDerived && opening && (
          <OpeningPanel
            key={`${focus.id}-${wall}-${opening.kind}-${opening.initial?.id}`}
            kind={opening.kind}
            wall={wall}
            wallLabel={label(wall)}
            wallLength={focusDerived.wallLengths[wall]}
            initial={opening.initial}
            onDraft={setDraft}
            onCancel={() => setOpening(undefined)}
            onSave={(o) => {
              if (opening.initial) p.updateOpening(focus.id, { ...o, id: opening.initial.id })
              else p.addOpening(focus.id, o)
              setOpening(undefined)
            }}
            onRemove={
              opening.initial
                ? () => {
                    p.removeOpening(focus.id, opening.initial!.id)
                    setOpening(undefined)
                  }
                : undefined
            }
          />
        )}
      </main>

      <NameDialog open={dialog === 'add'} onOpenChange={(o) => setDialog(o ? 'add' : null)} title="Raum hinzufügen" submitLabel="Hinzufügen" withSuggestions onSubmit={p.addRoom} />
      <NameDialog
        open={dialog === 'rename-room'}
        onOpenChange={(o) => setDialog(o ? 'rename-room' : null)}
        title="Raum umbenennen"
        initial={focus?.name}
        submitLabel="Speichern"
        onSubmit={(n) => focus && p.renameRoom(focus.id, n)}
      />
      <NameDialog
        open={dialog === 'rename-project'}
        onOpenChange={(o) => setDialog(o ? 'rename-project' : null)}
        title="Wohnung umbenennen"
        initial={p.name}
        submitLabel="Speichern"
        onSubmit={p.renameProject}
      />
      <ResponsiveDialog open={dialog === 'shape'} onOpenChange={(o) => setDialog(o ? 'shape' : null)} title="Form">
        <ToggleGroup
          type="single"
          variant="outline"
          value={focus?.shape}
          onValueChange={(v) => {
            if (!v || !focus) return
            p.setShape(focus.id, v as Shape)
            setWall(0)
            setDialog(null)
          }}
          className="mb-4 w-full"
        >
          {(['rect', 'L'] as const).map((s) => (
            <ToggleGroupItem key={s} value={s} className="h-32 flex-1 flex-col gap-1">
              <Pictogram variant="shape" shape={s} className="size-20" />
              {s === 'rect' ? 'Rechteck' : 'L-Form'}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ResponsiveDialog>
    </div>
  )
}
