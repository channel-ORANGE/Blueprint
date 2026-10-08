import { Copy, FileDown, MoreHorizontal, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Pictogram, PlanView } from '@/components/plan'
import { area } from '@/components/plan/geometry'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { sqm } from '@/lib/format'
import { apartment } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

type View = 'first' | 'project'

// Geschätzte Maße zählen: Wände und Öffnungen mit Status „estimated“.
const estimatedIn = (r: (typeof apartment.rooms)[number]) =>
  (r.wallStatus ?? []).filter((s) => s === 'estimated').length + r.openings.filter((o) => o.status === 'estimated').length
const estimated = apartment.rooms.reduce((n, r) => n + estimatedIn(r), 0)
const complete = apartment.rooms.filter((r) => estimatedIn(r) === 0).length
const totalArea = apartment.rooms.reduce((s, r) => s + area(r.polygon), 0)

export default function M1Start() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('project')
  const proto = () => toast('Im Prototyp nicht verfügbar')

  return (
    <MobileShell>
      <AppHeader title="Blueprint" />

      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">Prototyp-Ansicht:</span>
        <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as View)}>
          <ToggleGroupItem value="first">Erster Start</ToggleGroupItem>
          <ToggleGroupItem value="project">Mit Projekt</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === 'first' ? (
        <div className="flex min-h-0 flex-1 flex-col px-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Pictogram variant="shape" shape="rect" className="size-28" />
              </EmptyMedia>
              <EmptyTitle>Noch keine Wohnung</EmptyTitle>
              <EmptyDescription>In 3 Minuten zum ersten Raum: Rechteck wählen, zwei Maße eingeben – fertig.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="lg" className="h-11 w-full" onClick={() => navigate('/raumform')}>
                Wohnung anlegen
              </Button>
              <Button variant="outline" size="lg" className="h-11 w-full" onClick={() => navigate('/wohnung')}>
                Beispielwohnung ansehen
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <h2 className="text-lg font-semibold">Meine Wohnungen</h2>

            <Card size="sm">
              <CardHeader>
                <CardTitle>{apartment.name}</CardTitle>
                <CardDescription>
                  {apartment.rooms.length} Räume · {sqm(totalArea)} · heute bearbeitet
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <PlanView rooms={apartment.rooms} showRoomLabels className="h-44 rounded-lg bg-muted/40" />
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {complete} von {apartment.rooms.length} Räumen vollständig
                  </Badge>
                  <Badge variant="outline">{estimated} Maße geschätzt</Badge>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button className="flex-1" onClick={() => navigate('/wohnung')}>
                  Öffnen
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Mehr">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={proto}>
                      <Copy /> Duplizieren
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/ergebnis')}>
                      <FileDown /> Als Datei sichern
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={proto}>
                      <Trash2 /> Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>

            <Alert>
              <TriangleAlert />
              <AlertTitle>Noch nicht gesichert</AlertTitle>
              <AlertDescription>Deine Daten liegen nur auf diesem Gerät. Sichere sie als Datei oder übertrage sie aufs Handy/Laptop.</AlertDescription>
              <div className="col-start-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => navigate('/ergebnis')}>
                  Sichern
                </Button>
              </div>
            </Alert>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-4">
            <Button size="lg" className="h-11 w-full" onClick={() => navigate('/raumform')}>
              <Plus /> Neue Wohnung
            </Button>
          </div>
        </>
      )}
    </MobileShell>
  )
}
