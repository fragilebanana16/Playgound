import request from '@/utils/request'

// 查询歌曲列表(本地文件)
export function listLocalMusic(query) {
  return request({
    url: '/system/music/localMusic',
    method: 'get',
    params: query
  })
}

// 查询歌曲列表(数据库)
export function listMusic(query) {
  return request({
    url: '/system/music/list',
    method: 'get',
    params: query
  })
}

// 查询歌曲详细
export function getMusic(musicId) {
  return request({
    url: '/system/music/' + musicId,
    method: 'get'
  })
}

// 新增歌曲
export function addMusic(data) {
  return request({
    url: '/system/music',
    method: 'post',
    data: data
  })
}

// 修改歌曲
export function updateMusic(data) {
  return request({
    url: '/system/music',
    method: 'put',
    data: data
  })
}

// 删除歌曲
export function delMusic(musicId) {
  return request({
    url: '/system/music/' + musicId,
    method: 'delete'
  })
}
