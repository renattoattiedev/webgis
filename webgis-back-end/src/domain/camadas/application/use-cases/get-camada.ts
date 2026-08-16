import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Camadas } from '../../enterprise/entities/camadas';
import { CamadasRepository } from '../repositories/camadas-repository';

interface GetCamadaUseCaseRequest {
  NOM_NOME: string;
}
type FetchCamadaUseCaseResponse = Either<
  null,
  {
    camadas: Camadas;
  }
>;

@Injectable()
export class GetCamadasUseCase {
  constructor(private camadasRepository: CamadasRepository) {}

  async execute({
    NOM_NOME,
  }: GetCamadaUseCaseRequest): Promise<FetchCamadaUseCaseResponse> {
    const camadas = await this.camadasRepository.findByNome(NOM_NOME);

    if (!camadas) {
      return left(null);
    }

    return right({
      camadas,
    });
  }
}
