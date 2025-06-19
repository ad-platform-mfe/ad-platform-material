import React, { useState, useEffect } from 'react'
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
  Tag,
  Form,
  Input as AntdInput,
  message
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
  updateMaterial,
  type Material as MaterialType,
  type AddMaterialPayload
} from '@/api/material'

const { Search } = Input

interface CustomUploadFile extends UploadFile {
  title: string
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

const generateVideoThumbnail = (file: RcFile): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    // 跳转到1秒
    video.currentTime = 1

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const thumbnailUrl = canvas.toDataURL('image/jpeg')
        // 释放资源
        URL.revokeObjectURL(video.src)
        resolve(thumbnailUrl)
      } else {
        URL.revokeObjectURL(video.src)
        // 返回空字符串
        resolve('')
      }
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      // 返回空字符串
      resolve('')
    }
  })
}

const getFileType = (file: RcFile): 'image' | 'video' => {
  // 优先使用 MIME 类型
  if (file.type && file.type.startsWith('image/')) {
    return 'image'
  } else if (file.type && file.type.startsWith('video/')) {
    return 'video'
  }
  // 如果 MIME 类型不是视频，则检查文件扩展名
  if ((file.name && file.name.endsWith('.jpg')) || file.name.endsWith('.png')) {
    return 'image'
  } else if (file.name && file.name.endsWith('.mp4')) {
    return 'video'
  }
  throw new Error('不支持的文件类型')
}

function Material() {
  const [materials, setMaterials] = useState<MaterialType[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(
    null
  )
  const [fileList, setFileList] = useState<CustomUploadFile[]>([])
  const [previewingMaterial, setPreviewingMaterial] = useState<
    | (Omit<MaterialType, 'id' | 'createdAt' | 'updatedAt'> & {
        id?: number
      })
    | null
  >(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [previewModalWidth, setPreviewModalWidth] = useState<
    number | undefined
  >()
  const [editForm] = Form.useForm()

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
        ) : record.cover ? (
          <AntImage
            width={80}
            height={45}
            src={record.cover}
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
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
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
    .filter((item: MaterialType) => {
      if (filter === 'all') return true
      return item.type === filter
    })
    .filter((item: MaterialType) => {
      if (!search) return true
      return item.title.toLowerCase().includes(search.toLowerCase())
    })

  const handleTitleChange = (newTitle: string, uid: string) => {
    setFileList((currentFileList: CustomUploadFile[]) =>
      currentFileList.map((file: CustomUploadFile) => {
        if (file.uid === uid) {
          return { ...file, title: newTitle }
        }
        return file
      })
    )
  }

  const calculateModalWidth = (
    width: number,
    height: number
  ): number | undefined => {
    if (height > width) {
      const maxHeight = window.innerHeight * 0.8
      const maxWidth = window.innerWidth * 0.8
      let modalWidth = (width / height) * maxHeight
      if (modalWidth > maxWidth) {
        modalWidth = maxWidth
      }
      return modalWidth
    }
    return undefined
  }

  const handleImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = e.currentTarget
    const newWidth = calculateModalWidth(img.naturalWidth, img.naturalHeight)
    setPreviewModalWidth(newWidth)
  }

  const handleVideoLoad = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const video = e.currentTarget
    const { videoWidth, videoHeight } = video
    const newWidth = calculateModalWidth(videoWidth, videoHeight)
    setPreviewModalWidth(newWidth)
  }

  const handleCardPreview = (item: MaterialType) => {
    setPreviewModalWidth(undefined) // 每次打开时重置宽度
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

    setPreviewModalWidth(undefined)
    setPreviewingMaterial({
      title:
        file.name ||
        previewUrl?.substring(previewUrl.lastIndexOf('/') + 1) ||
        '预览',
      data: previewUrl || '',
      type: file.type?.startsWith('video/') ? 'video' : 'image'
    })
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    const nextFileList = newFileList.map((file: UploadFile) => {
      const currentFile = fileList.find(
        (item: CustomUploadFile) => item.uid === file.uid
      )
      return {
        ...file,
        title: currentFile?.title || file.name
      }
    })
    setFileList(nextFileList as CustomUploadFile[])
  }

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleOk = async () => {
    const uploadPromises = fileList.map(async (file: CustomUploadFile) => {
      if (!file.originFileObj) return

      const fileType = getFileType(file.originFileObj as RcFile)
      let coverImage = ''
      if (fileType === 'video') {
        coverImage = await generateVideoThumbnail(file.originFileObj as RcFile)
      }

      const base64 = await getBase64(file.originFileObj as RcFile)
      const payload: AddMaterialPayload = {
        title: file.title,
        data: base64,
        type: fileType,
        ...(coverImage && { cover: coverImage })
      }
      return addMaterial(payload)
    })

    try {
      await Promise.all(uploadPromises)
      message.success('素材上传成功！')
      setIsModalOpen(false)
      setFileList([])
      fetchMaterials()
    } catch (error) {
      console.error('Failed to upload materials:', error)
      message.error('素材上传失败，请稍后重试。')
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handleEdit = (record: MaterialType) => {
    setEditingMaterial(record)
    editForm.setFieldsValue({ title: record.title })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields()
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, { title: values.title })
        message.success('素材更新成功！')
        setIsEditModalOpen(false)
        setEditingMaterial(null)
        fetchMaterials()
      }
    } catch (error) {
      console.error('Failed to update material:', error)
      message.error('素材更新失败，请稍后重试。')
    }
  }

  const handleEditCancel = () => {
    setIsEditModalOpen(false)
    setEditingMaterial(null)
  }

  const handlePreviewCancel = () => {
    setPreviewingMaterial(null)
    setPreviewModalWidth(undefined)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMaterial(id)
      message.success('素材删除成功！')
      fetchMaterials()
    } catch (error) {
      console.error('Failed to delete material:', error)
      message.error('素材删除失败，请稍后重试。')
    }
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
          {filteredMaterials.map((item: MaterialType) => (
            <MaterialCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onPreview={handleCardPreview}
              onEdit={handleEdit}
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
            onChange={(value: string | number | boolean) =>
              setViewMode(value as 'card' | 'table')
            }
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
        <div
          style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '20px' }}
        >
          {fileList.map((file: CustomUploadFile) => (
            <div
              key={file.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 12
              }}
            >
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginRight: 12
                }}
              >
                {file.name}
              </span>
              <Input
                value={file.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleTitleChange(e.target.value, file.uid)
                }
                placeholder="请输入素材标题"
              />
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="编辑素材"
        open={isEditModalOpen}
        onOk={handleUpdate}
        onCancel={handleEditCancel}
      >
        <Form form={editForm} layout="vertical" name="form_in_modal">
          <Form.Item
            name="title"
            label="素材标题"
            rules={[{ required: true, message: '请输入素材标题!' }]}
          >
            <AntdInput />
          </Form.Item>
        </Form>
      </Modal>

      {previewingMaterial && (
        <Modal
          open={!!previewingMaterial}
          title={previewingMaterial.title}
          footer={null}
          onCancel={handlePreviewCancel}
          destroyOnClose
          width={previewModalWidth}
        >
          {previewingMaterial.type === 'image' && (
            <img
              key={previewingMaterial.data}
              alt={previewingMaterial.title}
              style={{ width: '100%' }}
              src={previewingMaterial.data}
              onLoad={handleImageLoad}
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
