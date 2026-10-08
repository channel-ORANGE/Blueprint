import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import type { Fit, Furniture } from '@/components/plan'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cm } from '@/lib/format'
import { cn } from '@/lib/utils'
import { screens } from './registry'

/**
 * Schmale Leiste über jedem Screen – gehört nicht zur App, sondern zum Prototyp:
 * springt zwischen den Screens, damit man den Ablauf durchklicken kann.
 */
export function PrototypeBar() {
  const { pathname } = useLocation()
  const i = screens.findIndex((s) => s.path === pathname)
  const current = screens[i]
  const prev = screens[i - 1]
  const next = screens[i + 1]
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b bg-muted/60 px-1 text-xs text-muted-foreground">
      <Button variant="ghost" size="icon-xs" asChild aria-label="Alle Screens">
        <Link to="/">
          <LayoutGrid />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="xs" className="min-w-0 flex-1 justify-start font-normal text-muted-foreground">
            <span className="truncate">
              Prototyp · {current ? `${current.id} ${current.title}` : 'Übersicht'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Screens</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {screens.map((s) => (
            <DropdownMenuItem key={s.id} asChild>
              <Link to={s.path}>
                <span className="w-8 text-muted-foreground tabular-nums">{s.id}</span>
                {s.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="icon-xs" disabled={!prev} asChild={!!prev} aria-label="Vorheriger Screen">
        {prev ? (
          <Link to={prev.path}>
            <ChevronLeft />
          </Link>
        ) : (
          <ChevronLeft />
        )}
      </Button>
      <Button variant="ghost" size="icon-xs" disabled={!next} asChild={!!next} aria-label="Nächster Screen">
        {next ? (
          <Link to={next.path}>
            <ChevronRight />
          </Link>
        ) : (
          <ChevronRight />
        )}
      </Button>
    </div>
  )
}

/** Rahmen für mobile Screens: volle Höhe, auf großen Bildschirmen als Handy-breite Spalte. */
export function MobileShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh bg-muted/40">
      <div className={cn('mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background sm:border-x sm:shadow-sm', className)}>
        <PrototypeBar />
        {children}
      </div>
    </div>
  )
}

/** App-Kopfzeile: Zurück, Titel mit Untertitel, Aktionen rechts. */
export function AppHeader({ title, subtitle, back, actions }: { title: string; subtitle?: string; back?: string; actions?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2">
      {back && (
        <Button variant="ghost" size="icon" aria-label="Zurück" onClick={() => navigate(back)}>
          <ChevronLeft />
        </Button>
      )}
      <div className={cn('min-w-0 flex-1', !back && 'pl-2')}>
        <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-0.5">{actions}</div>}
    </header>
  )
}

const fitText: Record<Fit, string> = { ok: 'Passt', tight: 'Knapp', bad: 'Passt nicht' }
const fitClass: Record<Fit, string> = {
  ok: 'border-fit-ok/30 bg-fit-ok/10 text-fit-ok',
  tight: 'border-fit-tight/40 bg-fit-tight/15 text-[color-mix(in_oklab,var(--fit-tight)_70%,black)]',
  bad: 'border-fit-bad/30 bg-fit-bad/10 text-fit-bad',
}

/** Ampel „passt / knapp / passt nicht“ – shadcn-Badge mit Ampelfarben. */
export function FitBadge({ fit = 'ok', className }: { fit?: Fit; className?: string }) {
  return (
    <Badge variant="outline" className={cn(fitClass[fit], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {fitText[fit]}
    </Badge>
  )
}

/** „220 × 95 × 85 cm“ */
export const dims = (f: Pick<Furniture, 'w' | 'd' | 'h'>) => `${cm(f.w)} × ${cm(f.d)} × ${cm(f.h)} cm`
