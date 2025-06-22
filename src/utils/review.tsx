import { Tag, Tooltip } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import type { Material, ReviewResult } from '@/api/material'
import styles from './review.module.less'

// 审核状态 -> 标签颜色和文本
export const getStatusTag = (status: Material['reviewStatus']) => {
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

// 审核结果 -> 可读的拒绝理由
export const generateRejectionReason = (reviewResult?: ReviewResult) => {
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

// 渲染拒绝理由的通用组件
export const renderRejectionReason = (
  reviewResult: ReviewResult,
  record: Material
) => {
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
