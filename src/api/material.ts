import service from '@/utils/request'

export interface Material {
  id: number
  title: string
  type: 'image' | 'video'
  data: string
  cover?: string
  createdAt: string
  updatedAt: string
}

interface GetMaterialsParams {
  page?: number
  pageSize?: number
}

interface GetMaterialsResponse {
  total: number
  list: Material[]
  page: string
  pageSize: string
}

export const getMaterials = (params: GetMaterialsParams) => {
  return service.get<GetMaterialsResponse>('/materials', { params })
}

export type AddMaterialPayload = Omit<
  Material,
  'id' | 'createdAt' | 'updatedAt'
>

export const addMaterial = (data: AddMaterialPayload) => {
  return service.post<{ data: Material }>('/materials', data)
}

export const updateMaterial = (id: number, data: { title: string }) => {
  return service.put(`/materials/${id}`, data)
}

export const deleteMaterial = (id: number) => {
  return service.delete(`/materials/${id}`)
}
