import { Request, Response } from 'express';
import { mediaService } from '../services/media.service';

export class MediaController {
  async getAll(_req: Request, res: Response) {
    try {
      const list = await mediaService.findAll();
      res.json({ data: list });
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async stream(req: Request, res: Response) {
    const id = Number(req.params.id);
    const music = await mediaService.findById(id);
    if (!music) return res.status(404).json({ message: 'Music not found' });

    const { createReadStream, stat } = await mediaService.getFileStream(music.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // 支持拖动进度条
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = Number(startStr);
      const end = endStr ? Number(endStr) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
      });
      createReadStream({ start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      createReadStream().pipe(res);
    }
  }
}

export const mediaController = new MediaController();