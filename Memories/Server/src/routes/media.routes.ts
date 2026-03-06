import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';

export const mediaRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: 本地音乐管理
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: 获取所有曲目
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: 曲目列表
 */
mediaRouter.get('/', (req, res) => mediaController.getAll(req, res));

/**
 * @swagger
 * /api/media/{id}/stream:
 *   get:
 *     summary: 流式播放音频
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 音频流
 *       404:
 *         description: 曲目不存在
 */
mediaRouter.get('/:id/stream', (req, res) => mediaController.stream(req, res));