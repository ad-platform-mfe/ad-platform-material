import service from '@/utils/request'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Material {
  id: number
  title: string
  type: 'image' | 'video'
  data: string
  cover?: string
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'review' | 'reviewing'
  reviewResult?: ReviewResult
  createdAt: string
  updatedAt: string
}

export interface ReviewDetails {
  Label: string
  SubLabel: string
  Score: number
  Suggestion: 'Block' | 'Pass' | 'Review'
}

export interface ReviewResult {
  success: boolean
  materialId: string
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'review' | 'reviewing'
  details: ReviewDetails
}

interface GetMaterialsParams {
  page?: number
  pageSize?: number
  type?: 'image' | 'video'
}

export interface MaterialsData {
  total: number
  list: Material[]
}

export const getMaterials = (
  params: GetMaterialsParams
): Promise<ApiResponse<MaterialsData>> => {
  return service.get('/materials', { params })
}

export type AddMaterialPayload = Omit<
  Material,
  'id' | 'createdAt' | 'updatedAt'
>

export const addMaterial = (data: AddMaterialPayload) => {
  return service.post<ApiResponse<Material>>('/materials', data)
}

export const updateMaterial = (id: number, data: { title: string }) => {
  return service.put(`/materials/${id}`, data)
}

export const deleteMaterial = (id: number) => {
  return service.delete(`/materials/${id}`)
}
