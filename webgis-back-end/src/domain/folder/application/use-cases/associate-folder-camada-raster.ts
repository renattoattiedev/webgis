import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersRepository } from '../repositories/foders-repository';
import { FoldersCamadasRaster } from '../../enterprise/entities/folders-camadas-raster';

interface AssociateCamadaRasterToFolderUseCaseRequest {
  COD_FOLDER_CAMADA_RASTER_ID: UniqueEntityID;
  COD_FOLDER_ID: string;
  COD_CAMADA_RASTER_ID: string;
}

@Injectable()
export class AssociateFolderCamadaRasterUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
    COD_CAMADA_RASTER_ID,
  }: AssociateCamadaRasterToFolderUseCaseRequest) {
    const folderCamadaRaster = FoldersCamadasRaster.create({
      COD_FOLDER_ID,
      COD_CAMADA_RASTER_ID,
    });

    await this.foldersRepository.addCamadaRasterToFolder(folderCamadaRaster);

    return right({
      folderCamadaRaster,
    });
  }
}
