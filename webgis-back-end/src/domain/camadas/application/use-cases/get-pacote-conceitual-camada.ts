import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';

interface GetPacoteConceitualCamadaUseCaseRequest {
  NOM_NOME: string;
}

type FetchPacoteConceitualCamadaUseCaseResponse = Either<
  null,
  {
    pacoteConceitualNome: string;
  }
>;

@Injectable()
export class GetPacotesConceituaisCamadasUseCase {
  constructor(private pacotesConceituaisCamadasRepository: CamadasRepository) {}

  async execute({
    NOM_NOME,
  }: GetPacoteConceitualCamadaUseCaseRequest): Promise<FetchPacoteConceitualCamadaUseCaseResponse> {
    const pacoteConceitualNome =
      await this.pacotesConceituaisCamadasRepository.findPacoteConceitual(
        NOM_NOME,
      );

    if (!pacoteConceitualNome) {
      return left(null);
    }

    return right({
      pacoteConceitualNome,
    });
  }
}
