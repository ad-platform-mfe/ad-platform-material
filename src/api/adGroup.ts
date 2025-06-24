import request from '@/utils/request'
import type { Material } from './material'

// 通用API响应类型
export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

// 定义广告组相关的类型
export interface AdGroup {
  id: number
  name: string
  mainCategory: '互动广告' | '创意视频'
  tags: string[]
  Materials?: Material[]
  createdAt: string
  updatedAt: string
}

export interface AdGroupListData {
  count: number
  rows: AdGroup[]
}

interface AdGroupListParams {
  page?: number
  pageSize?: number
}

// 获取广告组列表
export const getAdGroups = (
  params: AdGroupListParams
): Promise<ApiResponse<AdGroupListData>> => {
  return request({
    url: '/adGroup/list',
    method: 'get',
    params
  })
}

// 创建广告组
export const createAdGroup = (data: {
  name: string
  mainCategory: string
  tags: string[]
  materialIds: number[]
}) => {
  return request({
    url: '/adGroup/create',
    method: 'post',
    data
  })
}

// 更新广告组
export const updateAdGroup = (
  id: number,
  data: {
    name: string
    mainCategory: string
    tags: string[]
    materialIds: number[]
  }
) => {
  return request({
    url: `/adGroup/update/${id}`,
    method: 'put',
    data
  })
}

// 删除广告组
export const deleteAdGroup = (id: number) => {
  return request({
    url: `/adGroup/delete/${id}`,
    method: 'delete'
  })
}

// 获取单个广告组详情
export const getAdGroupById = (id: number): Promise<ApiResponse<AdGroup>> => {
  return request({
    url: `/adGroup/detail/${id}`,
    method: 'get'
  })
}
