import request from '@/utils/request'

export function getLyrics(query) {
  return request({
    url: '/media/fileContent',
    method: 'get',
    params: query
  })
}
