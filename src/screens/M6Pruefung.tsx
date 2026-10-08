import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PlanView } from '@/components/plan'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { meters, parseLength } from '@/lib/format'
import { measuringRoom } from '@/mock/apartment'
import { AppHeader, MobileShell } from './shared'

const options = [
  { value: 'w1', title: 'Wand 1 stimmt (360 cm)', description: 'Wand 3 wird auf 360 cm gesetzt.' },
  { value: 'w3', title: 'Wand 3 stimmt (357 cm)', description: 'Wand 1 wird auf 357 cm gesetzt.' },
  { value: 'avg', title: 'Mittelwert (358,5 cm)', description: 'Beide Wände werden auf 358,5 cm gesetzt.' },
  { value: 'skew', title: 'Raum ist leicht schief – Diagonale eingeben', description: 'Die Wände bleiben, wie du sie gemessen hast.' },
]

// Rechteck 360 × 345 cm → Diagonale √(360² + 345²)
const expectedDiagonal = Math.hypot(3600, 3450)

export default function M6Pruefung() {
  const navigate = useNavigate()
  const [choice, setChoice] = useState('avg')
  const [diagonal, setDiagonal] = useState('')
  const [closeOpen, setCloseOpen] = useState(false)
  const diagMm = parseLength(diagonal)

  return (
    <MobileShell>
      <AppHeader title="Schlafzimmer prüfen" back="/aufmass" />

      <PlanView
        rooms={[measuringRoom]}
        dimensions="all"
        activeWall={{ roomId: measuringRoom.id, index: 2, label: '357' }}
        className="h-48 shrink-0 border-b"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 py-4">
          <Alert>
            <TriangleAlert />
            <AlertTitle>Gegenüberliegende Wände weichen 3 cm ab</AlertTitle>
            <AlertDescription>Wand 1: 360 cm · Wand 3: 357 cm. Im Altbau normal – prüf kurz, ob du beide auf gleicher Höhe gemessen hast.</AlertDescription>
          </Alert>

          <FieldGroup className="gap-4">
            <RadioGroup value={choice} onValueChange={setChoice} className="gap-2">
              {options.map((o) => (
                <FieldLabel key={o.value} htmlFor={`opt-${o.value}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{o.title}</FieldTitle>
                      <FieldDescription className="text-xs">{o.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={o.value} id={`opt-${o.value}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>

            {choice === 'skew' && (
              <Field>
                <FieldLabel htmlFor="diagonal">Diagonale</FieldLabel>
                <InputGroup className="h-12">
                  <InputGroupInput
                    id="diagonal"
                    inputMode="decimal"
                    value={diagonal}
                    onChange={(e) => setDiagonal(e.target.value)}
                    aria-invalid={diagonal !== '' && diagMm === null}
                    className="text-2xl font-semibold tabular-nums"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>cm</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  {diagMm !== null && `= ${meters(diagMm)} · `}Bei 360 × 345 cm wären es {(expectedDiagonal / 10).toLocaleString('de-DE', { maximumFractionDigits: 1 })} cm
                </FieldDescription>
              </Field>
            )}
          </FieldGroup>

          <Button variant="outline" size="sm" className="self-start" onClick={() => setCloseOpen(true)}>
            Beispiel: Freiform schließt nicht
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-4 pt-3 pb-4">
        <Button
          size="lg"
          className="h-11 w-full"
          disabled={choice === 'skew' && diagMm === null}
          onClick={() => {
            toast('Schlafzimmer vollständig')
            navigate('/wohnung')
          }}
        >
          Übernehmen
        </Button>
      </div>

      <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Der Raum schließt nicht</AlertDialogTitle>
            <AlertDialogDescription>Zwischen Wand 6 und Wand 1 fehlen 4 cm. Kleine Abweichungen sind normal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col sm:justify-stretch">
            <AlertDialogAction onClick={() => toast('Auf alle Wände verteilt')}>Auf alle Wände verteilen (je &lt; 1 cm)</AlertDialogAction>
            <AlertDialogAction variant="outline" onClick={() => toast('Letzte Wand angepasst')}>
              Letzte Wand anpassen
            </AlertDialogAction>
            <AlertDialogCancel>Nochmal messen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileShell>
  )
}
