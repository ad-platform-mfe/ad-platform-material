import type { FC, PropsWithChildren } from 'react'
import { Layout } from 'antd'
import styles from './BasicLayout.module.css'

const { Header, Content } = Layout

const BasicLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>广告素材平台</div>
      </Header>
      <Content className={styles.content}>{children}</Content>
    </Layout>
  )
}

export default BasicLayout
