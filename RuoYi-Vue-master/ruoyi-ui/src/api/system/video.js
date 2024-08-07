import request from '@/utils/request'

export function getVideos() {
  return request({
    url: '/system/video/getVideos',
    method: 'get'
  })
}