import type { FC } from 'react'
import { Card, Image } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import styles from './index.module.less'
import { type Material as MaterialType } from '@/api/material'

const { Meta } = Card

interface MaterialCardProps {
  item: MaterialType
  onDelete: (id: number) => void
  onPreview: (item: MaterialType) => void
  onEdit: (item: MaterialType) => void
}

const MaterialCard: FC<MaterialCardProps> = (props) => {
  const { item, onDelete, onPreview, onEdit } = props

  return (
    <Card
      cover={
        item.type === 'image' ? (
          <Image alt={item.title} src={item.data} />
        ) : (
          <div
            className={styles['video-cover']}
            onClick={() => onPreview(item)}
          >
            <div className={styles['video-placeholder']}>
              <p>视频素材</p>
            </div>
            <div className={styles['video-play-icon']}>▶</div>
          </div>
        )
      }
      actions={[
        <EyeOutlined key="preview" onClick={() => onPreview(item)} />,
        <EditOutlined key="edit" onClick={() => onEdit(item)} />,
        <DeleteOutlined key="delete" onClick={() => onDelete(item.id)} />
      ]}
    >
      <Meta title={item.title} />
    </Card>
  )
}

export default MaterialCard
