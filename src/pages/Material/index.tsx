import React, { useState, useEffect, type FC } from 'react'
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
import type { TableProps } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import MaterialCard from '@/components/MaterialCard'
import PhonePreview from '@/components/PhonePreview'
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
import { getBase64, getFileType, generateVideoThumbnail } from '@/utils/file'
import { getStatusTag, renderRejectionReason } from '@/utils/review'

const { Search } = Input

interface CustomUploadFile extends UploadFile {
  title: string
}

const MaterialPage: FC = () => {
  const [materials, setMaterials] = useState<MaterialType[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(
    null
  )
  const [fileList, setFileList] = useState<CustomUploadFile[]>([])
  const [previewingMaterial, setPreviewingMaterial] =
    useState<MaterialType | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [previewModalWidth, setPreviewModalWidth] = useState<
    number | undefined
  >()
  const [loading, setLoading] = useState(false)

  const [form] = Form.useForm()

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const res = await getMaterials({})
      if (res && res.data && Array.isArray(res.data.list)) {
        setMaterials(res.data.list)
      }
    } catch (error) {
      console.error('获取素材列表失败:', error)
      message.error('获取素材列表失败')
    } finally {
      setLoading(false)
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

  const columns: TableProps<MaterialType>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '素材预览',
      dataIndex: 'data',
      key: 'preview',
      width: 150,
      render: (data: string, record: MaterialType) =>
        record.type === 'image' ? (
          <AntImage width={100} src={data} alt={record.title} />
        ) : (
          <video
            width="100"
            poster={record.cover}
            controls
            src={data}
            className={styles.videoPlayer}
          />
        )
    },
    {
      title: '素材名称',
      dataIndex: 'title',
      key: 'title',
      width: 280
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: 'image' | 'video') => (
        <Tag color={type === 'image' ? 'blue' : 'green'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 300,
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: 120,
      render: getStatusTag
    },
    {
      title: '审核详情',
      dataIndex: 'reviewResult',
      key: 'reviewDetail',
      width: 250,
      render: (reviewResult, record) =>
        renderRejectionReason(reviewResult, record)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: MaterialType) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>编辑</a>
          <a onClick={() => handleDelete(record.id)}>删除</a>
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

  const handleCardPreview = (item: MaterialType) => {
    setPreviewModalWidth(undefined) // 每次打开时重置宽度
    setPreviewingMaterial(item)
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
    try {
      const values = await form.validateFields()
      const { title } = values

      if (editingMaterial) {
        setLoading(true)
        await updateMaterial(editingMaterial.id, { title })
        message.success('素材更新成功')
      } else {
        if (fileList.length === 0 || !fileList[0].originFileObj) {
          message.error('请先上传文件')
          return
        }
        setLoading(true)
        const uploadPromises = fileList.map(async (file: CustomUploadFile) => {
          if (!file.originFileObj) return

          const fileType = getFileType(file.originFileObj as RcFile)
          let coverImage = ''
          if (fileType === 'video') {
            coverImage = await generateVideoThumbnail(
              file.originFileObj as RcFile
            )
          }

          const base64 = await getBase64(file.originFileObj as RcFile)
          const payload: AddMaterialPayload = {
            title: file.title,
            data: base64,
            type: fileType,
            reviewStatus: 'pending',
            ...(coverImage && { cover: coverImage })
          }
          return addMaterial(payload)
        })
        await Promise.all(uploadPromises)
        message.success('素材添加成功')
      }
      setIsModalOpen(false)
      setEditingMaterial(null)
      setFileList([])
      form.resetFields()
      fetchMaterials()
    } catch (info) {
      console.log('Validate Failed:', info)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingMaterial(null)
    setFileList([])
    form.resetFields()
  }

  const handleEdit = (record: MaterialType) => {
    setEditingMaterial(record)
    form.setFieldsValue({ title: record.title })
    setIsEditModalOpen(true)
  }

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields()
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
          className={styles.masonryGrid}
          columnClassName={styles.masonryGrid_column}
        >
          {filteredMaterials.map((item) => (
            <div key={item.id} className={styles.masonryItem}>
              <MaterialCard
                item={item}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => handleEdit(item)}
                onPreview={() => handleCardPreview(item)}
              />
            </div>
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
        confirmLoading={loading}
      >
        <Upload
          accept="image/*,video/*"
          beforeUpload={() => false} // Prevent auto upload
          listType="picture-card"
          fileList={fileList}
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
        <Form form={form} layout="vertical" name="form_in_modal">
          <Form.Item
            name="title"
            label="素材标题"
            rules={[{ required: true, message: '请输入素材标题!' }]}
          >
            <AntdInput />
          </Form.Item>
        </Form>
      </Modal>

      {previewingMaterial?.type === 'video' && (
        <PhonePreview
          material={previewingMaterial}
          onClose={handlePreviewCancel}
        />
      )}
      {previewingMaterial?.type === 'image' && (
        <Modal
          open={!!previewingMaterial}
          title={previewingMaterial.title}
          footer={null}
          onCancel={handlePreviewCancel}
          destroyOnClose
          width={previewModalWidth}
        >
          <img
            key={previewingMaterial.data}
            alt={previewingMaterial.title}
            style={{ width: '100%' }}
            src={previewingMaterial.data}
            onLoad={handleImageLoad}
          />
        </Modal>
      )}
    </div>
  )
}

export default MaterialPage
