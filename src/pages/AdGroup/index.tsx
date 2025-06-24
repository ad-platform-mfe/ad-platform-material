import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col
} from 'antd'
import {
  getAdGroups,
  createAdGroup,
  updateAdGroup,
  deleteAdGroup,
  AdGroup
} from '@/api/adGroup'
import { getMaterials, Material } from '@/api/material'
import styles from './index.module.less'

const { Option } = Select

const AdGroupPage: React.FC = () => {
  const [adGroups, setAdGroups] = useState<AdGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false)
  const [editingAdGroup, setEditingAdGroup] = useState<AdGroup | null>(null)
  const [form] = Form.useForm()

  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([])

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials({ pageSize: 1000 })
      if (res.code === 0) {
        setMaterials(res.data.list)
      }
    } catch (error) {
      console.error('获取素材列表失败:', error)
      message.error('获取素材列表失败')
    }
  }

  // Fetch ad groups
  const fetchAdGroups = async () => {
    setLoading(true)
    try {
      const res = await getAdGroups({ page: 1, pageSize: 100 })
      if (res.code === 0) {
        setAdGroups(res.data.rows)
      }
    } catch (error) {
      console.error('获取广告组列表失败:', error)
      message.error('获取广告组列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdGroups()
    fetchMaterials()
  }, [])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = { ...values, materialIds: selectedMaterialIds }

      if (editingAdGroup) {
        await updateAdGroup(editingAdGroup.id, payload)
        message.success('更新成功')
      } else {
        await createAdGroup(payload)
        message.success('创建成功')
      }
      setIsModalVisible(false)
      setEditingAdGroup(null)
      fetchAdGroups()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingAdGroup(null)
    form.resetFields()
    setSelectedMaterialIds([])
  }

  const handleEdit = (record: AdGroup) => {
    setEditingAdGroup(record)
    form.setFieldsValue({
      name: record.name,
      mainCategory: record.mainCategory,
      tags: record.tags
    })
    setSelectedMaterialIds(record.Materials?.map((m) => m.id) || [])
    setIsModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAdGroup(id)
      message.success('删除成功')
      fetchAdGroups()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleMaterialSelect = () => {
    setIsModalVisible(false)
    setIsMaterialModalVisible(true)
  }

  const handleMaterialModalOk = () => {
    setIsMaterialModalVisible(false)
    setIsModalVisible(true)
  }

  const handleMaterialModalCancel = () => {
    setIsMaterialModalVisible(false)
    setIsModalVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '广告组名称', dataIndex: 'name', key: 'name' },
    { title: '主分类', dataIndex: 'mainCategory', key: 'mainCategory' },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>{tags && tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</>
      )
    },
    {
      title: '包含素材数',
      key: 'materialsCount',
      render: (_text: unknown, record: AdGroup) => record.Materials?.length || 0
    },
    {
      title: '操作',
      key: 'action',
      render: (_text: unknown, record: AdGroup) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}>编辑</a>
          <Popconfirm
            title="确定删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <a>删除</a>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const materialColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '素材标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type' }
  ]

  const rowSelection = {
    selectedRowKeys: selectedMaterialIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedMaterialIds(selectedRowKeys as number[])
    }
  }

  return (
    <div className={styles.adGroupPage}>
      <Card>
        <Row justify="end" style={{ marginBottom: 16 }}>
          <Col>
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
              新建广告组
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={adGroups}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingAdGroup ? '编辑广告组' : '新建广告组'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="adGroupForm"
          initialValues={{ tags: [] }}
        >
          <Form.Item
            name="name"
            label="广告组名称"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="mainCategory"
            label="主分类"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="互动广告">互动广告</Option>
              <Option value="创意视频">创意视频</Option>
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入后按回车创建标签"
            />
          </Form.Item>
          <Form.Item label="关联素材">
            <Space>
              <Button onClick={handleMaterialSelect}>选择素材</Button>
              <span>已选择 {selectedMaterialIds.length} 个素材</span>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="选择素材"
        open={isMaterialModalVisible}
        onOk={handleMaterialModalOk}
        onCancel={handleMaterialModalCancel}
        width={800}
      >
        <Table
          rowSelection={rowSelection}
          columns={materialColumns}
          dataSource={materials}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>
    </div>
  )
}

export default AdGroupPage
