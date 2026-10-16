# Blueprint – Arbeitsplan

> Verlauf aller Iterationen und Entscheidungen aus der ersten (Cloud-)Sitzung. Ältere Abschnitte sind überholt, wo spätere Iterationen etwas anderes festlegen – maßgeblich ist jeweils der neueste Stand weiter unten.
>
> **Aktueller Stand (16.10.2026):** Eine Ansicht statt Screens (`src/app/`): Räume per Vorschlag anlegen, auf der Fläche anordnen (Einrasten mit Wandabstand), antippen und Wandmaße, Türen und Fenster eingeben. Läuft unter https://channel-orange.github.io/Blueprint/ (Deploy per `.github/workflows/pages.yml`). Nächste Idee: geführtes Aufmaß, siehe `docs/ideen.md`.


## Context
Das Repo ist leer (nur `README.md`). Ziel ist eine Web-App, mit der Laien aus selbst gemessenen Maßen einen maßstabsgetreuen Wohnungsgrundriss erstellen und darin die Einrichtung verlässlich planen.
Vereinbarter Ablauf: Konzept iterativ ausarbeiten (dieser Plan) → Layout in Figma → gemeinsam korrigieren → erst dann bauen.

**Entscheidungen des Users**
- Wohnung, raumweise: Räume werden an Türen angebaut.
- Mobile-first überall, Desktop als responsive Erweiterung.
- Speicherung lokal, Übertragung per Link/QR.
- Look: ruhig und präzise.

---

## Konzept: Iterationen

**v1 (verworfen): Formular „Länge × Breite“ pro Raum.**
Das scheitert an mehreren Stellen:
- reale Räume sind nicht rechteckig,
- es fehlen Tür- und Fensterpositionen, die für die Möbelplanung entscheidend sind,
- getrennt gemessene Räume passen beim Zusammensetzen nicht zusammen.

**v2: Maße direkt an der Wand eingeben.**
- Formvorlagen plus „Raum ablaufen“ für Freiform.
- Öffnungen und Wandobjekte pro Wand.
- Wohnung über magnetisches Einrasten zusammensetzen.
- Getrennte Modi für Aufmaß und Einrichten.

**v3 (aktuell): v2 nach UX-Review durch einen Subagent und nach den Antworten des Users.**
Wichtigste Änderungen:
1. **Vertrauen in Zahlen statt schöner Zeichnung.** Jedes Maß hat einen Status: *gemessen*, *geschätzt (Standardwert)* oder *berechnet*. Plausibilitätschecks:
   - Gegenüberliegende Wände werden abgeglichen („3 cm Differenz – welche Messung stimmt?“).
   - Optional ein Diagonalmaß gegen schiefe Ecken.
   - Hinweis bei unplausiblen Werten.
2. **Eindeutige Zahleneingabe.** Standard ist cm. Akzeptiert werden „345“, „3,45 m“ und „120+85“. Die Eingabe wird live gespiegelt („= 3,45 m“). Bei Werten unter 30 cm oder über 15 m fragt die App nach.
3. **Aufmaß-Assistent mit Orientierung.**
   - Wand 1 ist die Türwand, von der Tür aus gesehen. Danach geht es im Uhrzeigersinn weiter.
   - Eine Minikarte hebt die aktive Wand hervor.
   - Mikro-Tipps, z. B. „über der Fußleiste messen“.
   - Optional ein Foto pro Wand als Gedächtnisstütze.
4. **Öffnungen mit wenig Pflichtangaben.** Pflicht sind nur der Abstand von der linken Ecke und die Breite. Alles andere sind Standardwerte, markiert als „geschätzt“: Tür 88,5 × 201 cm, Fenster mit 90 cm Brüstung. Die Türrichtung wird per Piktogramm gewählt (4 Varianten).
5. **Wohnung ohne CAD-Puzzle.** Ein neuer Raum wird über „An Tür anbauen“ an eine Tür eines vorhandenen Raums gesetzt und richtet sich automatisch aus. Es gibt eine globale Innenwandstärke (Standard 11,5 cm). Kein freies Snapping in V1.
6. **Maße bleiben beim Einrichten unverändert.**
   - Gemessene Wände sind gesperrt. „Maß korrigieren“ öffnet ein Mini-Sheet, ohne den Modus zu verlassen.
   - Kein Wände-Ziehen per Drag.
7. **Einrichten mobil und präzise.**
   - Ziehen per Finger zur Grobplatzierung.
   - Feine Platzierung: auf die Abstandslinie zur Wand tippen und den Zielwert eingeben.
   - ±1/±10-cm-Nudge-Buttons, drehen um 90°, an die Wand schieben.
   - Ampel statt Ja/Nein: *passt*, *knapp* (unter 3 cm), *passt nicht*.
   - Fußleisten-Puffer einstellbar.
8. **Neue Kern-Features.**
   - „Passt durch die Tür?“-Check für jedes Möbel, mit Kippmaß-Logik.
   - Bewegungsflächen für den Türschwenk und vor Schrankfronten.
   - Dachschräge in einfacher Form: Kniestock plus Abstand bis 2 m Raumhöhe. Möbel darunter bekommen eine Höhenwarnung.
9. **In unter 3 Minuten zum ersten Erfolg.** Start mit Rechteck-Vorlage: 2 Maße eingeben, schon steht der Raum. Ein Beispielprojekt ist zum Ausprobieren vorhanden.

### Funktionsumfang V1
- Projekte (Wohnungen) mit Räumen. Raumformen: Rechteck, L, Freiform („ablaufen“, nur 90°-Winkel, Schließfehler wird verständlich erklärt).
- Wandobjekte: Tür, Fenster, Durchgang, Heizkörper, Hindernis/Vorsprung, Dachschräge. Pro Raum eine Deckenhöhe.
- Einrichten:
  - Bibliothek mit ca. 30 Standardmöbeln nach Raumtyp,
  - eigene Möbel per B × T × H,
  - Abstände, Ampel, Bewegungsflächen, Tür-Check.
- Ergebnis:
  - PDF im Maßstab 1:50 bzw. 1:100 mit Maßketten,
  - Möbel-Maßliste,
  - Netto-Grundfläche pro Raum (keine Wohnflächenberechnung nach WoFlV),
  - PNG.
- Speicherung lokal (IndexedDB) mit Autosave und Undo/Redo. JSON-Backup mit Warnung „noch nicht gesichert“. Übertragung per zeitlich begrenztem Link/QR über ein kleines Backend. Offlinefähig als PWA.

**Nicht in V1:** freies Snapping, beliebige Winkel, Wohnflächenberechnung nach WoFlV, öffentliche Share-Links, Accounts, 3D-Ansicht, mehrere Etagen.

### Tech-Skizze (erst in der Bauphase)
- React + TypeScript + Vite + Tailwind.
- UI ausschließlich shadcn/ui, Installation über den Shadcn-Konnektor bzw. die CLI.
- Zeichenfläche als SVG, Zustand-State mit Undo über Patches.
- Geometrie intern in mm, mit Vitest getestet.
- PDF über jsPDF + svg2pdf.
- Kleines Transfer-Backend für die verschlüsselten, zeitlich begrenzten Blobs.

**Datenmodell (grob):**
- `Project` → `rooms[]`
- `Room`: walls[] mit Länge, Richtung und Status; Deckenhöhe; anchor (an Tür X von Raum Y)
- `Opening`: wallId, Abstand, Breite, Höhe, Brüstung, Anschlag
- `Feature` (Wandobjekt)
- `Furniture`: Katalog oder eigenes Möbel; x, y, Drehung, B, T, H

---

## Stand
Der Klick-Prototyp v1 ist fertig und veröffentlicht: https://claude.ai/artifact/MuKRgy873bApheBZ5GvRRK. Branch `claude/konzept-figma`, 11 Screens in `src/screens/`, Zeichenfläche in `src/components/plan/`.

---

# Iteration 2: Skizzieren, dann messen

## Context
Feedback des Users zum Prototyp v1:
- Er ist „extrem unübersichtlich“ und hat zu viele Beschreibungen.
- Die Screens M1–D1 verwirren, weil man nicht erkennt, ob es Schritte oder Funktionen sind.

Neuer Ablauf, mit dem User abgestimmt:
1. „Raum hinzufügen“ antippen.
2. Raum benennen. Der erste Raum erscheint in der Mitte, jeder weitere daneben.
3. Ab dem zweiten Raum die Räume hin- und herschieben, bis die Anordnung ungefähr stimmt.
4. Einen Raum antippen: Die Ansicht zoomt hinein. Dort gibt man Wandmaße ein und fügt Türen und Fenster hinzu.

**Festgelegt:**
- In der Skizze werden Räume nur verschoben, nicht in der Größe gezogen. Die echte Größe kommt aus den Maßen.
- Jeder Raum ist zunächst ein Rechteck. „Form ändern“ (L-Form) gibt es in der Detailansicht.
- Einrichten fällt vorerst ganz weg.

**Devise:** Wenn eine Funktion eine Beschreibung braucht, muss die Funktion intuitiver werden. Text nur, wo er unbedingt nötig ist.

## Bedien- und Textregeln
- **Erlaubter Text:** Titel, Labels, Werte, und Warnungen nur dann, wenn sie eintreten.
- **Nicht erlaubt:** Tipps, Untertitel, Erklärsätze.
- **Zustand wird gezeigt, nicht beschrieben:**
  - Ungemessener Raum: blass, gestrichelt, nur der Name.
  - Gemessener Raum: echte Wände.
  - Offene Wand: „?“.
  - Berechnete Wand: grauer Wert.
- **Gesten:**
  - Ein Finger auf einem Raum verschiebt ihn.
  - Ein Finger auf freier Fläche verschiebt die Ansicht.
  - Zwei Finger zoomen.
  - Kurzes Antippen eines Raums öffnet die Detailansicht.
- **Eine App, keine Screen-Liste:** Die Prototyp-Übersicht und die PrototypeBar entfallen, der Link öffnet direkt die App.

## Zustände der einen Ansicht (alles in `src/app/`)

**1. Leer**
- Kopfzeile „Meine Wohnung“.
- In der Mitte `Empty` mit Rechteck-Piktogramm und Button „Raum hinzufügen“.

**2. Raum hinzufügen** (Drawer mobil, Dialog ab `md`)
- Input „Name“ mit Autofokus und Vorschlags-Chips (ToggleGroup): Wohnzimmer, Schlafzimmer, Kinderzimmer, Küche, Bad, WC, Flur, Arbeitszimmer, Abstellraum.
- Button „Hinzufügen“.
- Startgröße je Name, z. B. Wohnzimmer 4,5 × 5 m, Bad 2 × 2,5 m, Flur 1,4 × 4 m, sonst 3 × 3 m.
- Platzierung: Der erste Raum liegt in der Mitte. Jeder weitere kommt rechts neben die vorhandenen, ohne Überlappung, und die Ansicht schwenkt sanft dorthin.

**3. Skizze**
- Alle Räume auf der Fläche (react-zoom-pan-pinch für Pan und Zoom, @use-gesture für das Ziehen von Räumen).
- **Einrasten:** Beim Ziehen rastet der Raum auf Kantenabstand = Wandstärke (11,5 cm) an Nachbarräume ein. Gleiche Kanten werden bündig ausgerichtet. Toleranz etwa 25 px auf dem Bildschirm.
- Überlappung wird rot umrandet.
- Schwebender Button „+“ unten für „Raum hinzufügen“.
- Header: „Meine Wohnung“, Rückgängig und ⋯ (Umbenennen).

**4. Raum im Detail**
- **Einstieg:** Antippen zoomt animiert auf den Raum (`zoomToElement` bzw. `setTransform`). Die Nachbarräume bleiben blass sichtbar.
- **Header:** Zurück-Pfeil, Raumname, ⋯ (Form ändern, Umbenennen, Löschen). Tippen auf die freie Fläche führt ebenfalls zurück.
- **Wände:** Jede Wand ist antippbar. Die gewählte Wand ist blau, und darunter erscheint das Eingabefeld „Wand 2“ mit „cm“ (große Zahl, `inputMode decimal`) und dem Button „Weiter“.
- **Rechteck:** Nach 2 Maßen ist der Raum fertig. Wand 3 und 4 werden berechnet und grau angezeigt, der Button heißt dann „Fertig“.
- **Ein Maß eintragen:** Der Raum bekommt sofort seine echte Größe.
  - Angrenzende Räume bleiben „angeklebt“ und rücken mit. Verankert ist der Raum oben links: Nachbarn rechts bzw. unten verschieben sich um die Differenz, rekursiv weiter.
  - Eine Warnung erscheint nur bei unplausiblen Werten (< 30 cm, > 15 m) oder nicht eindeutiger Eingabe.
- **Türen und Fenster:** Unten die Buttons [Tür] [Fenster]. Sie öffnen einen Drawer für die aktuell gewählte Wand:
  - Abstand und Breite als InputGroups. Der Plan zeigt live die Maßkette „Ecke → Öffnung“ und die Breite. Neu in PlanView: Maßketten für die hervorgehobene Öffnung.
  - Bei Türen zusätzlich 4 Richtungs-Piktogramme ohne Text.
  - Button „Hinzufügen“.
  - Eine Tür in einer Wand, die an einen Nachbarraum grenzt, durchbricht automatisch beide Wände. Ein Feld „führt zu“ ist dafür nicht nötig.
- **Form ändern:** Drawer mit 2 Piktogramm-Kacheln, Rechteck und L-Form (6 Wände). Bei L-Form sind 4 Maße nötig, 2 werden berechnet.

## Umsetzung
**Aufräumen:**
- `src/screens/*` (M1–D1, `registry`, `Overview`, `useFurnishing`, `shared`) und `src/lib/checks.ts` entfernen.
- `react-router` entfernen. Es gibt nur noch eine Ansicht, die Zustände liegen im State.
- `src/mock/apartment.ts` wird zu einem optionalen Beispiel.

**Neu:**
- `src/app/useProject.ts`:
  - State mit Undo, Räume als `{ id, name, x, y, w, h, shape, lengths[], status[], openings[] }` in mm.
  - Aktionen: addRoom, moveRoom (mit Einrasten), setWallLength (mit Nachbarn-Mitschieben), addOpening, rename, remove, setShape.
  - Daraus wird `polygon` für die Zeichnung abgeleitet.
- `src/app/snap.ts`: reine Funktionen für Einrasten, Überlappung und Nachbarschaft, mit Vitest getestet (`npm i -D vitest`).
- `src/components/plan/SketchCanvas.tsx`:
  - Fläche mit Pan und Zoom, ungemessene und gemessene Räume, Ziehen, Antippen, Zoom auf einen Raum.
  - Wiederverwendet werden `OpeningShape`, `Dim` und `WallMark` aus `PlanView.tsx`. Diese werden dafür exportiert.
- `src/app/App.tsx` (Header, Canvas, Panels) plus `AddRoomDrawer.tsx`, `WallPanel.tsx`, `OpeningDrawer.tsx`, `ShapeDrawer.tsx`.
- UI ausschließlich aus `src/components/ui/*` (shadcn).
- **Responsive:** Mobil ein Bottom-Panel bzw. Drawer. Ab `md` schwebt das Panel als Card unten rechts, Dialoge statt Drawer.

**Arbeitsteilung:**
- Kern selbst: State, Einrasten, Canvas, Zoom-Übergang. Das hängt eng zusammen.
- Danach ein Sonnet-Subagent als „Laientest“. Er klickt per Playwright den kompletten Ablauf durch, macht Screenshots in 390 × 844 und 1440 × 900 und meldet Stellen, die ohne Erklärung unklar sind, sowie visuelle Fehler. Ich bewerte und behebe sie.

## Verifikation
- `npx tsc -b`, `npm run build` und `npx vitest run` (Einrasten, Mitschieben der Nachbarn, Rechteck aus 2 Maßen) laufen fehlerfrei.
- Playwright-Ablauf ohne Konsolenfehler:
  1. Leer → Wohnzimmer → Flur.
  2. Flur an das Wohnzimmer ziehen, er rastet ein.
  3. Wohnzimmer antippen, er zoomt hinein.
  4. 480 und 450 eingeben. Der Flur rückt mit.
  5. Tür in die gemeinsame Wand setzen. Sie durchbricht beide Wände.
  6. Zurück zur Skizze.
- Screenshot nach jedem Schritt ansehen.
- `grep` nach Tipp-/Beschreibungstexten in `src/app`: nur Labels und Werte.
- Republish auf dieselbe Artifact-URL. Commit und Push auf `claude/konzept-figma`.


---

# Iteration 2b: Eigene Adresse ohne Claude-Leiste (GitHub Pages) + Höhenfix

## Context
Auf dem Handy sitzt die Leiste des claude.ai-Viewers über der App. Die Seite kann sie nicht entfernen.

Der User hat GitHub Pages gewählt. Das Repo `channel-ORANGE/Blueprint` ist privat, deshalb macht der User es entweder öffentlich oder nutzt GitHub Pro.

Außerdem zeigt der Screenshot einen Fehler: Der „+ Raum“-Button ist unten abgeschnitten, und die Räume sitzen zu tief. Ursache ist `h-dvh` in `src/app/App.tsx:81` im eingebetteten Rahmen.

## Änderungen
1. **Höhe:**
   - `html`, `body` und `#root` bekommen `height: 100%` (in `src/index.css`), die App `h-full` statt `h-dvh`.
   - Der Header bekommt zusätzlich `padding-top: env(safe-area-inset-top)` für den Vollbildmodus auf dem Handy.
2. **Installierbar als App ohne Browserleiste:**
   - `index.html`:
     - `viewport-fit=cover`,
     - `theme-color`,
     - `apple-mobile-web-app-capable` und `mobile-web-app-capable`,
     - `apple-mobile-web-app-title` „Blueprint“,
     - `apple-touch-icon`,
     - `<link rel="manifest">`.
   - `public/manifest.webmanifest`: `display: standalone`, `start_url` und `scope` = `./`, Name, Farben, Icons.
   - Icons `public/icon-192.png`, `public/icon-512.png` und `public/apple-touch-icon.png`. Ein schlichtes Grundriss-Motiv in Blueprint-Blau, per Skript mit PIL erzeugt.
   - Ein Service Worker ist nicht nötig.
3. **Deploy:** `.github/workflows/pages.yml`.
   - Löst aus bei Push auf `main` und `claude/konzept-figma` sowie per `workflow_dispatch`.
   - Ablauf: Node 22, `npm ci`, `npm test`, `npm run build`. Danach wird `dist/` per `peaceiris/actions-gh-pages@v4` in den Branch `gh-pages` gepusht, mit `permissions: contents: write`.
   - `base: './'` in `vite.config.ts` bleibt, damit es unter `/Blueprint/` funktioniert.
   - `page.html` ist nur für das Artifact. Sie wird nicht nach `dist/` gebaut, sondern nur lokal beim Veröffentlichen erzeugt, also kein Eingriff.
4. **Commit und Push auf `claude/konzept-figma`:** Der Workflow legt `gh-pages` beim ersten Lauf an. Status über die GitHub-MCP-Tools (`actions_list`) prüfen.
5. **Artifact:** mit dem Höhenfix neu veröffentlichen, gleiche URL.

## Schritte für den User (einmalig)
1. Repo öffentlich machen: Settings → General → Danger Zone → Change visibility. Alternativ GitHub Pro.
2. Settings → Pages → Source „Deploy from a branch“, Branch `gh-pages` / `(root)`, Save.
3. Die Adresse lautet dann `https://channel-orange.github.io/Blueprint/`.
4. Auf dem iPhone: Safari → Teilen → „Zum Home-Bildschirm“. Danach startet die App im Vollbild ohne Leisten.

## Verifikation
- `npm test`, `npx tsc -b` und `npm run build` laufen fehlerfrei. `dist/` enthält `manifest.webmanifest` und die Icons.
- Playwright in 390 × 844 mit `dist` über `vite preview`: Der „+ Raum“-Button ist vollständig sichtbar, die Räume sind vertikal zentriert, keine Konsolenfehler.
- Der GitHub-Actions-Lauf ist grün und der Branch `gh-pages` existiert. Ob die Seite live ist, kann der User nach Schritt 2 prüfen.


---

# Iteration 2c: Tastatur nur auf Wunsch, fester Header, einheitliche Panels

## Context
Feedback des Users vom iPhone:
1. **Tastatur öffnet sich sofort** beim Öffnen eines Raums und bei „Raum hinzufügen“. Gewünscht: Erst die Oberfläche zeigen, der User tippt dann selbst ins Feld. Bei „Raum hinzufügen“ sind die Vorschläge der Normalfall, ein eigener Name ist nur eine Zusatzoption.
2. **Header und Zeichenfläche rutschen nach oben**, wenn die Tastatur aufgeht. Das ist iOS-Safari-Verhalten: Der Layout-Viewport scrollt.
3. **Panels uneinheitlich:** Das Panel für Türen und Fenster ist anders aufgebaut als das für Wände.

## Änderungen
1. **Kein Autofokus auf Mobilgeräten**
   - `src/app/RoomPanel.tsx`: `autoFocus` nur noch am Desktop (`useIsDesktop()` aus `ResponsiveDialog.tsx`). Dort gibt es keine Bildschirmtastatur, und man kann sofort tippen. Das gilt für das Wandmaß und für „Abstand zur Ecke“.
   - `src/app/ResponsiveDialog.tsx`: Den automatischen Fokus beim Öffnen unterdrücken (`onOpenAutoFocus={e => e.preventDefault()}` an Drawer/DialogContent). Sonst fokussiert Radix/Vaul das erste Eingabefeld und öffnet die Tastatur.
   - `src/app/AddRoomDialog.tsx`, „Raum hinzufügen“ neu angeordnet:
     - Zuerst die Vorschläge als Raster aus gleich großen Buttons (`grid-cols-2`, mobil gut treffbar). Ein Tipp legt den Raum an und schließt den Dialog.
     - Darunter die Zusatzoption: `InputGroup` mit Platzhalter „Eigener Name“ und einem `InputGroupButton` (+) zum Hinzufügen. Enter fügt ebenfalls hinzu.
     - Der große Footer-Button „Hinzufügen“ entfällt.
     - Der Umbenennen-Dialog bleibt bei Feld + „Speichern“, ohne Autofokus auf dem Handy.
2. **Fester Header über der Tastatur**
   - Neuer Hook `src/app/useVisualViewport.ts`: liest `window.visualViewport` (`height`, `offsetTop`) bei `resize`/`scroll`.
   - `App.tsx`: Der App-Container ist `position: fixed` mit `top = offsetTop`, `height = visualViewport.height`, links und rechts 0. Dadurch bleibt der Header oben, das Panel sitzt direkt über der Tastatur, und die Zeichenfläche dazwischen wird kleiner, statt mitzurutschen.
   - Fallback ohne `visualViewport`: `inset: 0`.
   - `index.html`: `interactive-widget=resizes-content` im Viewport-Meta, das gleiche Verhalten für Chrome/Android.
   - Die Zeichenfläche richtet die Ansicht beim Verkleinern bereits neu auf den Raum aus (vorhandener `fitKey` in `SketchCanvas.tsx`). So bleibt der Raum über Panel und Tastatur sichtbar.
3. **Einheitliches Panel für Wand und Tür/Fenster** (`RoomPanel.tsx`), gleiches Grundgerüst:
   - **Kopfzeile:** Titel links („Wand oben“ bzw. „Tür · Wand oben“), bei Tür/Fenster rechts ein ×.
   - **Inhalt:** Eingabefelder mit gleicher Höhe und Schriftgröße.
     - Wand: ein Feld ohne Extra-Label, der Titel ist das Label (`aria-label`).
     - Tür/Fenster: „Abstand zur Ecke“ und „Breite“ nebeneinander, darunter die Türrichtungen. Die Piktogramm-Buttons sind kompakter und haben die gleiche Höhe wie die übrigen Buttons (`h-12`).
   - **Fußzeile:** gleich hohe Buttons in einer Reihe, die Hauptaktion immer rechts und blau.
     - Wand: [Tür] [Fenster] [Weiter/Fertig].
     - Tür/Fenster: [🗑 nur beim Bearbeiten] [Hinzufügen/Speichern].
   - Hinweise (Warnung, Wand-Konflikt) stehen bei beiden an derselben Stelle, zwischen Inhalt und Fußzeile.

## Verifikation
- `npm test`, `npx tsc -b` und `npm run build` laufen fehlerfrei.
- Playwright 390 × 844 (`hasTouch`/`isMobile`): Nach Antippen eines Raums bzw. Öffnen von „Raum hinzufügen“ ist `document.activeElement` kein Input. Ein Vorschlag legt den Raum mit einem Tipp an. Eigener Name per Feld + Plus-Button funktioniert.
- Tastatur simulieren: Viewport auf 390 × 500 verkleinern. Der Header bleibt bei y = 0, das Panel liegt unten am sichtbaren Rand, der Raum ist in der verbleibenden Fläche zentriert.
- Screenshot-Vergleich Wand-Panel gegen Tür-Panel: gleiche Kopfzeile, gleiche Feldhöhe, Fußzeile mit gleich hohen Buttons.
- Commit und Push. Der Pages-Workflow veröffentlicht automatisch, das Artifact wird neu veröffentlicht.
