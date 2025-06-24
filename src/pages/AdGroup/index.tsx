import React, { type FC } from 'react'
import { Card, Typography } from 'antd'
import styles from './index.module.less'

const { Title } = Typography

const AdGroupPage: FC = () => {
  return (
    <Card>
      <Title level={3}>广告组管理</Title>
      <div className={styles.placeholder}>
        <p>广告组列表</p>
      </div>
    </Card>
  )
}

export default AdGroupPage
