import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface FetchCamadasRasterFoldersUseCaseRequest {
  COD_FOLDER_ID: string;
  COD_CAMADA_RASTER_ID: string;
}

type FetchCamadasRasterFoldersUseCaseResponse = Either<
  null,
  {
    folderCamadas: {
      COD_FOLDER_CAMADADA_RASTER_ID: UniqueEntityID;
      COD_FOLDER_ID: string;
      COD_CAMADA_RASTER_ID: string;
    };
  }
>;

@Injectable()
export class FetchCamadasRasterFoldersUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
    COD_CAMADA_RASTER_ID,
  }: FetchCamadasRasterFoldersUseCaseRequest): Promise<FetchCamadasRasterFoldersUseCaseResponse> {
    const camadasFolders =
      await this.foldersRepository.findCamadaRasterFoldersById(
        COD_FOLDER_ID,
        COD_CAMADA_RASTER_ID,
      );

    if (!camadasFolders) {
      return left(null);
    }

    return right({
      folderCamadas: {
        COD_FOLDER_CAMADADA_RASTER_ID: camadasFolders.id,
        COD_FOLDER_ID: camadasFolders.codFolderId,
        COD_CAMADA_RASTER_ID: camadasFolders.codCamadaId,
      },
    });
  }
}
