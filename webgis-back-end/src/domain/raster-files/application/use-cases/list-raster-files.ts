import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { RasterFilesRepository } from '../repositories/raster-files-repository';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';

export interface ListedRasterFile {
  name: string;
  relativePath: string;
  type: 'dir' | 'file';
  size?: number;
  extension?: string;
  alreadyPublished?: boolean;
  camadaId?: string;
}

interface ListRasterFilesRequest {
  relativePath: string;
}

interface ListRasterFilesResponse {
  items: ListedRasterFile[];
}

@Injectable()
export class ListRasterFilesUseCase {
  constructor(
    private readonly filesRepo: RasterFilesRepository,
    private readonly camadasRepo: CamadasRasterRepository,
  ) {}

  async execute(
    req: ListRasterFilesRequest,
  ): Promise<Either<never, ListRasterFilesResponse>> {
    const entries = await this.filesRepo.listChildren(req.relativePath);

    const items: ListedRasterFile[] = await Promise.all(
      entries.map(async (entry) => {
        const base: ListedRasterFile = {
          name: entry.name,
          relativePath: entry.relativePath,
          type: entry.type,
          size: entry.size,
          extension: entry.extension,
        };
        if (entry.type === 'file') {
          const camada = await this.camadasRepo.findByFonte(entry.relativePath);
          if (camada) {
            base.alreadyPublished = true;
            base.camadaId = camada.id.toString();
          } else {
            base.alreadyPublished = false;
          }
        }
        return base;
      }),
    );

    return right({ items });
  }
}
