import { useSyncExternalStore, type ReactNode } from 'react'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

const query = '(min-width: 768px)'
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

export const useIsDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)

/** Mobil Bottom-Sheet (shadcn Drawer), ab Tablet-Breite Dialog. */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  modal = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** false: Plan bleibt unabgedunkelt sichtbar (Live-Vorschau) */
  modal?: boolean
}) {
  const desktop = useIsDesktop()
  if (desktop)
    return (
      <Dialog open={open} onOpenChange={onOpenChange} modal={modal}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => !modal && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={modal}>
      {/* Kein automatischer Fokus: Die Tastatur öffnet sich erst, wenn man ins Feld tippt. */}
      <DrawerContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4">{children}</div>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}
