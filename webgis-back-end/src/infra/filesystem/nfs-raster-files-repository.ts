import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { RasterFilesRepository } from '@/domain/raster-files/application/repositories/raster-files-repository';
import { RasterFile } from '@/domain/raster-files/enterprise/entities/raster-file';

@Injectable()
export class NfsRasterFilesRepository implements RasterFilesRepository {
  constructor(private readonly basePath: string) {}

  private resolveSafe(relativePath: string): string {
    if (!relativePath) return this.basePath;
    if (/[\x00]/.test(relativePath)) {
      throw new BadRequestException('Caminho inválido');
    }
    if (path.isAbsolute(relativePath)) {
      throw new BadRequestException('Caminho inválido');
    }
    const resolved = path.resolve(this.basePath, relativePath);
    const relativeFromBase = path.relative(this.basePath, resolved);
    if (
      relativeFromBase.startsWith('..') ||
      path.isAbsolute(relativeFromBase)
    ) {
      throw new BadRequestException('Caminho inválido');
    }
    return resolved;
  }

  private async assertBaseExists(): Promise<void> {
    if (!fsSync.existsSync(this.basePath)) {
      throw new ServiceUnavailableException('Repositório raster indisponível');
    }
  }

  async listChildren(relativePath: string): Promise<RasterFile[]> {
    const safe = this.resolveSafe(relativePath);
    await this.assertBaseExists();

    let entries: fsSync.Dirent[];
    try {
      entries = await fs.readdir(safe, { withFileTypes: true });
    } catch (err: any) {
      if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
        return [];
      }
      throw err;
    }

    const out: RasterFile[] = [];

    for (const entry of entries) {
      const entryRel = relativePath
        ? path.posix.join(relativePath, entry.name)
        : entry.name;
      if (entry.isDirectory()) {
        const grandchildren = await this.listChildren(entryRel);
        if (grandchildren.length === 0) continue;
        out.push(RasterFile.directory(entry.name, entryRel));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext !== '.tif') continue;
        const stat = await fs.stat(path.join(safe, entry.name));
        out.push(RasterFile.file(entry.name, entryRel, stat.size, ext));
      }
    }

    return out;
  }

  async exists(relativePath: string): Promise<boolean> {
    const safe = this.resolveSafe(relativePath);
    try {
      await fs.access(safe);
      return true;
    } catch {
      return false;
    }
  }
}
