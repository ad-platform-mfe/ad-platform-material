import service from '@/utils/request'

/**
 * 触发指定素材的 AI 内容审核
 * @param id 素材 ID
 */
export function triggerReview(id: number): Promise<{ message: string }> {
  return service.post(`/reviews/trigger/${id}`)
}
