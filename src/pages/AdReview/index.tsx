import { useState, useEffect, type FC } from 'react'
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Input,
  message,
  Image
} from 'antd'
import styles from './index.module.less'
import type { TableProps } from 'antd'
import { SearchOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons'
import { getMaterials, type Material, type ApiResponse } from '@/api/material'
import { triggerReview } from '@/api/review'

const { Title } = Typography
const { Option } = Select

interface MaterialsData {
  total: number
  list: Material[]
}

const AdReview: FC = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      // 我们只审核图片类型的素材
      const res = (await getMaterials({
        page: 1,
        pageSize: 100,
        type: 'image'
      })) as ApiResponse<MaterialsData>
      if (res && res.data && Array.isArray(res.data.list)) {
        setMaterials(res.data.list)
      }
    } catch (error) {
      console.error('获取待审核素材列表失败:', error)
      message.error('获取待审核素材列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const handleAiReview = async (id: number) => {
    try {
      await triggerReview(id)
      message.success('AI审核任务已启动，请稍后刷新查看结果。')
      // 延迟一段时间后刷新列表，给后端一些处理时间
      setTimeout(() => {
        fetchMaterials()
      }, 1500)
    } catch (error) {
      console.error('启动AI审核失败:', error)
      message.error('启动AI审核失败')
    }
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesStatus =
      statusFilter === 'all' || material.reviewStatus === statusFilter
    const matchesSearch =
      searchText === '' ||
      material.title.toLowerCase().includes(searchText.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusTag = (status: Material['reviewStatus']) => {
    switch (status) {
      case 'approved':
        return <Tag color="success">审核通过</Tag>
      case 'rejected':
        return <Tag color="error">审核拒绝</Tag>
      case 'review':
        return <Tag color="warning">建议复审</Tag>
      case 'pending':
      default:
        return <Tag color="processing">待审核</Tag>
    }
  }

  const columns: TableProps<Material>['columns'] = [
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
      render: (data: string, record) => (
        <Image width={100} src={record.cover || data} alt={record.title} />
      )
    },
    {
      title: '素材名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: 120,
      render: (status: Material['reviewStatus']) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small">
            人工审核
          </Button>
          <Button
            icon={<RobotOutlined />}
            onClick={() => handleAiReview(record.id)}
            disabled={record.reviewStatus !== 'pending'}
            size="small"
          >
            AI 审核
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Card>
      <Title level={2}>广告素材审核</Title>

      <Space className={styles.filterBar} style={{ marginBottom: 16 }}>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
        >
          <Option value="all">全部状态</Option>
          <Option value="pending">待审核</Option>
          <Option value="approved">已通过</Option>
          <Option value="rejected">已拒绝</Option>
          <Option value="review">建议复审</Option>
        </Select>

        <Input
          placeholder="搜索素材名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredMaterials}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}

export default AdReview
