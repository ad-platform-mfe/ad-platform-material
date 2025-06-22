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
  Image,
  Tooltip,
  Modal,
  Form
} from 'antd'
import styles from './index.module.less'
import type { TableProps } from 'antd'
import { SearchOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons'
import { getMaterials, type Material, type ReviewResult } from '@/api/material'
import { triggerReview, submitManualReview } from '@/api/review'

const { Title } = Typography
const { Option } = Select

const AdReview: FC = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null)
  const [form] = Form.useForm()

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      // 只审核图片类型的素材
      const res = await getMaterials({
        page: 1,
        pageSize: 100,
        type: 'image'
      })
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
    // 立即更新UI，将状态设置为"审核中"
    setMaterials((prevMaterials) =>
      prevMaterials.map((material) =>
        material.id === id
          ? { ...material, reviewStatus: 'reviewing' }
          : material
      )
    )

    try {
      const res = await triggerReview(id)
      // 后端返回202，表示任务已启动
      message.success(res.message || 'AI审核任务已启动，3秒后将自动刷新列表。')

      // 3秒后刷新列表以获取最新审核状态
      setTimeout(() => {
        fetchMaterials()
      }, 3000)
    } catch (error) {
      console.error('启动AI审核失败:', error)
      message.error('启动AI审核失败，请重试')
      // 如果失败，把状态还原回去
      fetchMaterials()
    }
  }

  const handleOpenReviewModal = (material: Material) => {
    setCurrentMaterial(material)
    setIsModalVisible(true)
    form.resetFields()
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setCurrentMaterial(null)
  }

  const handleManualReviewSubmit = async (
    values: { reason?: string },
    action: 'approve' | 'reject'
  ) => {
    if (!currentMaterial) return

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    if (action === 'reject') {
      try {
        await form.validateFields(['reason'])
        if (!form.getFieldValue('reason')) {
          form.setFields([{ name: 'reason', errors: ['请填写拒绝原因'] }])
          return
        }
      } catch {
        return // 验证失败，不继续
      }
    }

    try {
      setLoading(true)
      await submitManualReview(currentMaterial.id, {
        reviewStatus: newStatus,
        reason: values.reason
      })

      message.success(
        `素材已成功标记为【${action === 'approve' ? '通过' : '拒绝'}】`
      )
      // 更新本地数据
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === currentMaterial.id ? { ...m, reviewStatus: newStatus } : m
        )
      )
      handleModalCancel()
    } catch (error) {
      console.error('人工审核提交失败', error)
      message.error('操作失败，请重试')
    } finally {
      setLoading(false)
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
      case 'reviewing':
        return (
          <Tag color="processing" icon={<RobotOutlined />}>
            审核中
          </Tag>
        )
      case 'pending':
      default:
        return <Tag>待审核</Tag>
    }
  }

  const generateRejectionReason = (reviewResult?: ReviewResult) => {
    if (!reviewResult) {
      return '无详细审核信息。'
    }

    const { Label, SubLabel, Score, Suggestion } = reviewResult
    const labelMap: Record<string, string> = {
      Polity: '政治类',
      Porn: '涉黄',
      Illegal: '违法',
      Terror: '涉恐',
      Sexy: '性感',
      Normal: '正常'
    }

    const suggestionMap: Record<string, string> = {
      Block: '拒绝',
      Pass: '通过',
      Review: '复审'
    }

    const readableLabel = labelMap[Label] || Label
    const readableSuggestion = suggestionMap[Suggestion] || Suggestion

    return `该素材命中了【${readableLabel}】敏感内容 (标签: ${SubLabel})，置信度为 ${Score} 分，系统建议【${readableSuggestion}】。`
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
      key: 'title',
      width: 280
    },
    {
      title: '提交时间',
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
      render: (status: Material['reviewStatus']) => getStatusTag(status)
    },
    {
      title: '审核详情',
      dataIndex: 'reviewResult',
      key: 'reviewDetail',
      width: 250,
      render: (reviewResult: ReviewResult, record: Material) => {
        if (record.reviewStatus !== 'rejected') {
          return '-'
        }
        const reason = generateRejectionReason(reviewResult)
        return (
          <Tooltip title={reason}>
            <span className={styles.rejectionReason}>{reason}</span>
          </Tooltip>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleOpenReviewModal(record)}
          >
            人工复审
          </Button>
          <Button
            icon={<RobotOutlined />}
            onClick={() => handleAiReview(record.id)}
            disabled={['approved', 'reviewing'].includes(record.reviewStatus)}
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
          <Option value="reviewing">审核中</Option>
          <Option value="approved">已通过</Option>
          <Option value="rejected">已拒绝</Option>
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

      {currentMaterial && (
        <Modal
          title={`人工复审 - ${currentMaterial.title}`}
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
        >
          <p>当前状态: {getStatusTag(currentMaterial.reviewStatus)}</p>
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleManualReviewSubmit(values, 'reject')}
          >
            <Form.Item
              name="reason"
              label="拒绝原因"
              rules={[
                {
                  validator: async (_, value) => {
                    // 这个校验器实际上由手动调用validateFields来触发
                    if (!value && form.getFieldValue('__action') === 'reject') {
                      return Promise.reject(new Error('请填写拒绝原因'))
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="如果选择拒绝，请在此处填写详细原因..."
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={() => handleManualReviewSubmit({}, 'approve')}
                >
                  同意
                </Button>
                <Button danger htmlType="submit">
                  拒绝
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Card>
  )
}

export default AdReview
