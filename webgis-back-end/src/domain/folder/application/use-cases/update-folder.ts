import { right, left } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';

interface UpdateFolderUseCaseRequest {
  COD_FOLDER_ID: string;
  DSC_FOLDER: string;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
}

@Injectable()
export class UpdateFolderUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({ COD_FOLDER_ID, DSC_FOLDER }: UpdateFolderUseCaseRequest) {
    const existingFolder = await this.foldersRepository.findById(COD_FOLDER_ID);

    if (!existingFolder) {
      return left(new Error('Pasta não encontrada'));
    }

    existingFolder.SetDescricaoFolder(DSC_FOLDER);

    await this.foldersRepository.save(existingFolder);

    return right({
      folder: existingFolder,
    });
  }
}
