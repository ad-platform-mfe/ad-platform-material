import type { FC } from 'react'
import { Layout } from 'antd'
import styles from './BasicLayout.module.less'
import { Outlet } from 'react-router-dom'

const { Content } = Layout

const BasicLayout: FC = () => {
  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  )
}

export default BasicLayout
