const nf = (digits: number) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** 3450 → "345" (cm, ohne Einheit) – Standard für Maßketten. */
export const cm = (mm: number) => nf(mm % 10 === 0 ? 0 : 1).format(mm / 10)

/** 3450 → "3,45 m" */
export const meters = (mm: number) => `${nf(2).format(mm / 1000)} m`

/** 20.16 → "20,2 m²" */
export const sqm = (m2: number) => `${nf(1).format(m2)} m²`

/**
 * Tolerante Maßeingabe: "345", "3,45 m", "3.45m", "120+85", "34,5 cm".
 * Ergebnis in mm oder null. Ohne Einheit gilt cm.
 */
export function parseLength(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '')
  if (!s) return null
  const parts = s.split('+')
  let total = 0
  for (const part of parts) {
    const m = part.match(/^(\d+(?:[.,]\d+)?)(mm|cm|m)?$/)
    if (!m) return null
    const v = parseFloat(m[1].replace(',', '.'))
    const unit = m[2] ?? 'cm'
    total += unit === 'mm' ? v : unit === 'cm' ? v * 10 : v * 1000
  }
  return Math.round(total)
}
