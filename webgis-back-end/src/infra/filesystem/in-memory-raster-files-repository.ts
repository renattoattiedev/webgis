import { RasterFilesRepository } from '@/domain/raster-files/application/repositories/raster-files-repository';
import { RasterFile } from '@/domain/raster-files/enterprise/entities/raster-file';

export class InMemoryRasterFilesRepository implements RasterFilesRepository {
  items: Map<string, RasterFile[]> = new Map();
  existing: Set<string> = new Set();

  async listChildren(relativePath: string): Promise<RasterFile[]> {
    return this.items.get(relativePath) ?? [];
  }

  async exists(relativePath: string): Promise<boolean> {
    return this.existing.has(relativePath);
  }
}
