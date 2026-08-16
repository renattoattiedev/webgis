import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FoldersRepository } from '../repositories/foders-repository';

interface GetFolderCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_USER_ID: string;
}

type GetFolderCamadaRasterUseCaseResponse = Either<
  null,
  {
    id: string;
  }
>;

@Injectable()
export class GetFolderCamadaRasterUseCase {
  constructor(private foldersRepository: FoldersRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_USER_ID,
  }: GetFolderCamadaRasterUseCaseRequest): Promise<GetFolderCamadaRasterUseCaseResponse> {
    const id = await this.foldersRepository.getFolderIdFromCamadaId(
      COD_CAMADA_RASTER_ID,
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
