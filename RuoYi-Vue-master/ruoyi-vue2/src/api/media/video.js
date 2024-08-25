import request from '@/utils/request'

export function getVideos() {
  return request({
    url: '/system/video/getVideos',
    method: 'get'
  })
}

export function getTest() {
  return request({
    url: '/system/video/getTest/heihei.mp4',
    method: 'get',
  })
}