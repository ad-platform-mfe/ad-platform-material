import { Card, Popconfirm } from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import styles from './index.module.less'
import { type Material as MaterialType } from '@/api/material'

interface MaterialCardProps {
  item: MaterialType
  onDelete: (id: number) => void
  onPreview: (item: MaterialType) => void
  onEdit: (item: MaterialType) => void
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  item,
  onDelete,
  onPreview,
  onEdit
}) => {
  return (
    <Card
      hoverable
      cover={
        item.type === 'video' && item.cover ? (
          <img
            alt={item.title}
            src={item.cover}
            className={styles.materialImage}
          />
        ) : item.type === 'image' ? (
          <img
            alt={item.title}
            src={item.data}
            className={styles.materialImage}
          />
        ) : (
          <div className={styles.videoPlaceholder}>
            <PlayCircleOutlined style={{ fontSize: '48px', color: '#fff' }} />
          </div>
        )
      }
      actions={[
        <EyeOutlined key="preview" onClick={() => onPreview(item)} />,
        <EditOutlined key="edit" onClick={() => onEdit(item)} />,
        <Popconfirm
          title="确认删除"
          description="您确定要删除这个素材吗？"
          onConfirm={() => onDelete(item.id)}
          okText="确认"
          cancelText="取消"
        >
          <DeleteOutlined key="delete" />
        </Popconfirm>
      ]}
    >
      <Card.Meta title={item.title} />
    </Card>
  )
}

export default MaterialCard
