import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../../../folder/application/repositories/foders-repository';

interface FetchCamadasFoldersUseCaseRequest {
  COD_FOLDER_ID: string;
  COD_CAMADA_ID: string;
}

type FetchCamadasFoldersUseCaseResponse = Either<
  null,
  {
    folderCamadas: {
      COD_FOLDER_CAMADADA_ID: UniqueEntityID;
      COD_FOLDER_ID: string;
      COD_CAMADA_ID: string;
    };
  }
>;

@Injectable()
export class FetchCamadasFoldersUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_FOLDER_ID,
    COD_CAMADA_ID,
  }: FetchCamadasFoldersUseCaseRequest): Promise<FetchCamadasFoldersUseCaseResponse> {
    const camadasFolders = await this.foldersRepository.findCamadaFoldersById(
      COD_FOLDER_ID,
      COD_CAMADA_ID,
    );

    if (!camadasFolders) {
      return left(null);
    }

    return right({
      folderCamadas: {
        COD_FOLDER_CAMADADA_ID: camadasFolders.id,
        COD_FOLDER_ID: camadasFolders.codFolderId,
        COD_CAMADA_ID: camadasFolders.codCamadaId,
      },
    });
  }
}
