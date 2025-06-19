import { useState, useEffect } from 'react'
import type { RadioChangeEvent } from 'antd'
import {
  Button,
  Input,
  Radio,
  Space,
  Modal,
  Upload,
  Empty,
  Segmented,
  Table,
  Image as AntImage,
  Tag
} from 'antd'
import type { RcFile, UploadProps } from 'antd/es/upload'
import type { UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import MaterialCard from '@/components/MaterialCard'
import styles from './index.module.less'
import Masonry from 'react-masonry-css'
import {
  getMaterials,
  addMaterial,
  deleteMaterial,
  type Material as MaterialType
} from '@/api/material'

const { Search } = Input

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

function Material() {
  const [materials, setMaterials] = useState<MaterialType[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewingMaterial, setPreviewingMaterial] = useState<
    | (Omit<MaterialType, 'id' | 'createdAt' | 'updatedAt'> & {
        id?: number
      })
    | null
  >(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [videoModalWidth, setVideoModalWidth] = useState<number | undefined>()

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials({})
      if (res.data && res.data.list) {
        setMaterials(res.data.list)
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  }

  const columns = [
    {
      title: '缩略图',
      dataIndex: 'data',
      key: 'url',
      render: (data: string, record: MaterialType) =>
        record.type === 'image' ? (
          <AntImage
            width={80}
            height={45}
            src={data}
            alt={record.title}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 45,
              background: '#e8e8e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            视频
          </div>
        )
    },
    {
      title: '素材名称',
      dataIndex: 'title',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: 'image' | 'video') => (
        <Tag color={type === 'image' ? 'green' : 'blue'}>
          {type === 'image' ? '图片' : '视频'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: MaterialType) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleCardPreview(record)}>
            预览
          </Button>
          <Button type="link">编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleFilterChange = (e: RadioChangeEvent) => {
    setFilter(e.target.value)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const filteredMaterials = materials
    .filter((item) => {
      if (filter === 'all') return true
      return item.type === filter
    })
    .filter((item) => {
      if (!search) return true
      return item.title.toLowerCase().includes(search.toLowerCase())
    })

  const handleVideoLoad = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const video = e.currentTarget
    const { videoWidth, videoHeight } = video

    // 仅为竖屏视频计算动态宽度
    if (videoHeight > videoWidth) {
      const maxHeight = window.innerHeight * 0.8
      const maxWidth = window.innerWidth * 0.8

      let modalWidth = videoWidth

      if (videoHeight > maxHeight) {
        modalWidth = (videoWidth / videoHeight) * maxHeight
      }

      if (modalWidth > maxWidth) {
        modalWidth = maxWidth
      }
      setVideoModalWidth(modalWidth)
    }
  }

  const handleCardPreview = (item: MaterialType) => {
    setVideoModalWidth(undefined) // 每次打开时重置宽度
    setPreviewingMaterial(item)
  }

  const handlePreview = async (file: UploadFile) => {
    let previewUrl = file.url

    if (!previewUrl && file.originFileObj) {
      try {
        previewUrl = await getBase64(file.originFileObj as RcFile)
      } catch (e) {
        console.error('Failed to get base64 for preview:', e)
        previewUrl = '' // or some fallback
      }
    }

    setPreviewingMaterial({
      title:
        file.name ||
        previewUrl?.substring(previewUrl.lastIndexOf('/') + 1) ||
        '预览',
      data: previewUrl || '',
      type: file.type?.startsWith('video/') ? 'video' : 'image'
    })
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList)

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleOk = async () => {
    const uploadPromises = fileList.map(async (file) => {
      if (!file.originFileObj) return

      const base64 = await getBase64(file.originFileObj as RcFile)
      const payload = {
        title: file.name,
        data: base64,
        type: (file.type?.startsWith('image/') ? 'image' : 'video') as
          | 'image'
          | 'video'
      }
      return addMaterial(payload)
    })

    try {
      await Promise.all(uploadPromises)
      setIsModalOpen(false)
      setFileList([])
      fetchMaterials() // Refresh list after upload
    } catch (error) {
      console.error('Failed to upload materials:', error)
      // Optionally show an error message to the user
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handlePreviewCancel = () => {
    setPreviewingMaterial(null)
    setVideoModalWidth(undefined)
  }

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个素材吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMaterial(id)
          fetchMaterials() // Refresh list after delete
        } catch (error) {
          console.error('Failed to delete material:', error)
        }
      }
    })
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  )

  const renderContent = () => {
    if (viewMode === 'card') {
      if (filteredMaterials.length === 0) {
        return (
          <Empty description="暂无素材">
            <Button type="primary" onClick={showModal}>
              立即上传
            </Button>
          </Empty>
        )
      }
      return (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className={styles['my-masonry-grid']}
          columnClassName={styles['my-masonry-grid_column']}
        >
          {filteredMaterials.map((item) => (
            <MaterialCard
              key={item.id}
              item={item}
              onDelete={() => handleDelete(item.id)}
              onPreview={handleCardPreview}
            />
          ))}
        </Masonry>
      )
    }
    return (
      <Table columns={columns} dataSource={filteredMaterials} rowKey="id" />
    )
  }

  return (
    <div>
      <div className={styles.actions}>
        <Space>
          <Button type="primary" onClick={showModal}>
            上传素材
          </Button>
          <Radio.Group value={filter} onChange={handleFilterChange}>
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="image">图片</Radio.Button>
            <Radio.Button value="video">视频</Radio.Button>
          </Radio.Group>
        </Space>
        <Space>
          <Search
            placeholder="请输入素材名称"
            onSearch={handleSearch}
            style={{ width: 240 }}
          />
          <Segmented
            options={[
              { label: '卡片', value: 'card' },
              { label: '表格', value: 'table' }
            ]}
            value={viewMode}
            onChange={(value) => setViewMode(value as 'card' | 'table')}
          />
        </Space>
      </div>
      {renderContent()}
      <Modal
        title="上传素材"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Upload
          accept="image/*,video/*"
          beforeUpload={() => false} // Prevent auto upload
          listType="picture-card"
          fileList={fileList}
          onPreview={handlePreview}
          onChange={handleChange}
        >
          {fileList.length >= 8 ? null : uploadButton}
        </Upload>
      </Modal>
      {previewingMaterial && (
        <Modal
          open={!!previewingMaterial}
          title={previewingMaterial.title}
          footer={null}
          onCancel={handlePreviewCancel}
          destroyOnClose
          width={
            previewingMaterial.type === 'video' ? videoModalWidth : undefined
          }
        >
          {previewingMaterial.type === 'image' && (
            <img
              key={previewingMaterial.data}
              alt={previewingMaterial.title}
              style={{ width: '100%' }}
              src={previewingMaterial.data}
            />
          )}
          {previewingMaterial.type === 'video' && (
            <video
              key={previewingMaterial.data}
              controls
              autoPlay
              muted
              style={{ width: '100%' }}
              src={previewingMaterial.data}
              onLoadedMetadata={handleVideoLoad}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

export default Material
