import type { FC, PropsWithChildren } from 'react'
import { Layout } from 'antd'
import styles from './BasicLayout.module.less'

const { Content } = Layout

const BasicLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Layout className={styles.layout}>
      <Content className={styles.content}>{children}</Content>
    </Layout>
  )
}

export default BasicLayout
