import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { Pictogram, type RoomShape } from '@/components/plan'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AppHeader, MobileShell } from './shared'

const suggestions = ['Wohnzimmer', 'Schlafzimmer', 'Küche', 'Bad', 'Flur', 'Arbeitszimmer']

const shapes: { value: RoomShape; title: string; text: string }[] = [
  { value: 'rect', title: 'Rechteck', text: '4 Wände – 2 Maße reichen' },
  { value: 'L', title: 'L-Form', text: '6 Wände, z. B. mit Nische' },
  { value: 'free', title: 'Freiform', text: 'Wand für Wand ablaufen, rechte Winkel' },
]

export default function M3Raumform() {
  const navigate = useNavigate()
  const [name, setName] = useState('Arbeitszimmer')
  const [shape, setShape] = useState<RoomShape>('rect')
  const [ceiling, setCeiling] = useState('250')

  return (
    <MobileShell>
      <AppHeader title="Neuer Raum" back="/wohnung" />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <FieldGroup className="gap-6">
          <Field>
            <FieldLabel htmlFor="room-name">Name</FieldLabel>
            <Input id="room-name" value={name} onChange={(e) => setName(e.target.value)} />
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={1}
              value={suggestions.includes(name) ? name : ''}
              onValueChange={(v) => v && setName(v)}
              className="flex-wrap"
            >
              {suggestions.map((s) => (
                <ToggleGroupItem key={s} value={s}>
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <FieldSet>
            <FieldLegend variant="label">Form</FieldLegend>
            <RadioGroup value={shape} onValueChange={(v) => setShape(v as RoomShape)} className="gap-2">
              {shapes.map((s) => (
                <FieldLabel key={s.value} htmlFor={`shape-${s.value}`}>
                  <Field orientation="horizontal" className="items-center">
                    <Pictogram variant="shape" shape={s.value} className="size-14 shrink-0" />
                    <FieldContent>
                      <FieldTitle>{s.title}</FieldTitle>
                      <FieldDescription>{s.text}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={s.value} id={`shape-${s.value}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="ceiling">Deckenhöhe</FieldLabel>
            <InputGroup>
              <InputGroupInput id="ceiling" inputMode="decimal" value={ceiling} onChange={(e) => setCeiling(e.target.value)} />
              <InputGroupAddon align="inline-end">
                <InputGroupText>cm</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <div className="flex items-center gap-2">
              <FieldDescription>Standardwert – kannst du später messen</FieldDescription>
              <Badge variant="outline">geschätzt</Badge>
            </div>
          </Field>

          <Item variant="muted">
            <ItemMedia className="size-16 self-start">
              <Pictogram variant="door" hinge="start" swing="in" className="size-16" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>So misst du</ItemTitle>
              <ItemDescription className="line-clamp-none">Wand 1 ist die Wand mit der Tür. Stell dich in die Tür – danach geht es im Uhrzeigersinn weiter.</ItemDescription>
            </ItemContent>
          </Item>
        </FieldGroup>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-4">
        <Button size="lg" className="h-11 w-full" disabled={!name.trim()} onClick={() => navigate('/aufmass')}>
          Messen beginnen <ArrowRight />
        </Button>
      </div>
    </MobileShell>
  )
}
