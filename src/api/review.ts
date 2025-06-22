import service from '@/utils/request'

/**
 * 触发指定素材的 AI 内容审核
 * @param id 素材 ID
 */
export function triggerReview(id: number): Promise<{ message: string }> {
  return service.post(`/reviews/trigger/${id}`)
}

/**
 * 提交人工复审结果
 * @param id 素材ID
 * @param data 审核结果
 */
export function submitManualReview(
  id: number,
  data: {
    reviewStatus: 'approved' | 'rejected'
    reason?: string
  }
) {
  return service.post(`/reviews/manual/${id}`, data)
}
