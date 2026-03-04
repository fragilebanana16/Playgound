export class ApiResponse<T> {
  code: number;
  data: T | null;
  msg: string;

  constructor(code: number, data: T | null, msg: string) {
    this.code = code;
    this.data = data;
    this.msg = msg;
  }

  static success<T>(data: T, msg = '请求成功') {
    return new ApiResponse(200, data, msg);
  }

  static error(msg = '请求失败', code = 500) {
    return new ApiResponse(code, null, msg);
  }
}
