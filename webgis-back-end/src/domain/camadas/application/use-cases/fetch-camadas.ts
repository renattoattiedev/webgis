import { Either, left, right } from '@/core/either';
import { CamadasRepository } from '../repositories/camadas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Injectable } from '@nestjs/common';

interface FetchCamadasUseCaseRequest {
  NOM_NOME: string;
}
interface FetchCamadaNomeUseCaseRequest {
  NOM_NOME: string;
}
type FetchCamadaUseCaseResponse = Either<
  null,
  {
    camada: Camadas;
  }
>;
type FetchCamadasUseCaseResponse = Either<
  null,
  {
    camadas: Camadas[];
  }
>;

@Injectable()
export class FetchCamadasUseCase {
  constructor(private camadasRepository: CamadasRepository) {}

  async executeMany({
    NOM_NOME,
  }: FetchCamadasUseCaseRequest): Promise<FetchCamadasUseCaseResponse> {
    const camadas = await this.camadasRepository.findManyByCamadasId(NOM_NOME);

    return right({
      camadas,
    });
  }

  async execute({
    NOM_NOME,
  }: FetchCamadaNomeUseCaseRequest): Promise<FetchCamadaUseCaseResponse> {
    const camada = await this.camadasRepository.findByNome(NOM_NOME);

    if (!camada) {
      return left(null);
    }

    return right({
      camada,
    });
  }
}
