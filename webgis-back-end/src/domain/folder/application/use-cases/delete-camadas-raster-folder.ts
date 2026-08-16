import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface DeleteCamadaRasterFolderUseCaseRequest {
  COD_FOLDER_CAMADADA_RASTER_ID: string;
}

@Injectable()
export class DeleteCamadaRasterFolderUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_CAMADADA_RASTER_ID,
  }: DeleteCamadaRasterFolderUseCaseRequest) {
    {
      try {
        await this.foldersRepository.removeFolderCamadaRaster(
          COD_FOLDER_CAMADADA_RASTER_ID,
        );
        return right(null);
      } catch (error) {
        return left(
          'Failed to delete the folder camada. Please make sure the ID is correct.',
        );
      }
    }
  }
}
