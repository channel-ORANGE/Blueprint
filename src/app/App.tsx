import { ChevronLeft, MoreHorizontal, Plus, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Pictogram, type Opening, type OpeningKind } from '@/components/plan'
import { SketchCanvas } from '@/components/plan/SketchCanvas'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { NameDialog } from './AddRoomDialog'
import { ResponsiveDialog, useIsDesktop } from './ResponsiveDialog'
import { OpeningPanel, WallPanel } from './RoomPanel'
import { derive, type Shape } from './rooms'
import { useProject } from './useProject'

type Dialog = 'add' | 'rename-room' | 'rename-project' | 'shape' | null

export default function App() {
  const p = useProject()
  const desktop = useIsDesktop()
  const [focusId, setFocusId] = useState<string>()
  const [wall, setWall] = useState(0)
  const [openingKind, setOpeningKind] = useState<OpeningKind>()
  const [draft, setDraft] = useState<Opening>()
  const [dialog, setDialog] = useState<Dialog>(null)

  const focus = p.rooms.find((r) => r.id === focusId)
  const focusDerived = focus && derive(focus)

  const openRoom = (id: string) => {
    if (id === focusId) return
    const r = p.rooms.find((x) => x.id === id)!
    const d = derive(r)
    p.snapshot()
    setFocusId(id)
    setOpeningKind(undefined)
    setWall(Math.max(0, d.status.findIndex((s) => s === 'open')))
  }
  const closeRoom = () => {
    setFocusId(undefined)
    setOpeningKind(undefined)
  }
  const nextWall = () => {
    if (!focusDerived) return
    const n = focusDerived.status.length
    const next = [...Array(n).keys()].map((k) => (wall + 1 + k) % n).find((i) => focusDerived.status[i] === 'open' && i !== wall)
    if (next === undefined) closeRoom()
    else setWall(next)
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
    toast(`${name} gelöscht`, { action: { label: 'Rückgängig', onClick: p.undo } })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2">
        {focus ? (
          <Button variant="ghost" size="icon" aria-label="Zurück zur Wohnung" onClick={closeRoom}>
            <ChevronLeft />
          </Button>
        ) : null}
        <h1 className={`min-w-0 flex-1 truncate text-base font-semibold ${focus ? '' : 'pl-2'}`}>{focus ? focus.name : p.name}</h1>
        <Button variant="ghost" size="icon" aria-label="Rückgängig" disabled={!p.canUndo} onClick={p.undo}>
          <Undo2 />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mehr">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {focus ? (
              <>
                <DropdownMenuItem onSelect={() => setDialog('shape')}>Form ändern</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialog('rename-room')}>Umbenennen</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={removeFocused}>
                  Löschen
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={() => setDialog('rename-project')}>Umbenennen</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
            activeWall={focus && !openingKind ? wall : undefined}
            draftOpening={draft}
            conflicts={p.conflicts}
            rightInset={desktop && focusId ? 416 : 0}
            onMoveStart={() => p.snapshot()}
            onMove={p.moveRoom}
            onTapRoom={openRoom}
            onTapWall={(i) => {
              setOpeningKind(undefined)
              setWall(i)
            }}
            onTapBackground={closeRoom}
            className="min-h-0 flex-1"
          />
        )}

        {!focus && p.rooms.length > 0 && (
          <Button size="lg" className="absolute right-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] h-12 rounded-full px-5 shadow-lg" onClick={() => setDialog('add')}>
            <Plus /> Raum
          </Button>
        )}

        {focus && focusDerived && !openingKind && (
          <WallPanel
            key={`${focus.id}-${wall}-${focus.shape}`}
            wall={wall}
            value={focus.lengths[wall]}
            derived={focusDerived}
            onChange={(mm) => p.setLength(focus.id, wall, mm)}
            onNext={nextWall}
            onAddOpening={setOpeningKind}
          />
        )}
        {focus && focusDerived && openingKind && (
          <OpeningPanel
            key={`${focus.id}-${wall}-${openingKind}`}
            kind={openingKind}
            wall={wall}
            wallLength={focusDerived.wallLengths[wall]}
            onDraft={setDraft}
            onCancel={() => setOpeningKind(undefined)}
            onAdd={(o) => {
              p.addOpening(focus.id, o)
              setOpeningKind(undefined)
            }}
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
            <ToggleGroupItem key={s} value={s} aria-label={s === 'rect' ? 'Rechteck' : 'L-Form'} className="h-28 flex-1">
              <Pictogram variant="shape" shape={s} className="size-20" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ResponsiveDialog>
    </div>
  )
}
