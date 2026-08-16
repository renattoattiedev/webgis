import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';

interface DeleteFolderUseCaseRequest {
  COD_FOLDER_ID: string;
}

@Injectable()
export class DeleteFolderUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({ COD_FOLDER_ID }: DeleteFolderUseCaseRequest) {
    const existingFolder = await this.foldersRepository.findById(COD_FOLDER_ID);

    if (!existingFolder) {
      return left(new Error('Pasta não encontrada'));
    }

    await this.foldersRepository.removeFolder(COD_FOLDER_ID);

    return right({
      folder: existingFolder,
    });
  }
}
