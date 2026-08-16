import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Basemap } from '../../enterprise/entities/basemap';
import { BasemapsRepository } from '../repositories/basemaps-repository';

interface DeleteBasemapUseCaseRequest {
  COD_BASEMAP_ID: string;
  COD_USUARIO_EXCLUSAO: string;
}

type DeleteBasemapUseCaseResponse = Either<
  {
    mensagem: string;
  },
  {
    basemap: Basemap;
  }
>;

@Injectable()
export class DeleteBasemapUseCase {
  constructor(private basemapsRepository: BasemapsRepository) {}

  async execute({
    COD_BASEMAP_ID,
    COD_USUARIO_EXCLUSAO,
  }: DeleteBasemapUseCaseRequest): Promise<DeleteBasemapUseCaseResponse> {
    const basemap = await this.basemapsRepository.findById(COD_BASEMAP_ID);

    if (!basemap) {
      return left({
        mensagem: 'Basemap não encontrado',
      });
    }

    await this.basemapsRepository.delete(COD_BASEMAP_ID, COD_USUARIO_EXCLUSAO);

    return right({
      basemap,
    });
  }
}
