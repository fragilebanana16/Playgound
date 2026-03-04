import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

export const authRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 注册与登录
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 注册
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: 注册成功
 *       409:
 *         description: Email 已存在
 */
authRouter.post('/register', (req, res) => authController.register(req, res));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 登录
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功，返回 token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: 邮箱或密码错误
 */
authRouter.post('/login', (req, res) => authController.login(req, res));
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前登录用户信息
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 *       401:
 *         description: 未登录
 */
authRouter.get('/me', (req, res) => authController.me(req as any, res))