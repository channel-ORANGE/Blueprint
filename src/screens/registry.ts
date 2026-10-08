import { lazy } from 'react'

export type ScreenInfo = {
  id: string
  path: string
  title: string
  description: string
  device: 'mobile' | 'desktop'
  Component: React.LazyExoticComponent<() => React.JSX.Element>
}

// Reihenfolge = Ablauf in der App.
export const screens: ScreenInfo[] = [
  { id: 'M1', path: '/start', title: 'Projekte', description: 'Start, leerer Zustand und Beispielwohnung', device: 'mobile', Component: lazy(() => import('./M1Start')) },
  { id: 'M2', path: '/wohnung', title: 'Wohnungsübersicht', description: 'Grundriss gesamt, Räume mit Status, Raum anbauen', device: 'mobile', Component: lazy(() => import('./M2Wohnung')) },
  { id: 'M3', path: '/raumform', title: 'Raumform wählen', description: 'Rechteck, L-Form oder Freiform', device: 'mobile', Component: lazy(() => import('./M3Raumform')) },
  { id: 'M4', path: '/aufmass', title: 'Aufmaß', description: 'Wand für Wand messen, mit Minikarte und Spiegelung', device: 'mobile', Component: lazy(() => import('./M4Aufmass')) },
  { id: 'M5', path: '/oeffnung', title: 'Tür / Fenster', description: 'Öffnung an einer Wand hinzufügen', device: 'mobile', Component: lazy(() => import('./M5Oeffnung')) },
  { id: 'M6', path: '/pruefung', title: 'Plausibilität', description: 'Widersprüchliche Maße und Schließfehler klären', device: 'mobile', Component: lazy(() => import('./M6Pruefung')) },
  { id: 'M7', path: '/anbauen', title: 'Raum anbauen', description: 'Neuen Raum an eine vorhandene Tür setzen', device: 'mobile', Component: lazy(() => import('./M7Anbauen')) },
  { id: 'M8', path: '/einrichten', title: 'Einrichten', description: 'Möbel platzieren, Abstände exakt eingeben', device: 'mobile', Component: lazy(() => import('./M8Einrichten')) },
  { id: 'M9', path: '/moebel', title: 'Möbelbibliothek', description: 'Standardmöbel und eigene Maße', device: 'mobile', Component: lazy(() => import('./M9Moebel')) },
  { id: 'M10', path: '/ergebnis', title: 'Ergebnis & Export', description: 'PDF, Maßliste, Tür-Check, Übertragen per QR', device: 'mobile', Component: lazy(() => import('./M10Ergebnis')) },
  { id: 'D1', path: '/desktop', title: 'Einrichten (Desktop)', description: 'Bibliothek, Plan und Eigenschaften nebeneinander', device: 'desktop', Component: lazy(() => import('./D1Desktop')) },
]

export const screenByPath = (path: string) => screens.find((s) => s.path === path)
