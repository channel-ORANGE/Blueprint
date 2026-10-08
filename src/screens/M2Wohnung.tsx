import { Monitor, MoreHorizontal, Pencil, Plus, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PlanView } from '@/components/plan'
import { area } from '@/components/plan/geometry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { sqm } from '@/lib/format'
import { apartment } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

// Geschätzte Maße zählen: Wände und Öffnungen mit Status „estimated“.
const estimatedIn = (r: (typeof apartment.rooms)[number]) =>
  (r.wallStatus ?? []).filter((s) => s === 'estimated').length + r.openings.filter((o) => o.status === 'estimated').length
const totalArea = apartment.rooms.reduce((s, r) => s + area(r.polygon), 0)
const proto = () => toast('Im Prototyp nicht verfügbar')

export default function M2Wohnung() {
  const navigate = useNavigate()

  return (
    <MobileShell>
      <AppHeader
        title={apartment.name}
        subtitle={`${apartment.rooms.length} Räume · ${sqm(totalArea)}`}
        back="/start"
        actions={
          <>
            <Button variant="ghost" size="icon" aria-label="Übertragen per QR-Code" onClick={() => navigate('/ergebnis')}>
              <QrCode />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Mehr">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={proto}>
                  <Pencil /> Innenwandstärke ändern …
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/desktop')}>
                  <Monitor /> Am großen Bildschirm öffnen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <PlanView rooms={apartment.rooms} furniture={apartment.furniture} showRoomLabels interactive className="h-[40%] shrink-0 border-b" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <h2 className="text-sm font-medium text-muted-foreground">Räume</h2>
        <ItemGroup className="gap-2">
          {apartment.rooms.map((r) => {
            const est = estimatedIn(r)
            return (
              <Item
                key={r.id}
                variant="outline"
                size="sm"
                role="button"
                tabIndex={0}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(r.id === 'wohnen' ? '/einrichten' : '/aufmass')}
                onKeyDown={(e) => e.key === 'Enter' && navigate(r.id === 'wohnen' ? '/einrichten' : '/aufmass')}
              >
                <ItemMedia>
                  <PlanView rooms={[r]} className="size-10" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{r.name}</ItemTitle>
                  <ItemDescription>
                    {sqm(area(r.polygon))} · {r.polygon.length} Wände
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {est === 0 ? <Badge variant="secondary">Vollständig</Badge> : <Badge variant="outline">{est} geschätzt</Badge>}
                </ItemActions>
              </Item>
            )
          })}

          <Item variant="muted" size="sm">
            <ItemContent>
              <ItemTitle>Innenwände {String(apartment.wallThickness / 10).replace('.', ',')} cm</ItemTitle>
              <ItemDescription>Gilt für alle Räume</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline" size="sm" onClick={proto}>
                Ändern
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-4">
        <Button size="lg" className="h-11 w-full" onClick={() => navigate('/anbauen')}>
          <Plus /> Raum anbauen
        </Button>
      </div>
    </MobileShell>
  )
}
