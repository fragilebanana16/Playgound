import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return {
    "token": "testToken"
  }
  // return request.post<Api.Auth.LoginResponse>({
  //   url: '/api/auth/login',
  //   params
  //   // showSuccessMessage: true // 显示成功消息
  //   // showErrorMessage: false // 不显示错误消息
  // })
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return {
      "userId": 1,
      "userName": "admin",
      "roles": [
          "R_SUPER"
      ],
      "buttons": [
          "B_CODE1",
          "B_CODE2"
      ],
      "email": "admin"
  }

  // return request.get<Api.Auth.UserInfo>({
  //   url: '/api/auth/me'
  //   // 自定义请求头
  //   // headers: {
  //   //   'X-Custom-Header': 'your-custom-value'
  //   // }
  // })
}
