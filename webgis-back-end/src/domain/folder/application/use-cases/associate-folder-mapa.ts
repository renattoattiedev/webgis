import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersRepository } from '../repositories/foders-repository';
import { FoldersMapas } from '../../enterprise/entities/folders-mapas';

interface AssociateMapaToFolderUseCaseRequest {
  COD_FOLDER_MAPA_ID: UniqueEntityID;
  COD_FOLDER_ID: string;
  COD_MAPA_ID: string;
}

@Injectable()
export class AssociateFolderMapaUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
    COD_MAPA_ID,
  }: AssociateMapaToFolderUseCaseRequest) {
    const folderMapa = FoldersMapas.create({
      COD_FOLDER_ID,
      COD_MAPA_ID,
    });

    await this.foldersRepository.addMapaToFolder(folderMapa);

    return right({
      folderMapa,
    });
  }
}
