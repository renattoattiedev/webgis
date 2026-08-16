import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface GetFolderMapaUseCaseRequest {
  COD_MAPA_ID: string;
  COD_USER_ID: string;
}

type GetFolderMapaUseCaseResponse = Either<
  null,
  {
    id: string;
  }
>;

@Injectable()
export class GetFolderMapaUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_USER_ID,
  }: GetFolderMapaUseCaseRequest): Promise<GetFolderMapaUseCaseResponse> {
    const id = await this.foldersRepository.getFolderIdFromMapaId(
      COD_MAPA_ID,
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
