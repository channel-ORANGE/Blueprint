import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ResponsiveDialog } from './ResponsiveDialog'

const suggestions = ['Wohnzimmer', 'Schlafzimmer', 'Kinderzimmer', 'Küche', 'Esszimmer', 'Bad', 'WC', 'Flur', 'Arbeitszimmer', 'Abstellraum', 'Balkon']

/** Raum hinzufügen: Ein Tipp auf einen Vorschlag genügt, ein eigener Name ist die Ausnahme. */
export function AddRoomDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (name: string) => void }) {
  const [custom, setCustom] = useState('')
  useEffect(() => {
    if (open) setCustom('')
  }, [open])
  const add = (name: string) => {
    if (!name.trim()) return
    onAdd(name.trim())
    onOpenChange(false)
  }
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Raum hinzufügen">
      <div className="flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((s) => (
            <Button key={s} variant="outline" className="h-11 justify-start" onClick={() => add(s)}>
              {s}
            </Button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            add(custom)
          }}
        >
          <InputGroup className="h-11">
            <InputGroupInput id="room-name" aria-label="Eigener Name" placeholder="Eigener Name" value={custom} onChange={(e) => setCustom(e.target.value)} className="text-base" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default" size="icon-sm" aria-label="Hinzufügen" disabled={!custom.trim()}>
                <Plus />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </ResponsiveDialog>
  )
}

/** Umbenennen (Raum oder Wohnung). */
export function NameDialog({
  open,
  onOpenChange,
  title,
  initial = '',
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  initial?: string
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)
  useEffect(() => {
    if (open) setName(initial)
  }, [open, initial])
  const submit = () => {
    if (!name.trim()) return
    onSubmit(name.trim())
    onOpenChange(false)
  }
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button size="lg" className="h-11" disabled={!name.trim()} onClick={submit}>
          Speichern
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Input id="rename" aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-base" />
      </form>
    </ResponsiveDialog>
  )
}
