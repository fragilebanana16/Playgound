import request from '@/utils/request'

// 查询专辑列表
export function listMusicPlaylist(query) {
  return request({
    url: '/system/musicPlaylist/list',
    method: 'get',
    params: query
  })
}

// 查询专辑详细
export function getMusicPlaylist(id) {
  return request({
    url: '/system/musicPlaylist/' + id,
    method: 'get'
  })
}

// 新增专辑
export function addMusicPlaylist(data) {
  return request({
    url: '/system/musicPlaylist',
    method: 'post',
    data: data
  })
}

// 修改专辑
export function updateMusicPlaylist(data) {
  return request({
    url: '/system/musicPlaylist',
    method: 'put',
    data: data
  })
}

// 删除专辑
export function delMusicPlaylist(id) {
  return request({
    url: '/system/musicPlaylist/' + id,
    method: 'delete'
  })
}
