import type { FC } from 'react'
import { useState } from 'react'
import type { RadioChangeEvent } from 'antd'
import { Button, Input, Radio, Space, List, Modal, Upload, Empty } from 'antd'
import type { RcFile, UploadProps } from 'antd/es/upload'
import type { UploadFile } from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import MaterialCard from '@/components/MaterialCard'
import styles from './index.module.css'

const { Search } = Input

interface Material {
  id: number
  type: 'image' | 'video'
  name: string
  url: string
  cover?: string
}

const mockData: Material[] = [
  {
    id: 1,
    type: 'image',
    name: '风景图片',
    url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
  },
  {
    id: 2,
    type: 'image',
    name: '美女图片',
    url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
  },
  {
    id: 3,
    type: 'video',
    name: '广告视频',
    url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    cover:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
  }
]

const Material: FC = () => {
  const [materials, setMaterials] = useState(mockData)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewingMaterial, setPreviewingMaterial] = useState<Material | null>(
    null
  )

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
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1)
    )
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
      type: file.type?.startsWith('image/') ? 'image' : 'video',
      cover: file.type?.startsWith('video/')
        ? 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
        : undefined
    }))

    setMaterials((prev) => [...newMaterials, ...prev])
    setFileList([])
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handlePreviewCancel = () => setPreviewOpen(false)

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
        <Search
          placeholder="请输入素材名称"
          onSearch={handleSearch}
          style={{ width: 240 }}
        />
      </div>
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
        <Modal
          open={previewOpen}
          title={previewTitle}
          footer={null}
          onCancel={handlePreviewCancel}
        >
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </Modal>
      {previewingMaterial && (
        <Modal
          open={!!previewingMaterial}
          title={previewingMaterial.name}
          footer={null}
          onCancel={() => setPreviewingMaterial(null)}
          destroyOnClose
        >
          {previewingMaterial.type === 'image' && (
            <img
              alt={previewingMaterial.name}
              style={{ width: '100%' }}
              src={previewingMaterial.url}
            />
          )}
          {previewingMaterial.type === 'video' && (
            <video
              controls
              autoPlay
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
