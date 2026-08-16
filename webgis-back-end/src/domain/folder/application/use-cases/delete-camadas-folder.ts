import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';

interface DeleteCamadaFolderUseCaseRequest {
  COD_FOLDER_CAMADADA_ID: string;
}

@Injectable()
export class DeleteCamadaFolderUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({ COD_FOLDER_CAMADADA_ID }: DeleteCamadaFolderUseCaseRequest) {
    {
      try {
        await this.foldersRepository.removeFolderCamada(COD_FOLDER_CAMADADA_ID);
        return right(null);
      } catch (error) {
        return left(
          'Failed to delete the folder camada. Please make sure the ID is correct.',
        );
      }
    }
  }
}
