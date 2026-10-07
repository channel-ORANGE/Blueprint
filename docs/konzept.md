# Blueprint – Konzept (v3)

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

