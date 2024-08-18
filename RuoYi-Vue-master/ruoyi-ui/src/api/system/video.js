import request from '@/utils/request'

// 查询影视列表
export function listVideo(query) {
  return request({
    url: '/system/video/list',
    method: 'get',
    params: query
  })
}

// 查询影视详细
export function getVideo(videoId) {
  return request({
    url: '/system/video/' + videoId,
    method: 'get'
  })
}

// 新增影视
export function addVideo(data) {
  return request({
    url: '/system/video',
    method: 'post',
    data: data
  })
}

// 修改影视
export function updateVideo(data) {
  return request({
    url: '/system/video',
    method: 'put',
    data: data
  })
}

// 删除影视
export function delVideo(videoId) {
  return request({
    url: '/system/video/' + videoId,
    method: 'delete'
  })
}
