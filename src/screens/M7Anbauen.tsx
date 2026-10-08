import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { PlanView, type Room } from '@/components/plan'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { apartment } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

const NEW_DOOR = 'd-neu'

// Lokale Kopie: der Flur bekommt eine neue Tür in der rechten Wand.
const rooms: Room[] = apartment.rooms.map((r) =>
  r.id === 'flur'
    ? {
        ...r,
        openings: [...r.openings, { id: NEW_DOOR, kind: 'door', wall: 1, offset: 2600, width: 760, hinge: 'start', swing: 'out', status: 'measured' }],
      }
    : r,
)

const preview: Room = {
  id: 'neu',
  name: 'Neuer Raum',
  polygon: [
    { x: 6430, y: 5880 },
    { x: 8515, y: 5880 },
    { x: 8515, y: 7300 },
    { x: 6430, y: 7300 },
  ],
  wallStatus: ['open', 'open', 'open', 'open'],
  openings: [],
}

const options = [
  { value: NEW_DOOR, title: 'Flur', text: 'neue Tür rechts (76 cm)', disabled: false },
  { value: 'kueche', title: 'Küche', text: 'Tür zum Flur', disabled: true },
  { value: 'schlafen', title: 'Schlafzimmer', text: 'Tür zum Flur', disabled: true },
]

export default function M7Anbauen() {
  const navigate = useNavigate()
  const [door, setDoor] = useState(NEW_DOOR)
  const chosen = door === NEW_DOOR

  return (
    <MobileShell>
      <AppHeader title="Raum anbauen" subtitle="Tür wählen" back="/wohnung" />

      <PlanView
        rooms={chosen ? [...rooms, preview] : rooms}
        showRoomLabels
        highlightOpeningId={door}
        focusRoomId={chosen ? preview.id : undefined}
        className="h-[38%] shrink-0 border-b"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <p className="text-sm text-muted-foreground">Wähle die Tür, durch die man den neuen Raum betritt. Er wird automatisch daran ausgerichtet – kein Puzzeln.</p>

        <RadioGroup value={door} onValueChange={setDoor} className="gap-2">
          {options.map((o) => (
            <FieldLabel key={o.value} htmlFor={`door-${o.value}`}>
              <Field orientation="horizontal" data-disabled={o.disabled} className="items-center">
                <FieldContent>
                  <FieldTitle>{o.title}</FieldTitle>
                  <FieldDescription>{o.text}</FieldDescription>
                </FieldContent>
                {o.disabled && <Badge variant="secondary">schon verbunden</Badge>}
                <RadioGroupItem value={o.value} id={`door-${o.value}`} disabled={o.disabled} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>

        <Button variant="link" className="self-start px-0" onClick={() => navigate('/oeffnung')}>
          Tür fehlt? Erst im Flur ergänzen
        </Button>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-4">
        <Button size="lg" className="h-11 w-full" onClick={() => navigate('/raumform')}>
          Weiter: Raumform wählen <ArrowRight />
        </Button>
      </div>
    </MobileShell>
  )
}
