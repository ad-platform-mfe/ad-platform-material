import axios from 'axios'
import microApp from '@micro-zoe/micro-app'

let token = microApp.getGlobalData()?.token || localStorage.getItem('token')
console.log(microApp.getGlobalData(), 'microApp.getGlobalData()')

// 监听全局数据变化，以便token在登录后或刷新后能及时同步
microApp.addGlobalDataListener((data: { token?: string }) => {
  if (data.token) {
    token = data.token
    localStorage.setItem('token', token as string)
  }
})
console.log(token, 'token')

const service = axios.create({
  baseURL: 'http://localhost:9090/api',
  timeout: 10000
})

service.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code !== 0) {
      console.error('API Error:', data.msg)
      return Promise.reject(new Error(data.msg || 'Error'))
    }
    return data
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default service
