import request from '@/utils/http'

export function fetchGetPhotos() {
   return request.get<Api.Media.PhotoInfo[]>({
     url: '/api/file/photos'
     // 自定义请求头
     // headers: {
     //   'X-Custom-Header': 'your-custom-value'
     // }
  })
}

export function fetchPhotosByBbox(params: {
  west: number
  east: number
  south: number
  north: number
  limit?: number
}) {
   return request.get<Api.Media.PhotoInfo[]>({
     url: '/api/file/photosBbox',
     params
     // 自定义请求头
     // headers: {
     //   'X-Custom-Header': 'your-custom-value'
     // }
  })
}

