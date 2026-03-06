import { Router } from 'express';
import { userController } from '../controllers/user.controller';

export const userRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 用户管理 CRUD
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取所有用户
 *     tags: [Users]
 *     security:
 *       - bearerAuth: [] # 声明需要 Bearer Token
 *     responses:
 *       200:
 *         description: 用户列表
 */
userRouter.get('/', (req, res) => userController.getAll(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 根据ID获取用户
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         username: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 用户信息
 *       404:
 *         description: 用户不存在
 */
userRouter.get('/:id', (req, res) => userController.getById(req, res));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建用户
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 *       409:
 *         description: Email 已存在
 */
userRouter.post('/', (req, res) => userController.create(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: 更新用户
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 用户不存在
 */
userRouter.patch('/:id', (req, res) => userController.update(req, res));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: 删除成功
 *       404:
 *         description: 用户不存在
 */
userRouter.delete('/:id', (req, res) => userController.delete(req, res));
