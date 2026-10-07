import { PlanView } from './PlanView'
import type { Room } from './types'

/** Kleine Raumübersicht mit hervorgehobener aktiver Wand (Orientierung im Aufmaß). */
export function MiniMap({ room, activeWall, className }: { room: Room; activeWall: number; className?: string }) {
  return <PlanView rooms={[room]} activeWall={{ roomId: room.id, index: activeWall }} wallThickness={140} padding={260} className={className} />
}
