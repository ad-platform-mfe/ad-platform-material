import type { FC } from 'react'
import BasicLayout from './layouts/BasicLayout'
import Material from './pages/Material'

const App: FC = () => {
  return (
    <BasicLayout>
      <Material />
    </BasicLayout>
  )
}

export default App
