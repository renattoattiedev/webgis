import { Either, right } from '@/core/either';
import { CamadasRepository } from '../repositories/camadas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Injectable } from '@nestjs/common';

interface FetchCamadasGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
}

type FetchCamadasGrupoUseCaseResponse = Either<
  null,
  {
    camadas: Camadas[];
  }
>;

@Injectable()
export class FetchCamadasGrupoUseCase {
  constructor(private camadasRepository: CamadasRepository) {}

  async execute({
    COD_GRUPO_ID,
  }: FetchCamadasGrupoUseCaseRequest): Promise<FetchCamadasGrupoUseCaseResponse> {
    const camadas =
      await this.camadasRepository.findManyByCamadasGrupoId(COD_GRUPO_ID);

    return right({
      camadas,
    });
  }
}
