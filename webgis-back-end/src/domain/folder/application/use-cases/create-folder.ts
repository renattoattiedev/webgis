import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';
import { Folders } from '../../../folder/enterprise/entities/folders';

interface CreateFolderUseCaseRequest {
  COD_FOLDER_ID: UniqueEntityID;
  DSC_FOLDER: string;
  COD_USUARIO_CRIACAO: string;
}

@Injectable()
export class CreateFolderUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    DSC_FOLDER,
    COD_USUARIO_CRIACAO,
  }: CreateFolderUseCaseRequest) {
    const folder = Folders.create({
      DSC_FOLDER,
      COD_USUARIO_CRIACAO,
    });

    await this.foldersRepository.create(folder);

    return right({
      folder,
    });
  }
}
