import request from '@/utils/request'
import axios from 'axios'

// 获取路由
export const getRouters = () => {
  if (import.meta.env.MODE === 'mock') {
    return axios.get('/mock/routes.json').then(rsp => rsp.data)
  } else {
    return request({
      url: '/getRouters',
      method: 'get'
    })
  }
}