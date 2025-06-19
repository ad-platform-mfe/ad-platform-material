import type { FC } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import BasicLayout from './layouts/BasicLayout'
import Material from './pages/Material'

const App: FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BasicLayout>
        <Material />
      </BasicLayout>
    </ConfigProvider>
  )
}

export default App
