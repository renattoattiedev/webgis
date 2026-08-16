import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';
import { Folders } from '../../../folder/enterprise/entities/folders';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

interface FetchFoldersContentUseCaseRequest {
  COD_FOLDER_ID: string;
}

type FetchFoldersContentUseCaseResponse = Either<
  null,
  {
    folder: Folders;
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }
>;

@Injectable()
export class FetchFolderContentUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
  }: FetchFoldersContentUseCaseRequest): Promise<FetchFoldersContentUseCaseResponse> {
    const { folder, camadas, camadasRaster, mapas } =
      await this.foldersRepository.findContentByFolderId(COD_FOLDER_ID);

    return right({
      folder,
      camadas,
      camadasRaster,
      mapas,
    });
  }
}
