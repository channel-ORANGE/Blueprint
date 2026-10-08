import { ChevronRight, Monitor, Smartphone } from 'lucide-react'
import { Link } from 'react-router'

import { PlanView } from '@/components/plan'
import { Badge } from '@/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { apartment } from '@/mock/apartment'
import { screens } from './registry'

/** Einstieg in den Klick-Prototyp: alle Screens in Ablauf-Reihenfolge. */
export function Overview() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary">Klick-Prototyp · Stand zur Abstimmung</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Blueprint</h1>
        <p className="text-muted-foreground">
          Wohnungsgrundriss per Maßeingabe – Räume Wand für Wand messen, an Türen anbauen und die Einrichtung zentimetergenau planen. Alle Screens
          arbeiten mit der Beispielwohnung „{apartment.name}“.
        </p>
      </div>
      <PlanView rooms={apartment.rooms} furniture={apartment.furniture} showRoomLabels className="h-72 rounded-lg border" />
      <ItemGroup>
        {screens.map((s) => (
          <Item key={s.id} variant="outline" asChild>
            <Link to={s.path}>
              <ItemMedia variant="icon">{s.device === 'mobile' ? <Smartphone /> : <Monitor />}</ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <span className="text-muted-foreground tabular-nums">{s.id}</span> {s.title}
                </ItemTitle>
                <ItemDescription>{s.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="size-4 text-muted-foreground" />
              </ItemActions>
            </Link>
          </Item>
        ))}
      </ItemGroup>
    </main>
  )
}
