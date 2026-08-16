import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface GetFolderCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
  COD_USER_ID: string;
}

type GetFolderCamadaUseCaseResponse = Either<
  null,
  {
    id: string;
  }
>;

@Injectable()
export class GetFolderCamadaUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_CAMADA_ID,
    COD_USER_ID,
  }: GetFolderCamadaUseCaseRequest): Promise<GetFolderCamadaUseCaseResponse> {
    const id = await this.foldersRepository.getFolderIdFromCamadaId(
      COD_CAMADA_ID,
      COD_USER_ID,
    );

    if (!id) {
      return left(null);
    }

    return right({
      id,
    });
  }
}
