import { Copy, Download, Info, Share2, TriangleAlert } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PlanView, type MeasureStatus } from '@/components/plan'
import { area, bounds, edges, outset } from '@/components/plan/geometry'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldContent, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Kbd } from '@/components/ui/kbd'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cm, meters, sqm } from '@/lib/format'
import { apartment } from '@/mock/apartment'
import { AppHeader, FitBadge, MobileShell, dims } from './shared'

const TRANSFER_URL = 'https://blueprint.app/t/7KQ-3XF'
const TRANSFER_CODE = '7KQ-3XF'

// Nutzbare Fläche auf dem Blatt (quer, 15 mm Rand, 25 mm Schriftfeld) in mm.
const usable = { A4: { w: 267, h: 155 }, A3: { w: 390, h: 242 } } as const
const planBounds = bounds(apartment.rooms.flatMap((r) => outset(r.polygon, apartment.wallThickness)))

const statusBadge: Partial<Record<MeasureStatus, string>> = { estimated: 'geschätzt', computed: 'berechnet' }

export default function M10Ergebnis() {
  const [scale, setScale] = useState('100')
  const [paper, setPaper] = useState('A4')
  const [withFurniture, setWithFurniture] = useState(true)
  const [withDims, setWithDims] = useState(false)

  // Größe des Plans auf dem Papier in mm.
  const onPaper = { w: planBounds.w / Number(scale), h: planBounds.h / Number(scale) }
  const space = usable[paper as keyof typeof usable]
  const tooBig = onPaper.w > space.w || onPaper.h > space.h

  return (
    <MobileShell>
      <AppHeader title="Ergebnis" subtitle={apartment.name} back="/einrichten" />

      <Tabs defaultValue="pdf" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 border-b px-4 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="liste">Maßliste</TabsTrigger>
            <TabsTrigger value="uebertragen">Übertragen</TabsTrigger>
          </TabsList>
        </div>

        {/* PDF */}
        <TabsContent value="pdf" className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-5">
              <Card className="aspect-[1.414] gap-0 rounded-md bg-white py-0 text-neutral-900 shadow-sm">
                <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                  <PlanView
                    rooms={apartment.rooms}
                    furniture={withFurniture ? apartment.furniture : []}
                    dimensions={withDims ? 'all' : []}
                    showRoomLabels
                    className="min-h-0 flex-1"
                  />
                  <div className="flex shrink-0 items-center justify-between border-t border-neutral-300 px-3 py-1.5 text-xs">
                    <span className="truncate">
                      {apartment.name} · Grundriss · M 1:{scale} · {paper}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <FieldGroup className="gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="scale">Maßstab</FieldLabel>
                    <Select value={scale} onValueChange={setScale}>
                      <SelectTrigger id="scale" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">1:50</SelectItem>
                        <SelectItem value="100">1:100</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="paper">Papier</FieldLabel>
                    <Select value={paper} onValueChange={setPaper}>
                      <SelectTrigger id="paper" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {tooBig ? (
                  <Alert>
                    <TriangleAlert />
                    <AlertDescription>
                      Bei 1:{scale} wird der Plan {cm(onPaper.w)} × {cm(onPaper.h)} cm groß und passt nicht auf {paper}. Nimm ein größeres Blatt oder 1:100.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Plan auf dem Blatt: {cm(onPaper.w)} × {cm(onPaper.h)} cm – passt auf {paper} quer. Lineal: 1 cm auf dem Blatt = {meters(Number(scale) * 10)}.
                  </p>
                )}

                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <label htmlFor="furniture">Möbel einzeichnen</label>
                    </FieldTitle>
                  </FieldContent>
                  <Switch id="furniture" checked={withFurniture} onCheckedChange={setWithFurniture} />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <label htmlFor="dims">Maßketten</label>
                    </FieldTitle>
                  </FieldContent>
                  <Switch id="dims" checked={withDims} onCheckedChange={setWithDims} />
                </Field>
              </FieldGroup>
            </div>
          </div>
          <div className="shrink-0 border-t bg-background px-4 pt-3 pb-4">
            <Button size="lg" className="h-11 w-full" onClick={() => toast('Im Prototyp nicht verfügbar')}>
              <Download /> PDF herunterladen
            </Button>
          </div>
        </TabsContent>

        {/* Maßliste */}
        <TabsContent value="liste" className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-6">
              <Alert>
                <TriangleAlert />
                <AlertTitle>2 Hinweise</AlertTitle>
                <AlertDescription>
                  <div>Garderobe ragt in den Schwenkbereich der Wohnungstür</div>
                  <div>Sessel steht knapp</div>
                </AlertDescription>
              </Alert>

              {apartment.rooms.map((room) => {
                const furniture = apartment.furniture.filter((f) => f.roomId === room.id)
                return (
                  <section key={room.id} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-medium">{room.name}</h2>
                      <span className="text-xs text-muted-foreground tabular-nums">{sqm(area(room.polygon))}</span>
                    </div>
                    <Separator />
                    <ItemGroup>
                      {edges(room.polygon).map((e, i) => {
                        const status = room.wallStatus?.[i] ?? 'measured'
                        return (
                          <Item key={i} size="xs" className="px-0 py-1.5">
                            <ItemContent>
                              <ItemTitle className="tabular-nums">
                                Wand {i + 1} · {cm(e.length)} cm
                              </ItemTitle>
                            </ItemContent>
                            <ItemActions>
                              {statusBadge[status] ? <Badge variant="outline">{statusBadge[status]}</Badge> : <span className="text-xs text-muted-foreground">gemessen</span>}
                            </ItemActions>
                          </Item>
                        )
                      })}
                      {furniture.length > 0 && <Separator className="my-1" />}
                      {furniture.map((f) => (
                        <Item key={f.id} size="xs" className="px-0 py-1.5">
                          <ItemContent>
                            <ItemTitle>{f.name}</ItemTitle>
                            <ItemDescription className="tabular-nums">{dims(f)}</ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <FitBadge fit={f.fit} />
                          </ItemActions>
                        </Item>
                      ))}
                    </ItemGroup>
                  </section>
                )
              })}
            </div>
          </div>
          <div className="shrink-0 border-t bg-background px-4 pt-3 pb-4">
            <Button variant="outline" size="lg" className="h-11 w-full" onClick={() => toast('Liste geteilt', { description: 'Im Prototyp wird nichts gesendet.' })}>
              <Share2 /> Als Liste teilen
            </Button>
          </div>
        </TabsContent>

        {/* Übertragen */}
        <TabsContent value="uebertragen" className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 px-4 py-4">
            <Card className="items-center gap-4 py-6 text-center">
              <CardContent className="flex flex-col items-center gap-4">
                <QRCodeSVG value={TRANSFER_URL} size={176} fgColor="currentColor" bgColor="transparent" level="M" className="text-foreground" aria-label="QR-Code zum Übertragen" />
                <p className="max-w-[16rem] text-sm text-muted-foreground">Mit dem anderen Gerät scannen – der Link gilt 15 Minuten.</p>
                <Kbd className="h-9 px-4 text-xl font-semibold tracking-wider text-foreground tabular-nums">{TRANSFER_CODE}</Kbd>
                <Button className="w-full" onClick={() => toast('Link kopiert')}>
                  <Copy /> Link kopieren
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              oder
              <Separator className="flex-1" />
            </div>

            <Button variant="outline" size="lg" className="h-11 w-full" onClick={() => toast('Im Prototyp nicht verfügbar')}>
              <Download /> Backup als Datei speichern (.json)
            </Button>

            <Alert>
              <Info />
              <AlertDescription>Ohne Konto: Deine Daten liegen nur auf diesem Gerät. Sichere regelmäßig.</AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </MobileShell>
  )
}
