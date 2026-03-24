# my-backend 使用说明

## 启动步骤

### 1. 初始化数据库
用 MySQL 客户端执行 `init.sql` 文件

### 2. 修改数据库密码
打开 `src/main/resources/application.yml`
把 `password: 你的密码` 改成你本地 MySQL 的密码

### 3. 用 Eclipse 打开
File → Import → Maven → Existing Maven Projects → 选择本文件夹

等待右下角 Maven 下载依赖完成

### 4. 启动
找到 `MyApplication.java` → 右键 → Run As → Spring Boot App

看到 `Started MyApplication` 说明启动成功

---

## 接口列表

| 方法   | 地址               | 说明     |
|--------|--------------------|----------|
| GET    | /user/list         | 查询所有 |
| GET    | /user/{id}         | 查询单个 |
| POST   | /user              | 新增     |
| PUT    | /user              | 修改     |
| DELETE | /user/{id}         | 删除     |

## POST / PUT 请求体示例
```json
{
  "username": "王五",
  "password": "123456",
  "email": "wangwu@example.com"
}
```
