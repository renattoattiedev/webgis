import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface DeleteMapaFolderUseCaseRequest {
  COD_FOLDER_MAPA_ID: string;
}

@Injectable()
export class DeleteMapaFolderUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({ COD_FOLDER_MAPA_ID }: DeleteMapaFolderUseCaseRequest) {
    {
      try {
        await this.foldersRepository.removeFolderMapa(COD_FOLDER_MAPA_ID);
        return right(null);
      } catch (error) {
        return left(
          'Failed to delete the folder Mapa. Please make sure the ID is correct.',
        );
      }
    }
  }
}
