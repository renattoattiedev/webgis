import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface FetchMapasFoldersUseCaseRequest {
  COD_FOLDER_ID: string;
  COD_MAPA_ID: string;
}

type FetchMapasFoldersUseCaseResponse = Either<
  null,
  {
    folderMapas: {
      COD_FOLDER_MAPA_ID: UniqueEntityID;
      COD_FOLDER_ID: string;
      COD_MAPA_ID: string;
    };
  }
>;

@Injectable()
export class FetchMapasFoldersUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
    COD_MAPA_ID,
  }: FetchMapasFoldersUseCaseRequest): Promise<FetchMapasFoldersUseCaseResponse> {
    const MapasFolders = await this.foldersRepository.findMapaFoldersById(
      COD_FOLDER_ID,
      COD_MAPA_ID,
    );

    console.log(COD_FOLDER_ID, COD_MAPA_ID);

    if (!MapasFolders) {
      return left(null);
    }

    return right({
      folderMapas: {
        COD_FOLDER_MAPA_ID: MapasFolders.id,
        COD_FOLDER_ID: MapasFolders.codFolderId,
        COD_MAPA_ID: MapasFolders.codMapaId,
      },
    });
  }
}
