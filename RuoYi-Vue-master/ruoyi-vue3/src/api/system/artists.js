import request from '@/utils/request'

// 查询歌手列表
export function listArtists(query) {
  return request({
    url: '/system/artists/list',
    method: 'get',
    params: query
  })
}

// 查询歌手详细
export function getArtists(id) {
  return request({
    url: '/system/artists/' + id,
    method: 'get'
  })
}

// 新增歌手
export function addArtists(data) {
  return request({
    url: '/system/artists',
    method: 'post',
    data: data
  })
}

// 修改歌手
export function updateArtists(data) {
  return request({
    url: '/system/artists',
    method: 'put',
    data: data
  })
}

// 删除歌手
export function delArtists(id) {
  return request({
    url: '/system/artists/' + id,
    method: 'delete'
  })
}
