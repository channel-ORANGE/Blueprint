import { useState } from 'react'
import { MiniMap, Pictogram, PlanView } from '@/components/plan'
import { apartment, measuringRoom, roomById } from '@/mock/apartment'

export default function App() {
  const [furniture, setFurniture] = useState(apartment.furniture)
  const [sel, setSel] = useState<string | undefined>('sofa')
  return (
    <div className="grid gap-4 p-4">
      <PlanView rooms={apartment.rooms} furniture={furniture} showRoomLabels showClearance className="h-[600px] border" />
      <PlanView
        rooms={[roomById('wohnen')]}
        furniture={furniture.filter((f) => f.roomId === 'wohnen')}
        dimensions="all"
        selectedFurnitureId={sel}
        onSelectFurniture={setSel}
        onMoveFurniture={(id, cx, cy) => setFurniture((fs) => fs.map((f) => (f.id === id ? { ...f, cx, cy } : f)))}
        showClearance
        interactive
        className="h-[600px] border"
      />
      <PlanView rooms={[measuringRoom]} dimensions="all" activeWall={{ roomId: measuringRoom.id, index: 1, label: '345?' }} className="h-[400px] border" />
      <div className="flex gap-2">
        <MiniMap room={measuringRoom} activeWall={1} className="size-24 border" />
        {(['rect', 'L', 'free'] as const).map((s) => (
          <Pictogram key={s} variant="shape" shape={s} className="size-24 border" />
        ))}
        {(['start', 'end'] as const).flatMap((h) =>
          (['in', 'out'] as const).map((sw) => <Pictogram key={h + sw} variant="door" hinge={h} swing={sw} className="size-24 border" />),
        )}
      </div>
    </div>
  )
}
