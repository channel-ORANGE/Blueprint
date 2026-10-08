import { Suspense } from 'react'
import { Route, Routes } from 'react-router'

import { Overview } from '@/screens/Overview'
import { screens } from '@/screens/registry'

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route path="/" element={<Overview />} />
        {screens.map(({ id, path, Component }) => (
          <Route key={id} path={path} element={<Component />} />
        ))}
      </Routes>
    </Suspense>
  )
}
