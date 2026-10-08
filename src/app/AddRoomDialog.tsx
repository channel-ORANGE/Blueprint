import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ResponsiveDialog } from './ResponsiveDialog'

const suggestions = ['Wohnzimmer', 'Schlafzimmer', 'Kinderzimmer', 'Küche', 'Bad', 'WC', 'Flur', 'Arbeitszimmer', 'Abstellraum']

/** Raum anlegen bzw. umbenennen. Ein Vorschlag fügt den Raum direkt hinzu. */
export function NameDialog({
  open,
  onOpenChange,
  title,
  initial = '',
  submitLabel,
  withSuggestions = false,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  initial?: string
  submitLabel: string
  withSuggestions?: boolean
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  const submit = (value = name) => {
    if (!value.trim()) return
    onSubmit(value.trim())
    onOpenChange(false)
  }
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (o) setName(initial)
        onOpenChange(o)
      }}
      title={title}
      footer={
        <Button size="lg" className="h-11" disabled={!name.trim()} onClick={() => submit()}>
          {submitLabel}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Input id="room-name" aria-label="Name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
        {withSuggestions && (
          <ToggleGroup type="single" variant="outline" size="sm" value="" onValueChange={(v) => v && submit(v)} className="flex-wrap justify-start">
            {suggestions.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </form>
    </ResponsiveDialog>
  )
}
