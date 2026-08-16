import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';
import { FoldersCamadas } from '../../../folder/enterprise/entities/folders-camadas';

interface AssociateCamadaToFolderUseCaseRequest {
  COD_FOLDER_CAMADADA_ID: UniqueEntityID;
  COD_FOLDER_ID: string;
  COD_CAMADA_ID: string;
}

@Injectable()
export class AssociateFolderCamadaUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
    COD_CAMADA_ID,
  }: AssociateCamadaToFolderUseCaseRequest) {
    const folderCamada = FoldersCamadas.create({
      COD_FOLDER_ID,
      COD_CAMADA_ID,
    });

    await this.foldersRepository.addCamadaToFolder(folderCamada);

    return right({
      folderCamada,
    });
  }
}
