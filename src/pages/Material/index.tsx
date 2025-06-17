import type { FC } from 'react'
import { useState } from 'react'
import type { RadioChangeEvent } from 'antd'
import {
  Button,
  Input,
  Radio,
  Space,
  List,
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

import adImgDemo from '@/assets/images/ad-img-demo.jpg'
import adImgDemo2 from '@/assets/images/ad-img-demo2.jpg'
import adVideoDemo2 from '@/assets/video/ad-demo2.mp4'

const { Search } = Input

interface Material {
  id: number
  type: 'image' | 'video'
  name: string
  url: string
  cover?: string
  createdAt?: string
}

const mockData: Material[] = [
  {
    id: 1,
    type: 'image',
    name: '风景图片',
    url: adImgDemo,
    createdAt: '2023-10-01 10:00:00'
  },
  {
    id: 2,
    type: 'image',
    name: '品牌广告',
    url: adImgDemo2,
    createdAt: '2023-10-02 11:30:00'
  },
  {
    id: 3,
    type: 'video',
    name: '广告视频',
    url: adVideoDemo2,
    cover:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    createdAt: '2023-10-03 15:00:00'
  }
]

const Material: FC = () => {
  const [materials, setMaterials] = useState(mockData)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewingMaterial, setPreviewingMaterial] = useState<Material | null>(
    null
  )
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

  const columns = [
    {
      title: '缩略图',
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record: Material) => (
        <AntImage
          width={80}
          height={45}
          src={record.type === 'image' ? url : record.cover}
          alt={record.name}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
        />
      )
    },
    {
      title: '素材名称',
      dataIndex: 'name',
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
      render: (_: unknown, record: Material) => (
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
    const newFilter = e.target.value
    setFilter(newFilter)
    filterMaterials(newFilter, search)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    filterMaterials(filter, value)
  }

  const filterMaterials = (type: string, keyword: string) => {
    let filteredData = mockData

    if (type !== 'all') {
      filteredData = filteredData.filter((item) => item.type === type)
    }

    if (keyword) {
      filteredData = filteredData.filter((item) => item.name.includes(keyword))
    }

    setMaterials(filteredData)
  }

  const handleCardPreview = (item: Material) => {
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
      id: new Date().getTime(), // temporary id
      name:
        file.name ||
        previewUrl?.substring(previewUrl.lastIndexOf('/') + 1) ||
        '预览',
      url: previewUrl || '',
      type: file.type?.startsWith('video/') ? 'video' : 'image'
    })
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    setFileList(newFileList)

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleOk = () => {
    const newMaterials: Material[] = fileList.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      url: file.url || (file.preview as string),
      type: file.type?.startsWith('image/') ? 'image' : 'video'
    }))

    setMaterials((prev) => [...newMaterials, ...prev])
    setFileList([])
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handlePreviewCancel = () => setPreviewingMaterial(null)

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个素材吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setMaterials((prev) => prev.filter((item) => item.id !== id))
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
      return (
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={materials}
          renderItem={(item) => (
            <List.Item>
              <MaterialCard
                item={item}
                onDelete={handleDelete}
                onPreview={handleCardPreview}
              />
            </List.Item>
          )}
          locale={{
            emptyText: (
              <Empty description="暂无素材">
                <Button type="primary" onClick={showModal}>
                  立即上传
                </Button>
              </Empty>
            )
          }}
        />
      )
    }
    return <Table columns={columns} dataSource={materials} rowKey="id" />
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
          action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
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
          title={previewingMaterial.name}
          footer={null}
          onCancel={handlePreviewCancel}
          destroyOnClose
        >
          {previewingMaterial.type === 'image' && (
            <img
              key={previewingMaterial.url}
              alt={previewingMaterial.name}
              style={{ width: '100%' }}
              src={previewingMaterial.url}
            />
          )}
          {previewingMaterial.type === 'video' && (
            <video
              key={previewingMaterial.url}
              controls
              autoPlay
              muted
              style={{ width: '100%' }}
              src={previewingMaterial.url}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

export default Material
