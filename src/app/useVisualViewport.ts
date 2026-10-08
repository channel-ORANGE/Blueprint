import { useEffect, useState } from 'react'

type Viewport = { height: number; offsetTop: number } | null

/**
 * Sichtbarer Bereich des Browsers (ohne Bildschirmtastatur).
 * iOS Safari verschiebt sonst beim Öffnen der Tastatur die ganze Seite samt Header nach oben.
 */
export function useVisualViewport(): Viewport {
  const read = (): Viewport => (window.visualViewport ? { height: window.visualViewport.height, offsetTop: window.visualViewport.offsetTop } : null)
  const [vp, setVp] = useState<Viewport>(read)
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const update = () => setVp({ height: v.height, offsetTop: v.offsetTop })
    v.addEventListener('resize', update)
    v.addEventListener('scroll', update)
    return () => {
      v.removeEventListener('resize', update)
      v.removeEventListener('scroll', update)
    }
  }, [])
  return vp
}
