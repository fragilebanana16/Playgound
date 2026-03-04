# Express TypeScript Boilerplate

Express + TypeScript + TypeORM + PostgreSQL + Swagger CRUD 模板

## 技术栈

- **Express 4** - Web 框架
- **TypeScript 5** - 类型安全
- **TypeORM 0.3** - ORM
- **PostgreSQL** - 数据库
- **Zod** - 请求参数校验
- **Swagger** - API 文档

## 目录结构

```
src/
├── app.ts                  # 入口
├── data-source.ts          # 数据库连接
├── swagger.ts              # Swagger 配置
├── entities/
│   └── User.ts             # 实体
├── repositories/
│   └── user.repository.ts  # 数据访问层
├── services/
│   └── user.service.ts     # 业务逻辑层
├── controllers/
│   └── user.controller.ts  # 控制器
└── routes/
    └── user.routes.ts      # 路由 + Swagger 注释
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库信息

# 3. 启动开发服务器
npm run dev

tmux开新窗口
tmux new-session -d -s server 'cd ~/storage/memo/server/TermuxServerSrc && npm run dev'
想看输出随时
tmux attach -t server
退出但保持运行：Ctrl+B 然后 D
tmux new-session -d -s server 'cd ~/storage/memo/client && npm run dev'

```

## API 接口

| 方法   | 路径            | 说明         |
|--------|-----------------|--------------|
| GET    | /api/users      | 获取所有用户 |
| GET    | /api/users/:id  | 获取单个用户 |
| POST   | /api/users      | 创建用户     |
| PATCH  | /api/users/:id  | 更新用户     |
| DELETE | /api/users/:id  | 删除用户     |

## Swagger 文档

启动后访问：http://localhost:3000/api-docs

## 新增一个模块

按照以下步骤复制 User 模块：

1. `src/entities/` 新建实体
2. `src/repositories/` 新建 repository
3. `src/services/` 新建 service
4. `src/controllers/` 新建 controller
5. `src/routes/` 新建路由并注册到 `app.ts`
