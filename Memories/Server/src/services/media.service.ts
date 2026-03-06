import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';

const MUSIC_DIR = process.env.MUSIC_DIR || '/music';

export interface MusicItem {
  id: number;
  name: string;
  artist: string;
  duration: number;
  size: number;
  filePath: string;
}

// 内存缓存，避免每次请求都扫描磁盘
let cache: MusicItem[] = [];

export class MediaService {
  async findAll(): Promise<Omit<MusicItem, 'filePath'>[]> {
    if (cache.length === 0) await this.scan();
    return cache.map(({ filePath, ...rest }) => rest);
  }

  async findById(id: number): Promise<MusicItem | null> {
    if (cache.length === 0) await this.scan();
    return cache.find(m => m.id === id) ?? null;
  }

  async getFileStream(filePath: string) {
    const stat = fs.statSync(filePath);
    const createReadStream = (options?: { start: number; end: number }) =>
      fs.createReadStream(filePath, options);
    return { createReadStream, stat };
  }

  private async scan() {
    const exts = ['.mp3', '.flac', '.wav', '.ogg', '.m4a'];
    const files = fs.readdirSync(MUSIC_DIR).filter(f =>
      exts.includes(path.extname(f).toLowerCase())
    );

    cache = await Promise.all(
      files.map(async (file, index) => {
        const filePath = path.join(MUSIC_DIR, file);
        const stat = fs.statSync(filePath);
        const meta = await mm.parseFile(filePath);
        return {
          id: index + 1,
          name: meta.common.title || path.basename(file, path.extname(file)),
          artist: meta.common.artist || '未知艺术家',
          duration: Math.floor(meta.format.duration || 0),
          size: stat.size,
          filePath,
        };
      })
    );
  }
}

export const mediaService = new MediaService();