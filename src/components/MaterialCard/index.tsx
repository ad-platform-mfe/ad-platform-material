import type { FC } from 'react'
import { Card, Image } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import styles from './index.module.css'

const { Meta } = Card

interface Material {
  id: number
  type: 'image' | 'video'
  name: string
  url: string
  cover?: string
}

interface MaterialCardProps {
  item: Material
  onDelete: (id: number) => void
  onPreview: (item: Material) => void
}

const MaterialCard: FC<MaterialCardProps> = ({ item, onDelete, onPreview }) => {
  return (
    <Card
      cover={
        item.type === 'image' ? (
          <Image alt={item.name} src={item.url} />
        ) : (
          <div className={styles['video-cover']}>
            <Image alt={item.name} src={item.cover} />
            <div className={styles['video-play-icon']}>▶</div>
          </div>
        )
      }
      actions={[
        <EyeOutlined key="preview" onClick={() => onPreview(item)} />,
        <EditOutlined key="edit" />,
        <DeleteOutlined key="delete" onClick={() => onDelete(item.id)} />
      ]}
    >
      <Meta title={item.name} />
    </Card>
  )
}

export default MaterialCard
